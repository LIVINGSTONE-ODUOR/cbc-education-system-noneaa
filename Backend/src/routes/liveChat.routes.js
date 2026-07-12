const express = require('express');
const router = express.Router();

const liveChat = require('../controllers/liveChat.controller');
const { authenticateOwner } = require('../middleware/auth');

// ── Public: used by the website chat widget (no auth) ──
router.post('/start', liveChat.startConversation);
router.post('/:id/message', liveChat.postVisitorMessage);
router.post('/:id/escalate', liveChat.escalateConversation);
router.get('/:id/messages', liveChat.getMessages);

// ── Protected: used by the owner's Support Inbox only ──
// Live chat is a website-owner tool, not a school-platform admin tool —
// school admins/super_admins no longer have a Live Chat page and cannot
// authenticate here.
router.get('/inbox', authenticateOwner, liveChat.getInbox);
router.post('/:id/claim', authenticateOwner, liveChat.claimConversation);
router.post('/:id/reply', authenticateOwner, liveChat.postAgentReply);
router.post('/:id/close', authenticateOwner, liveChat.closeConversation);

module.exports = router;