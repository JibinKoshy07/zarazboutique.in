const { query } = require('../../db/pool');
const { hashPassword, verifyPassword, signToken } = require('../../middleware/auth');
const { normalizeEmail } = require('../../utils/helpers');
const { conflict, unauthorized } = require('../../utils/errors');
const { toCustomer } = require('../../utils/serialize');

const registerCustomer = async ({ name, email, phone, password }) => {
  const normalized = normalizeEmail(email);

  const existing = await query('SELECT id FROM users WHERE email = $1', [normalized]);
  if (existing.rows.length) throw conflict('An account with this email already exists');

  const passwordHash = await hashPassword(password);
  const { rows } = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, 'customer')
     RETURNING id, name, email, phone, role, created_at, last_login_at, is_active`,
    [name, normalized, phone || null, passwordHash]
  );

  const user = toCustomer(rows[0]);
  const token = signToken({ sub: user.id, role: 'customer', email: user.email, name: user.name });
  return { user, token };
};

const loginCustomer = async ({ email, password }) => {
  const normalized = normalizeEmail(email);
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [normalized]);
  const record = rows[0];

  // Same message for "no such user" and "wrong password" so the endpoint
  // cannot be used to enumerate registered emails.
  if (!record || !record.is_active) throw unauthorized('Invalid email or password');

  const ok = await verifyPassword(password, record.password_hash);
  if (!ok) throw unauthorized('Invalid email or password');

  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [record.id]);

  const user = toCustomer({ ...record, last_login_at: new Date() });
  const token = signToken({ sub: user.id, role: 'customer', email: user.email, name: user.name });
  return { user, token };
};

const loginAdmin = async ({ email, password }) => {
  const normalized = normalizeEmail(email);
  const { rows } = await query('SELECT * FROM admins WHERE email = $1', [normalized]);
  const record = rows[0];

  if (!record || !record.is_active) throw unauthorized('Invalid email or password');
  const ok = await verifyPassword(password, record.password_hash);
  if (!ok) throw unauthorized('Invalid email or password');

  await query('UPDATE admins SET last_login_at = now() WHERE id = $1', [record.id]);

  const admin = { id: record.id, name: record.name, email: record.email, role: record.role };
  const token = signToken({ sub: admin.id, role: 'admin', email: admin.email, name: admin.name });
  return { admin, token };
};

module.exports = { registerCustomer, loginCustomer, loginAdmin };
