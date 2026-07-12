const express = require('express');
const router = express.Router();

const liveChat = require('../controllers/liveChat.controller');
const { authenticate, authorize } = require('../middleware/auth');

// ── Public: used by the website chat widget (no auth) ──
router.post('/start', liveChat.startConversation);
router.post('/:id/message', liveChat.postVisitorMessage);
router.post('/:id/escalate', liveChat.escalateConversation);
router.get('/:id/messages', liveChat.getMessages);

// ── Protected: used by the staff live-chat inbox ──
const STAFF_ROLES = ['admin', 'teacher', 'school_admin', 'super_admin'];

router.get('/inbox', authenticate, authorize(...STAFF_ROLES), liveChat.getInbox);
router.post('/:id/claim', authenticate, authorize(...STAFF_ROLES), liveChat.claimConversation);
router.post('/:id/reply', authenticate, authorize(...STAFF_ROLES), liveChat.postAgentReply);
router.post('/:id/close', authenticate, authorize(...STAFF_ROLES), liveChat.closeConversation);

module.exports = router;
