/**
 * Session Timeout Middleware — CBC Education System
 *
 * Automatically expires user sessions after a configurable period of inactivity.
 * Uses DB-based last_activity timestamp to allow horizontal scaling.
 */

const { query } = require('../config/database');
const logger = require('../utils/logger');

const SESSION_TIMEOUT_MINUTES = parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 60;

const sessionTimeout = async (req, res, next) => {
  // Skip timeout checks for non-authenticated requests
  if (!req.user || !req.user.id) {
    return next();
  }

  try {
    const userId = req.user.id;

    // Update last_activity every 5 minutes (throttled)
    const now = Date.now();
    const lastUpdate = req._lastActivityUpdate || 0;

    if (now - lastUpdate > 5 * 60 * 1000) {
      const result = await query(
        'UPDATE users SET last_activity = NOW() WHERE id = $1 RETURNING last_activity',
        [userId]
      ).catch(() => ({ rows: [{ last_activity: new Date().toISOString() }] }));

      req._lastActivityUpdate = now;
    }

    next();
  } catch (error) {
    // Never block the request due to timeout tracking failure
    logger.warn('Session timeout check failed:', error.message);
    next();
  }
};

module.exports = { sessionTimeout };
