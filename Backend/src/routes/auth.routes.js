const jwt = require('jsonwebtoken');
const { verifyToken } = require('../config/auth');
const { query } = require('../config/database');
const { sessionTimeout } = require('./sessionTimeout');

// Authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.substring(7);
  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (error) {
    console.error('🔴 Token verify failed:', {
      errorName: error?.name,
      errorMessage: error?.message,
      tokenPreview: token ? token.slice(0, 20) : null,
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.'
    });
  }

  const tokenUser = {
    id: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    schoolId: decoded.schoolId || null
  };

  console.log('🔍 AUTH DEBUG:', tokenUser);

  // DB Lookup
  let userResult;
  try {
    userResult = await query(
      `SELECT 
         u.id,
         u.email,
         u.role,
         u.status,
         COALESCE(u.school_id, sa.school_id) AS school_id
       FROM users u
       LEFT JOIN school_admins sa ON sa.user_id = u.id
       WHERE u.id = $1 
         AND (u.status IS NULL OR u.status != 'deleted')
       LIMIT 1`,
      [decoded.userId]
    );

    console.log('✅ DB User Lookup:', {
      rowsFound: userResult.rows.length,
      userId: decoded.userId
    });
  } catch (dbError) {
    console.error('❌ DB lookup failed, using JWT fallback:', dbError.message);
    req.user = tokenUser;
    return next();
  }

  if (userResult.rows.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. User not found or account deleted.'
    });
  }

  const user = userResult.rows[0];

  if (user.status === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'Account suspended. Please contact support.'
    });
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.school_id
  };

  // Session timeout
  try {
    await new Promise((resolve) => {
      sessionTimeout(req, res, (err) => {
        if (err) console.error('Session timeout error:', err);
        resolve();
      });
    });
  } catch (e) {
    console.error('Session timeout error:', e);
  }

  next();
};

// Other middlewares (authorize, etc.)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }
    next();
  };
};

const requireSameSchool = (req, res, next) => { /* add your existing code */ };
const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => { /* your existing */ };
const validateInput = (schema) => { /* your existing */ };
const csrfProtection = (req, res, next) => { /* your existing */ };
const auditLog = (action) => { /* your existing */ };
const securityHeaders = (req, res, next) => { /* your existing */ };
const errorHandler = (err, req, res, next) => { /* your existing */ };

module.exports = {
  authenticate,
  authorize,
  requireSameSchool,
  rateLimit,
  validateInput,
  csrfProtection,
  auditLog,
  securityHeaders,
  errorHandler
};
