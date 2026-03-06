const express = require('express');
const router = express.Router();

const aiAssistantController = require('../controllers/aiAssistant.controller');
const { authenticate, authorize, securityHeaders } = require('../middleware/auth');

const requireAuth = authenticate;
const requireRole = (roles) => authorize(...roles);
const AI_ALLOWED_ROLES = ['admin', 'teacher', 'school_admin', 'super_admin'];

router.use(securityHeaders);
router.use(requireAuth);

router.post('/chat', requireRole(AI_ALLOWED_ROLES), aiAssistantController.chat);
router.post('/chat/stream', requireRole(AI_ALLOWED_ROLES), aiAssistantController.streamChat);
router.get('/conversations', requireRole(AI_ALLOWED_ROLES), aiAssistantController.listConversations);
router.get(
  '/conversations/:id/messages',
  requireRole(AI_ALLOWED_ROLES),
  aiAssistantController.getConversationMessages
);

module.exports = router;
