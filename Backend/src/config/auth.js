/**
 * Authentication & JWT Configuration — CBC Education System
 *
 * Handles password hashing, token generation/verification, account lockout,
 * and session cleanup. All sensitive operations use the centralized logger.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('./database');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// JWT Configuration
// ─────────────────────────────────────────────
// JWT_SECRET is required in ALL environments. The app refuses to start without it.
// This ensures tokens are valid across restarts and deployments.
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is not set. Refusing to start. ' +
      'Generate a long random secret (e.g. `openssl rand -hex 64`) and set it in your .env file.'
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// ─────────────────────────────────────────────
// Security Configuration
// ─────────────────────────────────────────────
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
const ATTEMPTS_PER_ROUND = parseInt(process.env.ATTEMPTS_PER_ROUND) || 3;
const BASE_LOCKOUT_MINUTES = parseInt(process.env.BASE_LOCKOUT_MINUTES) || 3;
const MAX_LOCKOUT_MINUTES = parseInt(process.env.MAX_LOCKOUT_MINUTES) || 120;

// ─────────────────────────────────────────────
// Secure Token Generation
// ─────────────────────────────────────────────
const generateSecureToken = () => crypto.randomBytes(32).toString('hex');

// ─────────────────────────────────────────────
// Password Helpers
// ─────────────────────────────────────────────
const hashPassword = async (password) => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// ─────────────────────────────────────────────
// JWT Token Generation
// ─────────────────────────────────────────────
const generateTokens = async (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.school_id || null,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = generateSecureToken();

  // Store refresh token in database
  try {
    await query(
      `INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, refreshToken, null, null, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );
  } catch (error) {
    logger.warn('Could not create user session:', error.message);
  }

  return { accessToken, refreshToken, expiresIn: JWT_EXPIRES_IN };
};

// ─────────────────────────────────────────────
// Token Verification
// ─────────────────────────────────────────────
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    const msg = error?.message || 'Invalid or expired token';
    const err = new Error(msg);
    err.name = error?.name;
    err.code = error?.code;
    throw err;
  }
};

// ─────────────────────────────────────────────
// Account Lockout
// ─────────────────────────────────────────────
const isAccountLocked = async (userId) => {
  try {
    const result = await query('SELECT locked_until FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return false;
    const lockedUntil = result.rows[0].locked_until;
    return lockedUntil && new Date() < new Date(lockedUntil);
  } catch (error) {
    logger.warn('Could not check account lock status:', error.message);
    return false;
  }
};

const incrementLoginAttempts = async (userId) => {
  try {
    const result = await query(
      `UPDATE users
       SET login_attempts = COALESCE(login_attempts, 0) + 1
       WHERE id = $1
       RETURNING login_attempts, locked_until`,
      [userId]
    );

    if (!result.rows[0]) return null;

    const attempts = result.rows[0].login_attempts;

    // Lock account every ATTEMPTS_PER_ROUND failures (progressive lockout)
    if (attempts % ATTEMPTS_PER_ROUND === 0) {
      const round = attempts / ATTEMPTS_PER_ROUND;
      const lockMinutes = Math.min(
        BASE_LOCKOUT_MINUTES * Math.pow(2, round - 1),
        MAX_LOCKOUT_MINUTES
      );

      await query(
        `UPDATE users
         SET locked_until = NOW() + ($1 * INTERVAL '1 minute')
         WHERE id = $2`,
        [lockMinutes, userId]
      );
    }

    return result.rows[0];
  } catch (error) {
    logger.warn('Could not increment login attempts:', error.message);
    return null;
  }
};

const resetLoginAttempts = async (userId) => {
  try {
    await query(
      `UPDATE users
       SET login_attempts = 0, locked_until = NULL
       WHERE id = $1`,
      [userId]
    );
  } catch (error) {
    logger.warn('Could not reset login attempts:', error.message);
  }
};

// ─────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters long');
  if (!/(?=.*[a-z])/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/(?=.*[A-Z])/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/(?=.*\d)/.test(password)) errors.push('Password must contain at least one number');
  if (!/(?=.*[@$!%*?&])/.test(password)) errors.push('Password must contain at least one special character (@$!%*?&)');
  return errors;
};

// ─────────────────────────────────────────────
// Database Uniqueness Checks
// ─────────────────────────────────────────────
const isEmailTaken = async (email, excludeUserId = null) => {
  let queryText = 'SELECT id FROM users WHERE email = $1';
  let params = [email];
  if (excludeUserId) {
    queryText += ' AND id != $2';
    params.push(excludeUserId);
  }
  const result = await query(queryText, params);
  return result.rows.length > 0;
};

const isTscNumberTaken = async (tscNumber, schoolId, excludeUserId = null) => {
  let queryText = 'SELECT id FROM teachers WHERE tsc_number = $1 AND school_id = $2';
  let params = [tscNumber, schoolId];
  if (excludeUserId) {
    queryText += ' AND user_id != $3';
    params.push(excludeUserId);
  }
  const result = await query(queryText, params);
  return result.rows.length > 0;
};

const isAdmissionNumberTaken = async (admissionNumber, schoolId, excludeLearnerId = null) => {
  let queryText = 'SELECT id FROM learners WHERE admission_number = $1 AND school_id = $2';
  let params = [admissionNumber, schoolId];
  if (excludeLearnerId) {
    queryText += ' AND id != $3';
    params.push(excludeLearnerId);
  }
  const result = await query(queryText, params);
  return result.rows.length > 0;
};

// ─────────────────────────────────────────────
// Session Cleanup
// ─────────────────────────────────────────────
const cleanupExpiredSessions = async () => {
  try {
    const result = await query('DELETE FROM user_sessions WHERE expires_at < NOW()');
    if (result.rowCount > 0) {
      logger.debug(`Cleaned up ${result.rowCount} expired sessions`);
    }
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
  }
};

// Schedule session cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────
module.exports = {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyToken,
  isAccountLocked,
  incrementLoginAttempts,
  resetLoginAttempts,
  isValidEmail,
  validatePassword,
  isEmailTaken,
  isTscNumberTaken,
  isAdmissionNumberTaken,
  cleanupExpiredSessions,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
};
