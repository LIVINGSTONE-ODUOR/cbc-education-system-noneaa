// ================================================================
// routes/curriculum.routes.js
//
// Mount: app.use('/api/v1/curriculum', curriculumRoutes)
// ================================================================

const express = require('express');
const router  = express.Router();

const {
  getLearningAreas, getLearningAreaById, createLearningArea,
  updateLearningArea, deleteLearningArea, hardDeleteLearningArea,
  getStrands, createStrand, deleteStrand, hardDeleteStrand,
  getSubStrands, createSubStrand, deleteSubStrand, hardDeleteSubStrand,
  getCompetencies, createCompetency, deleteCompetency, hardDeleteCompetency,
  getCurriculumTree, seedCBCCurriculum,
} = require('../controllers/curriculum.controller');

const { authenticate, authorize, securityHeaders } = require('../middleware/auth');

// Apply security headers to all routes
router.use(securityHeaders);

// All curriculum routes require authentication
router.use(authenticate);

// ── Utility (BEFORE any /:id routes) ────────────────────────────

// Full tree for one grade — used by assessment entry form
// GET /api/v1/curriculum/tree/Grade%204
router.get('/tree/:grade', getCurriculumTree);

// Seed national CBC content — super_admin only, idempotent
// POST /api/v1/curriculum/seed-cbc
router.post('/seed-cbc',
  authorize('super_admin'),
  seedCBCCurriculum
);

// ── Learning Areas ───────────────────────────────────────────────
// ?grade_level=Grade 4  ?is_active=true  ?school_only=true
router.get('/learning-areas',      getLearningAreas);
router.post('/learning-areas',     authorize('school_admin', 'super_admin'), createLearningArea);
router.get('/learning-areas/:id',  getLearningAreaById);
router.put('/learning-areas/:id',  authorize('school_admin', 'super_admin'), updateLearningArea);
// Hard delete - MUST come BEFORE the general /:id route to avoid being matched as an id
router.delete('/learning-areas/:id/hard', authorize('school_admin', 'super_admin'), hardDeleteLearningArea);
// Soft delete - comes after hard delete route
router.delete('/learning-areas/:id', authorize('school_admin', 'super_admin'), deleteLearningArea);

// Strands under a learning area
// GET /api/v1/curriculum/learning-areas/:id/strands
router.get('/learning-areas/:id/strands', getStrands);

// ── Strands ──────────────────────────────────────────────────────
router.post('/strands',     authorize('school_admin', 'super_admin'), createStrand);
// Hard delete - MUST come BEFORE the general /:id route
router.delete('/strands/:id/hard', authorize('school_admin', 'super_admin'), hardDeleteStrand);
router.delete('/strands/:id', authorize('school_admin', 'super_admin'), deleteStrand);

// Sub-strands under a strand
router.get('/strands/:id/sub-strands', getSubStrands);

// ── Sub-Strands ──────────────────────────────────────────────────
router.post('/sub-strands',     authorize('school_admin', 'super_admin'), createSubStrand);
// Hard delete - MUST come BEFORE the general /:id route
router.delete('/sub-strands/:id/hard', authorize('school_admin', 'super_admin'), hardDeleteSubStrand);
router.delete('/sub-strands/:id', authorize('school_admin', 'super_admin'), deleteSubStrand);

// Competencies under a sub-strand
router.get('/sub-strands/:id/competencies', getCompetencies);

// ── Competencies ─────────────────────────────────────────────────
router.post('/competencies',     authorize('school_admin', 'super_admin'), createCompetency);
// Hard delete - MUST come BEFORE the general /:id route
router.delete('/competencies/:id/hard', authorize('school_admin', 'super_admin'), hardDeleteCompetency);
router.delete('/competencies/:id', authorize('school_admin', 'super_admin'), deleteCompetency);

module.exports = router;

