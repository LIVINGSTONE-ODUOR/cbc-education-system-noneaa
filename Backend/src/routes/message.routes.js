// =============================================================================
// message.routes.js
// Base path (mounted in app.js): /api/v1/messages
//
// Internal direct messaging: student <-> teacher, parent <-> teacher, and
// student/parent/teacher <-> school_admin. See message.controller.js for
// the exact allowed-pairs matrix (canMessage).
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getContacts,
  getThread,
  sendMessage,
  getUnreadCount,
} = require('../controllers/message.controller');

// All messaging routes require authentication
router.use(authenticate);

// GET /api/v1/messages/contacts
//   People the current user may message, with unread counts + last message preview.
router.get('/contacts', getContacts);

// GET /api/v1/messages/unread-count
//   Total unread messages for the current user (for a nav badge).
router.get('/unread-count', getUnreadCount);

// GET /api/v1/messages/thread/:userId
//   Full 1:1 thread with :userId, oldest first. Marks their messages as read.
router.get('/thread/:userId', getThread);

// POST /api/v1/messages/thread/:userId
//   Body: { content }
router.post('/thread/:userId', sendMessage);

module.exports = router;
