const { verifyToken } = require('../config/auth');
const { query } = require('../config/database');

// Main Authentication Middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.substring(7);
  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (error) {
    console.error('🔴 Token verify failed:', error.name, error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  console.log('🔍 AUTH DEBUG:', {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role
  });

  // FIXED DB QUERY
  let userResult;
  try {
    userResult = await query(
      `SELECT u.id, u.email, u.role, u.status, COALESCE(u.school_id, sa.school_id) AS school_id
       FROM users u
       LEFT JOIN school_admins sa ON sa.user_id = u.id
       WHERE u.id = $1 AND (u.status IS NULL OR u.status != 'deleted')
       LIMIT 1`,
      [decoded.userId]
    );
  } catch (dbError) {
    console.error('❌ DB lookup failed:', dbError.message);
    req.user = decoded; // fallback
    return next();
  }

  if (userResult.rows.length === 0) {
    return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
  }

  const user = userResult.rows[0];
  req.user = user;
  next();
};

// Other required middlewares (minimal versions to prevent undefined errors)
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
  }
  next();
};

const auditLog = () => (req, res, next) => next();
const securityHeaders = (req, res, next) => next();

module.exports = {
  authenticate,
  authorize,
  auditLog,
  securityHeaders
};
