const { AppError } = require('../utils/errors');
const env = require('../config/env');

const notFoundHandler = (req, res) => {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const isExpected = err instanceof AppError || err.expected === true;

  if (!isExpected) {
    console.error('[error]', req.method, req.originalUrl, '-', err.message);
    if (!env.isProduction) console.error(err.stack);
  }

  const status = isExpected ? err.status || 400 : 500;
  const message = isExpected ? err.message : 'Something went wrong. Please try again.';

  const body = { error: { message } };
  if (isExpected && err.details) body.error.details = err.details;
  if (!env.isProduction && !isExpected) body.error.stack = err.stack;

  res.status(status).json(body);
};

module.exports = { notFoundHandler, errorHandler };
