const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pool, initDatabase } = require('./db');
const { sendOrderConfirmation, sendAdminNotification, sendStatusUpdateEmail, sendContactMessage } = require('./emailService');

// ============ SESSION TOKENS (HMAC-signed, no server storage) ============
// Format: base64url(JSON payload).signature  — payload carries id/role + expiry
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || process.env.CASHFREE_SECRET_KEY || 'dev-insecure-secret';
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠  SESSION_SECRET is not set — set a strong random value in .env for production');
}
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function b64url(buf) { return Buffer.from(buf).toString('base64url'); }
function signData(data) { return crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url'); }

function createToken(payload) {
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + SESSION_TTL_MS }));
  return `${body}.${signData(body)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = signData(body);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

function getToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Require a valid user session; sets req.auth
function requireUser(req, res, next) {
  const payload = verifyToken(getToken(req));
  if (!payload || payload.role !== 'user') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.auth = payload;
  next();
}

// Require a valid admin session; sets req.auth
function requireAdmin(req, res, next) {
  const payload = verifyToken(getToken(req));
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  req.auth = payload;
  next();
}

// ============ RATE LIMITING ============
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

function checkRateLimit(key) {
  const now = Date.now();
  const record = rateLimit.get(key);
  
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimit.set(key, { windowStart: now, attempts: 1 });
    return true;
  }
  
  if (record.attempts >= MAX_ATTEMPTS) {
    return false;
  }
  
  record.attempts++;
  return true;
}

// Periodically purge expired rate-limit entries so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimit) {
    if (now - v.windowStart > RATE_LIMIT_WINDOW) rateLimit.delete(k);
  }
}, RATE_LIMIT_WINDOW).unref();

const app = express();
const PORT = process.env.PORT || 3000;

// Order stage constants used across the API
const ORDER_STATUSES = ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Payment Failed', 'Returned', 'Refunded'];

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

// CORS: allow same-origin/local tools plus the configured storefront origin(s)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:8899,http://127.0.0.1:8899')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // same-origin fetch, curl, server-to-server, webhooks
    cb(null, allowedOrigins.includes(origin));
  },
  credentials: false
}));

// Capture raw request body too — Cashfree webhook signature is computed over the raw bytes
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.rawBody = buf.toString(); } }));

// Serve uploaded product images
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|gif|webp|svg\+xml|avif)$/.test(file.mimetype)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Initialize database on startup
initDatabase();

// ============ AUTH ROUTES ============

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const clientIP = req.ip || req.socket.remoteAddress;
    if (!checkRateLimit(`register:${clientIP}`)) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }

    const { name, email, password, country, state, pinCode } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user with optional address
    const result = await pool.query(
      'INSERT INTO users (name, email, password, country, state, pin_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, country, state, pin_code',
      [name, email, hashedPassword, country || null, state || null, pinCode || null]
    );
    
    const user = result.rows[0];
    res.status(201).json({
      message: 'User created successfully',
      token: createToken({ role: 'user', id: user.id }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
        state: user.state,
        pinCode: user.pin_code
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const clientIP = req.ip || req.socket.remoteAddress;
    if (!checkRateLimit(`login:${clientIP}`)) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const result = await pool.query(
      'SELECT id, name, email, password FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Return user without password (including address)
    res.json({
      message: 'Login successful',
      token: createToken({ role: 'user', id: user.id }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
        state: user.state,
        pinCode: user.pin_code
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID (only the authenticated user themself)
app.get('/api/users/:id', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.auth.id) !== String(id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const result = await pool.query(
      'SELECT id, name, email, country, state, pin_code, created_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      country: user.country,
      state: user.state,
      pinCode: user.pin_code,
      createdAt: user.created_at
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user address (only the authenticated user themself)
app.put('/api/users/:id/address', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.auth.id) !== String(id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { country, state, pinCode } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET country = $1, state = $2, pin_code = $3 WHERE id = $4 RETURNING id, name, email, country, state, pin_code',
      [country, state, pinCode, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      message: 'Address updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
        state: user.state,
        pinCode: user.pin_code
      }
    });
  } catch (err) {
    console.error('Update address error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ CONTACT ROUTE ============

// Contact form submission (recipient configured via CONTACT_FORM_EMAIL env)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }

    if (typeof name !== 'string' || name.length > 100 ||
        typeof message !== 'string' || message.length > 5000 ||
        (phone && (typeof phone !== 'string' || phone.length > 20))) {
      return res.status(400).json({ error: 'Invalid input length' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const result = await sendContactMessage({ name: name.trim(), email: email.trim(), phone: phone && phone.trim(), message: message.trim() });

    res.json({ success: true, message: 'Message sent successfully', emailSent: result.success });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ CASHFREE PAYMENTS ============

const CASHFREE_API_VERSION = '2023-08-01';
const CF_BASE = process.env.CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const cashfreeConfigured = () => Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);

async function cashfreeRequest(method, path, body) {
  const res = await fetch(`${CF_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': CASHFREE_API_VERSION,
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET_KEY
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Cashfree error ${res.status}`);
  }
  return data;
}

// Recompute the order total from DB prices — never trust client-supplied amounts for payment
async function computeOrderTotal(items) {
  let subtotal = 0;
  const lineItems = [];
  for (const item of items) {
    const result = await pool.query('SELECT name, price FROM products WHERE id = $1', [item.id]);
    if (result.rows.length === 0) {
      throw new Error(`Product ${item.id} not found`);
    }
    const product = result.rows[0];
    const qty = parseInt(item.quantity, 10) || 1;
    subtotal += parseFloat(product.price) * qty;
    lineItems.push({ id: item.id, name: product.name, price: parseFloat(product.price), quantity: qty });
  }
  const shipping = subtotal > 3000 ? 0 : 99;
  const discount = Math.round(subtotal * 0.05);
  return { total: subtotal + shipping - discount, lineItems };
}

async function markOrderPaid(orderId) {
  const updated = await pool.query(
    `UPDATE orders SET payment_status = 'Paid',
       status = CASE WHEN status = 'Payment Failed' THEN 'Placed' ELSE status END
     WHERE id = $1 AND payment_status != 'Paid'
     RETURNING status`,
    [orderId]
  );
  // If a retried payment revived a Payment Failed order, log the status change in the timeline
  if (updated.rows.length > 0 && updated.rows[0].status === 'Placed') {
    await pool.query(
      'INSERT INTO order_status_history (order_id, status) VALUES ($1, $2)',
      [orderId, 'Placed']
    );
  }
}

// Create Cashfree order for online payment (user id taken from the authenticated session)
app.post('/api/payments/cashfree/create-order', requireUser, async (req, res) => {
  try {
    if (!cashfreeConfigured()) {
      return res.status(503).json({ error: 'Online payments are not configured yet' });
    }

    const userId = req.auth.id;
    const { items, address } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(400).json({ error: 'User not found. Please log out and log in again.' });
    }

    const { total, lineItems } = await computeOrderTotal(items);

    const shippingAddress = address && address.fullName ? {
      fullName: address.fullName || null,
      phone: address.phone || null,
      house: address.house || null,
      street: address.street || null,
      landmark: address.landmark || null,
      city: address.city || null,
      state: address.state || null,
      pinCode: address.pinCode || null,
      country: address.country || null
    } : null;

    // Create the internal order first (payment pending), then attach the Cashfree order id
    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, total_amount, status, payment_method, payment_status, shipping_address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [userId, total, 'Placed', 'Cashfree', 'Pending', shippingAddress ? JSON.stringify(shippingAddress) : null]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of lineItems) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity) VALUES ($1, $2, $3, $4, $5)',
        [orderId, item.id, item.name, item.price, item.quantity]
      );
    }

    const cfOrderId = `zaraz_${orderId}`;
    const phone = (shippingAddress && shippingAddress.phone ? shippingAddress.phone : '').replace(/\D/g, '').slice(-10) || '9999999999';

    const cfPayload = {
      order_id: cfOrderId,
      order_amount: Number(total.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: `user_${userId}`,
        customer_name: user.name || 'Customer',
        customer_email: user.email || 'customer@example.com',
        customer_phone: phone
      }
    };
    if (process.env.APP_BASE_URL) {
      cfPayload.order_meta = { return_url: `${process.env.APP_BASE_URL}/orders.html?orderId=${orderId}` };
    }

    const cfOrder = await cashfreeRequest('POST', '/orders', cfPayload);

    await pool.query('UPDATE orders SET cf_order_id = $1 WHERE id = $2', [cfOrderId, orderId]);

    res.json({
      orderId,
      cfOrderId,
      paymentSessionId: cfOrder.payment_session_id,
      mode: process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
      amount: total
    });
  } catch (err) {
    console.error('Cashfree create-order error:', err);
    res.status(500).json({ error: err.message || 'Could not initiate payment' });
  }
});

// Create a fresh payment session for an existing unpaid order ("Complete Payment" on orders page).
// Cashfree order ids can't be reused after a payment attempt, so each retry gets a new one.
app.post('/api/payments/cashfree/repay/:orderId', requireUser, async (req, res) => {
  try {
    if (!cashfreeConfigured()) {
      return res.status(503).json({ error: 'Online payments are not configured yet' });
    }

    const orderId = req.params.orderId;
    const userId = req.auth.id;

    const orderResult = await pool.query(
      `SELECT o.id, o.user_id, o.total_amount, o.status, o.payment_method, o.payment_status, o.cf_order_id,
              u.name AS user_name, u.email AS user_email, o.shipping_address
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.id = $1`,
      [orderId]
    );
    const order = orderResult.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (String(order.user_id) !== String(userId)) {
      return res.status(403).json({ error: 'This order does not belong to you' });
    }
    if (order.payment_status === 'Paid') {
      return res.status(400).json({ error: 'This order is already paid' });
    }
    if (order.payment_method !== 'Cashfree') {
      return res.status(400).json({ error: 'This order was not placed for online payment' });
    }
    if (['Cancelled', 'Returned', 'Refunded'].includes(order.status)) {
      return res.status(400).json({ error: `Cannot pay for a ${order.status.toLowerCase()} order` });
    }

    const cfOrderId = `zaraz_${order.id}_${Date.now().toString(36)}`;
    const address = order.shipping_address || {};
    const phone = String(address.phone || '').replace(/\D/g, '').slice(-10) || '9999999999';

    const cfPayload = {
      order_id: cfOrderId,
      order_amount: Number(parseFloat(order.total_amount).toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: `user_${order.user_id}`,
        customer_name: order.user_name || 'Customer',
        customer_email: order.user_email || 'customer@example.com',
        customer_phone: phone
      }
    };
    if (process.env.APP_BASE_URL) {
      cfPayload.order_meta = { return_url: `${process.env.APP_BASE_URL}/orders.html?orderId=${order.id}` };
    }

    const cfOrder = await cashfreeRequest('POST', '/orders', cfPayload);

    // Point the order at the new Cashfree session; a failed attempt becomes payable again
    await pool.query(
      `UPDATE orders SET cf_order_id = $1, payment_status = 'Pending',
         status = CASE WHEN status = 'Payment Failed' THEN 'Placed' ELSE status END
       WHERE id = $2`,
      [cfOrderId, order.id]
    );

    res.json({
      orderId: order.id,
      cfOrderId,
      paymentSessionId: cfOrder.payment_session_id,
      mode: process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
      amount: parseFloat(order.total_amount)
    });
  } catch (err) {
    console.error('Cashfree repay error:', err);
    res.status(500).json({ error: err.message || 'Could not initiate payment' });
  }
});

// Verify payment after the checkout modal closes (client-driven confirmation)
app.get('/api/payments/cashfree/verify/:orderId', requireUser, async (req, res) => {
  try {
    if (!cashfreeConfigured()) {
      return res.status(503).json({ error: 'Online payments are not configured yet' });
    }

    const orderId = req.params.orderId;
    const orderResult = await pool.query('SELECT user_id, cf_order_id, payment_status FROM orders WHERE id = $1', [orderId]);
    const order = orderResult.rows[0];
    if (!order || !order.cf_order_id) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (String(order.user_id) !== String(req.auth.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (order.payment_status === 'Paid') {
      return res.json({ status: 'PAID', orderId });
    }

    const cfOrder = await cashfreeRequest('GET', `/orders/${order.cf_order_id}`);

    if (cfOrder.order_status === 'PAID') {
      await markOrderPaid(orderId);
      return res.json({ status: 'PAID', orderId });
    }

    if (['EXPIRED', 'TERMINATED'].includes(cfOrder.order_status)) {
      await pool.query(`UPDATE orders SET status = 'Payment Failed', payment_status = 'Failed' WHERE id = $1`, [orderId]);
      return res.json({ status: 'FAILED', orderId });
    }

    res.json({ status: 'PENDING', orderId });
  } catch (err) {
    console.error('Cashfree verify error:', err);
    res.status(500).json({ error: err.message || 'Could not verify payment' });
  }
});

// Webhook: Cashfree calls this on payment events (reliable confirmation)
app.post('/api/webhooks/cashfree', async (req, res) => {
  try {
    const secret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY;
    const timestamp = req.headers['x-webhook-timestamp'];
    const signature = req.headers['x-webhook-signature'];

    if (!secret || !timestamp || !signature || !req.rawBody) {
      return res.status(400).json({ error: 'Missing webhook signature data' });
    }

    const computed = crypto
      .createHmac('sha256', secret)
      .update(timestamp + req.rawBody)
      .digest('base64');

    if (computed !== signature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const cfOrderId = event.data && event.data.order && event.data.order.order_id;
    const paymentStatus = event.data && event.data.payment && event.data.payment.payment_status;

    if (cfOrderId && paymentStatus === 'SUCCESS') {
      // cf order ids look like zaraz_{orderId} or zaraz_{orderId}_{retrySuffix}
      const match = String(cfOrderId).match(/^zaraz_(\d+)/);
      const orderId = match ? parseInt(match[1], 10) : NaN;
      if (!Number.isNaN(orderId)) {
        await markOrderPaid(orderId);
        console.log(`✅ Webhook: order ${orderId} marked as Paid`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Cashfree webhook error:', err);
    res.status(500).json({ error: 'Webhook error' });
  }
});

// ============ ORDER ROUTES ============

// Create order (offline/COD). User id comes from the authenticated session and the
// total is recomputed from DB prices — never trust amounts sent by the client.
app.post('/api/orders', requireUser, async (req, res) => {
  try {
    const userId = req.auth.id;
    const { items, address, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const { total, lineItems } = await computeOrderTotal(items);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get user details for address
      const userResult = await client.query(
        'SELECT name, email FROM users WHERE id = $1',
        [userId]
      );
      
      const user = userResult.rows[0];

      if (!user) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'User not found. Please log out and log in again.' });
      }
      
      // Snapshot of the currently chosen shipping address (JSONB)
      const shippingAddress = address && address.fullName ? {
        fullName: address.fullName || null,
        phone: address.phone || null,
        house: address.house || null,
        street: address.street || null,
        landmark: address.landmark || null,
        city: address.city || null,
        state: address.state || null,
        pinCode: address.pinCode || null,
        country: address.country || null
      } : null;
      
      // Create order with payment placeholder and full address snapshot
      const orderResult = await client.query(
        'INSERT INTO orders (user_id, total_amount, status, payment_method, payment_status, shipping_address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [userId, total, 'Placed', paymentMethod || 'Offline Placeholder', 'Pending', shippingAddress ? JSON.stringify(shippingAddress) : null]
      );

      const orderId = orderResult.rows[0].id;

      // Record the first status entry for the timeline
      await client.query(
        'INSERT INTO order_status_history (order_id, status) VALUES ($1, $2)',
        [orderId, 'Placed']
      );

      // Add order items
      for (const item of lineItems) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity) VALUES ($1, $2, $3, $4, $5)',
          [orderId, item.id, item.name, item.price, item.quantity]
        );
      }

      await client.query('COMMIT');

      // Send emails (async, don't wait)
      sendOrderConfirmation(
        { name: user.name, email: user.email },
        orderId,
        lineItems,
        total,
        shippingAddress || {}
      );

      sendAdminNotification(
        { name: user.name, email: user.email },
        orderId,
        lineItems,
        total,
        shippingAddress || {}
      );
      
      res.status(201).json({
        message: 'Order created successfully',
        orderId
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user orders (only the authenticated user's own orders)
app.get('/api/orders/:userId', requireUser, async (req, res) => {
  try {
    const { userId } = req.params;
    if (String(req.auth.id) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const ordersResult = await pool.query(
      'SELECT id, total_amount, status, payment_method, payment_status, shipping_address, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    const orders = await Promise.all(ordersResult.rows.map(async (order) => {
      const itemsResult = await pool.query(
        'SELECT product_id, product_name, product_price, quantity FROM order_items WHERE order_id = $1',
        [order.id]
      );
      
      return {
        ...order,
        items: itemsResult.rows
      };
    }));
    
    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order detail + status history (must be the authenticated user's own order)
app.get('/api/orders/:userId/:orderId', requireUser, async (req, res) => {
  try {
    const { userId, orderId } = req.params;
    if (String(req.auth.id) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const orderResult = await pool.query(
      'SELECT id, user_id, total_amount, status, payment_method, payment_status, shipping_address, created_at FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    if (String(req.auth.id) !== String(order.user_id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const itemsResult = await pool.query(
      'SELECT product_id, product_name, product_price, quantity FROM order_items WHERE order_id = $1',
      [orderId]
    );
    
    const historyResult = await pool.query(
      'SELECT status, changed_at FROM order_status_history WHERE order_id = $1 ORDER BY changed_at ASC, id ASC',
      [orderId]
    );
    
    res.json({
      ...order,
      items: itemsResult.rows,
      history: historyResult.rows
    });
  } catch (err) {
    console.error('Get order detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ ADMIN ROUTES ============

// Admin login with rate limiting
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(`admin:${clientIP}`)) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const result = await pool.query(
      'SELECT id, name, email, password FROM admins WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Clear rate limit on successful login
    rateLimit.delete(`admin:${clientIP}`);

    res.json({
      message: 'Admin login successful',
      token: createToken({ role: 'admin', id: admin.id }),
      admin: { id: admin.id, name: admin.name, email: admin.email }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders (admin only)
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id, o.total_amount, o.status, o.payment_method, o.payment_status,
        o.shipping_address, o.created_at,
        u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    
    // Get items for each order
    const orders = await Promise.all(result.rows.map(async (order) => {
      const itemsResult = await pool.query(
        'SELECT product_id, product_name, product_price, quantity FROM order_items WHERE order_id = $1',
        [order.id]
      );
      return {
        ...order,
        items: itemsResult.rows
      };
    }));
    
    res.json(orders);
  } catch (err) {
    console.error('Get all orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (admin only)
app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Get current order info
    const orderResult = await pool.query(
      'SELECT user_id FROM orders WHERE id = $1',
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const userId = orderResult.rows[0].user_id;
    
    // Record history entry only when the status actually changes
    await pool.query(
      'INSERT INTO order_status_history (order_id, status) VALUES ($1, $2)',
      [id, status]
    );
    
    // Update status
    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, id]
    );
    
    // Get user and order details for email
    const userResult = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );
    
    const itemsResult = await pool.query(
      'SELECT product_name, product_price, quantity FROM order_items WHERE order_id = $1',
      [id]
    );
    
    const totalResult = await pool.query(
      'SELECT total_amount FROM orders WHERE id = $1',
      [id]
    );
    
    // Send status update email
    sendStatusUpdateEmail(
      { name: userResult.rows[0].name, email: userResult.rows[0].email },
      id,
      status,
      itemsResult.rows,
      parseFloat(totalResult.rows[0].total_amount)
    );
    
    res.json({
      message: 'Order status updated',
      order: { id: parseInt(id), status }
    });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ PRODUCT & CATEGORY ROUTES ============

// Public: list categories (with product count; parent_id supports subcategories)
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.name, c.parent_id,
             COUNT(p.id)::int AS product_count,
             COUNT(p.id)::int + COALESCE(SUM(ch.cnt), 0)::int AS total_product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN (
        SELECT parent_id, COUNT(*)::int AS cnt
        FROM products pr
        JOIN categories cc ON cc.id = pr.category_id
        WHERE cc.parent_id IS NOT NULL
        GROUP BY parent_id
      ) ch ON ch.parent_id = c.id
      GROUP BY c.id
      ORDER BY c.parent_id NULLS FIRST, c.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public: list products (optionally filter by category id)
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    const params = [];
    let where = '';
    if (category) {
      params.push(category);
      // a parent category also matches products filed under its subcategories
      where = `WHERE p.category_id = $1
                OR p.category_id IN (SELECT id FROM categories WHERE parent_id = $1)`;
    }
    const result = await pool.query(`
      SELECT p.id, p.name, p.price, p.image, p.description, p.stock, p.created_at,
             p.category_id, c.name AS category
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${where}
      ORDER BY p.id
    `, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public: get one product for the details page
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.id, p.name, p.price, p.image, p.description, p.stock, p.created_at,
             p.category_id, c.name AS category, pc.name AS parent_category
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN categories pc ON pc.id = c.parent_id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: create product
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, categoryId, price, image, description, stock } = req.body;

    if (!name || price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }

    const result = await pool.query(
      'INSERT INTO products (name, category_id, price, image, description, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, categoryId || null, parseFloat(price), image || null, description || null, parseInt(stock) || 0]
    );
    res.status(201).json({ message: 'Product created', product: result.rows[0] });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid category' });
    }
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update product
app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, price, image, description, stock } = req.body;

    if (!name || price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, category_id = $2, price = $3, image = $4, description = $5, stock = $6 WHERE id = $7 RETURNING *',
      [name, categoryId || null, parseFloat(price), image || null, description || null, parseInt(stock) || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product updated', product: result.rows[0] });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid category' });
    }
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete product
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: create category (optionally under a parent → subcategory)
app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    let parent = null;
    if (parentId) {
      const parentResult = await pool.query(
        'SELECT id, parent_id FROM categories WHERE id = $1',
        [parentId]
      );
      parent = parentResult.rows[0];
      if (!parent) {
        return res.status(400).json({ error: 'Parent category not found' });
      }
      if (parent.parent_id) {
        return res.status(400).json({ error: 'Only one level of subcategories is supported' });
      }
    }

    const result = await pool.query(
      'INSERT INTO categories (name, parent_id) VALUES ($1, $2) RETURNING *',
      [name.trim(), parent ? parent.id : null]
    );
    res.status(201).json({ message: 'Category created', category: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete category (products in it are kept, category set to null)
app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: upload a product image, returns its public URL
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    // Build the public URL from the trusted API base (never the spoofable Host header).
    // In production set API_PUBLIC_URL to the public API origin, e.g. https://api.example.com
    const base = (process.env.API_PUBLIC_URL || `${req.protocol}://localhost:${PORT}`).replace(/\/$/, '');
    res.status(201).json({ message: 'Image uploaded', imageUrl: `${base}/uploads/${req.file.filename}` });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
