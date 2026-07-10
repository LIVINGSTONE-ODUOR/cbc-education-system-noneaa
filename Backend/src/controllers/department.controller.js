// ================================================================
// controllers/department.controller.js
//
// Table:   departments, department_teachers
// Pattern: matches curriculum.controller.js (raw SQL via `query`)
// Auth:    Bearer JWT → req.user.schoolId / req.user.role
//
// Every department is scoped to the caller's school_id. Its
// `learning_area_ids` are always validated against real rows in
// `learning_areas` (national or the school's own custom areas) —
// there is no hardcoded/mock learning-area list anywhere here.
// ================================================================

const { query } = require('../config/database');

const respond = (res, status, success, message, data = null, errors = null) => {
  const payload = { success, message };
  if (data)   payload.data   = data;
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};

const isWriter = (req) => ['super_admin', 'school_admin'].includes(req.user?.role);

// Shared SELECT used by list + getById so shapes always match.
const DEPARTMENT_SELECT = `
  SELECT
    d.id,
    d.name,
    d.code,
    d.description,
    d.hod_id,
    TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS hod_name,
    d.learning_area_ids,
    d.is_active,
    d.created_at,
    d.updated_at,
    COALESCE(array_length(d.learning_area_ids, 1), 0) AS subject_count,
    (SELECT COUNT(*) FROM department_teachers dt
       WHERE dt.department_id = d.id) AS teacher_count
  FROM departments d
  LEFT JOIN teachers t ON t.id = d.hod_id
  LEFT JOIN users u ON u.id = t.user_id
`;

// Maps a DB row -> the exact shape the frontend's `Department` type expects.
const toApiDepartment = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code || '',
  description: row.description || '',
  hodId: row.hod_id || '',
  hodName: row.hod_name || '',
  teacherCount: Number(row.teacher_count) || 0,
  subjectCount: Number(row.subject_count) || 0,
  status: row.is_active ? 'active' : 'inactive',
  createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
  learningAreaIds: row.learning_area_ids || [],
});

// Validates that every id in `ids` is a real, usable learning area for
// this school (national OR the school's own custom rows). Throws with a
// user-facing message if any id doesn't resolve.
const validateLearningAreaIds = async (ids, school_id) => {
  if (!ids || ids.length === 0) return [];
  const result = await query(
    `SELECT id FROM learning_areas
     WHERE deleted_at IS NULL
       AND (school_id IS NULL OR school_id = $1)
       AND id = ANY($2::uuid[])`,
    [school_id, ids]
  );
  const found = new Set(result.rows.map(r => r.id));
  const missing = ids.filter(id => !found.has(id));
  if (missing.length > 0) {
    const err = new Error(`Invalid learning area id(s): ${missing.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return ids;
};

// ================================================================
// 1. GET /api/v1/departments
// ================================================================
const getDepartments = async (req, res) => {
  try {
    const school_id = req.user?.schoolId;
    const result = await query(
      `${DEPARTMENT_SELECT}
       WHERE d.school_id = $1 AND d.deleted_at IS NULL
       ORDER BY d.created_at DESC`,
      [school_id]
    );
    return respond(res, 200, true, 'Departments retrieved', {
      departments: result.rows.map(toApiDepartment),
    });
  } catch (err) {
    console.error('[getDepartments]', err.message);
    return respond(res, 500, false, 'Failed to retrieve departments');
  }
};

// ================================================================
// 2. GET /api/v1/departments/:id
// ================================================================
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user?.schoolId;
    const result = await query(
      `${DEPARTMENT_SELECT} WHERE d.id = $1 AND d.school_id = $2 AND d.deleted_at IS NULL`,
      [id, school_id]
    );
    if (result.rows.length === 0) {
      return respond(res, 404, false, 'Department not found');
    }
    return respond(res, 200, true, 'Department retrieved', {
      department: toApiDepartment(result.rows[0]),
    });
  } catch (err) {
    console.error('[getDepartmentById]', err.message);
    return respond(res, 500, false, 'Failed to retrieve department');
  }
};

// ================================================================
// 3. POST /api/v1/departments
// ================================================================
const createDepartment = async (req, res) => {
  try {
    if (!isWriter(req)) return respond(res, 403, false, 'Insufficient permissions');

    const school_id = req.user?.schoolId;
    const userId = req.user?.userId;
    const { name, code, description, hodId, status, learningAreaIds } = req.body;

    if (!name || !name.trim()) {
      return respond(res, 400, false, 'Validation failed', null, [
        { field: 'name', message: 'Department name is required' },
      ]);
    }
    if (!hodId) {
      return respond(res, 400, false, 'Validation failed', null, [
        { field: 'hodId', message: 'Head of Department is required' },
      ]);
    }

    const validIds = await validateLearningAreaIds(learningAreaIds, school_id);

    const insert = await query(
      `INSERT INTO departments
         (school_id, name, code, description, hod_id, learning_area_ids, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       RETURNING id`,
      [
        school_id,
        name.trim(),
        code?.trim() || null,
        description?.trim() || null,
        hodId,
        validIds,
        status !== 'inactive',
        userId,
      ]
    );

    const result = await query(`${DEPARTMENT_SELECT} WHERE d.id = $1`, [insert.rows[0].id]);
    return respond(res, 201, true, 'Department created', {
      department: toApiDepartment(result.rows[0]),
    });
  } catch (err) {
    if (err.code === '23505') {
      return respond(res, 409, false, 'A department with this code already exists');
    }
    console.error('[createDepartment]', err.message);
    return respond(res, err.statusCode || 500, false, err.message || 'Failed to create department');
  }
};

// ================================================================
// 4. PUT /api/v1/departments/:id
// ================================================================
const updateDepartment = async (req, res) => {
  try {
    if (!isWriter(req)) return respond(res, 403, false, 'Insufficient permissions');

    const { id } = req.params;
    const school_id = req.user?.schoolId;
    const userId = req.user?.userId;
    const { name, code, description, hodId, status, learningAreaIds } = req.body;

    const existing = await query(
      `SELECT id FROM departments WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [id, school_id]
    );
    if (existing.rows.length === 0) {
      return respond(res, 404, false, 'Department not found');
    }

    const validIds = learningAreaIds !== undefined
      ? await validateLearningAreaIds(learningAreaIds, school_id)
      : undefined;

    await query(
      `UPDATE departments SET
         name = COALESCE($1, name),
         code = COALESCE($2, code),
         description = COALESCE($3, description),
         hod_id = COALESCE($4, hod_id),
         is_active = COALESCE($5, is_active),
         learning_area_ids = COALESCE($6, learning_area_ids),
         updated_by = $7
       WHERE id = $8`,
      [
        name?.trim() || null,
        code?.trim() || null,
        description?.trim() ?? null,
        hodId || null,
        status !== undefined ? status !== 'inactive' : null,
        validIds !== undefined ? validIds : null,
        userId,
        id,
      ]
    );

    const result = await query(`${DEPARTMENT_SELECT} WHERE d.id = $1`, [id]);
    return respond(res, 200, true, 'Department updated', {
      department: toApiDepartment(result.rows[0]),
    });
  } catch (err) {
    if (err.code === '23505') {
      return respond(res, 409, false, 'A department with this code already exists');
    }
    console.error('[updateDepartment]', err.message);
    return respond(res, err.statusCode || 500, false, err.message || 'Failed to update department');
  }
};

// ================================================================
// 5. DELETE /api/v1/departments/:id  (soft delete)
// ================================================================
const deleteDepartment = async (req, res) => {
  try {
    if (!isWriter(req)) return respond(res, 403, false, 'Insufficient permissions');

    const { id } = req.params;
    const school_id = req.user?.schoolId;
    const userId = req.user?.userId;

    const result = await query(
      `UPDATE departments SET deleted_at = NOW(), deleted_by = $1
       WHERE id = $2 AND school_id = $3 AND deleted_at IS NULL
       RETURNING id`,
      [userId, id, school_id]
    );
    if (result.rows.length === 0) {
      return respond(res, 404, false, 'Department not found');
    }
    return respond(res, 200, true, 'Department deleted');
  } catch (err) {
    console.error('[deleteDepartment]', err.message);
    return respond(res, 500, false, 'Failed to delete department');
  }
};

// ================================================================
// 6. Learning areas of a department
//    GET    /api/v1/departments/:id/learning-areas
//    POST   /api/v1/departments/:id/learning-areas   { learningAreaId }
//    DELETE /api/v1/departments/:id/learning-areas/:learningAreaId
// ================================================================
const getDepartmentLearningAreas = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user?.schoolId;

    const dept = await query(
      `SELECT learning_area_ids FROM departments WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [id, school_id]
    );
    if (dept.rows.length === 0) return respond(res, 404, false, 'Department not found');

    const ids = dept.rows[0].learning_area_ids || [];
    if (ids.length === 0) {
      return respond(res, 200, true, 'Learning areas retrieved', { learning_areas: [] });
    }

    const result = await query(
      `SELECT id, name, code FROM learning_areas
       WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL
       ORDER BY name`,
      [ids]
    );
    return respond(res, 200, true, 'Learning areas retrieved', { learning_areas: result.rows });
  } catch (err) {
    console.error('[getDepartmentLearningAreas]', err.message);
    return respond(res, 500, false, 'Failed to retrieve learning areas');
  }
};

const assignLearningArea = async (req, res) => {
  try {
    if (!isWriter(req)) return respond(res, 403, false, 'Insufficient permissions');
    const { id } = req.params;
    const { learningAreaId } = req.body;
    const school_id = req.user?.schoolId;

    if (!learningAreaId) {
      return respond(res, 400, false, 'learningAreaId is required');
    }
    await validateLearningAreaIds([learningAreaId], school_id);

    const result = await query(
      `UPDATE departments
       SET learning_area_ids = (
         SELECT ARRAY(SELECT DISTINCT unnest(learning_area_ids || $1::uuid))
       )
       WHERE id = $2 AND school_id = $3 AND deleted_at IS NULL
       RETURNING learning_area_ids`,
      [learningAreaId, id, school_id]
    );
    if (result.rows.length === 0) return respond(res, 404, false, 'Department not found');

    return respond(res, 200, true, 'Learning area assigned', {
      learning_area_ids: result.rows[0].learning_area_ids,
    });
  } catch (err) {
    console.error('[assignLearningArea]', err.message);
    return respond(res, err.statusCode || 500, false, err.message || 'Failed to assign learning area');
  }
};

const removeLearningArea = async (req, res) => {
  try {
    if (!isWriter(req)) return respond(res, 403, false, 'Insufficient permissions');
    const { id, learningAreaId } = req.params;
    const school_id = req.user?.schoolId;

    const result = await query(
      `UPDATE departments
       SET learning_area_ids = array_remove(learning_area_ids, $1::uuid)
       WHERE id = $2 AND school_id = $3 AND deleted_at IS NULL
       RETURNING learning_area_ids`,
      [learningAreaId, id, school_id]
    );
    if (result.rows.length === 0) return respond(res, 404, false, 'Department not found');

    return respond(res, 200, true, 'Learning area removed', {
      learning_area_ids: result.rows[0].learning_area_ids,
    });
  } catch (err) {
    console.error('[removeLearningArea]', err.message);
    return respond(res, 500, false, 'Failed to remove learning area');
  }
};

// ================================================================
// 7. Teachers assigned to a department
//    GET    /api/v1/departments/:id/teachers
//    POST   /api/v1/departments/:id/teachers   { teacherId, role }
//    DELETE /api/v1/departments/:id/teachers/:assignmentId
// ================================================================
const getDepartmentTeachers = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user?.schoolId;

    const dept = await query(
      `SELECT id FROM departments WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [id, school_id]
    );
    if (dept.rows.length === 0) return respond(res, 404, false, 'Department not found');

    const result = await query(
      `SELECT dt.id, dt.teacher_id, TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS teacher_name, dt.role
       FROM department_teachers dt
       JOIN teachers t ON t.id = dt.teacher_id
       JOIN users u ON u.id = t.user_id
       WHERE dt.department_id = $1
       ORDER BY dt.created_at`,
      [id]
    );
    return respond(res, 200, true, 'Teachers retrieved', {
      teachers: result.rows.map(r => ({
        id: r.id,
        teacherId: r.teacher_id,
        teacherName: r.teacher_name,
        role: r.role,
      })),
    });
  } catch (err) {
    console.error('[getDepartmentTeachers]', err.message);
    return respond(res, 500, false, 'Failed to retrieve teachers');
  }
};

const assignDepartmentTeacher = async (req, res) => {
  try {
    if (!isWriter(req)) return respond(res, 403, false, 'Insufficient permissions');
    const { id } = req.params;
    const { teacherId, role } = req.body;
    const school_id = req.user?.schoolId;

    if (!teacherId) return respond(res, 400, false, 'teacherId is required');

    const dept = await query(
      `SELECT id FROM departments WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [id, school_id]
    );
    if (dept.rows.length === 0) return respond(res, 404, false, 'Department not found');

    const insert = await query(
      `INSERT INTO department_teachers (department_id, teacher_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (department_id, teacher_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING id, teacher_id, role`,
      [id, teacherId, role || 'Teacher']
    );

    const teacherRow = await query(
      `SELECT TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS name
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = $1`,
      [teacherId]
    );

    return respond(res, 201, true, 'Teacher assigned', {
      teacher: {
        id: insert.rows[0].id,
        teacherId: insert.rows[0].teacher_id,
        teacherName: teacherRow.rows[0]?.name || '',
        role: insert.rows[0].role,
      },
    });
  } catch (err) {
    console.error('[assignDepartmentTeacher]', err.message);
    return respond(res, 500, false, 'Failed to assign teacher');
  }
};

const removeDepartmentTeacher = async (req, res) => {
  try {
    if (!isWriter(req)) return respond(res, 403, false, 'Insufficient permissions');
    const { id, assignmentId } = req.params;
    const school_id = req.user?.schoolId;

    const result = await query(
      `DELETE FROM department_teachers dt
       USING departments d
       WHERE dt.id = $1 AND dt.department_id = $2
         AND d.id = dt.department_id AND d.school_id = $3
       RETURNING dt.id`,
      [assignmentId, id, school_id]
    );
    if (result.rows.length === 0) return respond(res, 404, false, 'Assignment not found');

    return respond(res, 200, true, 'Teacher removed');
  } catch (err) {
    console.error('[removeDepartmentTeacher]', err.message);
    return respond(res, 500, false, 'Failed to remove teacher');
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentLearningAreas,
  assignLearningArea,
  removeLearningArea,
  getDepartmentTeachers,
  assignDepartmentTeacher,
  removeDepartmentTeacher,
};
