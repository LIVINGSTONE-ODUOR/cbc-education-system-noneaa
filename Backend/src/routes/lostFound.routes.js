// =============================================================================
// lostFound.routes.js
// Base path (mounted in app.js): /api/v1/lost-found
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  listItems,
  createItem,
  resolveItem,
  deleteItem,
} = require('../controllers/lostFound.controller');

// All lost & found routes require authentication
router.use(authenticate);

// GET    /api/v1/lost-found?status=open|resolved|all&type=lost|found
//   School-wide, defaults to open posts.
router.get('/', listItems);

// POST   /api/v1/lost-found
//   Body: { item_type* ('lost'|'found'), title*, description, location, contact_info }
//   Roles: student
router.post('/', createItem);

// POST   /api/v1/lost-found/:id/resolve
//   Roles: student (reporter only)
router.post('/:id/resolve', resolveItem);

// DELETE /api/v1/lost-found/:id
//   Roles: student (reporter only)
router.delete('/:id', deleteItem);

module.exports = router;
