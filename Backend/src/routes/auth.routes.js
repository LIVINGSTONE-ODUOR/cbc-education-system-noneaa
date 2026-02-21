const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const registerController = require('../controllers/register.controller');
const { authenticate, auditLog, securityHeaders } = require('../middleware/auth');

const router = express.Router();

/* =====================================================
   GLOBAL SECURITY
===================================================== */

// Apply security headers to all auth routes
router.use(securityHeaders);

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* =====================================================
   PUBLIC ROUTES
===================================================== */

// ✅ Register School Admin (Bootstrap Endpoint)
router.post(
  '/register-school-admin',
  authLimiter,
  [
    body('administratorEmail')
      .isEmail()
      .withMessage('Please provide a valid administrator email'),

    body('administratorPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),

    body('schoolName')
      .notEmpty()
      .withMessage('School name is required'),

    body('schoolCode')
      .notEmpty()
      .withMessage('School code is required'),
  ],
  auditLog('REGISTER_SCHOOL_ADMIN'),
  registerController.registerSchoolAdmin
);

// ✅ Login
router.post(
  '/login',
  authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address'),

    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  auditLog('USER_LOGIN'),
  authController.login
);

// ✅ Refresh Token
router.post(
  '/refresh-token',
  authLimiter,
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
  ],
  auditLog('REFRESH_TOKEN'),
  authController.refreshToken
);

/* =====================================================
   PROTECTED ROUTES
===================================================== */

// ✅ Logout
router.post(
  '/logout',
  authenticate,
  auditLog('USER_LOGOUT'),
  authController.logout
);

module.exports = router;