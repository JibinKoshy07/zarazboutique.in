const crypto = require('crypto');
const { query, withTransaction } = require('../../db/pool');
const { notFound, badRequest } = require('../../utils/errors');
const { toOrder, toOrderItem } = require('../../utils/serialize');
const { round2 } = require('../../utils/helpers');
const { getCartForCheckout, clearCartInTransaction } = require('../cart/cart.service');
const { getOwnedAddressForOrder } = require('../addresses/address.service');
const { getProvider, isValidMethod } = require('../../services/payment');

const STATUS_FLOW = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
const TERMINAL_STATUSES = new Set(['Delivered', 'Cancelled', 'Returned']);
// Statuses that release reserved stock back to inventory when an order reaches them.
const STOCK_RELEASING_STATUSES = new Set(['Cancelled', 'Returned']);

const generateOrderNumber = () => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `ZB-${stamp}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

/**
 * Locks the requested product rows and reserves stock. `SELECT ... FOR UPDATE`
 * serialises concurrent checkouts so two buyers cannot oversell the last saree.
 */
const reserveStock = async (client, items) => {
  const locked = new Map();
  for (const item of items) {
    const { rows } = await client.query('SELECT id, name, price, stock, is_active FROM products WHERE id = $1 FOR UPDATE', [
      item.productId,
    ]);
    const product = rows[0];
    if (!product || !product.is_active) throw badRequest(`${item.product.name} is no longer available`);
    if (product.stock < item.quantity) {
      throw badRequest(`Only ${product.stock} of ${product.name} left in stock`);
    }
    locked.set(item.productId, product);
  }

  for (const item of items) {
    const product = locked.get(item.productId);
    await client.query('UPDATE products SET stock = stock - $2, updated_at = now() WHERE id = $1', [
      product.id,
      item.quantity,
    ]);
  }
  return locked;
};

const placeOrder = async (userId, { addressId, paymentMethod, notes }) => {
  if (!isValidMethod(paymentMethod)) throw badRequest('Select a valid payment method');
  const provider = getProvider();

  return withTransaction(async (client) => {
    const cart = await getCartForCheckout(client, userId);
    const address = await getOwnedAddressForOrder(client, userId, addressId);

    // Prices come from the locked product rows, never from the request body.
    const locked = await reserveStock(client, cart.items);

    const lines = cart.items.map((item) => {
      const product = locked.get(item.productId);
      const unitPrice = Number(product.price);
      return {
        ...item,
        productName: product.name,
        unitPrice,
        lineTotal: round2(unitPrice * item.quantity),
      };
    });

    const subtotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
    const shippingFee = cart.shippingFee;
    const total = round2(subtotal + shippingFee);

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (order_number, user_id, status, payment_status, payment_method, subtotal, shipping_fee,
          total_amount, item_count, customer_name, customer_email, customer_phone, shipping_address, notes)
       VALUES ($1,$2,'Pending',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        generateOrderNumber(),
        userId,
        provider.initialPaymentStatus(),
        paymentMethod,
        subtotal,
        shippingFee,
        total,
        lines.length,
        address.full_name,
        (await client.query('SELECT email FROM users WHERE id = $1', [userId])).rows[0].email,
        address.phone,
        JSON.stringify({
          fullName: address.full_name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postal_code,
          country: address.country,
          label: address.label,
        }),
        notes || null,
      ]
    );
    const order = orderRows[0];

    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, product_name, product_image, size, color, unit_price, quantity, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          order.id,
          line.productId,
          line.productName,
          line.product.image,
          line.size,
          line.color,
          line.unitPrice,
          line.quantity,
          line.lineTotal,
        ]
      );
    }

    await client.query(
      `INSERT INTO order_status_history (order_id, status, note, actor)
       VALUES ($1, 'Pending', 'Order placed by customer', 'customer')`,
      [order.id]
    );

    await clearCartInTransaction(client, userId);

    const intent = await provider.createIntent(order);
    const orderItems = lines.map((line) => ({
      id: null,
      productId: line.productId,
      productName: line.productName,
      productImage: line.product.image,
      size: line.size,
      color: line.color,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    }));
    return { order: toOrder(order, orderItems), payment: intent };
  });
};

const listUserOrders = async (userId, { status } = {}) => {
  const params = [userId];
  let where = 'WHERE o.user_id = $1';
  if (status) {
    params.push(status);
    where += ` AND o.status = $${params.length}`;
  }
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
      ORDER BY o.placed_at DESC`,
    params
  );
  return rows.map((row) => toOrder(row, row.items.map(toOrderItem)));
};

const getUserOrder = async (userId, orderId) => {
  const { rows } = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
  if (!rows[0]) throw notFound('Order not found');

  const items = await query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [orderId]);
  const history = await query('SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC', [orderId]);

  return toOrder({ ...rows[0], status_history: history.rows }, items.rows.map(toOrderItem));
};

/** Cancels a customer's own order and returns stock to inventory. */
const cancelUserOrder = async (userId, orderId) =>
  withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE', [
      orderId,
      userId,
    ]);
    const order = rows[0];
    if (!order) throw notFound('Order not found');
    if (TERMINAL_STATUSES.has(order.status)) throw badRequest(`A ${order.status.toLowerCase()} order cannot be cancelled`);
    if (['Shipped', 'Out for Delivery'].includes(order.status)) {
      throw badRequest('This order has shipped. Please contact support to arrange a return.');
    }

    await releaseStock(client, orderId);
    await client.query(
      "UPDATE orders SET status = 'Cancelled', updated_at = now() WHERE id = $1",
      [orderId]
    );
    await client.query(
      "INSERT INTO order_status_history (order_id, status, note, actor) VALUES ($1, 'Cancelled', 'Cancelled by customer', 'customer')",
      [orderId]
    );
    return { id: Number(orderId), status: 'Cancelled' };
  });

const releaseStock = async (client, orderId) => {
  const { rows } = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
  for (const item of rows) {
    if (!item.product_id) continue;
    await client.query('UPDATE products SET stock = stock + $2, updated_at = now() WHERE id = $1', [
      item.product_id,
      item.quantity,
    ]);
  }
};

module.exports = {
  placeOrder,
  listUserOrders,
  getUserOrder,
  cancelUserOrder,
  releaseStock,
  generateOrderNumber,
  STATUS_FLOW,
  TERMINAL_STATUSES,
  STOCK_RELEASING_STATUSES,
};
