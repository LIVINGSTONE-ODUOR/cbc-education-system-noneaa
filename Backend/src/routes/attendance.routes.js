// =============================================================================
// attendance.routes.js
// Base path (mounted in app.js): /api/v1/attendance
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getClassRoster,
  saveClassAttendance,
  getTeacherRoster,
  saveTeacherAttendance,
} = require('../controllers/attendance.controller');

// All attendance routes require authentication
router.use(authenticate);

// GET  /api/v1/attendance/class/:classId/roster
//   Query: date (YYYY-MM-DD, defaults to today)
//   Response: enrolled roster merged with any attendance already saved for that date
router.get('/class/:classId/roster', getClassRoster);

// POST /api/v1/attendance/class/:classId
//   Body: { attendance_date, records: [{ learner_id*, status*, arrival_time, remarks }] }
//   * required. Upserts — safe to call again for the same class/date.
router.post('/class/:classId', saveClassAttendance);

// GET  /api/v1/attendance/teachers/roster
//   Query: date (YYYY-MM-DD, defaults to today)
//   Response: every active teacher merged with any attendance already saved for that date
router.get('/teachers/roster', getTeacherRoster);

// POST /api/v1/attendance/teachers
//   Body: { attendance_date, records: [{ teacher_id*, status*, check_in_time, check_out_time, remarks }] }
//   * required. Upserts — safe to call again for the same date.
router.post('/teachers', saveTeacherAttendance);

module.exports = router;
