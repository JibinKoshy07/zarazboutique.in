const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { unauthorized } = require('../utils/errors');

const SALT_ROUNDS = 12;

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

const signToken = (payload) =>
  jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
    issuer: env.jwt.issuer,
  });

const verifyToken = (token) => jwt.verify(token, env.jwt.secret, { issuer: env.jwt.issuer });

/**
 * Populates `req.auth` from a Bearer token when one is present and valid.
 * Invalid tokens are ignored here so public routes stay public; the
 * requireUser/requireAdmin guards reject the request when auth is mandatory.
 */
const attachAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const decoded = verifyToken(token);
      req.auth = { id: decoded.sub, role: decoded.role, email: decoded.email, name: decoded.name };
    } catch {
      req.auth = undefined;
    }
  }
  next();
};

const requireUser = (req, _res, next) => {
  if (!req.auth) return next(unauthorized());
  if (req.auth.role !== 'customer') return next(unauthorized('Customer account required'));
  return next();
};

const requireAdmin = (req, _res, next) => {
  if (!req.auth) return next(unauthorized('Admin authentication required'));
  if (req.auth.role !== 'admin') return next(unauthorized('Admin privileges required'));
  return next();
};

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  attachAuth,
  requireUser,
  requireAdmin,
};
