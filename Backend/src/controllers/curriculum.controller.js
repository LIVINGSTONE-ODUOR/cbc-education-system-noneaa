// ================================================================
// controllers/curriculum.controller.js
//
// CBC Curriculum hierarchy:
//   Learning Area → Strand → Sub-Strand → Competency
//
// Two record types:
//   National  (school_id = NULL)  — CBC standard, shared by all schools
//   Custom    (school_id = uuid)  — school-specific additions
//
// Rules:
//   • school_admin reads national + own custom
//   • school_admin CANNOT modify national curriculum items
//   • super_admin can modify anything + seed national content
//   • All lists merge national + custom automatically
//   • Tree endpoint uses one SQL query (JSON aggregation) — no N+1
//   • All deletes are soft (deleted_at) — never hard DELETE
// ================================================================

const { query, pool } = require('../config/database');

// ----------------------------------------------------------------
// Shared helpers
// ----------------------------------------------------------------

const respond = (res, status, success, message, data = null, errors = null) => {
  const payload = { success, message };
  if (data)   payload.data   = data;
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};

const isWriter = (req) => ['super_admin', 'school_admin'].includes(req.user?.role);

const VALID_GRADES = [
  'PP1','PP2',
  'Grade 1','Grade 2','Grade 3',
  'Grade 4','Grade 5','Grade 6',
  'Grade 7','Grade 8','Grade 9',
  'Grade 10','Grade 11','Grade 12',
];

const GRADE_BAND = (grade) => {
  if (['PP1','PP2'].includes(grade))                             return 'ecde';
  if (['Grade 1','Grade 2','Grade 3'].includes(grade))          return 'lower_primary';
  if (['Grade 4','Grade 5','Grade 6'].includes(grade))          return 'upper_primary';
  if (['Grade 7','Grade 8','Grade 9'].includes(grade))          return 'junior_secondary';
  if (['Grade 10','Grade 11','Grade 12'].includes(grade))       return 'senior_secondary';
  return null;
};

// Auto-generate a short code from a name
// "Oral Communication" → "ORAL-COM"
const generateCode = (name) =>
  name.toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w.slice(0, 4))
    .join('-')
    .slice(0, 20);


// ================================================================
// 1. GET /api/v1/curriculum/learning-areas
//    Returns national + this school's custom areas combined.
//    Query: ?grade_level=Grade 4  ?is_active=true  ?school_only=true
// ================================================================

const getLearningAreas = async (req, res) => {
  try {
    const school_id = req.user?.schoolId;
    const { grade_level, is_active, school_only } = req.query;

    let sql = `
      SELECT
        la.id,
        la.name,
        la.code,
        la.description,
        la.school_id,
        la.grade_levels,
        la.is_active,
        la.created_at,
        CASE WHEN la.school_id IS NULL THEN true ELSE false END AS is_national,
        (SELECT COUNT(*) FROM strands s
         WHERE s.learning_area_id = la.id
           AND s.deleted_at IS NULL) AS strand_count
      FROM learning_areas la
      WHERE la.deleted_at IS NULL
        AND (la.school_id IS NULL OR la.school_id = $1)
    `;

    const params = [school_id];
    let idx = 2;

    if (school_only === 'true') {
      sql += ` AND la.school_id = $${idx++}`;
      params.push(school_id);
    }
    if (grade_level) {
      sql += ` AND (la.grade_levels IS NULL OR $${idx++} = ANY(la.grade_levels))`;
      params.push(grade_level);
    }
    if (is_active !== undefined) {
      sql += ` AND la.is_active = $${idx++}`;
      params.push(is_active === 'true');
    }

    sql += ` ORDER BY la.school_id NULLS FIRST, la.name ASC`;

    const result = await query(sql, params);

    const national = result.rows.filter(r => r.is_national);
    const custom   = result.rows.filter(r => !r.is_national);

    return respond(res, 200, true, 'Learning areas retrieved', {
      learning_areas: result.rows,
      national_count: national.length,
      custom_count:   custom.length,
      total:          result.rowCount,
    });

  } catch (err) {
    console.error('[getLearningAreas]', err.message);
    return respond(res, 500, false, 'Failed to retrieve learning areas');
  }
};


// ================================================================
// 2. GET /api/v1/curriculum/learning-areas/:id
// ================================================================

const getLearningAreaById = async (req, res) => {
  try {
    const { id }    = req.params;
    const school_id = req.user?.schoolId;

    const result = await query(`
      SELECT la.*,
        CASE WHEN la.school_id IS NULL THEN true ELSE false END AS is_national,
        (SELECT COUNT(*) FROM strands s
         WHERE s.learning_area_id = la.id AND s.deleted_at IS NULL) AS strand_count
      FROM learning_areas la
      WHERE la.id = $1
        AND la.deleted_at IS NULL
        AND (la.school_id IS NULL OR la.school_id = $2)
    `, [id, school_id]);

    if (!result.rows.length)
      return respond(res, 404, false, 'Learning area not found');

    return respond(res, 200, true, 'Learning area retrieved', {
      learning_area: result.rows[0],
    });

  } catch (err) {
    console.error('[getLearningAreaById]', err.message);
    return respond(res, 500, false, 'Failed to retrieve learning area');
  }
};


// ================================================================
// 3. POST /api/v1/curriculum/learning-areas
//    Body: { name, code?, description?, grade_levels? }
//    school_admin creates school-specific. super_admin creates national.
// ================================================================

const createLearningArea = async (req, res) => {
  if (!isWriter(req)) return respond(res, 403, false, 'Only admins can create learning areas');

  const { name, code, description, grade_levels } = req.body;
  // super_admin sets school_id=NULL (national); school_admin sets own school
  const school_id  = req.user.role === 'super_admin' ? null : req.user.schoolId;
  const created_by = req.user.id;

  const errors = [];
  if (!name || name.trim().length < 2)
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  if (grade_levels && !Array.isArray(grade_levels))
    errors.push({ field: 'grade_levels', message: 'grade_levels must be an array' });
  if (grade_levels?.some(g => !VALID_GRADES.includes(g)))
    errors.push({ field: 'grade_levels', message: `Invalid grade in array. Valid: ${VALID_GRADES.join(', ')}` });
  if (errors.length > 0) return respond(res, 422, false, 'Validation failed', null, errors);

  const finalCode = (code || generateCode(name)).toUpperCase();

  try {
    const dup = await query(
      `SELECT id FROM learning_areas
       WHERE code = $1 AND deleted_at IS NULL
         AND (school_id IS NULL OR school_id = $2)`,
      [finalCode, school_id]
    );

    if (dup.rows.length)
      return respond(res, 409, false, `Code "${finalCode}" already in use`, null, [
        { field: 'code', message: 'Code already exists' },
      ]);

    const result = await query(`
      INSERT INTO learning_areas
        (name, code, description, school_id, grade_levels,
         is_active, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, $6, NOW(), NOW())
      RETURNING *
    `, [name.trim(), finalCode, description?.trim() || null, school_id, grade_levels || null, created_by]);

    return respond(res, 201, true, 'Learning area created', {
      learning_area: result.rows[0],
    });

  } catch (err) {
    console.error('[createLearningArea]', err.message);
    if (err.code === '23505') return respond(res, 409, false, 'Code already exists');
    return respond(res, 500, false, 'Failed to create learning area');
  }
};


// ================================================================
// 4. PUT /api/v1/curriculum/learning-areas/:id
// ================================================================

const updateLearningArea = async (req, res) => {
  if (!isWriter(req)) return respond(res, 403, false, 'Only admins can update learning areas');

  const { id }     = req.params;
  const school_id  = req.user.schoolId;
  const updated_by = req.user.id;
  const { name, code, description, grade_levels, is_active } = req.body;

  try {
    const existing = await query(
      `SELECT * FROM learning_areas WHERE id = $1 AND deleted_at IS NULL`, [id]
    );
    if (!existing.rows.length) return respond(res, 404, false, 'Learning area not found');

    const area = existing.rows[0];
    if (area.school_id === null && req.user.role !== 'super_admin')
      return respond(res, 403, false, 'National curriculum can only be edited by super_admin');
    if (area.school_id && area.school_id !== school_id && req.user.role !== 'super_admin')
      return respond(res, 403, false, 'You can only edit your own school\'s learning areas');

    const result = await query(`
      UPDATE learning_areas SET
        name         = COALESCE($1, name),
        code         = COALESCE($2, code),
        description  = COALESCE($3, description),
        grade_levels = COALESCE($4, grade_levels),
        is_active    = COALESCE($5, is_active),
        updated_at   = NOW(),
        updated_by   = $6
      WHERE id = $7 AND deleted_at IS NULL
      RETURNING *
    `, [name?.trim() || null, code?.toUpperCase() || null, description?.trim() || null,
        grade_levels || null, is_active !== undefined ? is_active : null, updated_by, id]);

    return respond(res, 200, true, 'Learning area updated', { learning_area: result.rows[0] });

  } catch (err) {
    console.error('[updateLearningArea]', err.message);
    return respond(res, 500, false, 'Failed to update learning area');
  }
};


// ================================================================
// 5. GET /api/v1/curriculum/learning-areas/:id/strands
// ================================================================

const getStrands = async (req, res) => {
  try {
    const { id }     = req.params;
    const school_id  = req.user.schoolId;
    const { is_active } = req.query;

    const areaCheck = await query(
      `SELECT id, name, school_id FROM learning_areas
       WHERE id = $1 AND deleted_at IS NULL
         AND (school_id IS NULL OR school_id = $2)`,
      [id, school_id]
    );
    if (!areaCheck.rows.length) return respond(res, 404, false, 'Learning area not found');

    let sql = `
      SELECT s.id, s.name, s.code, s.description,
             s.learning_area_id, s.is_active, s.created_at,
             (SELECT COUNT(*) FROM sub_strands ss
              WHERE ss.strand_id = s.id AND ss.deleted_at IS NULL) AS sub_strand_count
      FROM strands s
      WHERE s.learning_area_id = $1
        AND s.deleted_at IS NULL
    `;

    const params = [id];
    let idx = 2;
    if (is_active !== undefined) { sql += ` AND s.is_active = $${idx++}`; params.push(is_active === 'true'); }
    sql += ` ORDER BY s.name ASC`;

    const result = await query(sql, params);

    return respond(res, 200, true, 'Strands retrieved', {
      learning_area_id:   id,
      learning_area_name: areaCheck.rows[0].name,
      strands:            result.rows,
      total:              result.rowCount,
    });

  } catch (err) {
    console.error('[getStrands]', err.message);
    return respond(res, 500, false, 'Failed to retrieve strands');
  }
};


// ================================================================
// 6. POST /api/v1/curriculum/strands
//    Body: { learning_area_id, name, code?, description? }
// ================================================================

const createStrand = async (req, res) => {
  if (!isWriter(req)) return respond(res, 403, false, 'Only admins can create strands');

  const { learning_area_id, name, code, description } = req.body;
  const school_id  = req.user.schoolId;
  const created_by = req.user.id;

  const errors = [];
  if (!learning_area_id) errors.push({ field: 'learning_area_id', message: 'Required' });
  if (!name || name.trim().length < 2) errors.push({ field: 'name', message: 'Min 2 characters' });
  if (errors.length > 0) return respond(res, 422, false, 'Validation failed', null, errors);

  try {
    const areaCheck = await query(
      `SELECT id, school_id FROM learning_areas
       WHERE id = $1 AND deleted_at IS NULL
         AND (school_id IS NULL OR school_id = $2)`,
      [learning_area_id, school_id]
    );
    if (!areaCheck.rows.length)
      return respond(res, 404, false, 'Learning area not found or not accessible');
    if (areaCheck.rows[0].school_id === null && req.user.role !== 'super_admin')
      return respond(res, 403, false, 'Cannot add strands to national learning areas');

    const finalCode = (code || generateCode(name)).toUpperCase();

    const dup = await query(
      `SELECT id FROM strands
       WHERE learning_area_id = $1 AND code = $2 AND deleted_at IS NULL`,
      [learning_area_id, finalCode]
    );
    if (dup.rows.length)
      return respond(res, 409, false, `Code "${finalCode}" already exists in this learning area`, null, [
        { field: 'code', message: 'Code already in use' },
      ]);

    const result = await query(`
      INSERT INTO strands
        (learning_area_id, name, code, description,
         is_active, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())
      RETURNING *
    `, [learning_area_id, name.trim(), finalCode, description?.trim() || null, created_by]);

    return respond(res, 201, true, 'Strand created', { strand: result.rows[0] });

  } catch (err) {
    console.error('[createStrand]', err.message);
    if (err.code === '23505') return respond(res, 409, false, 'Strand code already exists');
    if (err.code === '23503') return respond(res, 404, false, 'Learning area not found');
    return respond(res, 500, false, 'Failed to create strand');
  }
};


// ================================================================
// 7. GET /api/v1/curriculum/strands/:id/sub-strands
// ================================================================

const getSubStrands = async (req, res) => {
  try {
    const { id }    = req.params;
    const { is_active } = req.query;

    const strandCheck = await query(
      `SELECT s.id, s.name, la.name AS learning_area_name
       FROM strands s
       JOIN learning_areas la ON la.id = s.learning_area_id
       WHERE s.id = $1 AND s.deleted_at IS NULL`,
      [id]
    );
    if (!strandCheck.rows.length) return respond(res, 404, false, 'Strand not found');

    let sql = `
      SELECT ss.id, ss.name, ss.code, ss.description,
             ss.strand_id, ss.is_active, ss.created_at,
             (SELECT COUNT(*) FROM competencies c
              WHERE c.sub_strand_id = ss.id AND c.deleted_at IS NULL) AS competency_count
      FROM sub_strands ss
      WHERE ss.strand_id = $1 AND ss.deleted_at IS NULL
    `;

    const params = [id];
    let idx = 2;
    if (is_active !== undefined) { sql += ` AND ss.is_active = $${idx++}`; params.push(is_active === 'true'); }
    sql += ` ORDER BY ss.name ASC`;

    const result = await query(sql, params);

    return respond(res, 200, true, 'Sub-strands retrieved', {
      strand_id:          id,
      strand_name:        strandCheck.rows[0].name,
      learning_area_name: strandCheck.rows[0].learning_area_name,
      sub_strands:        result.rows,
      total:              result.rowCount,
    });

  } catch (err) {
    console.error('[getSubStrands]', err.message);
    return respond(res, 500, false, 'Failed to retrieve sub-strands');
  }
};


// ================================================================
// 8. POST /api/v1/curriculum/sub-strands
//    Body: { strand_id, name, code?, description? }
// ================================================================

const createSubStrand = async (req, res) => {
  if (!isWriter(req)) return respond(res, 403, false, 'Only admins can create sub-strands');

  const { strand_id, name, code, description } = req.body;
  const school_id  = req.user.schoolId;
  const created_by = req.user.id;

  const errors = [];
  if (!strand_id) errors.push({ field: 'strand_id', message: 'Required' });
  if (!name || name.trim().length < 2) errors.push({ field: 'name', message: 'Min 2 characters' });
  if (errors.length > 0) return respond(res, 422, false, 'Validation failed', null, errors);

  try {
    const strandCheck = await query(`
      SELECT s.id, la.school_id AS area_school_id
      FROM strands s
      JOIN learning_areas la ON la.id = s.learning_area_id
      WHERE s.id = $1 AND s.deleted_at IS NULL AND la.deleted_at IS NULL
        AND (la.school_id IS NULL OR la.school_id = $2)
    `, [strand_id, school_id]);

    if (!strandCheck.rows.length)
      return respond(res, 404, false, 'Strand not found or not accessible');
    if (strandCheck.rows[0].area_school_id === null && req.user.role !== 'super_admin')
      return respond(res, 403, false, 'Cannot add sub-strands to national curriculum strands');

    const finalCode = (code || generateCode(name)).toUpperCase();

    const dup = await query(
      `SELECT id FROM sub_strands WHERE strand_id = $1 AND code = $2 AND deleted_at IS NULL`,
      [strand_id, finalCode]
    );
    if (dup.rows.length)
      return respond(res, 409, false, `Code "${finalCode}" already exists in this strand`, null, [
        { field: 'code', message: 'Code already in use' },
      ]);

    const result = await query(`
      INSERT INTO sub_strands
        (strand_id, name, code, description,
         is_active, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())
      RETURNING *
    `, [strand_id, name.trim(), finalCode, description?.trim() || null, created_by]);

    return respond(res, 201, true, 'Sub-strand created', { sub_strand: result.rows[0] });

  } catch (err) {
    console.error('[createSubStrand]', err.message);
    if (err.code === '23505') return respond(res, 409, false, 'Code already exists in this strand');
    if (err.code === '23503') return respond(res, 404, false, 'Strand not found');
    return respond(res, 500, false, 'Failed to create sub-strand');
  }
};


// ================================================================
// 9. GET /api/v1/curriculum/sub-strands/:id/competencies
// ================================================================

const getCompetencies = async (req, res) => {
  try {
    const { id }    = req.params;
    const { is_active } = req.query;

    const ssCheck = await query(
      `SELECT ss.id, ss.name, s.name AS strand_name, la.name AS learning_area_name
       FROM sub_strands ss
       JOIN strands s ON s.id = ss.strand_id
       JOIN learning_areas la ON la.id = s.learning_area_id
       WHERE ss.id = $1 AND ss.deleted_at IS NULL`,
      [id]
    );
    if (!ssCheck.rows.length) return respond(res, 404, false, 'Sub-strand not found');

    let sql = `
      SELECT c.id, c.name, c.description, c.sub_strand_id,
             c.performance_indicators, c.is_active, c.created_at
      FROM competencies c
      WHERE c.sub_strand_id = $1 AND c.deleted_at IS NULL
    `;

    const params = [id];
    let idx = 2;
    if (is_active !== undefined) { sql += ` AND c.is_active = $${idx++}`; params.push(is_active === 'true'); }
    sql += ` ORDER BY c.name ASC`;

    const result = await query(sql, params);

    return respond(res, 200, true, 'Competencies retrieved', {
      sub_strand_id:      id,
      sub_strand_name:    ssCheck.rows[0].name,
      strand_name:        ssCheck.rows[0].strand_name,
      learning_area_name: ssCheck.rows[0].learning_area_name,
      competencies:       result.rows,
      total:              result.rowCount,
    });

  } catch (err) {
    console.error('[getCompetencies]', err.message);
    return respond(res, 500, false, 'Failed to retrieve competencies');
  }
};


// ================================================================
// 10. POST /api/v1/curriculum/competencies
//     Body: {
//       sub_strand_id, name, description?,
//       performance_indicators?  ← string[] rubric descriptors
//     }
// ================================================================

const createCompetency = async (req, res) => {
  if (!isWriter(req)) return respond(res, 403, false, 'Only admins can create competencies');

  const { sub_strand_id, name, description, performance_indicators } = req.body;
  const school_id  = req.user.schoolId;
  const created_by = req.user.id;

  const errors = [];
  if (!sub_strand_id) errors.push({ field: 'sub_strand_id', message: 'Required' });
  if (!name || name.trim().length < 2) errors.push({ field: 'name', message: 'Min 2 characters' });
  if (performance_indicators && !Array.isArray(performance_indicators))
    errors.push({ field: 'performance_indicators', message: 'Must be an array of strings' });
  if (errors.length > 0) return respond(res, 422, false, 'Validation failed', null, errors);

  try {
    const ssCheck = await query(`
      SELECT ss.id, la.school_id AS area_school_id
      FROM sub_strands ss
      JOIN strands s ON s.id = ss.strand_id
      JOIN learning_areas la ON la.id = s.learning_area_id
      WHERE ss.id = $1 AND ss.deleted_at IS NULL
        AND (la.school_id IS NULL OR la.school_id = $2)
    `, [sub_strand_id, school_id]);

    if (!ssCheck.rows.length)
      return respond(res, 404, false, 'Sub-strand not found or not accessible');
    if (ssCheck.rows[0].area_school_id === null && req.user.role !== 'super_admin')
      return respond(res, 403, false, 'Cannot add competencies to national sub-strands');

    const dup = await query(
      `SELECT id FROM competencies
       WHERE sub_strand_id = $1 AND LOWER(name) = LOWER($2) AND deleted_at IS NULL`,
      [sub_strand_id, name.trim()]
    );
    if (dup.rows.length)
      return respond(res, 409, false, `Competency "${name}" already exists in this sub-strand`, null, [
        { field: 'name', message: 'Name already in use' },
      ]);

    const result = await query(`
      INSERT INTO competencies
        (sub_strand_id, name, description, performance_indicators,
         is_active, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())
      RETURNING *
    `, [sub_strand_id, name.trim(), description?.trim() || null, performance_indicators || null, created_by]);

    return respond(res, 201, true, 'Competency created', { competency: result.rows[0] });

  } catch (err) {
    console.error('[createCompetency]', err.message);
    if (err.code === '23503') return respond(res, 404, false, 'Sub-strand not found');
    return respond(res, 500, false, 'Failed to create competency');
  }
};


// ================================================================
// 11. GET /api/v1/curriculum/tree/:grade
//
//     Returns the FULL curriculum tree for one grade in a
//     SINGLE SQL query using JSON aggregation.
//     No N+1 queries — even a 13-area Grade 7 tree is one round-trip.
//
//     Used by: assessment entry form to populate all 4 dropdowns.
// ================================================================

const getCurriculumTree = async (req, res) => {
  try {
    const { grade } = req.params;
    const school_id = req.user?.schoolId;

    if (!VALID_GRADES.includes(grade))
      return respond(res, 400, false, `Invalid grade "${grade}"`, null, [
        { field: 'grade', message: `Must be one of: ${VALID_GRADES.join(', ')}` },
      ]);

    const result = await query(`
      SELECT
        la.id                AS id,
        la.name              AS name,
        la.code              AS code,
        la.description       AS description,
        la.grade_levels,
        CASE WHEN la.school_id IS NULL THEN true ELSE false END AS is_national,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id',          s.id,
              'name',        s.name,
              'code',        s.code,
              'description', s.description,
              'sub_strands', (
                SELECT COALESCE(json_agg(
                  jsonb_build_object(
                    'id',          ss.id,
                    'name',        ss.name,
                    'code',        ss.code,
                    'description', ss.description,
                    'competencies', (
                      SELECT COALESCE(json_agg(
                        jsonb_build_object(
                          'id',                     c.id,
                          'name',                   c.name,
                          'description',            c.description,
                          'performance_indicators', c.performance_indicators
                        ) ORDER BY c.name
                      ) FILTER (WHERE c.id IS NOT NULL AND c.deleted_at IS NULL), '[]'::json)
                      FROM competencies c
                      WHERE c.sub_strand_id = ss.id
                        AND c.is_active     = true
                        AND c.deleted_at    IS NULL
                    )
                  ) ORDER BY ss.name
                ) FILTER (WHERE ss.id IS NOT NULL AND ss.deleted_at IS NULL), '[]'::json)
                FROM sub_strands ss
                WHERE ss.strand_id  = s.id
                  AND ss.is_active  = true
                  AND ss.deleted_at IS NULL
              )
            )
          ) FILTER (WHERE s.id IS NOT NULL AND s.deleted_at IS NULL),
          '[]'::json
        ) AS strands

      FROM learning_areas la
      LEFT JOIN strands s
        ON  s.learning_area_id = la.id
        AND s.is_active        = true
        AND s.deleted_at       IS NULL

      WHERE la.deleted_at  IS NULL
        AND la.is_active   = true
        AND (la.school_id IS NULL OR la.school_id = $1)
        AND (la.grade_levels IS NULL OR $2 = ANY(la.grade_levels))

      GROUP BY la.id, la.name, la.code, la.description, la.grade_levels, la.school_id
      ORDER BY la.school_id NULLS FIRST, la.name ASC
    `, [school_id, grade]);

    return respond(res, 200, true, `Curriculum tree for ${grade}`, {
      grade,
      grade_band:          GRADE_BAND(grade),
      learning_area_count: result.rowCount,
      tree:                result.rows,
    });

  } catch (err) {
    console.error('[getCurriculumTree]', err.message);
    return respond(res, 500, false, 'Failed to retrieve curriculum tree');
  }
};


// ================================================================
// 12. POST /api/v1/curriculum/seed-cbc
//     Seeds national CBC curriculum. super_admin only. Idempotent.
// ================================================================

const seedCBCCurriculum = async (req, res) => {
  if (req.user?.role !== 'super_admin')
    return respond(res, 403, false, 'Only super_admin can seed the national curriculum');

  const client     = await pool.connect();
  const created_by = req.user.id;

  try {
    await client.query('BEGIN');

    let areas_created = 0, strands_created = 0;

    const CBC_AREAS = [
      { name: 'Language Activities',            code: 'LANG-ACT',  grades: ['PP1','PP2'] },
      { name: 'Mathematical Activities',      code: 'MATH-ACT',  grades: ['PP1','PP2'] },
      { name: 'Environmental Activities',     code: 'ENV-ACT',   grades: ['PP1','PP2'] },
      { name: 'Psychomotor & Creative Arts', code: 'PSY-CRE',   grades: ['PP1','PP2'] },
      { name: 'Literacy',                     code: 'LITERACY',  grades: ['Grade 1','Grade 2','Grade 3'] },
      { name: 'Kiswahili Language',          code: 'KSW',        grades: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'] },
      { name: 'English Language',            code: 'ENG',        grades: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'] },
      { name: 'Mathematics',                 code: 'MATH',       grades: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'] },
      { name: 'Environmental & Social Studies', code: 'ESS',   grades: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6'] },
      { name: 'Creative Arts & Sports',      code: 'CAS',        grades: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'] },
      { name: 'Religious Education',        code: 'REL-ED',     grades: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9'] },
      { name: 'Life Skills Education',       code: 'LIFE-SKL',   grades: ['Grade 4','Grade 5','Grade 6'] },
      { name: 'Integrated Science',          code: 'INTG-SCI',   grades: ['Grade 7','Grade 8','Grade 9'] },
      { name: 'Health Education',            code: 'HLTH-ED',    grades: ['Grade 7','Grade 8','Grade 9'] },
      { name: 'Pre-Technical Studies',       code: 'PRE-TECH',   grades: ['Grade 7','Grade 8','Grade 9'] },
      { name: 'Social Studies',              code: 'SOC-STD',     grades: ['Grade 7','Grade 8','Grade 9'] },
      { name: 'Business Studies',            code: 'BUS-STD',    grades: ['Grade 7','Grade 8','Grade 9'] },
      { name: 'Agriculture',                 code: 'AGRIC',       grades: ['Grade 7','Grade 8','Grade 9'] },
      { name: 'Home Science',                code: 'HOME-SCI',   grades: ['Grade 7','Grade 8','Grade 9'] },
    ];

    const areaIdMap = {};

    for (const area of CBC_AREAS) {
      const r = await client.query(`
        INSERT INTO learning_areas
          (name, code, description, school_id, grade_levels, is_active, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, NULL, $4, true, $5, NOW(), NOW())
        ON CONFLICT (code) DO NOTHING
        RETURNING id, code
      `, [area.name, area.code, `CBC National — ${area.name}`, area.grades, created_by]);

      if (r.rows.length) { areaIdMap[area.code] = r.rows[0].id; areas_created++; }
      else {
        const ex = await client.query(
          `SELECT id FROM learning_areas WHERE code = $1 AND school_id IS NULL`, [area.code]
        );
        if (ex.rows.length) areaIdMap[area.code] = ex.rows[0].id;
      }
    }

    const CBC_STRANDS = [
      { area: 'LITERACY',  name: 'Listening and Speaking',    code: 'LIT-LS' },
      { area: 'LITERACY',  name: 'Reading',                   code: 'LIT-RD' },
      { area: 'LITERACY',  name: 'Writing',                   code: 'LIT-WR' },
      { area: 'LITERACY',  name: 'Grammar',                   code: 'LIT-GR' },
      { area: 'ENG',       name: 'Listening and Speaking',    code: 'ENG-LS' },
      { area: 'ENG',       name: 'Reading',                   code: 'ENG-RD' },
      { area: 'ENG',       name: 'Writing',                   code: 'ENG-WR' },
      { area: 'ENG',       name: 'Language Structure',        code: 'ENG-LS2' },
      { area: 'KSW',       name: 'Kusikiliza na Kuzungumza',  code: 'KSW-KK' },
      { area: 'KSW',       name: 'Kusoma',                    code: 'KSW-KS' },
      { area: 'KSW',       name: 'Kuandika',                  code: 'KSW-KA' },
      { area: 'KSW',       name: 'Sarufi na Matumizi ya Lugha', code: 'KSW-SA' },
      { area: 'MATH',      name: 'Numbers',                   code: 'MATH-NUM' },
      { area: 'MATH',      name: 'Measurement',               code: 'MATH-MEA' },
      { area: 'MATH',      name: 'Geometry',                  code: 'MATH-GEO' },
      { area: 'MATH',      name: 'Data Handling',             code: 'MATH-DAT' },
      { area: 'ESS',       name: 'The Environment',           code: 'ESS-ENV' },
      { area: 'ESS',       name: 'Social Environment',        code: 'ESS-SOC' },
      { area: 'ESS',       name: 'Economic Environment',      code: 'ESS-ECO' },
      { area: 'CAS',       name: 'Visual Arts',               code: 'CAS-VA' },
      { area: 'CAS',       name: 'Performing Arts',           code: 'CAS-PA' },
      { area: 'CAS',       name: 'Physical Education',        code: 'CAS-PE' },
      { area: 'INTG-SCI',  name: 'Living Things',             code: 'SCI-LT' },
      { area: 'INTG-SCI',  name: 'Non-Living Things',         code: 'SCI-NL' },
      { area: 'INTG-SCI',  name: 'Environment',               code: 'SCI-ENV' },
      { area: 'INTG-SCI',  name: 'Energy',                    code: 'SCI-ENE' },
      { area: 'SOC-STD',   name: 'History and Government',   code: 'SOC-HG' },
      { area: 'SOC-STD',   name: 'Geography',                 code: 'SOC-GEO' },
      { area: 'AGRIC',     name: 'Crop Production',           code: 'AGR-CP' },
      { area: 'AGRIC',     name: 'Animal Production',         code: 'AGR-AP' },
      { area: 'HOME-SCI',  name: 'Food and Nutrition',        code: 'HOM-FN' },
      { area: 'HOME-SCI',  name: 'Clothing and Textiles',     code: 'HOM-CT' },
    ];

    for (const strand of CBC_STRANDS) {
      const areaId = areaIdMap[strand.area];
      if (!areaId) continue;

      const r = await client.query(`
        INSERT INTO strands
          (learning_area_id, name, code, is_active, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, true, $4, NOW(), NOW())
        ON CONFLICT (learning_area_id, code) DO NOTHING
        RETURNING id
      `, [areaId, strand.name, strand.code, created_by]);

      if (r.rows.length) strands_created++;
    }

    await client.query('COMMIT');

    return respond(res, 201, true, 'CBC National Curriculum seeded', {
      summary: {
        learning_areas_created: areas_created,
        strands_created,
        note: 'Add sub-strands and competencies via admin UI or a full data migration script',
      },
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seedCBCCurriculum]', err.message);
    return respond(res, 500, false, 'Seed failed: ' + err.message);
  } finally {
    client.release();
  }
};


// ================================================================
// 13. Soft-delete factory — used for all 4 curriculum levels
// 14. Cascade delete for learning areas (deletes all children too)
// 15. Hard delete — permanently removes records from database
// ================================================================

const softDelete = (table) => async (req, res) => {
  if (!isWriter(req)) return respond(res, 403, false, 'Only admins can delete curriculum items');

  const { id }     = req.params;
  const school_id  = req.user.schoolId;
  const deleted_by = req.user.id;
  const cascade    = req.query.cascade === 'true';

  try {
    const existing = await query(
      `SELECT * FROM ${table} WHERE id = $1 AND deleted_at IS NULL`, [id]
    );
    if (!existing.rows.length)
      return respond(res, 404, false, `Item not found`);

    // Protect national items from school_admin
    if (table === 'learning_areas') {
      const item = existing.rows[0];
      if (item.school_id === null && req.user.role !== 'super_admin')
        return respond(res, 403, false, 'Cannot delete national curriculum items');
      if (item.school_id && item.school_id !== school_id && req.user.role !== 'super_admin')
        return respond(res, 403, false, 'Cannot delete another school\'s curriculum items');
    }

    // Block if children exist (unless cascade=true for learning_areas)
    const CHILDREN = {
      learning_areas: { table: 'strands',      col: 'learning_area_id' },
      strands:        { table: 'sub_strands',  col: 'strand_id' },
      sub_strands:    { table: 'competencies', col: 'sub_strand_id' },
    };
    const child = CHILDREN[table];
    
    if (child) {
      const cnt = await query(
        `SELECT COUNT(*) AS n FROM ${child.table} WHERE ${child.col} = $1 AND deleted_at IS NULL`, [id]
      );
      
      // For learning_areas, allow cascade delete
      if (table === 'learning_areas' && cascade) {
        // Delete all competencies for all sub_strands of all strands
        await query(`
          UPDATE competencies SET deleted_at = NOW(), deleted_by = $1, is_active = false
          WHERE sub_strand_id IN (
            SELECT ss.id FROM sub_strands ss
            JOIN strands s ON s.id = ss.strand_id
            WHERE s.learning_area_id = $2 AND ss.deleted_at IS NULL
          ) AND deleted_at IS NULL
        `, [deleted_by, id]);
        
        // Delete all sub_strands for all strands
        await query(`
          UPDATE sub_strands SET deleted_at = NOW(), deleted_by = $1, is_active = false
          WHERE strand_id IN (
            SELECT s.id FROM strands s
            WHERE s.learning_area_id = $2 AND s.deleted_at IS NULL
          ) AND deleted_at IS NULL
        `, [deleted_by, id]);
        
        // Delete all strands
        await query(`
          UPDATE strands SET deleted_at = NOW(), deleted_by = $1, is_active = false
          WHERE learning_area_id = $2 AND deleted_at IS NULL
        `, [deleted_by, id]);
      } else if (parseInt(cnt.rows[0].n) > 0) {
        return respond(res, 409, false,
          `Cannot delete: ${cnt.rows[0].n} ${child.table.replace('_',' ')} still linked. Use ?cascade=true to delete all, or remove those first.`
        );
      }
    }

    await query(
      `UPDATE ${table} SET deleted_at = NOW(), deleted_by = $1, is_active = false WHERE id = $2`,
      [deleted_by, id]
    );

    return respond(res, 200, true, 'Deleted successfully');

  } catch (err) {
    console.error(`[softDelete:${table}]`, err.message);
    return respond(res, 500, false, 'Failed to delete item');
  }
};

// Hard delete - permanently removes records from database
const hardDelete = (table) => async (req, res) => {
  if (!isWriter(req)) return respond(res, 403, false, 'Only admins can delete curriculum items');

  const { id }     = req.params;
  const school_id  = req.user.schoolId;

  try {
    const existing = await query(
      `SELECT * FROM ${table} WHERE id = $1`, [id]
    );
    if (!existing.rows.length)
      return respond(res, 404, false, `Item not found`);

    // Protect national items from school_admin
    if (table === 'learning_areas') {
      const item = existing.rows[0];
      if (item.school_id === null && req.user.role !== 'super_admin')
        return respond(res, 403, false, 'Cannot delete national curriculum items');
      if (item.school_id && item.school_id !== school_id && req.user.role !== 'super_admin')
        return respond(res, 403, false, 'Cannot delete another school\'s curriculum items');
    }

    // Delete children first (cascade)
    if (table === 'learning_areas') {
      // Delete competencies for all sub_strands of all strands
      await query(`
        DELETE FROM competencies
        WHERE sub_strand_id IN (
          SELECT ss.id FROM sub_strands ss
          JOIN strands s ON s.id = ss.strand_id
          WHERE s.learning_area_id = $1
        )
      `, [id]);
      
      // Delete all sub_strands for all strands
      await query(`
        DELETE FROM sub_strands
        WHERE strand_id IN (
          SELECT s.id FROM strands s
          WHERE s.learning_area_id = $1
        )
      `, [id]);
      
      // Delete all strands
      await query(`DELETE FROM strands WHERE learning_area_id = $1`, [id]);
    } else if (table === 'strands') {
      await query(`DELETE FROM competencies WHERE sub_strand_id IN (SELECT id FROM sub_strands WHERE strand_id = $1)`, [id]);
      await query(`DELETE FROM sub_strands WHERE strand_id = $1`, [id]);
    } else if (table === 'sub_strands') {
      await query(`DELETE FROM competencies WHERE sub_strand_id = $1`, [id]);
    }

    // Delete the record itself
    await query(`DELETE FROM ${table} WHERE id = $1`, [id]);

    return respond(res, 200, true, 'Permanently deleted');

  } catch (err) {
    console.error(`[hardDelete:${table}]`, err.message);
    return respond(res, 500, false, 'Failed to permanently delete item');
  }
};


module.exports = {
  getLearningAreas,
  getLearningAreaById,
  createLearningArea,
  updateLearningArea,
  deleteLearningArea: softDelete('learning_areas'),
  hardDeleteLearningArea: hardDelete('learning_areas'),

  getStrands,
  createStrand,
  deleteStrand: softDelete('strands'),
  hardDeleteStrand: hardDelete('strands'),

  getSubStrands,
  createSubStrand,
  deleteSubStrand: softDelete('sub_strands'),
  hardDeleteSubStrand: hardDelete('sub_strands'),

  getCompetencies,
  createCompetency,
  deleteCompetency: softDelete('competencies'),
  hardDeleteCompetency: hardDelete('competencies'),

  getCurriculumTree,
  seedCBCCurriculum,
};

