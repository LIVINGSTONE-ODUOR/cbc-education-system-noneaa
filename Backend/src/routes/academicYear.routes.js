const express = require('express');
const router = express.Router();

const academicYearController = require('../controllers/academicYear.controller');
const { authenticate, authorize, securityHeaders } = require('../middleware/auth');

const requireAuth = authenticate;
const requireRole = (roles) => authorize(...roles);

const READ_ROLES = ['admin', 'teacher', 'school_admin', 'super_admin'];
const WRITE_ROLES = ['admin', 'school_admin', 'super_admin'];

router.use(securityHeaders);
router.use(requireAuth);

router.post('/academic-years', requireRole(WRITE_ROLES), academicYearController.createAcademicYear);
router.get('/academic-years', requireRole(READ_ROLES), academicYearController.listAcademicYears);
router.get(
  '/academic-years/current',
  requireRole(READ_ROLES),
  academicYearController.getCurrentAcademicYear
);
router.put('/academic-years/:id', requireRole(WRITE_ROLES), academicYearController.updateAcademicYear);
router.post(
  '/academic-years/:id/terms',
  requireRole(WRITE_ROLES),
  academicYearController.createTerm
);
router.get('/academic-years/:id/terms', requireRole(READ_ROLES), academicYearController.listTerms);
router.patch('/terms/:id/set-current', requireRole(WRITE_ROLES), academicYearController.setCurrentTerm);

module.exports = router;
