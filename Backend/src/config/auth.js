const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('./database');

// ====================== CONFIG ======================
const JWT_SECRET = process.env.JWT_SECRET || 
  (process.env.NODE_ENV === 'production' 
    ? 'cbc-education-system-production-secret-key-2024-change-me-in-prod'
    : crypto.randomBytes(64).toString('hex'));

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';           // Increased from 1h
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// ====================== HELPERS ======================
const generateSecureToken = () => crypto.randomBytes(32).toString('hex');

const hashPassword = async (password) => {
  if (!password || password.length < 8) throw new Error('Password must be at least 8 characters');
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// ====================== TOKEN GENERATION ======================
const generateTokens = async (user) => {
  const payload = {
    id: user.id,
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.school_id || null
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = generateSecureToken();

  // Store refresh token
  try {
    await query(
      `INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${REFRESH_TOKEN_EXPIRES_IN}')`,
      [user.id, refreshToken, null, null]
    );
  } catch (err) {
    console.warn('⚠️ Could not store refresh token:', err.message);
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN
  };
};

// ====================== REFRESH TOKEN ======================
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new Error('Refresh token required');

  const result = await query(
    `SELECT us.*, u.id, u.email, u.role, u.school_id 
     FROM user_sessions us
     JOIN users u ON us.user_id = u.id
     WHERE us.session_token = $1 AND us.expires_at > NOW()`,
    [refreshToken]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = result.rows[0];

  // Generate new access token
  const { accessToken } = await generateTokens(user);

  return {
    accessToken,
    refreshToken,           // Send back same refresh token
    expiresIn: JWT_EXPIRES_IN
  };
};

// ====================== VERIFY TOKEN ======================
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// ====================== OTHER FUNCTIONS (cleaned) ======================
const isAccountLocked = async (userId) => { ... }; // keep your existing logic

const incrementLoginAttempts = async (userId) => { ... }; // keep existing

const resetLoginAttempts = async (userId) => { ... };

const cleanupExpiredSessions = async () => {
  try {
    const result = await query('DELETE FROM user_sessions WHERE expires_at < NOW()');
    console.log(`🧹 Cleaned ${result.rowCount} expired sessions`);
  } catch (e) {
    console.error('Cleanup error:', e.message);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  hashPassword,
  verifyPassword,
  generateTokens,
  refreshAccessToken,        // ← NEW
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
  JWT_EXPIRES_IN
};
