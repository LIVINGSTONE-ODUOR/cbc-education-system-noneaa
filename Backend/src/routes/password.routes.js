const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const passwordController = require('../controllers/password.controller');
const { authenticate, auditLog, securityHeaders } = require('../middleware/auth');

const router = express.Router();

// Apply security headers to all password routes
router.use(securityHeaders);

// Rate limiting for password endpoints
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many password attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request password reset (public endpoint)
router.post('/request-reset', 
  passwordLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email address'),
  ],
  auditLog('REQUEST_PASSWORD_RESET'),
  passwordController.requestPasswordReset
);

// Reset password (public endpoint)
router.post('/reset', 
  passwordLimiter,
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  ],
  auditLog('RESET_PASSWORD'),
  passwordController.resetPassword
);

// Change password (requires authentication)
router.post('/change', 
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
  ],
  auditLog('CHANGE_PASSWORD'),
  passwordController.changePassword
);

// Verify email (public endpoint)
router.get('/verify-email/:token', 
  auditLog('VERIFY_EMAIL'),
  passwordController.verifyEmail
);

module.exports = router;
