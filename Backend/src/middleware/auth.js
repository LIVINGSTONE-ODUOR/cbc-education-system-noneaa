/**
 * Authentication & Authorization Middleware — CBC Education System
 *
 * Provides:
 * - authenticate: JWT verification + DB user lookup
 * - authorize: role-based access control
 * - authenticateOwner: website owner token verification
 * - securityHeaders: CSP and other security response headers
 * - csrfProtection: CSRF token validation for non-JWT requests
 */

const { verifyToken } = require('../config/auth');
const { query } = require('../config/database');
const { sessionTimeout } = require('./sessionTimeout');
const logger = require('../utils/logger');

// ──────────────────────────────────────────────────────────
// AUTHENTICATE
// ──────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.substring(7);
  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (error) {
    logger.error('Token verification failed:', {
      name: error?.name,
      message: error?.message,
    });

    return res.status(401).json({
      success: false,
      message: 'Token expired. Please login again.',
    });
  }

  const tokenUser = {
    id: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    schoolId: decoded.schoolId || null,
  };

  // Get user details from database
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
  } catch (dbError) {
    // DB fallback: trust signed JWT claims when DB is temporarily unavailable
    logger.warn('Authentication DB lookup failed, using JWT fallback:', dbError.message);
    req.user = tokenUser;
    return next();
  }

  if (!userResult || userResult.rows.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. User not found or account deleted.',
    });
  }

  const user = userResult.rows[0];

  if (user.status === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'Account suspended. Please contact support.',
    });
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.school_id,
  };

  // Apply session timeout check (non-blocking on error)
  try {
    await new Promise((resolve) => {
      sessionTimeout(req, res, (err) => {
        if (err) logger.warn('Session timeout error:', err.message);
        resolve();
      });
    });
  } catch (timeoutError) {
    logger.warn('Session timeout error:', timeoutError.message);
  }

  next();
};

// ──────────────────────────────────────────────────────────
// AUTHORIZE (Role-based)
// ──────────────────────────────────────────────────────────
const authorize = (...roles) => {
  const allowed = roles.map((r) => r.toString().trim().toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRole = (req.user.role || '').toString().trim().toLowerCase();

    if (!allowed.includes(userRole)) {
      logger.warn(
        `Blocked user ${req.user.id} — role "${req.user.role}" not in [${roles.join(', ')}] on ${req.method} ${req.originalUrl}`
      );
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions for this action.',
      });
    }

    next();
  };
};

// ──────────────────────────────────────────────────────────
// AUTHENTICATE OWNER (Website Owner)
// ──────────────────────────────────────────────────────────
const authenticateOwner = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.substring(7);
  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please login again.',
    });
  }

  if (decoded.type !== 'website_owner') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token for this resource.',
    });
  }

  try {
    const result = await query(
      `SELECT id, name, email, status FROM website_owners WHERE id = $1 LIMIT 1`,
      [decoded.ownerId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Owner account not found.',
      });
    }

    const owner = result.rows[0];
    if (owner.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Please contact support.',
      });
    }

    req.owner = { id: owner.id, name: owner.name, email: owner.email };
    req.user = { id: owner.id, email: owner.email, role: 'website_owner', isOwner: true };

    next();
  } catch (dbError) {
    logger.error('Owner authentication DB lookup failed:', dbError.message);
    return res.status(503).json({
      success: false,
      message: 'Authentication temporarily unavailable. Please try again.',
    });
  }
};

// ──────────────────────────────────────────────────────────
// AUTHENTICATE SUPPORT STAFF
// ──────────────────────────────────────────────────────────
const authenticateSupportStaff = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  let decoded;
  try {
    decoded = verifyToken(authHeader.substring(7));
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
  }

  if (decoded.type === 'website_owner') {
    return authenticateOwner(req, res, next);
  }

  return authenticate(req, res, (err) => {
    if (err) return next(err);
    return authorize('super_admin')(req, res, next);
  });
};

// ──────────────────────────────────────────────────────────
// SCHOOL ISOLATION
// ──────────────────────────────────────────────────────────
const requireSameSchool = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (req.user.role === 'super_admin') {
    return next();
  }

  if (!req.user.schoolId) {
    return res.status(403).json({ success: false, message: 'Access denied. No school assigned to your account.' });
  }

  next();
};

// ──────────────────────────────────────────────────────────
// RATE LIMIT (In-memory fallback — prefer express-rate-limit)
// ──────────────────────────────────────────────────────────
const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (attempts.has(ip)) {
      const userAttempts = attempts.get(ip);
      const validAttempts = userAttempts.filter((time) => time > windowStart);
      attempts.set(ip, validAttempts);
    }

    const currentAttempts = attempts.get(ip) || [];

    if (currentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    currentAttempts.push(now);
    attempts.set(ip, currentAttempts);

    next();
  };
};

// ──────────────────────────────────────────────────────────
// SECURITY HEADERS
// ──────────────────────────────────────────────────────────
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy
  const origin = req.headers.origin;
  const connectSrc =
    origin && (origin.includes('vercel.app') || origin.includes('render.com') || origin.includes('noneaa.com') || origin.includes('localhost'))
      ? `'self' https: ${origin}`
      : "'self' https:";

  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; ` +
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'; ` +
    `style-src 'self' 'unsafe-inline'; ` +
    `img-src 'self' data: https:; ` +
    `font-src 'self' https: data:; ` +
    `connect-src ${connectSrc}; ` +
    `frame-ancestors 'none';`
  );

  next();
};

// ──────────────────────────────────────────────────────────
// AUDIT LOG (fire-and-forget, never blocks requests)
// ──────────────────────────────────────────────────────────
const auditLog = (action) => {
  return (req, res, next) => {
    // Fire-and-forget: never block the request.
    // Use req.user?.id || null so pre-auth actions (login, register, refresh)
    // are still logged without crashing.
    const logData = {
      user_id: req.user?.id || null,
      school_id: req.user?.schoolId || null,
      action: action || `${req.method} ${req.route?.path || req.path}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    };

    query(
      `INSERT INTO audit_logs (user_id, school_id, action, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [logData.user_id, logData.school_id, logData.action, logData.ip_address, logData.user_agent]
    ).catch((err) => logger.warn('Audit log failed:', err.message));

    next();
  };
};

// ──────────────────────────────────────────────────────────
// CSRF PROTECTION (for session-based auth; skipped with Bearer)
// ──────────────────────────────────────────────────────────
const csrfProtection = (req, res, next) => {
  if (req.method === 'GET' || req.headers.authorization) {
    return next();
  }
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  if (!token || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed.',
    });
  }
  next();
};

// ──────────────────────────────────────────────────────────
// INPUT VALIDATION
// ──────────────────────────────────────────────────────────
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errorMessages,
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authenticateOwner,
  authenticateSupportStaff,
  requireSameSchool,
  rateLimit,
  auditLog,
  csrfProtection,
  validateInput,
  securityHeaders,
};
