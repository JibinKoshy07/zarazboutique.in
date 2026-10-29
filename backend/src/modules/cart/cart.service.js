const { query } = require('../../db/pool');
const { notFound, badRequest } = require('../../utils/errors');
const { toCartItem } = require('../../utils/serialize');
const { round2 } = require('../../utils/helpers');
const env = require('../../config/env');

const CART_SELECT = `
  SELECT ci.id, ci.product_id, ci.quantity, ci.size, ci.color,
         p.name, p.slug, p.image, p.images, p.price, p.stock, p.is_active,
         c.name AS category_name
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN categories c ON c.id = p.category_id
   WHERE ci.user_id = $1
   ORDER BY ci.created_at DESC
`;

const shippingFor = (subtotal) => {
  const { flatRate, freeAbove } = env.shipping;
  if (!flatRate || flatRate <= 0) return 0;
  if (freeAbove > 0 && subtotal >= freeAbove) return 0;
  return round2(flatRate);
};

const summarize = (items) => {
  const subtotal = round2(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const shippingFee = shippingFor(subtotal);
  return { items, subtotal, shippingFee, total: round2(subtotal + shippingFee), itemCount: items.length };
};

const getCart = async (userId) => {
  const { rows } = await query(CART_SELECT, [userId]);
  return summarize(rows.map(toCartItem));
};

const addItem = async (userId, { productId, quantity, size, color }) => {
  const product = await query('SELECT id, stock, is_active FROM products WHERE id = $1', [productId]);
  if (!product.rows[0]) throw notFound('Product not found');
  if (!product.rows[0].is_active) throw badRequest('This product is no longer available');

  const { rows: existing } = await query(
    `SELECT * FROM cart_items
      WHERE user_id = $1 AND product_id = $2
        AND COALESCE(size, '') = COALESCE($3, '')
        AND COALESCE(color, '') = COALESCE($4, '')`,
    [userId, productId, size || null, color || null]
  );

  const nextQuantity = (existing[0]?.quantity || 0) + quantity;
  if (nextQuantity > product.rows[0].stock) {
    throw badRequest(`Only ${product.rows[0].stock} left in stock`);
  }

  if (existing[0]) {
    await query('UPDATE cart_items SET quantity = $2, updated_at = now() WHERE id = $1', [existing[0].id, nextQuantity]);
  } else {
    await query(
      'INSERT INTO cart_items (user_id, product_id, quantity, size, color) VALUES ($1,$2,$3,$4,$5)',
      [userId, productId, nextQuantity, size || null, color || null]
    );
  }
  return getCart(userId);
};

const updateItem = async (userId, itemId, { quantity }) => {
  const { rows } = await query(
    `SELECT ci.id, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id
      WHERE ci.id = $1 AND ci.user_id = $2`,
    [itemId, userId]
  );
  if (!rows[0]) throw notFound('Cart item not found');

  if (quantity === 0) {
    await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    return getCart(userId);
  }
  if (quantity > rows[0].stock) throw badRequest(`Only ${rows[0].stock} left in stock`);

  await query('UPDATE cart_items SET quantity = $2, updated_at = now() WHERE id = $1 AND user_id = $3', [
    itemId,
    quantity,
    userId,
  ]);
  return getCart(userId);
};

const removeItem = async (userId, itemId) => {
  const result = await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [itemId, userId]);
  if (result.rowCount === 0) throw notFound('Cart item not found');
  return getCart(userId);
};

const clearCart = async (userId) => {
  await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  return summarize([]);
};

/** Reads the cart inside a transaction so checkout sees a consistent snapshot. */
const getCartForCheckout = async (client, userId) => {
  const { rows } = await client.query(CART_SELECT, [userId]);
  if (rows.length === 0) throw badRequest('Your cart is empty');
  return summarize(rows.map(toCartItem));
};

const clearCartInTransaction = async (client, userId) => {
  await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, getCartForCheckout, clearCartInTransaction, shippingFor };
