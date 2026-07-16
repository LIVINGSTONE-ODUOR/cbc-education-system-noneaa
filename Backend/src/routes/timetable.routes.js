// =============================================================================
// timetable.routes.js
// Base path (mounted in app.js): /api/v1/timetable
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate, authorize, securityHeaders } = require('../middleware/auth');
const {
  getTimetable,
  createSlot,
  updateSlot,
  deleteSlot,
  getDaySettings,
  updateDaySettings,
  getSchoolTimetable,
  getPrintHeader,
  getTeacherLoadReport,
  getTimetablePeriods,
} = require('../controllers/timetable.controller');

router.use(securityHeaders);
router.use(authenticate);

// ── Timetable Setup: number of lessons taught per day ──────────────────────
// Registered before "/:id" so "settings" is never swallowed by the param route.

// GET /api/v1/timetable/settings?academic_year_id=
//   Configured lessons-per-day (e.g. Monday: 8, Friday: 6). Any authenticated
//   role in the school can read.
router.get('/settings', getDaySettings);

// PUT /api/v1/timetable/settings
//   Body: { academic_year_id, days: [{ day, lessons_count }, ...] }
router.put('/settings', authorize('school_admin', 'super_admin'), updateDaySettings);

// GET /api/v1/timetable/school-wide?academic_year_id=&term_id=
//   Every class's weekly grid in one response — powers the admin's "Print
//   Timetable" button (all lessons, all classes, teacher per subject).
router.get('/school-wide', authorize('school_admin', 'super_admin'), getSchoolTimetable);

// GET /api/v1/timetable/print-header?academic_year_id=&term_id=
//   School name / term / academic year for the print header. Used by the
//   Teacher, Parent, and Student portal print buttons too.
router.get('/print-header', getPrintHeader);

// GET /api/v1/timetable/teacher-load?academic_year_id=&term_id=
//   Per-teacher, per-day lesson counts vs. that day's lesson cap — flags
//   free/unassigned days and overloaded days. Admin/super_admin only.
router.get('/teacher-load', authorize('school_admin', 'super_admin'), getTeacherLoadReport);

// GET /api/v1/timetable/periods
//   Academic years + terms for the Year/Term picker on the Print and
//   Timetable Setup screens. Any authenticated role in the school can read.
router.get('/periods', getTimetablePeriods);

// GET /api/v1/timetable?class_id=&academic_year_id=&term_id=
//   Weekly grid for one class. Any authenticated role in the school can read.
router.get('/', getTimetable);

// POST /api/v1/timetable
//   Create one (or several, via day: []) timetable slot(s).
//   Rejects with 409 if the class or the teacher is already booked.
router.post('/', authorize('school_admin', 'super_admin'), createSlot);

// PUT /api/v1/timetable/:id
router.put('/:id', authorize('school_admin', 'super_admin'), updateSlot);

// DELETE /api/v1/timetable/:id
router.delete('/:id', authorize('school_admin', 'super_admin'), deleteSlot);

module.exports = router;
