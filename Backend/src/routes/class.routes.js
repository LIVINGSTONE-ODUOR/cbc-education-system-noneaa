// =============================================================================
// class.routes.js
// Base path (mounted in app.js): /api/v1/classes
// =============================================================================

const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createClass,
  listClasses,
  getClass,
  updateClass,
  deleteClass,
  getClassLearners,
  getClassTimetable,
  getClassLearningAreas,
  setClassLearningAreas,
} = require('../controllers/class.controller');

// All class routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Collection routes
// ---------------------------------------------------------------------------

// POST  /api/v1/classes
//   Body: { grade_level*, stream_name, class_teacher_id, branch_id,
//            academic_year_id, capacity, learning_area_ids }
//   * required. learning_area_ids (optional) assigns the class's subjects
//   in the same request — see PUT /:id/learning-areas to change them later.
router.post('/', createClass);

// GET   /api/v1/classes
//   Query: academic_year_id | grade_level | is_active | branch_id
//          page | limit | sort_by (grade_level|stream_name|created_at|capacity) | sort_order
//   Response: classes + live learner_count per class
router.get('/', listClasses);

// ---------------------------------------------------------------------------
// Member routes (specific class by id)
// ---------------------------------------------------------------------------

// GET    /api/v1/classes/:id
//   Response: class detail + 10 most recent enrolled learners + subject assignments
router.get('/:id', getClass);

// PUT    /api/v1/classes/:id
//   Body (all optional): { class_teacher_id, capacity, stream_name, branch_id, is_active }
//   Guard: capacity cannot drop below current enrolled count
router.put('/:id', updateClass);

// DELETE /api/v1/classes/:id
//   Guard: blocked if any learners are currently enrolled (status = 'enrolled')
//   Effect: soft-deletes class, deactivates teacher_assignments + timetable_slots
router.delete('/:id', deleteClass);

// GET    /api/v1/classes/:id/learners
//   Full paginated roster for this class
//   Query: status (enrolled|withdrawn|all) | gender | search | page | limit
//          sort_by | sort_order
router.get('/:id/learners', getClassLearners);

// GET    /api/v1/classes/:id/timetable
//   Weekly schedule grid grouped by day → periods
//   Query: academic_year_id (defaults to current) | term_id
router.get('/:id/timetable', getClassTimetable);

// GET    /api/v1/classes/:id/learning-areas
//   Resolved subject list for this class: explicit assignment if the class
//   has one, otherwise the grade_levels/class_ids default.
router.get('/:id/learning-areas', getClassLearningAreas);

// PUT    /api/v1/classes/:id/learning-areas
//   Body: { learning_area_ids: string[] }
//   Replaces the explicit subject assignment for this class.
//   Roles: school_admin, super_admin
router.put('/:id/learning-areas', setClassLearningAreas);

module.exports = router;
