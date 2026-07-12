const express = require('express');
const router = express.Router();

const websiteOwner = require('../controllers/websiteOwner.controller');
const { authenticateOwner, rateLimit } = require('../middleware/auth');

// Public
router.post('/login', rateLimit(5, 15 * 60 * 1000), websiteOwner.login);

// Protected (owner token required)
router.get('/me', authenticateOwner, websiteOwner.me);
router.post('/change-password', authenticateOwner, websiteOwner.changePassword);

module.exports = router;
