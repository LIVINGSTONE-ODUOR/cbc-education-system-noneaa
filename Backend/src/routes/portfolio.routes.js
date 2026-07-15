// =============================================================================
// portfolio.routes.js
// Base path (mounted in app.js): /api/v1/portfolio
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  listItems,
  createItem,
  updateItem,
  deleteItem,
} = require('../controllers/portfolio.controller');

// All portfolio routes require authentication
router.use(authenticate);

// GET    /api/v1/portfolio?category=&academic_year=
//   Roles: student (own portfolio only)
router.get('/', listItems);

// POST   /api/v1/portfolio
//   Body: { category*, title*, description, organization, academic_year, date_achieved, external_link }
//   Roles: student
router.post('/', createItem);

// PUT    /api/v1/portfolio/:id
//   Roles: student (owner only)
router.put('/:id', updateItem);

// DELETE /api/v1/portfolio/:id
//   Roles: student (owner only)
router.delete('/:id', deleteItem);

module.exports = router;
