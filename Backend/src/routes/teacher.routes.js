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
  assignTeacherToClasses,
  listTeacherAssignments,
  removeTeacherAssignment,
  getMyClasses,
  getMyProfile,
  getMyTimetable,
  getMyClassStudents,
  getMyDashboard,
} = require('../controllers/teacher.controller');
const { uploadTeacherPhoto } = require('../controllers/teacherPhoto.controller');
const { getStudentProfile, addStudentNote } = require('../controllers/studentProfile.controller');
const {
  listMyLessonPlans,
  getMyLessonPlan,
  createLessonPlan,
  updateLessonPlan,
  submitLessonPlan,
  deleteLessonPlan,
} = require('../controllers/lessonPlan.controller');

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
// "Me" routes — MUST be registered before '/:id' routes below, otherwise
// Express would treat "me" as a teacher id and 404/misroute.
// ---------------------------------------------------------------------------

// GET    /api/v1/teachers/me/classes   — classes/subjects assigned to the
//        CURRENTLY LOGGED-IN teacher (resolved from the JWT, no id needed).
//        Used by the Marks Entry screen to scope what a teacher can see.
router.get('/me/classes', getMyClasses);

// GET    /api/v1/teachers/me                — the logged-in teacher's own
//        profile (name, email, phone, school, employee number, experience).
//        Powers the Teacher Portal sidebar.
router.get('/me', getMyProfile);

// GET    /api/v1/teachers/me/timetable      — the logged-in teacher's own
//        weekly timetable. Powers the Teacher Portal Schedule tab.
router.get('/me/timetable', getMyTimetable);

// GET    /api/v1/teachers/me/classes/:classId/students — real roster for one
//        of the logged-in teacher's classes, enriched with real attendance
//        and exam performance. Powers the Teacher Portal Classes tab.
router.get('/me/classes/:classId/students', getMyClassStudents);

// GET    /api/v1/teachers/me/dashboard — aggregate for the Teacher Portal
//        Home/Dashboard tab: greeting context, today's lessons, classes
//        still needing attendance marked, upcoming exams, quick stats.
router.get('/me/dashboard', getMyDashboard);

// GET    /api/v1/teachers/me/students/:learnerId — full Student Profile:
//        photo, admission no., parents, medical info, attendance history,
//        discipline records, academic history, comments & teacher notes.
//        Only accessible for a learner enrolled in a class this teacher
//        is assigned to.
router.get('/me/students/:learnerId', getStudentProfile);

// POST   /api/v1/teachers/me/students/:learnerId/notes — add a comment or a
//        private teacher note to a student's profile.
//        Body: { note_type: 'comment' | 'teacher_note', content }
router.post('/me/students/:learnerId/notes', addStudentNote);

// ---------------------------------------------------------------------------
// Lesson Planner — teachers prepare weekly plans (objectives, activities,
// resources, homework) for each class/subject they teach; principals review
// them via the separate /api/v1/lesson-plans routes.
// ---------------------------------------------------------------------------

// GET    /api/v1/teachers/me/lesson-plans — list own plans
//   query params: class_id, learning_area_id, week_number, status
router.get('/me/lesson-plans', listMyLessonPlans);

// GET    /api/v1/teachers/me/lesson-plans/:id — one plan
router.get('/me/lesson-plans/:id', getMyLessonPlan);

// POST   /api/v1/teachers/me/lesson-plans — create/upsert a draft
//   Body: { class_id, learning_area_id, term_id?, week_number,
//           objectives, activities, resources?, homework? }
router.post('/me/lesson-plans', createLessonPlan);

// PUT    /api/v1/teachers/me/lesson-plans/:id — edit a draft
router.put('/me/lesson-plans/:id', updateLessonPlan);

// PATCH  /api/v1/teachers/me/lesson-plans/:id/submit — draft -> submitted
router.patch('/me/lesson-plans/:id/submit', submitLessonPlan);

// DELETE /api/v1/teachers/me/lesson-plans/:id — delete a draft
router.delete('/me/lesson-plans/:id', deleteLessonPlan);

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

// ---------------------------------------------------------------------------
// Subject/class assignment routes (Piece A — assign a teacher to teach
// specific subject(s) in specific class(es))
// ---------------------------------------------------------------------------

// GET    /api/v1/teachers/:id/assignments   — list a teacher's assignments
//   query params:
//     academic_year_id  (optional, filters to one academic year)
//     include_inactive  (true|false, default false)
router.get('/:id/assignments', listTeacherAssignments);

// POST   /api/v1/teachers/:id/assignments   — assign teacher to class(es)/subject(s)
//   Body: { assignments: [{ class_id, learning_area_id }, ...],
//           academic_year_id?, term_id? }
//   Admin only.
router.post('/:id/assignments', assignTeacherToClasses);

// DELETE /api/v1/teachers/:id/assignments/:assignmentId  — remove one assignment
//   Admin only.
router.delete('/:id/assignments/:assignmentId', removeTeacherAssignment);

module.exports = router;
