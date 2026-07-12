// =============================================================================
// parentDashboard.routes.js
// Base path (mounted in app.js): /api/v1/parent-dashboard
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getMessages,
  markMessageRead,
  getMessageContacts,
  sendMessage,
  getConversation,
  getAnnouncements,
  getTeacherComments,
  getTimetable,
  getSchoolEvents,
  getChildProfile,
} = require('../controllers/parentDashboard.controller');

// All routes require authentication
router.use(authenticate);

// GET  /api/v1/parent-dashboard/messages?limit=10
//   Roles: parent (own inbox), teacher, school_admin, super_admin
router.get('/messages', getMessages);

// PUT  /api/v1/parent-dashboard/messages/:id/read
router.put('/messages/:id/read', markMessageRead);

// POST /api/v1/parent-dashboard/messages
//   Body: { recipient_user_id, learner_id, subject?, body }
//   Send a new message or a reply — to a teacher or the principal.
router.post('/messages', sendMessage);

// GET  /api/v1/parent-dashboard/messages/conversation/:otherUserId?learner_id=...
//   Full back-and-forth with one contact about one learner (chat view).
router.get('/messages/conversation/:otherUserId', getConversation);

// GET  /api/v1/parent-dashboard/learner/:learnerId/contacts
//   Who the parent can message about this child: class/subject teachers + principal.
router.get('/learner/:learnerId/contacts', getMessageContacts);

// GET  /api/v1/parent-dashboard/announcements?limit=10
//   School-wide announcements + any targeted at the caller's children's classes
router.get('/announcements', getAnnouncements);

// GET  /api/v1/parent-dashboard/learner/:learnerId/comments?limit=10
//   Roles: parent (own linked child only), teacher/school_admin/super_admin
router.get('/learner/:learnerId/comments', getTeacherComments);

// GET  /api/v1/parent-dashboard/learner/:learnerId/timetable
router.get('/learner/:learnerId/timetable', getTimetable);

// GET  /api/v1/parent-dashboard/learner/:learnerId/profile
//   Photo, admission number, grade & class, stream, DOB, class teacher,
//   medical info, and emergency contacts (linked guardians).
router.get('/learner/:learnerId/profile', getChildProfile);

// GET  /api/v1/parent-dashboard/events?limit=10
router.get('/events', getSchoolEvents);

module.exports = router;
