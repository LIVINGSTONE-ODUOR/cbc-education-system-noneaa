const express  = require('express');
const multer   = require('multer');
const router   = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  registerLearner,
  listLearners,
  getLearner,
  updateLearner,
  deleteLearner,
  enrollLearner,
  getEnrollmentHistory,
  bulkImportLearners,
  withdrawLearner,
} = require('../controllers/learner.controller');
const { uploadLearnerPhoto } = require('../controllers/learnerPhoto.controller');

// Photo upload multer (images, 5MB)
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  },
});

// CSV upload multer
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files allowed'), false);
    }
  },
});

// All learner routes require authentication
router.use(authenticate);

// POST /api/v1/learners/upload-photo
router.post('/upload-photo', authenticate, photoUpload.single('file'), uploadLearnerPhoto);

// =============================================================================
// Bulk Operations
// =============================================================================
// POST /api/v1/learners/bulk-import
router.post('/bulk-import', authenticate, csvUpload.single('file'), bulkImportLearners);

// =============================================================================
// Basic CRUD
// =============================================================================
// POST /api/v1/learners
router.post('/', registerLearner);

// GET /api/v1/learners
router.get('/', listLearners);

// GET /api/v1/learners/:id
router.get('/:id', getLearner);

// PUT /api/v1/learners/:id
router.put('/:id', updateLearner);

// DELETE /api/v1/learners/:id
router.delete('/:id', deleteLearner);

// =============================================================================
// Enrollment Management
// =============================================================================
// POST /api/v1/learners/:id/enroll
router.post('/:id/enroll', enrollLearner);

// GET /api/v1/learners/:id/enrollments
router.get('/:id/enrollments', getEnrollmentHistory);

// POST /api/v1/learners/:id/withdraw
router.post('/:id/withdraw', withdrawLearner);

module.exports = router;