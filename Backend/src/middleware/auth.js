const jwt = require('jsonwebtoken');
const { verifyToken } = require('../config/auth');
const { query } = require('../config/database');

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

  // DB Lookup for extra validation
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
    console.error('❌ No user found in DB for ID:', decoded.userId);
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

  next();
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions for this action.' });
    }
    next();
  };
};

// School isolation
const requireSameSchool = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.role === 'super_admin') return next();
  if (!req.user.schoolId) {
    return res.status(403).json({ success: false, message: 'Access denied. No school assigned.' });
  }
  next();
};

// Placeholder for other middlewares
const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => (req, res, next) => next();
const validateInput = (schema) => (req, res, next) => next();
const csrfProtection = (req, res, next) => next();
const auditLog = (action) => (req, res, next) => next();
const securityHeaders = (req, res, next) => next();
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
};

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
