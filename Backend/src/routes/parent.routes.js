const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  registerParent,
  listParents,
  getParent,
  updateParent,
  linkLearner,
  unlinkLearner,
  sendInvite,
  getMyChildren,
  fixMissingSchoolId,  // ← Add this to the import
} = require('../controllers/parent.controller');

// All parent routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// POST  /api/v1/parents
//   Register a parent and optionally create a user account + link a learner.
router.post('/', registerParent);

// GET   /api/v1/parents
//   List all parents for the school.
router.get('/', listParents);

// ---------------------------------------------------------------------------
// GET    /api/v1/parents/me/children
//   Self-service portal: the logged-in parent's own children (supports
//   multiple linked learners) with a performance snapshot for each.
//   Must be registered BEFORE '/:id' or Express will treat "me" as an id.
router.get('/me/children', getMyChildren);

// GET    /api/v1/parents/:id
router.get('/:id', getParent);

// PUT    /api/v1/parents/:id
router.put('/:id', updateParent);

// ---------------------------------------------------------------------------
// POST   /api/v1/parents/:id/link-learner
router.post('/:id/link-learner', linkLearner);

// DELETE /api/v1/parents/:id/unlink/:learnerId
router.delete('/:id/unlink/:learnerId', unlinkLearner);

// POST   /api/v1/parents/:id/send-invite
router.post('/:id/send-invite', sendInvite);

// ---------------------------------------------------------------------------
// SUPER ADMIN ONLY: Fix missing school_id in parent records
// POST   /api/v1/parents/fix-school-id
router.post('/fix-school-id', fixMissingSchoolId);  // ← Fixed: removed 'parents/' and used correct function name

module.exports = router;
