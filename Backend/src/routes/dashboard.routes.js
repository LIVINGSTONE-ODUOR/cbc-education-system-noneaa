/**
 * Dashboard Routes — CBC Education System
 *
 * All routes require authentication. School-scoped access is enforced
 * via the controller layer using req.user.schoolId.
 *
 * Mounted at: /api/v1/dashboard
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize, securityHeaders } = require('../middleware/auth');

// Apply security headers and authentication to all routes
router.use(securityHeaders);
router.use(authenticate);

// ─── STATISTICS ──────────────────────────────────────────────────
router.get('/stats', dashboardController.getSchoolStats);
router.post('/stats/refresh', authorize('school_admin', 'super_admin'), dashboardController.refreshSchoolStats);

// ─── ACTIVITIES ──────────────────────────────────────────────────
router.get('/activities', dashboardController.getSchoolActivities);
router.post('/activities', dashboardController.createSchoolActivity);

// ─── WIDGETS ─────────────────────────────────────────────────────
router.get('/widgets', dashboardController.getDashboardWidgets);
router.put('/widgets', dashboardController.saveDashboardWidget);
router.delete('/widgets/:widgetKey', dashboardController.deleteDashboardWidget);

// ─── PERFORMANCE ─────────────────────────────────────────────────
router.get('/learner-performance', dashboardController.getLearnerPerformance);
router.get('/analytics/grade-distribution', dashboardController.getGradeDistribution);

module.exports = router;
