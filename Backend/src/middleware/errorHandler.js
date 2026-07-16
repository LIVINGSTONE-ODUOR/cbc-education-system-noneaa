/**
 * Centralized Error Handler — CBC Education System
 *
 * Catches all errors thrown or passed to next(err) and returns a safe,
 * generic JSON response. Never exposes stack traces, database details,
 * file paths, or internal error codes to the client.
 *
 * In development, additional debug info may be included only if
 * SHOW_DEBUG_ERRORS=true is explicitly set.
 */

const logger = require('../utils/logger');

const isProduction = (process.env.NODE_ENV || 'development').toLowerCase() === 'production';
const showDebug = !isProduction && process.env.SHOW_DEBUG_ERRORS === 'true';

/**
 * Safely serialize an error for the response body.
 * In production (default), only the generic message is revealed.
 */
function safeErrorResponse(err) {
  const body = {
    success: false,
    message: 'Unable to process request.',
  };

  if (showDebug) {
    body.debug = {
      name: err.name,
      message: err.message,
      ...(err.stack && { stack: err.stack.split('\n').slice(0, 4).join('\n') }),
    };
  }

  // Handle specific known error types with appropriate status codes
  if (err.name === 'ValidationError' || err.statusCode === 400) {
    body.message = err.message || 'Validation failed.';
    return { statusCode: err.statusCode || 400, body };
  }

  if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
    body.message = err.message || 'Authentication required.';
    return { statusCode: err.statusCode || 401, body };
  }

  if (err.name === 'ForbiddenError' || err.statusCode === 403) {
    body.message = err.message || 'Insufficient permissions.';
    return { statusCode: err.statusCode || 403, body };
  }

  if (err.name === 'NotFoundError' || err.statusCode === 404) {
    body.message = err.message || 'Resource not found.';
    return { statusCode: err.statusCode || 404, body };
  }

  if (err.name === 'RateLimitError' || err.statusCode === 429) {
    body.message = err.message || 'Too many requests. Please try again later.';
    return { statusCode: err.statusCode || 429, body };
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    body.message = 'Request origin not allowed.';
    return { statusCode: 403, body };
  }

  // Database connection errors → generic
  if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'EHOSTUNREACH' ||
    err.message?.toLowerCase().includes('database') ||
    err.message?.toLowerCase().includes('connection refused') ||
    err.message?.toLowerCase().includes('timeout')
  ) {
    body.message = 'Service temporarily unavailable. Please try again.';
    return { statusCode: 503, body };
  }

  // Default to 500
  return { statusCode: 500, body };
}

/**
 * Express error-handling middleware (4 parameters).
 * Must be registered AFTER all routes.
 */
function errorHandler(err, req, res, _next) {
  // Log the full error server-side
  logger.error('Unhandled error:', {
    method: req.method,
    path: req.path,
    errorName: err.name,
    errorMessage: err.message,
    errorCode: err.code,
    ...(isProduction ? {} : { stack: err.stack }),
  });

  const { statusCode, body } = safeErrorResponse(err);

  return res.status(statusCode).json(body);
}

/**
 * 404 handler — must be registered BEFORE errorHandler.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'The requested endpoint was not found.',
  });
}

/**
 * Create an HTTP error with a specific name, status code, and message.
 * Useful in controllers: throw createError(401, 'UnauthorizedError', '…');
 */
function createError(statusCode, name, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.name = name;
  return err;
}

module.exports = {
  errorHandler,
  notFoundHandler,
  createError,
  safeErrorResponse,
};
