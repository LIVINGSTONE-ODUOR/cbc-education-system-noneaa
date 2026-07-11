const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/school.controller');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================================================
// IMPORTANT: Public routes MUST come BEFORE routes with parameters
// ============================================================================

// Public routes (no authentication required)
router.get('/plans', schoolController.getPlans);

// Protected routes - require authentication
router.use(authenticate);

// School management (Super Admin only for create/delete)
router.post('/', authorize('super_admin'), schoolController.createSchool);
// GET / is used by the school-admin dashboard too (e.g. Parents page loads
// it to populate a school selector). super_admin gets every school;
// school_admin gets only their own — scoping happens in getSchools().
router.get('/', authorize('super_admin', 'school_admin'), schoolController.getSchools);
router.get('/:id', authorize('super_admin', 'school_admin'), schoolController.getSchoolById);
router.put('/:id', authorize('super_admin'), schoolController.updateSchool);
router.delete('/:id', authorize('super_admin'), schoolController.deleteSchool);

// Subscription management
router.post('/:id/subscription', authorize('super_admin'), schoolController.createSubscription);
router.get('/:id/subscription', authorize('super_admin', 'school_admin'), schoolController.getCurrentSubscription);
router.get('/:id/payments', authorize('super_admin', 'school_admin'), schoolController.getPaymentHistory);

// Status management
router.patch('/:id/status', authorize('super_admin'), schoolController.updateSchoolStatus);

// Cron job endpoint (secured with secret)
router.post('/check-expiry', schoolController.checkExpiry);

// Branch management
router.get('/:schoolId/branches', authorize('super_admin', 'school_admin'), schoolController.getBranches);

// Learners for a specific school (School Management UI)
router.get('/:id/learners', authorize('super_admin', 'school_admin'), schoolController.getLearnersForSchool);

module.exports = router;
