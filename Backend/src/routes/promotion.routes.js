// =============================================================================
// promotion.routes.js
// Base path (mounted in app.js): /api/v1/promotions
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createBatch,
  listBatches,
  getBatch,
  runBatch,
  lockBatch,
  unlockBatch,
  deleteBatch,
} = require('../controllers/promotion.controller');

router.use(authenticate);

// POST   /api/v1/promotions
//   Body: { kind*, academic_year_id*, grade_level*, stream_name, to_grade_level, criteria*, effective_date* }
//   * required. kind must be 'promotion' or 'graduation'. to_grade_level required when kind='promotion'.
router.post('/', createBatch);

// GET    /api/v1/promotions
//   Query: kind | status | academic_year_id | grade_level | search | page | limit
router.get('/', listBatches);

// GET    /api/v1/promotions/:id
router.get('/:id', getBatch);

// POST   /api/v1/promotions/:id/run
router.post('/:id/run', runBatch);

// POST   /api/v1/promotions/:id/lock
router.post('/:id/lock', lockBatch);

// POST   /api/v1/promotions/:id/unlock
router.post('/:id/unlock', unlockBatch);

// DELETE /api/v1/promotions/:id
router.delete('/:id', deleteBatch);

module.exports = router;
