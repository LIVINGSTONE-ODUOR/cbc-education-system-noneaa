// ================================================================
// routes/department.routes.js
//
// Mount: app.use('/api/v1/departments', departmentRoutes)
// ================================================================

const express = require('express');
const router  = express.Router();

const {
  getDepartments, getDepartmentById, createDepartment,
  updateDepartment, deleteDepartment,
  getDepartmentLearningAreas, assignLearningArea, removeLearningArea,
  getDepartmentTeachers, assignDepartmentTeacher, removeDepartmentTeacher,
} = require('../controllers/department.controller');

const { authenticate, authorize, securityHeaders } = require('../middleware/auth');

router.use(securityHeaders);
router.use(authenticate);

// ── Departments ──────────────────────────────────────────────────
router.get('/',      getDepartments);
router.post('/',     authorize('school_admin', 'super_admin'), createDepartment);
router.get('/:id',   getDepartmentById);
router.put('/:id',   authorize('school_admin', 'super_admin'), updateDepartment);
router.delete('/:id', authorize('school_admin', 'super_admin'), deleteDepartment);

// ── Learning areas assigned to a department (fetched from DB) ───
router.get('/:id/learning-areas',                    getDepartmentLearningAreas);
router.post('/:id/learning-areas',                   authorize('school_admin', 'super_admin'), assignLearningArea);
router.delete('/:id/learning-areas/:learningAreaId', authorize('school_admin', 'super_admin'), removeLearningArea);

// ── Teachers assigned to a department ────────────────────────────
router.get('/:id/teachers',                 getDepartmentTeachers);
router.post('/:id/teachers',                authorize('school_admin', 'super_admin'), assignDepartmentTeacher);
router.delete('/:id/teachers/:assignmentId', authorize('school_admin', 'super_admin'), removeDepartmentTeacher);

module.exports = router;
