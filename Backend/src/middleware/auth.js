const jwt = require('jsonwebtoken');
const { verifyToken, JWT_SECRET } = require('../config/auth');
const { query } = require('../config/database');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user details from database with optimized query
    const userResult = await query(
      `SELECT u.id, u.email, u.role, u.status, u.school_id
       FROM users u
       WHERE u.id = $1 AND u.status != 'deleted'
       LIMIT 1`,
      [decoded.userId]
    );

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

    // Set user context for RLS
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id
    };

    // Set PostgreSQL session variables for RLS (optimized)
    await query('SELECT set_config($1, $2, false)', ['app.current_user_id', user.id]);
    await query('SELECT set_config($1, $2, false)', ['app.current_user_role', user.role]);
    if (user.school_id) {
      await query('SELECT set_config($1, $2, false)', ['app.current_school_id', user.school_id]);
    }

    next();
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    console.error('❌ Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
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

    // Clean up old entries
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

    // Store original send and json methods
    const originalSend = res.send;
    const originalJson = res.json;

    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        
        // Only log audit if response is successful or created
        if (res.statusCode >= 200 && res.statusCode < 500) {
          const logData = {
            user_id: req.user?.id || null,
            school_id: req.user?.schoolId || null,
            action: action || `${req.method} ${req.route?.path || req.path}`,
            table_name: null,
            record_id: null,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            request_method: req.method,
            request_path: req.path,
            request_body: req.method !== 'GET' ? req.body : null,
            response_status: res.statusCode,
            response_time: duration,
            timestamp: new Date().toISOString()
          };

          // Log to console for monitoring
          console.log(`📊 Audit: ${logData.action} - ${res.statusCode} - ${duration}ms`);

          // Store in database (optional, can be disabled for performance)
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
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none';"
  );

  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  } else {
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack
    });
  }
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