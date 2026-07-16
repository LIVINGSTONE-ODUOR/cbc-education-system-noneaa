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
} = require('../controllers/timetable.controller');

router.use(securityHeaders);
router.use(authenticate);

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
