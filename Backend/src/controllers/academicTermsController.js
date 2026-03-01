const { query, pool } = require('../config/database');

// Table name - using academic_years as this is what exists in the database
const TABLE_NAME = 'academic_years';

// ─── GET ALL TERMS (for a school) ────────────────────────────────────────────
const getTerms = async (req, res) => {
  try {
    const { school_id } = req.params;
    const { year, is_current, is_active } = req.query;

    // School admins can only view their own school's terms
    if (req.user.role === 'school_admin' && req.user.schoolId) {
      if (school_id !== req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view terms for your own school'
        });
      }
    }

    let queryText = `
      SELECT 
        id, school_id, name, year,
        start_date, end_date,
        is_current, is_active,
        created_at, created_by,
        updated_at, updated_by
      FROM ${TABLE_NAME}
      WHERE school_id = $1
    `;
    const params = [school_id];
    let idx = 2;

    if (year) {
      queryText += ` AND year = $${idx++}`;
      params.push(parseInt(year));
    }
    if (is_current !== undefined) {
      queryText += ` AND is_current = $${idx++}`;
      params.push(is_current === 'true');
    }
    if (is_active !== undefined) {
      queryText += ` AND is_active = $${idx++}`;
      params.push(is_active === 'true');
    }

    queryText += ` ORDER BY year DESC, start_date ASC`;

    const result = await query(queryText, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('getTerms error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET SINGLE TERM ─────────────────────────────────────────────────────────
const getTermById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Academic term not found' });
    }

    const term = result.rows[0];

    // School admins can only view their own school's terms
    if (req.user.role === 'school_admin' && req.user.schoolId) {
      if (term.school_id !== req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view terms for your own school'
        });
      }
    }

    return res.status(200).json({ success: true, data: term });
  } catch (error) {
    console.error('getTermById error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET CURRENT TERM (for a school) ─────────────────────────────────────────
const getCurrentTerm = async (req, res) => {
  try {
    const { school_id } = req.params;

    // School admins can only view their own school's current term
    if (req.user.role === 'school_admin' && req.user.schoolId) {
      if (school_id !== req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view terms for your own school'
        });
      }
    }

    const result = await query(
      `SELECT * FROM ${TABLE_NAME}
       WHERE school_id = $1 AND is_current = true AND is_active = true
       LIMIT 1`,
      [school_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'No active current term found' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getCurrentTerm error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── CREATE TERM ──────────────────────────────────────────────────────────────
const createTerm = async (req, res) => {
  const client = await pool.connect();
  try {
    const { school_id, name, year, start_date, end_date, is_current = false, is_active = true } = req.body;
    const created_by = req.user?.id;

    // Validate required fields
    if (!school_id || !name || !year || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'school_id, name, year, start_date, and end_date are required',
      });
    }

    // School admins can only create terms for their own school
    if (req.user.role === 'school_admin' && req.user.schoolId) {
      if (school_id !== req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create terms for your own school'
        });
      }
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ success: false, message: 'start_date must be before end_date' });
    }

    await client.query('BEGIN');

    // If setting as current, unset any existing current term for this school
    if (is_current) {
      await client.query(
        `UPDATE ${TABLE_NAME} SET is_current = false WHERE school_id = $1`,
        [school_id]
      );
    }

    const result = await client.query(
      `INSERT INTO ${TABLE_NAME}
         (school_id, name, year, start_date, end_date, is_current, is_active, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [school_id, name, year, start_date, end_date, is_current, is_active, created_by]
    );

    await client.query('COMMIT');

    return res.status(201).json({ success: true, message: 'Academic term created', data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('createTerm error:', error);
    
    // Handle duplicate key error
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: 'A term with this name already exists for this school year',
        error: error.message 
      });
    }
    
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

// ─── UPDATE TERM ──────────────────────────────────────────────────────────────
const updateTerm = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, year, start_date, end_date, is_current, is_active } = req.body;
    const updated_by = req.user?.id;

    // Check exists
    const existing = await client.query(`SELECT * FROM ${TABLE_NAME} WHERE id = $1`, [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Academic term not found' });
    }

    const currentTerm = existing.rows[0];

    // School admins can only update their own school's terms
    if (req.user.role === 'school_admin' && req.user.schoolId) {
      if (currentTerm.school_id !== req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update terms for your own school'
        });
      }
    }

    const newStartDate = start_date || currentTerm.start_date;
    const newEndDate   = end_date   || currentTerm.end_date;
    if (new Date(newStartDate) >= new Date(newEndDate)) {
      return res.status(400).json({ success: false, message: 'start_date must be before end_date' });
    }

    await client.query('BEGIN');

    // If promoting to current, demote others for this school
    if (is_current === true) {
      await client.query(
        `UPDATE ${TABLE_NAME} SET is_current = false
         WHERE school_id = $1 AND id != $2`,
        [currentTerm.school_id, id]
      );
    }

    const result = await client.query(
      `UPDATE ${TABLE_NAME} SET
        name       = COALESCE($1, name),
        year       = COALESCE($2, year),
        start_date = COALESCE($3, start_date),
        end_date   = COALESCE($4, end_date),
        is_current = COALESCE($5, is_current),
        is_active  = COALESCE($6, is_active),
        updated_at = NOW(),
        updated_by = $7
       WHERE id = $8
       RETURNING *`,
      [name, year, start_date, end_date, is_current, is_active, updated_by, id]
    );

    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Academic term updated', data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('updateTerm error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

// ─── SET CURRENT TERM ─────────────────────────────────────────────────────────
const setCurrentTerm = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const updated_by = req.user?.id;

    const existing = await client.query(`SELECT * FROM ${TABLE_NAME} WHERE id = $1`, [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Academic term not found' });
    }

    const { school_id } = existing.rows[0];

    // School admins can only set current for their own school's terms
    if (req.user.role === 'school_admin' && req.user.schoolId) {
      if (school_id !== req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'You can only set current term for your own school'
        });
      }
    }

    await client.query('BEGIN');

    // Unset all current terms for this school
    await client.query(
      `UPDATE ${TABLE_NAME} SET is_current = false WHERE school_id = $1`,
      [school_id]
    );

    // Set this one as current
    const result = await client.query(
      `UPDATE ${TABLE_NAME} SET is_current = true, updated_at = NOW(), updated_by = $1
       WHERE id = $2 RETURNING *`,
      [updated_by, id]
    );

    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Term set as current', data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('setCurrentTerm error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

// ─── TOGGLE ACTIVE STATUS ─────────────────────────────────────────────────────
const toggleTermStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updated_by = req.user?.id;

    const existing = await query(`SELECT * FROM ${TABLE_NAME} WHERE id = $1`, [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Academic term not found' });
    }

    const term = existing.rows[0];

    // School admins can only toggle status for their own school's terms
    if (req.user.role === 'school_admin' && req.user.schoolId) {
      if (term.school_id !== req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'You can only toggle status for terms in your own school'
        });
      }
    }

    const result = await query(
      `UPDATE ${TABLE_NAME}
       SET is_active = NOT is_active, updated_at = NOW(), updated_by = $1
       WHERE id = $2 RETURNING *`,
      [updated_by, id]
    );

    return res.status(200).json({
      success: true,
      message: `Term ${result.rows[0].is_active ? 'activated' : 'deactivated'}`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('toggleTermStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── DELETE TERM ──────────────────────────────────────────────────────────────
const deleteTerm = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query(`SELECT * FROM ${TABLE_NAME} WHERE id = $1`, [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Academic term not found' });
    }

    const term = existing.rows[0];

    // School admins can only delete their own school's terms
    if (req.user.role === 'school_admin' && req.user.schoolId) {
      if (term.school_id !== req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete terms for your own school'
        });
      }
    }

    if (term.is_current) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the current active term. Set another term as current first.',
      });
    }

    await query(`DELETE FROM ${TABLE_NAME} WHERE id = $1`, [id]);

    return res.status(200).json({ success: true, message: 'Academic term deleted' });
  } catch (error) {
    console.error('deleteTerm error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTerms,
  getTermById,
  getCurrentTerm,
  createTerm,
  updateTerm,
  setCurrentTerm,
  toggleTermStatus,
  deleteTerm,
};
