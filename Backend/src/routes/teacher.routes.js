// =============================================================================
// teacher.routes.js
// Base path (mounted in app.js): /api/v1/teachers
// =============================================================================

const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  inviteTeacher,
  listTeachers,
  getTeacher,
  updateTeacher,
  toggleTeacherActive,
  deleteTeacher,
  getTeacherTimetable,
  getTeacherClasses,
} = require('../controllers/teacher.controller');
const { uploadTeacherPhoto } = require('../controllers/teacherPhoto.controller');

// Photo upload multer (images, 5MB) — same limits as the learner photo upload
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  },
});

// All teacher routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Collection routes
// ---------------------------------------------------------------------------

// POST   /api/v1/teachers/invite   — send invite email (school_admin only)
router.post('/invite', inviteTeacher);

// POST   /api/v1/teachers/upload-photo   — upload teacher profile photo
router.post('/upload-photo', photoUpload.single('file'), uploadTeacherPhoto);

// GET    /api/v1/teachers           — list all teachers for this school
//   query params:
//     page        (default 1)
//     limit       (default 20)
//     is_active   (true|false)
//     search      (name, email, TSC number)
//     sort_by     (created_at | date_joined | tsc_number)
//     sort_order  (asc | desc)
router.get('/', listTeachers);

// ---------------------------------------------------------------------------
// Member routes (specific teacher by id)
// ---------------------------------------------------------------------------

// GET    /api/v1/teachers/:id               — full profile + assignments
router.get('/:id', getTeacher);

// PUT    /api/v1/teachers/:id               — update profile (admin only)
router.put('/:id', updateTeacher);

// PATCH  /api/v1/teachers/:id/activate      — toggle is_active (admin only)
router.patch('/:id/activate', toggleTeacherActive);

// DELETE /api/v1/teachers/:id               — soft-delete (admin only)
router.delete('/:id', deleteTeacher);

// GET    /api/v1/teachers/:id/timetable     — weekly schedule
//   query params:
//     academic_year_id  (optional, defaults to current year)
//     term_id           (optional, filter by term)
router.get('/:id/timetable', getTeacherTimetable);

// GET    /api/v1/teachers/:id/classes       — assigned classes this year
//   query params:
//     academic_year_id  (optional, defaults to current year)
router.get('/:id/classes', getTeacherClasses);

module.exports = router;
