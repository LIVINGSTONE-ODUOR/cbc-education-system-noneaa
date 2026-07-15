const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const schoolRegistrationController = require('../controllers/schoolRegistration.controller');
const schoolValidator = require('../validators/school.validator');
const { authenticate, auditLog, securityHeaders, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply security headers to all auth routes
router.use(securityHeaders);

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const raw = req.body && req.body.email;
    if (raw && typeof raw === 'string') {
      const normalized = raw.toLowerCase().trim();
      if (normalized.length > 0 && normalized.length <= 254) {
        return normalized;
      }
    }
    return req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || 'fallback';
  },
  message: {
    success: false,
    message: 'Too many authentication attempts for this account, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for registration endpoints
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== v1 Auth Routes ====================
// Login endpoint
router.post('/v1/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  auditLog('USER_LOGIN'),
  authController.login
);

// Step 2 of login when the account has 2FA enabled
router.post('/v1/login/2fa-verify',
  authLimiter,
  [
    body('tempToken').notEmpty().withMessage('tempToken is required'),
    body('code').notEmpty().withMessage('Code is required'),
  ],
  auditLog('USER_LOGIN_2FA_VERIFY'),
  authController.verifyTwoFactorLogin
);

// Logout endpoint
router.post('/v1/logout',
  authenticate,
  auditLog('USER_LOGOUT'),
  authController.logout
);

// Device / session history — list the caller's active sessions
router.get('/v1/sessions',
  authenticate,
  authController.getMySessions
);

// Sign a single device/session out remotely
router.delete('/v1/sessions/:id',
  authenticate,
  auditLog('REVOKE_SESSION'),
  authController.revokeSession
);

// Refresh token endpoint
router.post('/v1/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  auditLog('TOKEN_REFRESH'),
  authController.refreshToken
);

// ==================== v1 Registration Routes ====================
// Register School Admin (public)
router.post('/v1/register/school-admin',
  registerLimiter,
  schoolValidator.validateSchoolAdminRegistration,
  auditLog('REGISTER_SCHOOL_ADMIN'),
  schoolRegistrationController.registerSchoolAdmin
);

// Register Teacher (requires school admin authentication)
router.post('/v1/register/teacher',
  authenticate,
  authorize('school_admin'),
  schoolValidator.validateTeacherRegistration,
  auditLog('REGISTER_TEACHER'),
  schoolRegistrationController.registerTeacher
);

// Register Parent (public)
router.post('/v1/register/parent',
  registerLimiter,
  schoolValidator.validateParentRegistration,
  auditLog('REGISTER_PARENT'),
  schoolRegistrationController.registerParent
);

// Check School Code Availability
router.get('/v1/check-school-code/:code',
  schoolRegistrationController.checkSchoolCode
);

// Check Email Availability
router.get('/v1/check-email',
  schoolRegistrationController.checkEmail
);

// Get School by Code
router.get('/v1/school/:code',
  schoolRegistrationController.getSchoolByCode
);

// Check Subdomain Availability (live, as admin types during registration)
router.get('/v1/check-subdomain/:subdomain',
  schoolRegistrationController.checkSubdomain
);

// Get School by Subdomain (used by the login page to resolve
// {subdomain}.noneaa.com to a specific school)
router.get('/v1/school/by-subdomain/:subdomain',
  schoolRegistrationController.getSchoolBySubdomain
);

// ==================== Legacy Routes (for backward compatibility) ====================
// Login endpoint (legacy)
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  auditLog('USER_LOGIN'),
  authController.login
);

// Step 2 of login when the account has 2FA enabled (legacy alias)
router.post('/login/2fa-verify',
  authLimiter,
  [
    body('tempToken').notEmpty().withMessage('tempToken is required'),
    body('code').notEmpty().withMessage('Code is required'),
  ],
  auditLog('USER_LOGIN_2FA_VERIFY'),
  authController.verifyTwoFactorLogin
);

// Logout endpoint (legacy)
router.post('/logout',
  authenticate,
  auditLog('USER_LOUT'),
  authController.logout
);

// Refresh token endpoint (legacy)
router.post('/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  auditLog('TOKEN_REFRESH'),
  authController.refreshToken
);

module.exports = router;
