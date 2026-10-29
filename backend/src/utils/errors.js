/** Error type that carries an HTTP status and optional field-level details. */
class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
    this.expected = true;
  }
}

const badRequest = (message, details) => new AppError(400, message, details);
const unauthorized = (message = 'Authentication required') => new AppError(401, message);
const forbidden = (message = 'You do not have access to this resource') => new AppError(403, message);
const notFound = (message = 'Resource not found') => new AppError(404, message);
const conflict = (message, details) => new AppError(409, message, details);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict };
