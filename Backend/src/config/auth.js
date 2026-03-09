const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, transaction } = require('./database');

// JWT Configuration - Use a fixed secret for production to persist across restarts
// IMPORTANT: Set JWT_SECRET in environment variables for production
const JWT_SECRET = process.env.JWT_SECRET || 
  (process.env.NODE_ENV === 'production' 
    ? 'cbc-education-system-production-secret-key-2024' 
    : crypto.randomBytes(64).toString('hex'));
    
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Security Configuration
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
// Progressive lockout: every ATTEMPTS_PER_ROUND failures triggers a lockout.
// The first lockout lasts BASE_LOCKOUT_MINUTES; each subsequent round doubles the duration.
// e.g. round 1 (3 failures) → 3 min, round 2 (3 more) → 6 min, round 3 → 12 min, …
// The lockout duration is capped at MAX_LOCKOUT_MINUTES to prevent unreasonably long bans.
const ATTEMPTS_PER_ROUND = parseInt(process.env.ATTEMPTS_PER_ROUND) || 3;
const BASE_LOCKOUT_MINUTES = parseInt(process.env.BASE_LOCKOUT_MINUTES) || 3;
const MAX_LOCKOUT_MINUTES = parseInt(process.env.MAX_LOCKOUT_MINUTES) || 120; // 2 hours

// Helper function to generate secure tokens
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to hash password
const hashPassword = async (password) => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Helper function to verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT tokens
const generateTokens = async (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.school_id || null
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = generateSecureToken();

  // Store refresh token in database - handle missing table gracefully
  try {
    await query(
      `INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        refreshToken,
        null, // Will be set during login
        null, // Will be set during login
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      ]
    );
  } catch (error) {
    // If table doesn't exist, just log and continue without session storage
    console.warn('⚠️ Could not create user session:', error.message);
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN
  };
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Check if user is locked out
const isAccountLocked = async (userId) => {
  const result = await query(
    'SELECT locked_until FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) return false;

  const lockedUntil = result.rows[0].locked_until;
  return lockedUntil && new Date() < new Date(lockedUntil);
};

// Increment login attempts - progressive lockout (doubles each round)
const incrementLoginAttempts = async (userId) => {
  try {
    // Step 1: Increment the attempt counter
    const result = await query(
      `UPDATE users 
       SET login_attempts = COALESCE(login_attempts, 0) + 1
       WHERE id = $1
       RETURNING login_attempts, locked_until`,
      [userId]
    );

    if (!result.rows[0]) return null;

    const attempts = result.rows[0].login_attempts;

    // Step 2: Lock the account every ATTEMPTS_PER_ROUND failures
    if (attempts % ATTEMPTS_PER_ROUND === 0) {
      const round = attempts / ATTEMPTS_PER_ROUND;
      // Duration doubles each round: 3min, 6min, 12min, 24min, … capped at MAX_LOCKOUT_MINUTES
      const lockMinutes = Math.min(
        BASE_LOCKOUT_MINUTES * Math.pow(2, round - 1),
        MAX_LOCKOUT_MINUTES
      );

      const lockResult = await query(
        `UPDATE users 
         SET locked_until = NOW() + ($1 * INTERVAL '1 minute')
         WHERE id = $2
         RETURNING login_attempts, locked_until`,
        [lockMinutes, userId]
      );

      return lockResult.rows[0];
    }

    return result.rows[0];
  } catch (error) {
    // If column doesn't exist, just log and continue
    console.warn('⚠️ Could not increment login attempts:', error.message);
    return null;
  }
};

// Reset login attempts on successful login - handle missing columns gracefully
const resetLoginAttempts = async (userId) => {
  try {
    await query(
      `UPDATE users 
       SET login_attempts = 0, 
           locked_until = NULL, 
           last_login = NOW()
       WHERE id = $1`,
      [userId]
    );
  } catch (error) {
    // If columns don't exist, just log and continue
    console.warn('⚠️ Could not reset login attempts:', error.message);
  }
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return errors;
};

// Check if email is already in use
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

// Check if TSC number is already in use
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

// Check if admission number is already in use
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

// Clean up expired sessions
const cleanupExpiredSessions = async () => {
  try {
    const result = await query(
      'DELETE FROM user_sessions WHERE expires_at < NOW()'
    );
    console.log(`🧹 Cleaned up ${result.rowCount} expired sessions`);
  } catch (error) {
    console.error('❌ Error cleaning up expired sessions:', error);
  }
};

// Schedule session cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

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
  REFRESH_TOKEN_EXPIRES_IN
};