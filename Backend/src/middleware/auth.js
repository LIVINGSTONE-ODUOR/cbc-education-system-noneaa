const jwt = require('jsonwebtoken');
const { verifyToken, JWT_SECRET } = require('../config/auth');
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
      tokenLength: token ? token.length : null,
      authHeaderPreview: authHeader ? authHeader.slice(0, 30) : null
    });
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please login again.'
    });
  }
  const tokenUser = {
    id: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    schoolId: decoded.schoolId || null
  };

  console.log('🔍 AUTH DEBUG:', {
    jwtUserId: decoded.userId,
    jwtEmail: decoded.email,
    jwtRole: decoded.role,
    jwtSchoolId: decoded.schoolId
  });

  req.user = tokenUser;

  // FIXED QUERY - Only this part changed
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
  } catch (dbError) {
    console.error('❌ Authentication DB lookup failed, using JWT fallback:', dbError.message);
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

  try {
    await new Promise((resolve) => {
      sessionTimeout(req, res, (err) => {
        if (err) console.error('Session timeout error:', err);
        resolve();
      });
    });
  } catch (timeoutError) {
    console.error('Session timeout error:', timeoutError);
  }

  next();
};

// The rest of your middlewares (authorize, rateLimit, etc.) remain unchanged
const authorize = (...roles) => { /* your original code */ };
const requireSameSchool = (req, res, next) => { /* your original */ };
const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => { /* your original */ };
const validateInput = (schema) => { /* your original */ };
const csrfProtection = (req, res, next) => { /* your original */ };
const auditLog = (action) => { /* your original */ };
const securityHeaders = (req, res, next) => { /* your original */ };
const errorHandler = (err, req, res, next) => { /* your original */ };

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
