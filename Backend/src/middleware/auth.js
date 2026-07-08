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

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
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

  console.log('🔍 AUTH DEBUG:', {
    jwtUserId: decoded.userId,
    jwtEmail: decoded.email,
    jwtRole: decoded.role,
    jwtSchoolId: decoded.schoolId
  });

  const tokenUser = {
    id: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    schoolId: decoded.schoolId || null
  };

  // Get user details from database with optimized query
  // Use COALESCE to fallback to school_admins.school_id for users where school_id is not set in users table
  let userResult;
  try {
    userResult = await query(
      `SELECT u.id, u.email, u.role, u.status,
              COALESCE(u.school_id, sa.school_id) AS school_id
       FROM users u
       LEFT JOIN school_admins sa ON sa.user_id = u.id
       WHERE u.id = $1
         AND (u.status IS NULL OR u.status != 'deleted')
       LIMIT 1`,
      [decoded.userId]
    );

    console.log("========== AUTH QUERY ==========");
    console.log("JWT userId:", decoded.userId);
    console.log("Rows returned:", userResult.rows.length);
    console.log("Rows:", JSON.stringify(userResult.rows, null, 2));
  } catch (dbError) {

    // DB fallback mode: trust signed JWT claims when DB is temporarily unavailable.
    // This keeps authenticated flows alive if Postgres connectivity is down.
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

  // Check if account is suspended
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
        if (err) {
          console.error('Session timeout error:', err);
        }
        resolve();
      });
    });
  } catch (timeoutError) {
    console.error('Session timeout error:', timeoutError);
  }

  next();
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions for this action.'
      });
    }

    next();
  };
};

// School isolation middleware
const requireSameSchool = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Super admins can access all schools
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Check if user has a school assigned
  if (!req.user.schoolId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. No school assigned to your account.'
    });
  }

  next();
};

// Rate limiting middleware
const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (attempts.has(ip)) {
      const userAttempts = attempts.get(ip);
      const validAttempts = userAttempts.filter(time => time > windowStart);
      attempts.set(ip, validAttempts);
    }

    const currentAttempts = attempts.get(ip) || [];

    if (currentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    currentAttempts.push(now);
    attempts.set(ip, currentAttempts);

    next();
  };
};

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errorMessages
      });
    }

    next();
  };
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and API endpoints that use JWT
  if (req.method === 'GET' || req.headers.authorization) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed.'
    });
  }

  next();
};

// Audit logging middleware
const auditLog = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;

        if (res.statusCode >= 200 && res.statusCode < 500) {
          const logData = {
            user_id: req.user?.id || null,
            school_id: req.user?.schoolId || null,
            action: action || `${req.method} ${req.route?.path || req.path}`,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            request_method: req.method,
            request_path: req.path,
            response_status: res.statusCode,
            response_time: duration,
            timestamp: new Date().toISOString()
          };

          console.log(`📊 Audit: ${logData.action} - ${res.statusCode} - ${duration}ms`);

          if (process.env.ENABLE_AUDIT_LOGGING === 'true') {
            try {
              await query(
                `INSERT INTO audit_logs (user_id, school_id, action, ip_address, user_agent, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [logData.user_id, logData.school_id, logData.action, logData.ip_address, logData.user_agent]
              );
            } catch (auditError) {
              console.error('❌ Audit logging failed:', auditError);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in audit logging:', error);
      }
    });

    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy - allow connections from frontend origins
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://cbc-education-system-sooty.vercel.app',
    'https://*.vercel.app',
    'https://*.render.com'
  ];

  const isAllowedOrigin = allowedOrigins.some(allowed =>
    origin === allowed ||
    (allowed.includes('*') && origin?.endsWith(allowed.replace('*', '').replace('.', ''))) ||
    (allowed.includes('vercel.app') && origin?.includes('vercel.app')) ||
    (allowed.includes('render.com') && origin?.includes('render.com'))
  );

  const connectSrc = isAllowedOrigin && origin
    ? `'self' https: ${origin}`
    : "'self' https: https://cbc-education-system-sooty.vercel.app https://cbc-education-system-1.onrender.com https://*.vercel.app https://*.render.com";

  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    `connect-src ${connectSrc}; ` +
    "frame-ancestors 'none';"
  );

  next();
};

module.exports = {
  authenticate,
  authorize,
  requireSameSchool,
  rateLimit,
  validateInput,
  csrfProtection,
  auditLog,
  securityHeaders
};

