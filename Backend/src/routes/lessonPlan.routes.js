// =============================================================================
// lessonPlan.routes.js
// Base path (mounted in app.js): /api/v1/lesson-plans
// Principal / school_admin review of teacher-submitted lesson plans.
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { listSchoolLessonPlans, reviewLessonPlan } = require('../controllers/lessonPlan.controller');

router.use(authenticate);

// GET   /api/v1/lesson-plans — list plans for the school (school_admin only)
//   query params: status (default 'submitted'), teacher_id, class_id
router.get('/', listSchoolLessonPlans);

// PATCH /api/v1/lesson-plans/:id/review — approve or request changes
//   Body: { status: 'approved' | 'changes_requested', comment? }
router.patch('/:id/review', reviewLessonPlan);

module.exports = router;
