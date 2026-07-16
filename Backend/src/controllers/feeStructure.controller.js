// ================================================================
// controllers/feeStructure.controller.js
//
// Manages fee structures — what each grade pays per term.
// Must exist before any invoice can be generated.
//
// Tables touched:
//   fee_structures   → primary table
//   academic_years   → JOIN for year name
//   invoice_line_items → checked on delete (cannot delete if in use)
//
// All operations are school-scoped via JWT (req.user.schoolId).
// Only school_admin and super_admin can write. Teachers/parents
// can read (for transparency) but cannot create/edit/delete.
// ================================================================

const { query } = require('../config/database');
const logger = require('../utils/logger');

// ----------------------------------------------------------------
// Constants — adjust based on your DB ENUM types
// ----------------------------------------------------------------

const VALID_CATEGORIES = [
  'tuition', 'activity', 'uniform', 'transport',
  'meals', 'examination', 'registration', 'other',
];

const VALID_FREQUENCIES = [
  'per_term', 'per_year', 'once_off', 'monthly',
];

const VALID_GRADES = [
  'PP1', 'PP2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
  'Grade 10', 'Grade 11', 'Grade 12',
];

// ----------------------------------------------------------------
// Helper — structured response
// ----------------------------------------------------------------

const respond = (res, status, success, message, data = null, errors = null) => {
  const payload = { success, message };
  if (data)   payload.data   = data;
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};

// ----------------------------------------------------------------
// Helper — check if user can write
// ----------------------------------------------------------------

const canWrite = (req) =>
  ['super_admin', 'school_admin'].includes(req.user.role);


// ================================================================
// 1. GET /api/v1/fee-structures
//    List all fee structures for the school.
//    Filters: ?grade_level=Grade 4  ?category=tuition
//             ?academic_year_id=xxx ?is_active=true
// ================================================================

const getFeeStructures = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const {
      grade_level, category, academic_year_id,
      is_active, is_mandatory,
    } = req.query;

    let queryText = `
      SELECT
        fs.id,
        fs.school_id,
        fs.academic_year_id,
        fs.name,
        fs.grade_level,
        fs.category,
        fs.amount,
        fs.frequency,
        fs.description,
        fs.is_mandatory,
        fs.is_active,
        fs.created_at,
        fs.created_by,
        fs.updated_at,
        ay.name  AS academic_year_name,
        ay.year  AS academic_year

      FROM fee_structures fs
      LEFT JOIN academic_years ay
        ON ay.id = fs.academic_year_id

      WHERE fs.school_id  = $1
        AND fs.deleted_at IS NULL
    `;

    const params = [schoolId];
    let idx = 2;

    if (grade_level) {
      // When filtering by a specific grade, also include records with null grade_level (All Grades)
      queryText += ` AND (fs.grade_level = $${idx++} OR fs.grade_level IS NULL)`;
      params.push(grade_level);
    }
    if (category) {
      queryText += ` AND fs.category = $${idx++}`;
      params.push(category);
    }
    if (academic_year_id) {
      queryText += ` AND fs.academic_year_id = $${idx++}`;
      params.push(academic_year_id);
    }
    if (is_active !== undefined) {
      queryText += ` AND fs.is_active = $${idx++}`;
      params.push(is_active === 'true');
    }
    if (is_mandatory !== undefined) {
      queryText += ` AND fs.is_mandatory = $${idx++}`;
      params.push(is_mandatory === 'true');
    }

    queryText += `
      ORDER BY
        fs.grade_level ASC,
        fs.category    ASC,
        fs.name        ASC
    `;

    const result = await query(queryText, params);

    // Group by grade_level for easier frontend rendering
    const grouped = {};
    for (const row of result.rows) {
      const grade = row.grade_level || 'All Grades';
      if (!grouped[grade]) grouped[grade] = [];
      grouped[grade].push(row);
    }

    return respond(res, 200, true, 'Fee structures retrieved', {
      fee_structures: result.rows,
      grouped_by_grade: grouped,
      total: result.rowCount,
    });

  } catch (err) {
    logger.error('[getFeeStructures] Error:', err.message);
    return respond(res, 500, false, 'Failed to retrieve fee structures');
  }
};


// ================================================================
// 2. GET /api/v1/fee-structures/by-grade/:grade
//    Fetch fees for a specific grade — called during enrollment
//    to auto-generate invoice line items.
//
//    Returns only active, mandatory fees for the current year.
// ================================================================

const getFeesByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    const { academic_year_id } = req.query;
    const schoolId = req.user.schoolId;

    if (!VALID_GRADES.includes(grade)) {
      return respond(res, 400, false, `Invalid grade level: "${grade}"`, null, [
        { field: 'grade', message: `Must be one of: ${VALID_GRADES.join(', ')}` },
      ]);
    }

    // If no year specified, use current academic year
    let yearId = academic_year_id;
    if (!yearId) {
      const currentYear = await query(
        `SELECT id FROM academic_years
         WHERE school_id = $1 AND is_current = true
         LIMIT 1`,
        [schoolId]
      );
      if (!currentYear.rows.length) {
        return respond(res, 404, false,
          'No current academic year found. Please set up an academic year first.'
        );
      }
      yearId = currentYear.rows[0].id;
    }

    const result = await query(`
      SELECT
        fs.id,
        fs.name,
        fs.grade_level,
        fs.category,
        fs.amount,
        fs.frequency,
        fs.description,
        fs.is_mandatory,
        ay.name AS academic_year_name,
        ay.year AS academic_year

      FROM fee_structures fs
      JOIN academic_years ay ON ay.id = fs.academic_year_id

      WHERE fs.school_id        = $1
        AND fs.academic_year_id = $2
        AND (fs.grade_level = $3 OR fs.grade_level IS NULL)
        AND fs.is_active  = true
        AND fs.deleted_at IS NULL

      ORDER BY fs.is_mandatory DESC, fs.category ASC
    `, [schoolId, yearId, grade]);

    // Split into mandatory and optional for frontend display
    const mandatory = result.rows.filter(f => f.is_mandatory);
    const optional  = result.rows.filter(f => !f.is_mandatory);

    const totalMandatory = mandatory.reduce(
      (sum, f) => sum + parseFloat(f.amount), 0
    );

    return respond(res, 200, true, `Fee structures for ${grade}`, {
      grade,
      academic_year_id: yearId,
      mandatory_fees: mandatory,
      optional_fees:  optional,
      total_mandatory_amount: totalMandatory,
      total_fees: result.rowCount,
    });

  } catch (err) {
    logger.error('[getFeesByGrade] Error:', err.message);
    return respond(res, 500, false, 'Failed to retrieve fees for grade');
  }
};


// ================================================================
// 3. GET /api/v1/fee-structures/:id
//    Single fee structure detail
// ================================================================

const getFeeStructureById = async (req, res) => {
  try {
    const { id }    = req.params;
    const schoolId = req.user.schoolId;

    const result = await query(`
      SELECT
        fs.*,
        ay.name AS academic_year_name,
        ay.year AS academic_year,
        -- How many invoice line items reference this fee
        (SELECT COUNT(*)
         FROM invoice_line_items ili
         JOIN invoices i ON i.id = ili.invoice_id
         WHERE ili.fee_structure_id = fs.id
           AND i.deleted_at IS NULL
        ) AS usage_count

      FROM fee_structures fs
      LEFT JOIN academic_years ay ON ay.id = fs.academic_year_id
      WHERE fs.id = $1
        AND fs.school_id  = $2
        AND fs.deleted_at IS NULL
    `, [id, schoolId]);

    if (!result.rows.length) {
      return respond(res, 404, false, 'Fee structure not found');
    }

    return respond(res, 200, true, 'Fee structure retrieved', {
      fee_structure: result.rows[0],
    });

  } catch (err) {
    logger.error('[getFeeStructureById] Error:', err.message);
    return respond(res, 500, false, 'Failed to retrieve fee structure');
  }
};


// ================================================================
// 4. POST /api/v1/fee-structures
//    Create a new fee structure item
//
//    Body: {
//      academic_year_id, name, grade_level, category,
//      amount, frequency, description?, is_mandatory?
//    }
// ================================================================

const createFeeStructure = async (req, res) => {
  if (!canWrite(req)) {
    return respond(res, 403, false, 'Only school admins can create fee structures');
  }

  const {
    academic_year_id,
    name,
    grade_level,      // null = applies to all grades
    category,
    amount,
    frequency,
    description,
    is_mandatory = true,
  } = req.body;

  const schoolId  = req.user.schoolId;
  const createdBy = req.user.id;

  // ── Validation ──────────────────────────────────────────────
  const errors = [];

  if (!academic_year_id)
    errors.push({ field: 'academic_year_id', message: 'Academic year is required' });

  if (!name || name.trim().length < 3)
    errors.push({ field: 'name', message: 'Name must be at least 3 characters' });

  if (!category || !VALID_CATEGORIES.includes(category))
    errors.push({ field: 'category', message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });

  if (!frequency || !VALID_FREQUENCIES.includes(frequency))
    errors.push({ field: 'frequency', message: `Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}` });

  if (grade_level && !VALID_GRADES.includes(grade_level))
    errors.push({ field: 'grade_level', message: `Invalid grade. Must be one of: ${VALID_GRADES.join(', ')}` });

  const amountNum = parseFloat(amount);
  if (!amount || isNaN(amountNum) || amountNum <= 0)
    errors.push({ field: 'amount', message: 'Amount must be a positive number' });

  if (amountNum > 1000000)
    errors.push({ field: 'amount', message: 'Amount cannot exceed KES 1,000,000' });

  if (errors.length > 0)
    return respond(res, 422, false, 'Validation failed', null, errors);

  try {
    // Verify academic year belongs to this school
    const yearCheck = await query(
      `SELECT id FROM academic_years
       WHERE id = $1 AND school_id = $2`,
      [academic_year_id, schoolId]
    );

    if (!yearCheck.rows.length) {
      return respond(res, 404, false, 'Academic year not found for this school');
    }

    // Check for duplicate (same name + grade + category + year)
    const duplicate = await query(`
      SELECT id FROM fee_structures
      WHERE school_id        = $1
        AND academic_year_id = $2
        AND name             = $3
        AND category         = $4
        AND deleted_at IS NULL
        AND (grade_level = $5 OR (grade_level IS NULL AND $5 IS NULL))
    `, [schoolId, academic_year_id, name.trim(), category, grade_level || null]);

    if (duplicate.rows.length > 0) {
      return respond(res, 409, false,
        `A "${category}" fee named "${name}" already exists for ${grade_level || 'all grades'} this year.`,
        null,
        [{ field: 'name', message: 'Duplicate fee structure for this grade and category' }]
      );
    }

    const result = await query(`
      INSERT INTO fee_structures
        (school_id, academic_year_id, name, grade_level, category,
         amount, frequency, description, is_mandatory, is_active,
         created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW(), NOW())
      RETURNING *
    `, [
      schoolId,
      academic_year_id,
      name.trim(),
      grade_level || null,
      category,
      amountNum,
      frequency,
      description?.trim() || null,
      is_mandatory,
      createdBy,
    ]);

    return respond(res, 201, true, 'Fee structure created successfully', {
      fee_structure: result.rows[0],
    });

  } catch (err) {
    logger.error('[createFeeStructure] Error:', err.message);

    if (err.code === '23505') {
      return respond(res, 409, false, 'A similar fee structure already exists');
    }
    if (err.code === '23503') {
      return respond(res, 404, false, 'Academic year not found');
    }

    return respond(res, 500, false, 'Failed to create fee structure');
  }
};


// ================================================================
// 5. PUT /api/v1/fee-structures/:id
//    Update a fee structure.
//
//    IMPORTANT: Cannot change amount if invoices have already been
//    generated using this fee structure (to preserve invoice integrity).
//    Admin must create a new fee structure instead.
// ================================================================

const updateFeeStructure = async (req, res) => {
  if (!canWrite(req)) {
    return respond(res, 403, false, 'Only school admins can update fee structures');
  }

  const { id }     = req.params;
  const schoolId  = req.user.schoolId;
  const updatedBy = req.user.id;

  const {
    name, grade_level, category,
    amount, frequency, description,
    is_mandatory, is_active,
  } = req.body;

  try {
    // Fetch existing
    const existing = await query(
      `SELECT * FROM fee_structures WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [id, schoolId]
    );

    if (!existing.rows.length) {
      return respond(res, 404, false, 'Fee structure not found');
    }

    const current = existing.rows[0];

    // If amount is changing, check whether invoices already use this fee
    if (amount && parseFloat(amount) !== parseFloat(current.amount)) {
      const invoiceUsage = await query(`
        SELECT COUNT(*) AS cnt
        FROM invoice_line_items ili
        JOIN invoices i ON i.id = ili.invoice_id
        WHERE ili.fee_structure_id = $1
          AND i.deleted_at IS NULL
          AND i.status NOT IN ('cancelled', 'waived')
      `, [id]);

      const usageCount = parseInt(invoiceUsage.rows[0].cnt);

      if (usageCount > 0) {
        return respond(res, 409, false,
          `Cannot change amount: this fee is already used in ${usageCount} active invoice(s). ` +
          `Create a new fee structure for the updated amount instead.`,
          null,
          [{
            field: 'amount',
            message: `${usageCount} invoice(s) already reference this fee structure`,
            usage_count: usageCount,
          }]
        );
      }
    }

    // Validate new values if provided
    const errors = [];
    if (category && !VALID_CATEGORIES.includes(category))
      errors.push({ field: 'category', message: `Invalid category` });
    if (frequency && !VALID_FREQUENCIES.includes(frequency))
      errors.push({ field: 'frequency', message: `Invalid frequency` });
    if (grade_level && !VALID_GRADES.includes(grade_level))
      errors.push({ field: 'grade_level', message: `Invalid grade level` });
    if (amount && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0))
      errors.push({ field: 'amount', message: 'Amount must be a positive number' });
    if (errors.length > 0)
      return respond(res, 422, false, 'Validation failed', null, errors);

    const result = await query(`
      UPDATE fee_structures SET
        name         = COALESCE($1,  name),
        grade_level  = COALESCE($2,  grade_level),
        category     = COALESCE($3,  category),
        amount       = COALESCE($4,  amount),
        frequency    = COALESCE($5,  frequency),
        description  = COALESCE($6,  description),
        is_mandatory = COALESCE($7,  is_mandatory),
        is_active    = COALESCE($8,  is_active),
        updated_at   = NOW(),
        updated_by   = $9
      WHERE id        = $10
        AND school_id = $11
        AND deleted_at IS NULL
      RETURNING *
    `, [
      name?.trim() || null,
      grade_level || null,
      category    || null,
      amount ? parseFloat(amount) : null,
      frequency   || null,
      description?.trim() || null,
      is_mandatory !== undefined ? is_mandatory : null,
      is_active   !== undefined ? is_active   : null,
      updatedBy,
      id,
      schoolId,
    ]);

    return respond(res, 200, true, 'Fee structure updated successfully', {
      fee_structure: result.rows[0],
    });

  } catch (err) {
    logger.error('[updateFeeStructure] Error:', err.message);
    return respond(res, 500, false, 'Failed to update fee structure');
  }
};


// ================================================================
// 6. DELETE /api/v1/fee-structures/:id
//    Soft delete — sets deleted_at.
//    Blocked if any active invoices reference this fee.
// ================================================================

const deleteFeeStructure = async (req, res) => {
  if (!canWrite(req)) {
    return respond(res, 403, false, 'Only school admins can delete fee structures');
  }

  const { id }    = req.params;
  const schoolId = req.user.schoolId;
  const deletedBy = req.user.id;

  try {
    const existing = await query(
      `SELECT * FROM fee_structures WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [id, schoolId]
    );

    if (!existing.rows.length) {
      return respond(res, 404, false, 'Fee structure not found');
    }

    // Block if active invoices use this fee
    const usageCheck = await query(`
      SELECT COUNT(*) AS cnt
      FROM invoice_line_items ili
      JOIN invoices i ON i.id = ili.invoice_id
      WHERE ili.fee_structure_id = $1
        AND i.deleted_at         IS NULL
        AND i.status NOT IN ('cancelled', 'waived')
    `, [id]);

    const usageCount = parseInt(usageCheck.rows[0].cnt);
    if (usageCount > 0) {
      return respond(res, 409, false,
        `Cannot delete: ${usageCount} active invoice(s) reference this fee structure. ` +
        `Deactivate it instead.`,
        null,
        [{ field: 'id', message: `In use by ${usageCount} invoice(s)`, usage_count: usageCount }]
      );
    }

    await query(
      `UPDATE fee_structures
       SET deleted_at = NOW(), deleted_by = $1, is_active = false
       WHERE id = $2 AND school_id = $3`,
      [deletedBy, id, schoolId]
    );

    return respond(res, 200, true, 'Fee structure deleted successfully');

  } catch (err) {
    logger.error('[deleteFeeStructure] Error:', err.message);
    return respond(res, 500, false, 'Failed to delete fee structure');
  }
};


// ================================================================
// 7. POST /api/v1/fee-structures/duplicate-from-year
//    Duplicate all fee structures from a previous academic year
//    into the current/target year. Saves manual re-entry.
//
//    Body: {
//      source_academic_year_id,   ← copy FROM this year
//      target_academic_year_id,   ← copy INTO this year
//      adjust_percentage?         ← optional: increase amounts by X%
//    }
// ================================================================

const duplicateFromYear = async (req, res) => {
  if (!canWrite(req)) {
    return respond(res, 403, false, 'Only school admins can duplicate fee structures');
  }

  const { source_academic_year_id, target_academic_year_id, adjust_percentage = 0 } = req.body;
  const schoolId  = req.user.schoolId;
  const createdBy = req.user.id;

  if (!source_academic_year_id || !target_academic_year_id) {
    return respond(res, 422, false,
      'source_academic_year_id and target_academic_year_id are required'
    );
  }

  if (source_academic_year_id === target_academic_year_id) {
    return respond(res, 400, false, 'Source and target academic years must be different');
  }

  const multiplier = 1 + (parseFloat(adjust_percentage) / 100);
  if (isNaN(multiplier) || multiplier <= 0) {
    return respond(res, 422, false, 'adjust_percentage must be a valid number');
  }

  try {
    // Verify both years belong to this school
    const yearsCheck = await query(`
      SELECT id FROM academic_years
      WHERE id IN ($1, $2) AND school_id = $3
    `, [source_academic_year_id, target_academic_year_id, schoolId]);

    if (yearsCheck.rowCount < 2) {
      return respond(res, 404, false, 'One or both academic years not found for this school');
    }

    // Fetch source fee structures
    const sourceFees = await query(`
      SELECT name, grade_level, category, amount, frequency, description, is_mandatory
      FROM fee_structures
      WHERE school_id        = $1
        AND academic_year_id = $2
        AND deleted_at IS NULL
    `, [schoolId, source_academic_year_id]);

    if (!sourceFees.rows.length) {
      return respond(res, 404, false,
        'No fee structures found in the source academic year to duplicate'
      );
    }

    const created = [];
    const skipped = [];

    for (const fee of sourceFees.rows) {
      // Skip if already exists in target year
      const exists = await query(`
        SELECT id FROM fee_structures
        WHERE school_id        = $1
          AND academic_year_id = $2
          AND name             = $3
          AND category         = $4
          AND deleted_at IS NULL
          AND (grade_level = $5 OR (grade_level IS NULL AND $5 IS NULL))
      `, [schoolId, target_academic_year_id, fee.name, fee.category, fee.grade_level]);

      if (exists.rows.length > 0) {
        skipped.push({ name: fee.name, reason: 'Already exists in target year' });
        continue;
      }

      const newAmount = Math.round(parseFloat(fee.amount) * multiplier * 100) / 100;

      const result = await query(`
        INSERT INTO fee_structures
          (school_id, academic_year_id, name, grade_level, category,
           amount, frequency, description, is_mandatory, is_active,
           created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW(), NOW())
        RETURNING id, name, grade_level, category, amount
      `, [
        schoolId,
        target_academic_year_id,
        fee.name,
        fee.grade_level,
        fee.category,
        newAmount,
        fee.frequency,
        fee.description,
        fee.is_mandatory,
        createdBy,
      ]);

      created.push(result.rows[0]);
    }

    return respond(res, 201, true,
      `Duplicated ${created.length} fee structure(s). ${skipped.length} skipped (already exist).`,
      {
        created,
        skipped,
        summary: {
          source_count:  sourceFees.rowCount,
          created_count: created.length,
          skipped_count: skipped.length,
          adjustment:    adjust_percentage ? `+${adjust_percentage}%` : 'No adjustment',
        },
      }
    );

  } catch (err) {
    logger.error('[duplicateFromYear] Error:', err.message);
    return respond(res, 500, false, 'Failed to duplicate fee structures');
  }
};


// ================================================================
// 8. GET /api/v1/fee-structures/summary
//    Returns a quick financial summary per grade for the
//    current year — used on the Finance dashboard.
// ================================================================

const getFeesSummary = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { academic_year_id } = req.query;

    let yearId = academic_year_id;
    if (!yearId) {
      const current = await query(
        `SELECT id FROM academic_years
         WHERE school_id = $1 AND is_current = true LIMIT 1`,
        [schoolId]
      );
      if (!current.rows.length) {
        return respond(res, 404, false, 'No current academic year set');
      }
      yearId = current.rows[0].id;
    }

    const result = await query(`
      SELECT
        COALESCE(grade_level, 'All Grades') AS grade_level,
        COUNT(*)                            AS fee_count,
        SUM(CASE WHEN is_mandatory THEN amount ELSE 0 END) AS mandatory_total,
        SUM(CASE WHEN NOT is_mandatory THEN amount ELSE 0 END) AS optional_total,
        SUM(amount)                         AS grand_total,
        COUNT(CASE WHEN is_mandatory THEN 1 END) AS mandatory_count,
        COUNT(CASE WHEN NOT is_mandatory THEN 1 END) AS optional_count
      FROM fee_structures
      WHERE school_id        = $1
        AND academic_year_id = $2
        AND is_active        = true
        AND deleted_at       IS NULL
      GROUP BY grade_level
      ORDER BY grade_level ASC
    `, [schoolId, yearId]);

    return respond(res, 200, true, 'Fee summary retrieved', {
      academic_year_id: yearId,
      summary_by_grade: result.rows,
      total_structures: result.rows.reduce((sum, r) => sum + parseInt(r.fee_count), 0),
    });

  } catch (err) {
    logger.error('[getFeesSummary] Error:', err.message);
    return respond(res, 500, false, 'Failed to get fee summary');
  }
};


module.exports = {
  getFeeStructures,
  getFeesByGrade,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  duplicateFromYear,
  getFeesSummary,
};
