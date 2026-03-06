const express = require('express');
const router = express.Router();

const aiController = require('../controllers/ai.controller');

// Simple public AI chat endpoint - no authentication required
// Uses OpenRouter API directly
router.post('/ai-chat', aiController.chat);

module.exports = router;
