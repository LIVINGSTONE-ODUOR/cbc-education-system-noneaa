/**
 * CBC Grading System Routes
 *
 * All routes require authentication. Role-based access control is enforced
 * at the controller level for student/parent self-access checks.
 */

const express = require('express');
const router = express.Router();
const gradingController = require('../controllers/grading.controller');
const { authenticate, authorize, securityHeaders } = require('../middleware/auth');

// Apply security headers and authentication to all routes
router.use(securityHeaders);
router.use(authenticate);

// ─── GRADING SCHEMES ────────────────────────────────────────────
router.get('/schemes', gradingController.getSchemes);
router.post('/schemes', authorize('super_admin', 'school_admin'), gradingController.createScheme);
router.put('/schemes/:id', authorize('super_admin', 'school_admin'), gradingController.updateScheme);
router.delete('/schemes/:id', authorize('super_admin', 'school_admin'), gradingController.deleteScheme);

// ─── GRADING LEVELS ─────────────────────────────────────────────
router.get('/schemes/:id/levels', gradingController.getLevels);
router.post('/levels', authorize('super_admin', 'school_admin'), gradingController.createLevel);
router.put('/levels/:id', authorize('super_admin', 'school_admin'), gradingController.updateLevel);
router.delete('/levels/:id', authorize('super_admin', 'school_admin'), gradingController.deleteLevel);

// ─── COMPETENCY ASSESSMENTS ─────────────────────────────────────
router.post('/competency-assessments', authorize('teacher', 'school_admin', 'super_admin'), gradingController.saveCompetencyAssessment);
router.get('/competency-assessments', gradingController.getCompetencyAssessments);

// ─── SUBJECT ASSESSMENTS ────────────────────────────────────────
router.post('/subject-assessments', authorize('teacher', 'school_admin', 'super_admin'), gradingController.saveSubjectAssessment);
router.get('/subject-assessments', gradingController.getSubjectAssessments);

// ─── REPORT CARDS ───────────────────────────────────────────────
router.get('/report-cards', gradingController.getReportCards);
router.get('/report-cards/:id/full', gradingController.getFullReportCard);
router.put('/report-cards/:id/comments', authorize('teacher', 'school_admin', 'super_admin'), gradingController.updateReportCardComments);
router.post('/report-cards/:id/finalize', authorize('school_admin', 'super_admin'), gradingController.finalizeReportCard);

// ─── ANALYTICS ──────────────────────────────────────────────────
router.get('/analytics/class/:classId', authorize('teacher', 'school_admin', 'super_admin'), gradingController.getClassAnalytics);

// ─── PROMOTIONS ──────────────────────────────────────────────────
router.post('/promotions', authorize('school_admin', 'super_admin'), gradingController.savePromotionDecision);
router.get('/promotions', gradingController.getPromotionDecisions);

// ─── TRANSCRIPTS ────────────────────────────────────────────────
router.post('/transcripts/generate', authorize('school_admin', 'super_admin'), gradingController.generateTranscript);
router.get('/transcripts', gradingController.getTranscripts);

module.exports = router;
