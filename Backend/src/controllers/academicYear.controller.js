const { query, pool } = require('../config/database');
const logger = require('../utils/logger');

const respond = (res, statusCode, success, message, data = null, errors = null) => {
  const payload = { success, message };
  if (data) payload.data = data;
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

function sanitizeText(value, max = 120) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function parseInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function asBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

function dbFailure(res, error, fallbackMessage) {
  logger.error('[academicYear] Error:', error);

  if (error?.code === '42P01' || error?.code === '42703') {
    return respond(
      res,
      500,
      false,
      'Database schema is incomplete for academic year module. Run latest migration.'
    );
  }

  if (error?.code === '22P02') {
    return respond(res, 400, false, 'Invalid identifier format supplied.');
  }

  if (error?.code === '23505') {
    return respond(res, 409, false, 'Duplicate record conflict detected.');
  }

  return respond(res, 500, false, fallbackMessage || 'Unexpected server error.');
}

async function rollbackQuietly(client) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Ignore rollback errors.
  }
}

function validateAcademicYearInput(body, partial = false) {
  const errors = [];

  const year = parseInteger(body.year);
  const startDate = body.start_date ? parseDate(body.start_date) : null;
  const endDate = body.end_date ? parseDate(body.end_date) : null;

  if (!partial || hasOwn(body, 'year')) {
    if (year === null || year < 2000 || year > 2100) {
      errors.push({ field: 'year', message: 'Year must be a valid number between 2000 and 2100.' });
    }
  }

  if (!partial || hasOwn(body, 'start_date')) {
    if (!startDate) {
      errors.push({ field: 'start_date', message: 'start_date is required and must be valid.' });
    }
  }

  if (!partial || hasOwn(body, 'end_date')) {
    if (!endDate) {
      errors.push({ field: 'end_date', message: 'end_date is required and must be valid.' });
    }
  }

  if (startDate && endDate && startDate >= endDate) {
    errors.push({ field: 'date_range', message: 'start_date must be earlier than end_date.' });
  }

  const cleanedName = sanitizeText(body.name, 160);
  if (hasOwn(body, 'name') && !cleanedName) {
    errors.push({ field: 'name', message: 'name cannot be empty when provided.' });
  }

  return {
    errors,
    values: {
      year,
      startDate,
      endDate,
      name: cleanedName,
      isCurrent: asBool(body.is_current, false),
      isActive: asBool(body.is_active, true),
    },
  };
}

function validateTermInput(body) {
  const errors = [];

  const termNumber = parseInteger(body.term_number);
  const startDate = parseDate(body.start_date);
  const endDate = parseDate(body.end_date);
  const name = sanitizeText(body.name, 120);

  if (![1, 2, 3].includes(termNumber)) {
    errors.push({ field: 'term_number', message: 'term_number must be 1, 2, or 3.' });
  }

  if (!startDate) {
    errors.push({ field: 'start_date', message: 'start_date is required and must be valid.' });
  }

  if (!endDate) {
    errors.push({ field: 'end_date', message: 'end_date is required and must be valid.' });
  }

  if (startDate && endDate && startDate >= endDate) {
    errors.push({ field: 'date_range', message: 'start_date must be earlier than end_date.' });
  }

  return {
    errors,
    values: {
      termNumber,
      startDate,
      endDate,
      name,
      isCurrent: asBool(body.is_current, false),
      isActive: asBool(body.is_active, true),
    },
  };
}

/**
 * POST /api/v1/academic-years
 * Create academic year for authenticated user's school.
 */
async function createAcademicYear(req, res) {
  const schoolId = req.user?.schoolId;
  const createdBy = req.user?.id;

  if (!schoolId) {
    return respond(res, 403, false, 'Your account is not linked to a school.');
  }

  const { errors, values } = validateAcademicYearInput(req.body || {}, false);
  if (errors.length) {
    return respond(res, 422, false, 'Validation failed.', null, errors);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const school = await client.query('SELECT id FROM schools WHERE id = $1 LIMIT 1', [schoolId]);
    if (!school.rows.length) {
      await rollbackQuietly(client);
      return respond(res, 404, false, 'School not found for this account.');
    }

    const duplicate = await client.query(
      `SELECT id, year, name
       FROM academic_years
       WHERE school_id = $1 AND year = $2
       LIMIT 1`,
      [schoolId, values.year]
    );

    if (duplicate.rows.length) {
      await rollbackQuietly(client);
      return respond(
        res,
        409,
        false,
        `Academic year ${values.year} already exists for this school.`,
        null,
        [{ field: 'year', message: 'Duplicate year for this school.' }]
      );
    }

    const overlap = await client.query(
      `SELECT id, name, year
       FROM academic_years
       WHERE school_id = $1
         AND daterange(start_date, end_date, '[]') && daterange($2::date, $3::date, '[]')
       LIMIT 1`,
      [schoolId, req.body.start_date, req.body.end_date]
    );

    if (overlap.rows.length) {
      await rollbackQuietly(client);
      return respond(
        res,
        409,
        false,
        'Academic year dates overlap with an existing academic year.',
        null,
        [{ field: 'date_range', message: `Overlaps with ${overlap.rows[0].name || overlap.rows[0].year}.` }]
      );
    }

    if (values.isCurrent) {
      await client.query(
        `UPDATE academic_years
         SET is_current = false,
             updated_at = NOW(),
             updated_by = $2
         WHERE school_id = $1 AND is_current = true`,
        [schoolId, createdBy]
      );
    }

    const yearName = values.name || `${values.year} Academic Year`;

    const inserted = await client.query(
      `INSERT INTO academic_years (
         school_id, name, year, start_date, end_date,
         is_current, is_active, created_by, updated_by,
         created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, NOW(), NOW())
       RETURNING id, school_id, name, year, start_date, end_date, is_current, is_active, created_at`,
      [
        schoolId,
        yearName,
        values.year,
        req.body.start_date,
        req.body.end_date,
        values.isCurrent,
        values.isActive,
        createdBy,
      ]
    );

    await client.query('COMMIT');

    return respond(res, 201, true, 'Academic year created successfully.', {
      academic_year: inserted.rows[0],
    });
  } catch (error) {
    await rollbackQuietly(client);
    return dbFailure(res, error, 'Failed to create academic year.');
  } finally {
    client.release();
  }
}

/**
 * GET /api/v1/academic-years
 * List all academic years for authenticated user's school.
 */
async function listAcademicYears(req, res) {
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    return respond(res, 403, false, 'Your account is not linked to a school.');
  }

  try {
    let result;

    try {
      result = await query(
        `SELECT
           ay.id,
           ay.school_id,
           ay.name,
           ay.year,
           ay.start_date,
           ay.end_date,
           ay.is_current,
           ay.is_active,
           ay.created_at,
           ay.updated_at,
           COALESCE((
             SELECT COUNT(*)::int
             FROM terms t
             WHERE t.academic_year_id = ay.id
               AND t.school_id = ay.school_id
               AND t.deleted_at IS NULL
           ), 0) AS term_count
         FROM academic_years ay
         WHERE ay.school_id = $1
         ORDER BY ay.year DESC, ay.start_date DESC`,
        [schoolId]
      );
    } catch (error) {
      if (error.code !== '42P01') throw error;

      result = await query(
        `SELECT
           id,
           school_id,
           name,
           year,
           start_date,
           end_date,
           is_current,
           is_active,
           created_at,
           updated_at,
           0 AS term_count
         FROM academic_years
         WHERE school_id = $1
         ORDER BY year DESC, start_date DESC`,
        [schoolId]
      );
    }

    return respond(res, 200, true, 'Academic years retrieved.', {
      academic_years: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to retrieve academic years.');
  }
}

/**
 * GET /api/v1/academic-years/current
 * Get current academic year for authenticated user's school.
 */
async function getCurrentAcademicYear(req, res) {
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    return respond(res, 403, false, 'Your account is not linked to a school.');
  }

  try {
    const result = await query(
      `SELECT id, school_id, name, year, start_date, end_date, is_current, is_active, created_at, updated_at
       FROM academic_years
       WHERE school_id = $1 AND is_current = true
       ORDER BY start_date DESC
       LIMIT 1`,
      [schoolId]
    );

    if (!result.rows.length) {
      return respond(res, 404, false, 'No current academic year is set for this school.');
    }

    return respond(res, 200, true, 'Current academic year retrieved.', {
      academic_year: result.rows[0],
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to retrieve current academic year.');
  }
}

/**
 * PUT /api/v1/academic-years/:id
 * Update academic year details.
 */
async function updateAcademicYear(req, res) {
  const schoolId = req.user?.schoolId;
  const updatedBy = req.user?.id;
  const yearId = req.params.id;

  if (!schoolId) {
    return respond(res, 403, false, 'Your account is not linked to a school.');
  }

  const { errors, values } = validateAcademicYearInput(req.body || {}, true);
  if (errors.length) {
    return respond(res, 422, false, 'Validation failed.', null, errors);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT id, school_id, name, year, start_date, end_date, is_current, is_active
       FROM academic_years
       WHERE id = $1 AND school_id = $2
       LIMIT 1`,
      [yearId, schoolId]
    );

    if (!existing.rows.length) {
      await rollbackQuietly(client);
      return respond(res, 404, false, 'Academic year not found for this school.');
    }

    const current = existing.rows[0];

    const nextYear = hasOwn(req.body, 'year') ? values.year : current.year;
    const nextStart = hasOwn(req.body, 'start_date') ? req.body.start_date : current.start_date;
    const nextEnd = hasOwn(req.body, 'end_date') ? req.body.end_date : current.end_date;
    const nextName = hasOwn(req.body, 'name') ? values.name : current.name;
    const nextCurrent = hasOwn(req.body, 'is_current') ? values.isCurrent : current.is_current;
    const nextActive = hasOwn(req.body, 'is_active') ? values.isActive : current.is_active;

    const dateStart = parseDate(nextStart);
    const dateEnd = parseDate(nextEnd);

    if (!dateStart || !dateEnd || dateStart >= dateEnd) {
      await rollbackQuietly(client);
      return respond(
        res,
        422,
        false,
        'Validation failed.',
        null,
        [{ field: 'date_range', message: 'Updated start_date and end_date must form a valid range.' }]
      );
    }

    const duplicate = await client.query(
      `SELECT id
       FROM academic_years
       WHERE school_id = $1 AND year = $2 AND id <> $3
       LIMIT 1`,
      [schoolId, nextYear, yearId]
    );

    if (duplicate.rows.length) {
      await rollbackQuietly(client);
      return respond(
        res,
        409,
        false,
        `Academic year ${nextYear} already exists for this school.`,
        null,
        [{ field: 'year', message: 'Duplicate year for this school.' }]
      );
    }

    const overlap = await client.query(
      `SELECT id, name, year
       FROM academic_years
       WHERE school_id = $1
         AND id <> $4
         AND daterange(start_date, end_date, '[]') && daterange($2::date, $3::date, '[]')
       LIMIT 1`,
      [schoolId, nextStart, nextEnd, yearId]
    );

    if (overlap.rows.length) {
      await rollbackQuietly(client);
      return respond(
        res,
        409,
        false,
        'Updated dates overlap with another academic year.',
        null,
        [{ field: 'date_range', message: `Overlaps with ${overlap.rows[0].name || overlap.rows[0].year}.` }]
      );
    }

    if (nextCurrent) {
      await client.query(
        `UPDATE academic_years
         SET is_current = false,
             updated_at = NOW(),
             updated_by = $2
         WHERE school_id = $1 AND is_current = true AND id <> $3`,
        [schoolId, updatedBy, yearId]
      );
    }

    const updated = await client.query(
      `UPDATE academic_years
       SET name = $1,
           year = $2,
           start_date = $3,
           end_date = $4,
           is_current = $5,
           is_active = $6,
           updated_at = NOW(),
           updated_by = $7
       WHERE id = $8 AND school_id = $9
       RETURNING id, school_id, name, year, start_date, end_date, is_current, is_active, created_at, updated_at`,
      [
        nextName || `${nextYear} Academic Year`,
        nextYear,
        nextStart,
        nextEnd,
        nextCurrent,
        nextActive,
        updatedBy,
        yearId,
        schoolId,
      ]
    );

    await client.query('COMMIT');

    return respond(res, 200, true, 'Academic year updated successfully.', {
      academic_year: updated.rows[0],
    });
  } catch (error) {
    await rollbackQuietly(client);
    return dbFailure(res, error, 'Failed to update academic year.');
  } finally {
    client.release();
  }
}

/**
 * POST /api/v1/academic-years/:id/terms
 * Create a term within an academic year.
 */
async function createTerm(req, res) {
  const schoolId = req.user?.schoolId;
  const createdBy = req.user?.id;
  const academicYearId = req.params.id;

  if (!schoolId) {
    return respond(res, 403, false, 'Your account is not linked to a school.');
  }

  const { errors, values } = validateTermInput(req.body || {});
  if (errors.length) {
    return respond(res, 422, false, 'Validation failed.', null, errors);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const academicYear = await client.query(
      `SELECT id, school_id, name, year, start_date, end_date
       FROM academic_years
       WHERE id = $1 AND school_id = $2
       LIMIT 1`,
      [academicYearId, schoolId]
    );

    if (!academicYear.rows.length) {
      await rollbackQuietly(client);
      return respond(res, 404, false, 'Academic year not found for this school.');
    }

    const yearRow = academicYear.rows[0];
    const yearStart = parseDate(yearRow.start_date);
    const yearEnd = parseDate(yearRow.end_date);

    if (!yearStart || !yearEnd) {
      await rollbackQuietly(client);
      return respond(
        res,
        422,
        false,
        'Selected academic year has incomplete date boundaries.',
        null,
        [{ field: 'academic_year', message: 'Academic year must have valid start_date and end_date.' }]
      );
    }

    if (
      values.startDate < yearStart ||
      values.endDate > yearEnd
    ) {
      await rollbackQuietly(client);
      return respond(
        res,
        422,
        false,
        'Term dates must be inside the selected academic year period.',
        null,
        [{
          field: 'date_range',
          message: `Academic year range: ${yearRow.start_date} to ${yearRow.end_date}.`,
        }]
      );
    }

    const duplicateTermNumber = await client.query(
      `SELECT id
       FROM terms
       WHERE school_id = $1
         AND academic_year_id = $2
         AND term_number = $3
         AND deleted_at IS NULL
       LIMIT 1`,
      [schoolId, academicYearId, values.termNumber]
    );

    if (duplicateTermNumber.rows.length) {
      await rollbackQuietly(client);
      return respond(
        res,
        409,
        false,
        `Term ${values.termNumber} already exists in this academic year.`,
        null,
        [{ field: 'term_number', message: 'term_number must be unique per academic year.' }]
      );
    }

    const overlap = await client.query(
      `SELECT id, name
       FROM terms
       WHERE school_id = $1
         AND academic_year_id = $2
         AND deleted_at IS NULL
         AND daterange(start_date, end_date, '[]') && daterange($3::date, $4::date, '[]')
       LIMIT 1`,
      [schoolId, academicYearId, req.body.start_date, req.body.end_date]
    );

    if (overlap.rows.length) {
      await rollbackQuietly(client);
      return respond(
        res,
        409,
        false,
        'Term dates overlap with an existing term in this academic year.',
        null,
        [{ field: 'date_range', message: `Overlaps with ${overlap.rows[0].name}.` }]
      );
    }

    if (values.isCurrent) {
      await client.query(
        `UPDATE terms
         SET is_current = false,
             updated_at = NOW(),
             updated_by = $2
         WHERE school_id = $1 AND is_current = true`,
        [schoolId, createdBy]
      );

      await client.query(
        `UPDATE academic_years
         SET is_current = false,
             updated_at = NOW(),
             updated_by = $2
         WHERE school_id = $1 AND is_current = true`,
        [schoolId, createdBy]
      );

      await client.query(
        `UPDATE academic_years
         SET is_current = true,
             updated_at = NOW(),
             updated_by = $2
         WHERE id = $1`,
        [academicYearId, createdBy]
      );
    }

    const termName = values.name || `Term ${values.termNumber}`;

    const inserted = await client.query(
      `INSERT INTO terms (
         school_id,
         academic_year_id,
         term_number,
         name,
         start_date,
         end_date,
         is_current,
         is_active,
         created_by,
         updated_by,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, NOW(), NOW())
       RETURNING id, school_id, academic_year_id, term_number, name, start_date, end_date, is_current, is_active, created_at`,
      [
        schoolId,
        academicYearId,
        values.termNumber,
        termName,
        req.body.start_date,
        req.body.end_date,
        values.isCurrent,
        values.isActive,
        createdBy,
      ]
    );

    await client.query('COMMIT');

    return respond(res, 201, true, 'Term created successfully.', {
      term: inserted.rows[0],
    });
  } catch (error) {
    await rollbackQuietly(client);
    return dbFailure(res, error, 'Failed to create term.');
  } finally {
    client.release();
  }
}

/**
 * GET /api/v1/academic-years/:id/terms
 * List all terms in an academic year.
 */
async function listTerms(req, res) {
  const schoolId = req.user?.schoolId;
  const academicYearId = req.params.id;

  if (!schoolId) {
    return respond(res, 403, false, 'Your account is not linked to a school.');
  }

  try {
    const year = await query(
      `SELECT id, name, year, start_date, end_date, is_current
       FROM academic_years
       WHERE id = $1 AND school_id = $2
       LIMIT 1`,
      [academicYearId, schoolId]
    );

    if (!year.rows.length) {
      return respond(res, 404, false, 'Academic year not found for this school.');
    }

    const terms = await query(
      `SELECT id, school_id, academic_year_id, term_number, name, start_date, end_date, is_current, is_active, created_at, updated_at
       FROM terms
       WHERE school_id = $1
         AND academic_year_id = $2
         AND deleted_at IS NULL
       ORDER BY term_number ASC`,
      [schoolId, academicYearId]
    );

    return respond(res, 200, true, 'Terms retrieved.', {
      academic_year: year.rows[0],
      terms: terms.rows,
      total: terms.rowCount,
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to retrieve terms.');
  }
}

/**
 * PATCH /api/v1/terms/:id/set-current
 * Set one term as current for school and sync current academic year.
 */
async function setCurrentTerm(req, res) {
  const schoolId = req.user?.schoolId;
  const updatedBy = req.user?.id;
  const termId = req.params.id;

  if (!schoolId) {
    return respond(res, 403, false, 'Your account is not linked to a school.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const term = await client.query(
      `SELECT id, school_id, academic_year_id, term_number, name
       FROM terms
       WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [termId, schoolId]
    );

    if (!term.rows.length) {
      await rollbackQuietly(client);
      return respond(res, 404, false, 'Term not found for this school.');
    }

    const selected = term.rows[0];

    await client.query(
      `UPDATE terms
       SET is_current = false,
           updated_at = NOW(),
           updated_by = $2
       WHERE school_id = $1 AND is_current = true`,
      [schoolId, updatedBy]
    );

    const setTerm = await client.query(
      `UPDATE terms
       SET is_current = true,
           is_active = true,
           updated_at = NOW(),
           updated_by = $3
       WHERE id = $1 AND school_id = $2
       RETURNING id, school_id, academic_year_id, term_number, name, start_date, end_date, is_current, is_active, updated_at`,
      [termId, schoolId, updatedBy]
    );

    await client.query(
      `UPDATE academic_years
       SET is_current = false,
           updated_at = NOW(),
           updated_by = $2
       WHERE school_id = $1 AND is_current = true`,
      [schoolId, updatedBy]
    );

    await client.query(
      `UPDATE academic_years
       SET is_current = true,
           is_active = true,
           updated_at = NOW(),
           updated_by = $2
       WHERE id = $1`,
      [selected.academic_year_id, updatedBy]
    );

    await client.query('COMMIT');

    return respond(res, 200, true, 'Current term updated successfully.', {
      term: setTerm.rows[0],
    });
  } catch (error) {
    await rollbackQuietly(client);
    return dbFailure(res, error, 'Failed to set current term.');
  } finally {
    client.release();
  }
}

module.exports = {
  createAcademicYear,
  listAcademicYears,
  getCurrentAcademicYear,
  updateAcademicYear,
  createTerm,
  listTerms,
  setCurrentTerm,
};
