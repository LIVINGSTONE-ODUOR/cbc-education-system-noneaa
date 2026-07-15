// =============================================================================
// studyGroup.routes.js
// Base path (mounted in app.js): /api/v1/study-groups
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  listStudyGroups,
  createStudyGroup,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  deleteStudyGroup,
  listGroupMessages,
  postGroupMessage,
} = require('../controllers/studyGroup.controller');

// All study group routes require authentication
router.use(authenticate);

// GET    /api/v1/study-groups?class_id=...
//   Students default to their own class; teachers/admins must pass class_id.
router.get('/', listStudyGroups);

// POST   /api/v1/study-groups
//   Body: { name*, description, learning_area_id, max_members }
//   Roles: student (creates a group for their own class, auto-joins as owner)
router.post('/', createStudyGroup);

// GET    /api/v1/study-groups/:id
router.get('/:id', getStudyGroup);

// DELETE /api/v1/study-groups/:id
//   Roles: student (group owner only)
router.delete('/:id', deleteStudyGroup);

// POST   /api/v1/study-groups/:id/join
router.post('/:id/join', joinStudyGroup);

// POST   /api/v1/study-groups/:id/leave
router.post('/:id/leave', leaveStudyGroup);

// GET    /api/v1/study-groups/:id/messages
router.get('/:id/messages', listGroupMessages);

// POST   /api/v1/study-groups/:id/messages
//   Body: { message* }
router.post('/:id/messages', postGroupMessage);

module.exports = router;
