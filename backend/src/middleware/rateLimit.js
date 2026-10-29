const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const standard = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests. Please slow down and try again shortly.' } },
};

const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  ...standard,
});

// Login/register get a tighter budget to blunt credential-stuffing attempts.
const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  skipSuccessfulRequests: true,
  ...standard,
});

module.exports = { apiLimiter, authLimiter };
