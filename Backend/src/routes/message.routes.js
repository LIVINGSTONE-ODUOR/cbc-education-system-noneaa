// =============================================================================
// message.routes.js
// Base path (mounted in app.js): /api/v1/messages
//
// General-purpose messaging for teacher/student/school_admin accounts,
// built on the same `messages` table the Parent Portal already uses (see
// parentDashboard.routes.js for the parent-side endpoints — unchanged).
//
// Covers: student <-> teacher, teacher <-> parent (reply side),
//         student/parent/teacher <-> school_admin.
// See message.controller.js -> canMessage() for the exact allowed pairs.
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getContacts,
  getConversation,
  sendMessage,
  getInbox,
} = require('../controllers/message.controller');

// All messaging routes require authentication
router.use(authenticate);

// GET /api/v1/messages/contacts?search=
//   People the current user may message, with unread counts + last message preview.
//   school_admin: pass ?search=name to find a parent/student to start a new conversation.
router.get('/contacts', getContacts);

// GET /api/v1/messages/inbox?limit=20
//   Flat list of the most recent messages received, plus a total unread count.
router.get('/inbox', getInbox);

// GET /api/v1/messages/conversation/:otherUserId?learner_id=
//   Full 1:1 thread with :otherUserId. Marks their messages as read.
router.get('/conversation/:otherUserId', getConversation);

// POST /api/v1/messages
//   Body: { recipient_user_id, learner_id?, subject?, body }
router.post('/', sendMessage);

module.exports = router;
