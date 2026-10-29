const { badRequest } = require('./errors');

/** Wraps async route handlers so rejections reach the Express error middleware. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const toInt = (value, field = 'value') => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) throw badRequest(`${field} must be a number`);
  return parsed;
};

const toMoney = (value, field = 'amount') => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw badRequest(`${field} must be a positive number`);
  return Math.round(parsed * 100) / 100;
};

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/** Normalises an email so uniqueness checks and logins are case-insensitive. */
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const paginate = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 12));
  return { page, limit, offset: (page - 1) * limit };
};

/** Rounds to 2 decimals without floating-point drift (e.g. 0.1 + 0.2). */
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

module.exports = { asyncHandler, toInt, toMoney, slugify, normalizeEmail, paginate, round2 };
