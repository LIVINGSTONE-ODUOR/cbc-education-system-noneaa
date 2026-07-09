// =============================================================================
// exam.routes.js
// Base path (mounted in app.js): /api/v1/exams
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createExam,
  listExams,
  getExam,
  updateExam,
  deleteExam,
} = require('../controllers/exam.controller');

// All exam routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Collection routes
// ---------------------------------------------------------------------------

// POST  /api/v1/exams
//   Body: { term_id*, class_id*, exam_name*, exam_type*, start_date*, end_date*, description }
//   * required. exam_type must be one of: CAT, Mid-Term, End-Term, Mock, Final
router.post('/', createExam);

// GET   /api/v1/exams
//   Query: search | exam_type | term_id | class_id | grade_level | is_active
//          page | limit | sort_by (start_date|end_date|exam_name|exam_type|created_at) | sort_order
router.get('/', listExams);

// ---------------------------------------------------------------------------
// Member routes (specific exam by id)
// ---------------------------------------------------------------------------

// GET    /api/v1/exams/:id
router.get('/:id', getExam);

// PUT    /api/v1/exams/:id
//   Body (all optional): { term_id, class_id, exam_name, exam_type, start_date, end_date, description, is_active }
router.put('/:id', updateExam);

// DELETE /api/v1/exams/:id
router.delete('/:id', deleteExam);

module.exports = router;
