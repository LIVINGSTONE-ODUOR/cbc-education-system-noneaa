// =============================================================================
// campusLocation.routes.js
// Base path (mounted in app.js): /api/v1/campus-locations
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/campusLocation.controller');

// All campus map routes require authentication
router.use(authenticate);

// GET    /api/v1/campus-locations?category=&building=&q=
//   School-wide directory. Everyone can view.
router.get('/', listLocations);

// POST   /api/v1/campus-locations
//   Body: { name*, category*, building, floor, room_number, description }
//   Roles: teacher, school_admin
router.post('/', createLocation);

// PUT    /api/v1/campus-locations/:id
//   Roles: teacher, school_admin
router.put('/:id', updateLocation);

// DELETE /api/v1/campus-locations/:id
//   Roles: teacher, school_admin
router.delete('/:id', deleteLocation);

module.exports = router;
