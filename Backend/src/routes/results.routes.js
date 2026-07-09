// =============================================================================
// results.routes.js
// Base path (mounted in app.js): /api/v1/results
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  bulkUpsertResults,
  listResults,
  getLearnerResults,
  searchLearners,
  compareResults,
  deleteResult,
} = require('../controllers/results.controller');

// All results routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Collection routes
// ---------------------------------------------------------------------------

// POST   /api/v1/results/bulk
//   Body: { exam_id*, learning_area_id*, class_id, results*: [{ learner_id*, marks_obtained*, max_marks, is_absent, remarks }] }
//   * required. Roles: school_admin, super_admin, teacher
router.post('/bulk', bulkUpsertResults);

// GET    /api/v1/results
//   Query: exam_id* | class_id | learning_area_id | page | limit
router.get('/', listResults);

// GET    /api/v1/results/search?query=
//   Search learners by name / admission number
router.get('/search', searchLearners);

// GET    /api/v1/results/compare?learner_id=*&exam_ids=id1,id2,id3
//   Compare one learner's performance across exams
router.get('/compare', compareResults);

// ---------------------------------------------------------------------------
// Member routes
// ---------------------------------------------------------------------------

// GET    /api/v1/results/learner/:learner_id
//   Full final-result history for one learner (every exam sat, totals, grade, position)
router.get('/learner/:learner_id', getLearnerResults);

// DELETE /api/v1/results/:id
//   Roles: school_admin, super_admin, teacher
router.delete('/:id', deleteResult);

module.exports = router;
