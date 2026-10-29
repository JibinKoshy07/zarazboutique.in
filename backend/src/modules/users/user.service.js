const { query } = require('../../db/pool');
const { hashPassword, verifyPassword } = require('../../middleware/auth');
const { notFound, unauthorized } = require('../../utils/errors');
const { toCustomer } = require('../../utils/serialize');

const getProfile = async (userId) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at, u.last_login_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id)::int AS order_count,
            (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o
              WHERE o.user_id = u.id AND o.status <> 'Cancelled') AS total_spent
       FROM users u
      WHERE u.id = $1`,
    [userId]
  );
  if (!rows[0]) throw notFound('Account not found');
  return toCustomer(rows[0]);
};

const updateProfile = async (userId, { name, phone }) => {
  const { rows } = await query(
    `UPDATE users SET name = $2, phone = $3, updated_at = now()
      WHERE id = $1
      RETURNING id, name, email, phone, is_active, created_at, last_login_at`,
    [userId, name, phone || null]
  );
  if (!rows[0]) throw notFound('Account not found');
  return toCustomer(rows[0]);
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (!rows[0]) throw notFound('Account not found');

  const ok = await verifyPassword(currentPassword, rows[0].password_hash);
  if (!ok) throw unauthorized('Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  await query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [userId, passwordHash]);
  return { updated: true };
};

module.exports = { getProfile, updateProfile, changePassword };
