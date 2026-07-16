/**
 * Request Logger Middleware
 *
 * Logs HTTP request metadata without exposing sensitive data.
 * In production: method, path, status, duration (no query params, no bodies, no origins).
 * In development: more detail but still redacts sensitive headers.
 */

const logger = require('../utils/logger');

const isProduction = (process.env.NODE_ENV || 'development').toLowerCase() === 'production';

function requestLogger(req, res, next) {
  const start = Date.now();

  // Capture the original end to log after response
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;

    if (isProduction) {
      // Production: minimal, safe
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    } else {
      // Development: more detail, but still no sensitive headers/bodies
      const safeHeaders = { ...req.headers };
      delete safeHeaders.authorization;
      delete safeHeaders.cookie;
      delete safeHeaders['set-cookie'];
      delete safeHeaders['x-csrf-token'];

      logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        origin: req.headers.origin || undefined,
      });
    }

    originalEnd.apply(res, args);
  };

  next();
}

module.exports = requestLogger;
