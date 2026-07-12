const express = require('express');
const router = express.Router();

const liveChat = require('../controllers/liveChat.controller');
const { authenticateSupportStaff } = require('../middleware/auth');

// ── Public: used by the website chat widget (no auth) ──
router.post('/start', liveChat.startConversation);
router.post('/:id/message', liveChat.postVisitorMessage);
router.post('/:id/escalate', liveChat.escalateConversation);
router.get('/:id/messages', liveChat.getMessages);

// ── Protected: used by the staff live-chat inbox ──
// Live chat connects visitors to the website owner. authenticateSupportStaff
// accepts either a website-owner login (website_owners table) or a
// school-platform super_admin login (users table) — school admins,
// teachers, etc. are platform users, not the support team, so they must
// not see or reply to escalated conversations.
router.get('/inbox', authenticateSupportStaff, liveChat.getInbox);
router.post('/:id/claim', authenticateSupportStaff, liveChat.claimConversation);
router.post('/:id/reply', authenticateSupportStaff, liveChat.postAgentReply);
router.post('/:id/close', authenticateSupportStaff, liveChat.closeConversation);

module.exports = router;
