const { query, withTransaction } = require('../../db/pool');
const { notFound, badRequest } = require('../../utils/errors');
const { toProduct, toOrder, toOrderItem, toCustomer, toAddress } = require('../../utils/serialize');
const { uniqueSlug } = require('../categories/category.service');
const { releaseStock, STOCK_RELEASING_STATUSES } = require('../orders/order.service');

const getDashboard = async () => {
  const [totals, statusCounts, revenue, inventoryTotals, recentOrders, lowStock, topProducts] = await Promise.all([
    query(`
      SELECT
        (SELECT COUNT(*)::int FROM orders) AS total_orders,
        (SELECT COUNT(*)::int FROM products) AS total_products,
        (SELECT COUNT(*)::int FROM categories) AS total_categories,
        (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS total_customers,
        (SELECT COUNT(*)::int FROM orders WHERE status = 'Pending') AS pending_orders,
        (SELECT COUNT(*)::int FROM orders WHERE status = 'Delivered') AS delivered_orders
    `),
    query('SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status'),
    query(`
      SELECT
        COALESCE(SUM(total_amount) FILTER (WHERE status <> 'Cancelled'), 0) AS gross_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'Delivered'), 0) AS delivered_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'Pending'), 0) AS pending_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'Paid'), 0) AS paid_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE placed_at >= now() - interval '30 days' AND status <> 'Cancelled'), 0) AS revenue_30d
      FROM orders
    `),
    query(`
      SELECT
        COALESCE(SUM(stock), 0)::int AS total_units,
        COUNT(*) FILTER (WHERE stock > 0 AND stock <= low_stock_threshold)::int AS low_stock,
        COUNT(*) FILTER (WHERE stock = 0)::int AS out_of_stock,
        COALESCE(SUM(stock * price), 0) AS inventory_value
      FROM products
    `),
    query('SELECT * FROM orders ORDER BY placed_at DESC LIMIT 8'),
    query('SELECT id, name, stock, low_stock_threshold FROM products WHERE stock <= low_stock_threshold ORDER BY stock ASC LIMIT 10'),
    query(`
      SELECT oi.product_id, oi.product_name, SUM(oi.quantity)::int AS units_sold,
             SUM(oi.line_total) AS revenue,
             MAX(p.stock) AS stock,
             MAX(p.low_stock_threshold) AS low_stock_threshold,
             MAX(c.name) AS category_name
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
       WHERE o.status <> 'Cancelled'
       GROUP BY oi.product_id, oi.product_name
       ORDER BY units_sold DESC
       LIMIT 5
    `),
  ]);

  const counts = totals.rows[0];
  const money = revenue.rows[0];
  const inventory = inventoryTotals.rows[0];

  return {
    stats: {
      totalOrders: counts.total_orders,
      totalProducts: counts.total_products,
      totalCategories: counts.total_categories,
      totalCustomers: counts.total_customers,
      pendingOrders: counts.pending_orders,
      deliveredOrders: counts.delivered_orders,
      totalUnits: inventory.total_units,
      lowStock: inventory.low_stock,
      outOfStock: inventory.out_of_stock,
      inventoryValue: Number(inventory.inventory_value),
      revenue: {
        gross: Number(money.gross_revenue),
        delivered: Number(money.delivered_revenue),
        pending: Number(money.pending_revenue),
        paid: Number(money.paid_revenue),
        last30Days: Number(money.revenue_30d),
        currency: 'INR',
      },
    },
    ordersByStatus: statusCounts.rows.map((row) => ({ status: row.status, count: row.count })),
    recentOrders: recentOrders.rows.map((row) => toOrder(row)),
    lowStock: lowStock.rows.map((row) => ({
      id: row.id,
      name: row.name,
      stock: row.stock,
      threshold: row.low_stock_threshold,
    })),
    topProducts: topProducts.rows.map((row) => ({
      productId: row.product_id,
      name: row.product_name,
      categoryName: row.category_name,
      unitsSold: row.units_sold,
      revenue: Number(row.revenue),
      stock: row.stock,
      threshold: row.low_stock_threshold,
    })),
  };
};

const createProduct = async (payload) => {
  const slug = await uniqueSlug(payload.name, null, 'products');
  const { rows } = await query(
    `INSERT INTO products
       (name, slug, sku, category_id, description, fabric, price, compare_at_price, image, images, sizes, colors,
        stock, low_stock_threshold, is_active, is_featured, is_new_arrival, is_bestseller)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [
      payload.name,
      slug,
      payload.sku || null,
      payload.category_id || null,
      payload.description || null,
      payload.fabric || null,
      payload.price,
      payload.compare_at_price ?? null,
      payload.image || payload.images?.[0] || null,
      JSON.stringify(payload.images || []),
      JSON.stringify(payload.sizes || []),
      JSON.stringify(payload.colors || []),
      payload.stock ?? 0,
      payload.low_stock_threshold ?? 3,
      payload.is_active !== false,
      payload.is_featured === true,
      payload.is_new_arrival === true,
      payload.is_bestseller === true,
    ]
  );
  return toProduct(rows[0]);
};

const updateProduct = async (id, payload) => {
  const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
  if (!existing.rows[0]) throw notFound('Product not found');

  const slug = payload.name !== existing.rows[0].name ? await uniqueSlug(payload.name, id, 'products') : existing.rows[0].slug;

  const { rows } = await query(
    `UPDATE products
        SET name = $2, slug = $3, sku = $4, category_id = $5, description = $6, fabric = $7,
            price = $8, compare_at_price = $9, image = $10, images = $11, sizes = $12, colors = $13,
            stock = $14, low_stock_threshold = $15, is_active = $16, is_featured = $17,
            is_new_arrival = $18, is_bestseller = $19, updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [
      id,
      payload.name,
      slug,
      payload.sku || null,
      payload.category_id || null,
      payload.description || null,
      payload.fabric || null,
      payload.price,
      payload.compare_at_price ?? null,
      payload.image || payload.images?.[0] || null,
      JSON.stringify(payload.images || []),
      JSON.stringify(payload.sizes || []),
      JSON.stringify(payload.colors || []),
      payload.stock ?? 0,
      payload.low_stock_threshold ?? 3,
      payload.is_active !== false,
      payload.is_featured === true,
      payload.is_new_arrival === true,
      payload.is_bestseller === true,
    ]
  );
  return toProduct(rows[0]);
};

const deleteProduct = async (id) => {
  const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  if (result.rowCount === 0) throw notFound('Product not found');
  return { id: Number(id) };
};

const adjustStock = async (id, { stock, delta }) => {
  if (stock === undefined && delta === undefined) throw badRequest('Provide a stock value or a delta');

  const nextValue = stock !== undefined ? stock : undefined;
  const { rows } = await query(
    `UPDATE products
        SET stock = GREATEST(0, CASE WHEN $2::int IS NOT NULL THEN $2::int ELSE stock + $3::int END),
            updated_at = now()
      WHERE id = $1
      RETURNING id, name, stock`,
    [id, nextValue ?? null, delta ?? null]
  );
  if (!rows[0]) throw notFound('Product not found');
  return { id: rows[0].id, name: rows[0].name, stock: rows[0].stock };
};

const listOrders = async ({ q, status, paymentStatus, from, to, page = 1, limit = 20 }) => {
  const clauses = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    clauses.push(`(o.order_number ILIKE $${params.length} OR o.customer_name ILIKE $${params.length}
      OR o.customer_email ILIKE $${params.length} OR o.customer_phone ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    clauses.push(`o.status = $${params.length}`);
  }
  if (paymentStatus) {
    params.push(paymentStatus);
    clauses.push(`o.payment_status = $${params.length}`);
  }
  if (from) {
    params.push(from);
    clauses.push(`o.placed_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`o.placed_at <= $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM orders o ${where}`, params);
  const total = countResult.rows[0].total;

  const offset = (page - 1) * limit;
  const { rows } = await query(
    `SELECT o.*, COALESCE(json_agg(json_build_object(
        'id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name,
        'product_image', oi.product_image, 'size', oi.size, 'color', oi.color,
        'unit_price', oi.unit_price, 'quantity', oi.quantity, 'line_total', oi.line_total
      ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
      GROUP BY o.id
      ORDER BY o.placed_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    orders: rows.map((row) => toOrder(row, row.items.map(toOrderItem))),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
};

const getOrder = async (orderId, client = null) => {
  // Accepting a client lets callers inside a transaction read their own
  // uncommitted writes; the pool's other connections would not see them yet.
  const run = client ? (sql, params) => client.query(sql, params) : query;

  const { rows } = await run('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!rows[0]) throw notFound('Order not found');

  const items = await run('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [orderId]);
  const history = await run('SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC', [orderId]);

  return toOrder({ ...rows[0], status_history: history.rows }, items.rows.map(toOrderItem));
};

/**
 * Moves an order to a new status. Cancelling or returning an order releases its
 * reserved stock exactly once, so inventory cannot drift from reality.
 */
const updateOrderStatus = async (orderId, { status, note, tracking_number }, actor = 'admin') =>
  withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    const order = rows[0];
    if (!order) throw notFound('Order not found');
    if (order.status === status) throw badRequest(`Order is already ${status}`);

    const wasReleased = STOCK_RELEASING_STATUSES.has(order.status);
    const willRelease = STOCK_RELEASING_STATUSES.has(status);

    if (willRelease && !wasReleased) await releaseStock(client, orderId);

    await client.query(
      `UPDATE orders
          SET status = $2,
              tracking_number = COALESCE($3, tracking_number),
              updated_at = now()
        WHERE id = $1`,
      [orderId, status, tracking_number || null]
    );
    await client.query(
      'INSERT INTO order_status_history (order_id, status, note, actor) VALUES ($1, $2, $3, $4)',
      [orderId, status, note || `Status updated to ${status}`, actor]
    );

    return getOrder(orderId, client);
  });

const updatePaymentStatus = async (orderId, paymentStatus) => {
  const result = await query(
    'UPDATE orders SET payment_status = $2, updated_at = now() WHERE id = $1 RETURNING id',
    [orderId, paymentStatus]
  );
  if (result.rowCount === 0) throw notFound('Order not found');
  return getOrder(orderId);
};

const listCustomers = async ({ q, page = 1, limit = 20 }) => {
  const params = [];
  let where = "WHERE u.role = 'customer'";
  if (q) {
    params.push(`%${q}%`);
    where += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
  }

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM users u ${where}`, params);
  const total = countResult.rows[0].total;
  const offset = (page - 1) * limit;

  const { rows } = await query(
    `SELECT u.*,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id)::int AS order_count,
            (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o
              WHERE o.user_id = u.id AND o.status <> 'Cancelled') AS total_spent,
            (SELECT MAX(o.placed_at) FROM orders o WHERE o.user_id = u.id) AS last_order_at
       FROM users u
       ${where}
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    customers: rows.map(toCustomer),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
};

const getCustomer = async (customerId) => {
  const { rows } = await query(
    `SELECT u.*,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id)::int AS order_count,
            (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o
              WHERE o.user_id = u.id AND o.status <> 'Cancelled') AS total_spent,
            (SELECT MAX(o.placed_at) FROM orders o WHERE o.user_id = u.id) AS last_order_at
       FROM users u WHERE u.id = $1`,
    [customerId]
  );
  if (!rows[0]) throw notFound('Customer not found');

  const addresses = await query('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC', [customerId]);
  const orders = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY placed_at DESC LIMIT 10', [customerId]);

  const customer = toCustomer(rows[0]);
  const orderCount = customer.orderCount || 0;
  const totalSpent = customer.totalSpent || 0;

  return {
    customer,
    addresses: addresses.rows.map(toAddress),
    orders: orders.rows.map((row) => toOrder(row)),
    stats: {
      orderCount,
      totalSpent,
      averageOrderValue: orderCount ? Math.round((totalSpent / orderCount) * 100) / 100 : 0,
    },
  };
};

const setCustomerActive = async (customerId, isActive) => {
  const { rows } = await query(
    'UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1 AND role = $3 RETURNING *',
    [customerId, isActive, 'customer']
  );
  if (!rows[0]) throw notFound('Customer not found');
  return toCustomer(rows[0]);
};

const getInventory = async ({ q, lowOnly = false, outOfStock = false }) => {
  const clauses = [];
  const params = [];
  if (q) {
    params.push(`%${q}%`);
    clauses.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`);
  }
  if (lowOnly) clauses.push('p.stock > 0 AND p.stock <= p.low_stock_threshold');
  if (outOfStock) clauses.push('p.stock = 0');

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT p.id, p.name, p.sku, p.stock, p.low_stock_threshold, p.price, p.is_active,
            c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${where}
      ORDER BY p.stock ASC, p.name ASC`,
    params
  );

  const summary = await query(`
    SELECT
      COALESCE(SUM(stock), 0)::int AS total_units,
      COUNT(*)::int AS total_products,
      COUNT(*) FILTER (WHERE stock = 0)::int AS out_of_stock,
      COUNT(*) FILTER (WHERE stock > 0 AND stock <= low_stock_threshold)::int AS low_stock,
      COALESCE(SUM(stock * price), 0) AS inventory_value
      FROM products
  `);

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      stock: row.stock,
      threshold: row.low_stock_threshold,
      price: Number(row.price),
      isActive: row.is_active,
      categoryName: row.category_name,
      status: row.stock === 0 ? 'Out of stock' : row.stock <= row.low_stock_threshold ? 'Low stock' : 'In stock',
    })),
    summary: {
      totalUnits: summary.rows[0].total_units,
      totalProducts: summary.rows[0].total_products,
      outOfStock: summary.rows[0].out_of_stock,
      lowStock: summary.rows[0].low_stock,
      inventoryValue: Number(summary.rows[0].inventory_value),
    },
  };
};

const listContactMessages = async () => {
  const { rows } = await query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100');
  return rows;
};

const markContactRead = async (id, isRead = true) => {
  const { rows } = await query('UPDATE contact_messages SET is_read = $2 WHERE id = $1 RETURNING *', [id, isRead]);
  if (!rows[0]) throw notFound('Message not found');
  return rows[0];
};

module.exports = {
  getDashboard,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  listOrders,
  getOrder,
  updateOrderStatus,
  updatePaymentStatus,
  listCustomers,
  getCustomer,
  setCustomerActive,
  getInventory,
  listContactMessages,
  markContactRead,
};
