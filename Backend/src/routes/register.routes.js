const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const registerController = require('../controllers/register.controller');
const { authenticate, authorize, auditLog, securityHeaders } = require('../middleware/auth');

const router = express.Router();

// Apply security headers to all register routes
router.use(securityHeaders);

// Rate limiting for registration endpoints
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register school admin (public endpoint)
router.post('/school-admin', 
  registerLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('schoolName').notEmpty().withMessage('School name is required'),
    body('schoolCode').notEmpty().withMessage('School code is required'),
    body('schoolLevel').isIn(['ecde', 'primary', 'junior_secondary', 'senior_secondary']).withMessage('Invalid school level'),
    body('county').notEmpty().withMessage('County is required'),
    body('subCounty').notEmpty().withMessage('Sub-county is required'),
    body('physicalAddress').notEmpty().withMessage('Physical address is required'),
    body('schoolPhoneNumber').isMobilePhone().withMessage('Please provide a valid school phone number'),
    body('schoolEmail').isEmail().withMessage('Please provide a valid school email address'),
    body('administratorEmail').isEmail().withMessage('Please provide a valid administrator email address'),
    body('administratorPassword').isLength({ min: 8 }).withMessage('Administrator password must be at least 8 characters long'),
  ],
  auditLog('REGISTER_SCHOOL_ADMIN'),
  registerController.registerSchoolAdmin
);

// Register teacher (requires school admin authentication)
router.post('/teacher', 
  authenticate,
  authorize('school_admin'),
  [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('tscNumber').notEmpty().withMessage('TSC number is required'),
    body('subjectsTaught').isArray({ min: 1 }).withMessage('At least one subject must be specified'),
    body('dateJoined').isISO8601().withMessage('Please provide a valid date'),
  ],
  auditLog('REGISTER_TEACHER'),
  registerController.registerTeacher
);

// Register parent (public endpoint)
router.post('/parent', 
  registerLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('relationship').isIn(['father', 'mother', 'guardian']).withMessage('Invalid relationship type'),
  ],
  auditLog('REGISTER_PARENT'),
  registerController.registerParent
);

// Register learner (requires school admin authentication)
router.post('/learner', 
  authenticate,
  authorize('school_admin'),
  [
    body('admissionNumber').notEmpty().withMessage('Admission number is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('dateOfBirth').isISO8601().withMessage('Please provide a valid date of birth'),
    body('gender').isIn(['male', 'female']).withMessage('Invalid gender'),
    body('gradeLevel').notEmpty().withMessage('Grade level is required'),
    body('parentEmail').isEmail().withMessage('Please provide a valid parent email address'),
    body('parentFirstName').notEmpty().withMessage('Parent first name is required'),
    body('parentLastName').notEmpty().withMessage('Parent last name is required'),
    body('parentRelationship').isIn(['father', 'mother', 'guardian']).withMessage('Invalid parent relationship'),
  ],
  auditLog('REGISTER_LEARNER'),
  registerController.registerLearner
);

module.exports = router;
