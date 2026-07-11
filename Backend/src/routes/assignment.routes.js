// =============================================================================
// assignment.routes.js
// Base path (mounted in app.js): /api/v1/assignments
// =============================================================================

const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createAssignment,
  listAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  listSubmissions,
  gradeSubmission,
  submitAssignment,
  getLearnerAssignmentsDue,
} = require('../controllers/assignment.controller');

// Attachment upload — PDF or Word, 15MB. Actual mimetype re-validated in the
// controller since browsers can lie about file extensions.
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// All assignment routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Collection routes
// ---------------------------------------------------------------------------

// POST   /api/v1/assignments
//   multipart/form-data: class_id*, learning_area_id*, title*, description,
//   due_date*, max_grade, attachment (file, optional)
//   Roles: teacher (own class/subject only), school_admin, super_admin
router.post('/', attachmentUpload.single('attachment'), createAssignment);

// GET    /api/v1/assignments
//   Query: class_id | learning_area_id | page | limit
//   Teachers see only their own assignments; admins see the whole school.
router.get('/', listAssignments);

// GET    /api/v1/assignments/learner/:learnerId/due
//   Query: include_submitted=true to also return already-submitted work
//   (default: only not-yet-submitted assignments for the learner's class).
//   Roles: parent (own linked child only), student (self only),
//          teacher/school_admin/super_admin (any learner in their school)
//   NOTE: declared before '/:id' below even though it wouldn't actually
//   collide (different segment count) — kept here for readability, matching
//   the "specific routes before generic ones" convention used elsewhere.
router.get('/learner/:learnerId/due', getLearnerAssignmentsDue);

// ---------------------------------------------------------------------------
// Member routes
// ---------------------------------------------------------------------------

// GET    /api/v1/assignments/:id
router.get('/:id', getAssignment);

// PUT    /api/v1/assignments/:id
//   multipart/form-data (all optional): title, description, due_date,
//   max_grade, is_active, attachment (file, replaces the existing one)
router.put('/:id', attachmentUpload.single('attachment'), updateAssignment);

// DELETE /api/v1/assignments/:id
router.delete('/:id', deleteAssignment);

// GET    /api/v1/assignments/:id/submissions
//   Every enrolled learner in the class + their submission, if any.
//   Roles: teacher (own assignment only), school_admin, super_admin
router.get('/:id/submissions', listSubmissions);

// POST   /api/v1/assignments/:id/submit
//   multipart/form-data: submission_text, file (optional)
//   Roles: student (submits/resubmits their own work)
router.post('/:id/submit', attachmentUpload.single('file'), submitAssignment);

// PUT    /api/v1/assignments/submissions/:submissionId
//   Body: { grade, teacher_comment, status: 'graded' | 'returned' }
//   Roles: teacher (own assignment only), school_admin, super_admin
router.put('/submissions/:submissionId', gradeSubmission);

module.exports = router;
