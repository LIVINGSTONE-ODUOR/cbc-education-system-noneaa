const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  registerParent,
  listParents,
  getParent,
  updateParent,
  linkLearner,
  unlinkLearner,
  sendInvite,
  getMyChildren,
  fixMissingSchoolId,
} = require('../controllers/parent.controller');

// All parent routes require authentication
router.use(authenticate);

// A school_admin has full control over their own school: they can add
// parents, edit them, and link/unlink learners. super_admin can do this
// for any school too. This is now enforced in ONE place (here) instead of
// being duplicated inline inside every controller function, which is what
// let the link-learner check drift out of sync before.
const canManageParents = authorize('school_admin', 'super_admin');

// ---------------------------------------------------------------------------
// POST  /api/v1/parents
//   Register a parent and optionally create a user account + link a learner.
router.post('/', canManageParents, registerParent);

// GET   /api/v1/parents
//   List all parents for the school.
router.get('/', canManageParents, listParents);

// ---------------------------------------------------------------------------
// GET    /api/v1/parents/me/children
//   Self-service portal: the logged-in parent's own children (supports
//   multiple linked learners) with a performance snapshot for each.
//   Must be registered BEFORE '/:id' or Express will treat "me" as an id.
//   Intentionally NOT gated by canManageParents — this is for the parent
//   role viewing their own kids, not for admins.
router.get('/me/children', getMyChildren);

// GET    /api/v1/parents/:id
router.get('/:id', canManageParents, getParent);

// PUT    /api/v1/parents/:id
router.put('/:id', canManageParents, updateParent);

// ---------------------------------------------------------------------------
// POST   /api/v1/parents/:id/link-learner
router.post('/:id/link-learner', canManageParents, linkLearner);

// DELETE /api/v1/parents/:id/unlink/:learnerId
router.delete('/:id/unlink/:learnerId', canManageParents, unlinkLearner);

// POST   /api/v1/parents/:id/send-invite
router.post('/:id/send-invite', canManageParents, sendInvite);

// ---------------------------------------------------------------------------
// SUPER ADMIN ONLY: Fix missing school_id in parent records
// POST   /api/v1/parents/fix-school-id
router.post('/fix-school-id', authorize('super_admin'), fixMissingSchoolId);

module.exports = router;
