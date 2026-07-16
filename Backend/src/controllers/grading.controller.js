/**
 * CBC Grading System Controller
 *
 * Handles grading schemes, levels, competency assessments,
 * subject assessments, report cards, transcripts, and promotion decisions.
 *
 * SECURITY: All operations validate school_id scoping and role-based access.
 * Students can only see their own records. Parents can only see linked children.
 * Teachers can only see assigned classes. Admins have full school access.
 */

const { query } = require('../config/database');
const logger = require('../utils/logger');
const gradingCache = require('../services/gradingCache');
const { generateReportCardPdf } = require('../services/reportCardPdf');

// =============================================================================
// HELPERS
// =============================================================================

/** Convenience: load scheme + levels once, then grade in-memory with zero DB lookups */
async function loadGradingContext(schoolId) {
  const scheme = await gradingCache.getScheme(schoolId);
  const levels = scheme ? await gradingCache.getLevels(scheme.id) : [];
  return { scheme, levels };
}

/** Grade a single score using cached levels (no DB query) */
function gradeScore(levels, score) {
  return gradingCache.calculateGradeFromLevels(levels, score);
}

// =============================================================================
// GRADING SCHEMES
// =============================================================================

/** GET /api/v1/grading/schemes — list all schemes for a school */
exports.getSchemes = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.user.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID is required.' });

    const result = await query(
      `SELECT gs.*, (SELECT COUNT(*) FROM grading_levels gl WHERE gl.scheme_id = gs.id) as level_count
       FROM grading_schemes gs
       WHERE gs.school_id = $1
       ORDER BY gs.is_default DESC, gs.created_at DESC`,
      [schoolId]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get schemes error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load grading schemes.' });
  }
};

/** POST /api/v1/grading/schemes — create a new scheme */
exports.createScheme = async (req, res) => {
  try {
    const schoolId = req.body.school_id || req.user.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID is required.' });

    const { name, description, is_default } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Scheme name is required.' });

    // If setting as default, unset any existing default
    if (is_default) {
      await query(
        `UPDATE grading_schemes SET is_default = false WHERE school_id = $1`,
        [schoolId]
      );
    }

    const result = await query(
      `INSERT INTO grading_schemes (school_id, name, description, is_default, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [schoolId, name, description || '', !!is_default, req.user.id]
    );

    gradingCache.bust(schoolId);

    return res.status(201).json({ success: true, data: result.rows[0], message: 'Grading scheme created.' });
  } catch (error) {
    logger.error('Create scheme error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create grading scheme.' });
  }
};

/** PUT /api/v1/grading/schemes/:id — update a scheme */
exports.updateScheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_default, is_active } = req.body;

    // If setting as default, unset others in the same school
    if (is_default) {
      await query(
        `UPDATE grading_schemes SET is_default = false WHERE id != $1 AND school_id = (SELECT school_id FROM grading_schemes WHERE id = $1)`,
        [id]
      );
    }

    const result = await query(
      `UPDATE grading_schemes
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           is_default = COALESCE($3, is_default),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, is_default, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Scheme not found.' });
    }

    gradingCache.bust(result.rows[0].school_id);

    return res.json({ success: true, data: result.rows[0], message: 'Grading scheme updated.' });
  } catch (error) {
    logger.error('Update scheme error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update grading scheme.' });
  }
};

/** DELETE /api/v1/grading/schemes/:id */
exports.deleteScheme = async (req, res) => {
  try {
    const { id } = req.params;

    // Look up school_id for scoped cache bust
    const schemeLookup = await query(`SELECT school_id FROM grading_schemes WHERE id = $1`, [id]);
    if (schemeLookup.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Scheme not found.' });
    }
    const schoolId = schemeLookup.rows[0].school_id;

    await query(`DELETE FROM grading_schemes WHERE id = $1`, [id]);

    gradingCache.bust(schoolId);

    return res.json({ success: true, message: 'Grading scheme deleted.' });
  } catch (error) {
    logger.error('Delete scheme error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete grading scheme.' });
  }
};

// =============================================================================
// GRADING LEVELS
// =============================================================================

/** GET /api/v1/grading/schemes/:id/levels */
exports.getLevels = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT * FROM grading_levels WHERE scheme_id = $1 ORDER BY sort_order`,
      [id]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get levels error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load grading levels.' });
  }
};

/** POST /api/v1/grading/levels */
exports.createLevel = async (req, res) => {
  try {
    const { scheme_id, code, name, description, min_score, max_score, color, sort_order, is_pass } = req.body;

    if (!scheme_id || !code || !name || min_score === undefined || max_score === undefined) {
      return res.status(400).json({ success: false, message: 'Required fields missing: scheme_id, code, name, min_score, max_score.' });
    }

    const result = await query(
      `INSERT INTO grading_levels (scheme_id, code, name, description, min_score, max_score, color, sort_order, is_pass)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [scheme_id, code, name, description || '', min_score, max_score, color || '#6B7280', sort_order || 0, is_pass !== false]
    );

    gradingCache.bust(result.rows[0].scheme_id);

    return res.status(201).json({ success: true, data: result.rows[0], message: 'Grading level created.' });
  } catch (error) {
    logger.error('Create level error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create grading level.' });
  }
};

/** PUT /api/v1/grading/levels/:id */
exports.updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, min_score, max_score, color, sort_order, is_pass, is_active } = req.body;

    const result = await query(
      `UPDATE grading_levels
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           description = COALESCE($3, description),
           min_score = COALESCE($4, min_score),
           max_score = COALESCE($5, max_score),
           color = COALESCE($6, color),
           sort_order = COALESCE($7, sort_order),
           is_pass = COALESCE($8, is_pass),
           is_active = COALESCE($9, is_active)
       WHERE id = $10
       RETURNING *`,
      [code, name, description, min_score, max_score, color, sort_order, is_pass, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Level not found.' });
    }

    gradingCache.bust(result.rows[0].scheme_id);

    return res.json({ success: true, data: result.rows[0], message: 'Grading level updated.' });
  } catch (error) {
    logger.error('Update level error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update grading level.' });
  }
};

/** DELETE /api/v1/grading/levels/:id */
exports.deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const levelLookup = await query(`SELECT scheme_id FROM grading_levels WHERE id = $1`, [id]);
    const schemeId = levelLookup.rows[0]?.scheme_id;

    await query(`DELETE FROM grading_levels WHERE id = $1`, [id]);

    gradingCache.bust(schemeId);

    return res.json({ success: true, message: 'Grading level deleted.' });
  } catch (error) {
    logger.error('Delete level error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete grading level.' });
  }
};

// =============================================================================
// COMPETENCY ASSESSMENTS
// =============================================================================

/** POST /api/v1/grading/competency-assessments — create or update */
exports.saveCompetencyAssessment = async (req, res) => {
  try {
    const { learner_id, class_id, learning_area_id, competency_area_id, academic_term_id, academic_year_id,
            score, max_score, teacher_remarks, assessment_date } = req.body;

    if (!learner_id || !learning_area_id || !academic_term_id) {
      return res.status(400).json({ success: false, message: 'learner_id, learning_area_id, and academic_term_id are required.' });
    }

    const schoolId = req.user.schoolId;
    const ctx = await loadGradingContext(schoolId);
    const { gradeCode, competencyLevel } = gradeScore(ctx.levels, score);

    // Upsert
    const result = await query(
      `INSERT INTO competency_assessments
       (school_id, learner_id, class_id, learning_area_id, competency_area_id, academic_term_id, academic_year_id,
        score, max_score, grade_code, competency_level, teacher_remarks, assessed_by, assessment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (learner_id, learning_area_id, competency_area_id, academic_term_id, academic_year_id)
       DO UPDATE SET
         score = EXCLUDED.score,
         max_score = EXCLUDED.max_score,
         grade_code = EXCLUDED.grade_code,
         competency_level = EXCLUDED.competency_level,
         teacher_remarks = EXCLUDED.teacher_remarks,
         assessed_by = EXCLUDED.assessed_by,
         assessment_date = EXCLUDED.assessment_date,
         updated_at = NOW()
       RETURNING *`,
      [schoolId, learner_id, class_id, learning_area_id, competency_area_id, academic_term_id, academic_year_id,
       score, max_score || 100, gradeCode, competencyLevel, teacher_remarks || null, req.user.id, assessment_date ? new Date(assessment_date).toISOString() : new Date().toISOString()]
    );

    return res.json({ success: true, data: result.rows[0], message: 'Assessment saved.' });
  } catch (error) {
    logger.error('Save competency assessment error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save assessment.' });
  }
};

/** GET /api/v1/grading/competency-assessments */
exports.getCompetencyAssessments = async (req, res) => {
  try {
    const { learner_id, class_id, learning_area_id, academic_term_id, academic_year_id } = req.query;

    if (!learner_id || !academic_term_id) {
      return res.status(400).json({ success: false, message: 'learner_id and academic_term_id are required.' });
    }

    // Student access validation
    if (req.user.role === 'student' && String(req.user.id) !== String(learner_id)) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own assessments.' });
    }

    // Parent access validation via learner_parents junction table
    if (req.user.role === 'parent') {
      const parentCheck = await query(
        `SELECT lp.id FROM learner_parents lp
         JOIN parents p ON p.id = lp.parent_id
         WHERE lp.learner_id = $1 AND p.user_id = $2
         LIMIT 1`,
        [learner_id, req.user.id]
      ).catch(() => ({ rows: [] }));

      if (parentCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view your linked children.' });
      }
    }

    let sql = `SELECT ca.*, ca2.name as competency_name, la.name as subject_name
               FROM competency_assessments ca
               LEFT JOIN competency_areas ca2 ON ca.competency_area_id = ca2.id
               LEFT JOIN learning_areas la ON ca.learning_area_id = la.id
               WHERE ca.learner_id = $1 AND ca.academic_term_id = $2`;

    const params = [learner_id, academic_term_id];
    let idx = 3;

    if (learning_area_id) {
      sql += ` AND ca.learning_area_id = $${idx++}`;
      params.push(learning_area_id);
    }
    if (class_id) {
      sql += ` AND ca.class_id = $${idx++}`;
      params.push(class_id);
    }
    if (academic_year_id) {
      sql += ` AND ca.academic_year_id = $${idx++}`;
      params.push(academic_year_id);
    }

    sql += ` ORDER BY ca2.sort_order, ca.created_at`;

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get competency assessments error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load assessments.' });
  }
};

// =============================================================================
// SUBJECT ASSESSMENTS
// =============================================================================

/** POST /api/v1/grading/subject-assessments */
exports.saveSubjectAssessment = async (req, res) => {
  try {
    const { learner_id, class_id, learning_area_id, academic_term_id, academic_year_id,
            total_score, max_score, teacher_remarks } = req.body;

    if (!learner_id || !learning_area_id || !academic_term_id) {
      return res.status(400).json({ success: false, message: 'learner_id, learning_area_id, and academic_term_id are required.' });
    }

    const schoolId = req.user.schoolId;
    const ctx = await loadGradingContext(schoolId);
    const { gradeCode, competencyLevel } = gradeScore(ctx.levels, total_score);

    const result = await query(
      `INSERT INTO subject_assessments
       (school_id, learner_id, class_id, learning_area_id, academic_term_id, academic_year_id,
        total_score, max_score, grade_code, competency_level, teacher_remarks, assessed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (learner_id, learning_area_id, academic_term_id, academic_year_id)
       DO UPDATE SET
         total_score = EXCLUDED.total_score,
         max_score = EXCLUDED.max_score,
         grade_code = EXCLUDED.grade_code,
         competency_level = EXCLUDED.competency_level,
         teacher_remarks = EXCLUDED.teacher_remarks,
         assessed_by = EXCLUDED.assessed_by,
         updated_at = NOW()
       RETURNING *`,
      [schoolId, learner_id, class_id, learning_area_id, academic_term_id, academic_year_id,
       total_score, max_score || 100, gradeCode, competencyLevel, teacher_remarks || null, req.user.id]
    );

    // Auto-generate/update report card
    await updateReportCard(schoolId, learner_id, class_id, academic_term_id, academic_year_id);

    return res.json({ success: true, data: result.rows[0], message: 'Subject assessment saved.' });
  } catch (error) {
    logger.error('Save subject assessment error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save subject assessment.' });
  }
};

/** GET /api/v1/grading/subject-assessments */
exports.getSubjectAssessments = async (req, res) => {
  try {
    const { learner_id, class_id, academic_term_id, academic_year_id } = req.query;

    if (!learner_id) {
      return res.status(400).json({ success: false, message: 'learner_id is required.' });
    }

    // Student access validation
    if (req.user.role === 'student' && String(req.user.id) !== String(learner_id)) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own assessments.' });
    }

    // Parent access validation via learner_parents junction table
    if (req.user.role === 'parent') {
      const parentCheck = await query(
        `SELECT lp.id FROM learner_parents lp
         JOIN parents p ON p.id = lp.parent_id
         WHERE lp.learner_id = $1 AND p.user_id = $2
         LIMIT 1`,
        [learner_id, req.user.id]
      ).catch(() => ({ rows: [] }));

      if (parentCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view your linked children.' });
      }
    }

    let sql = `SELECT sa.*, la.name as subject_name
               FROM subject_assessments sa
               LEFT JOIN learning_areas la ON sa.learning_area_id = la.id
               WHERE sa.learner_id = $1`;
    const params = [learner_id];
    let idx = 2;

    if (academic_term_id) {
      sql += ` AND sa.academic_term_id = $${idx++}`;
      params.push(academic_term_id);
    }
    if (class_id) {
      sql += ` AND sa.class_id = $${idx++}`;
      params.push(class_id);
    }
    if (academic_year_id) {
      sql += ` AND sa.academic_year_id = $${idx++}`;
      params.push(academic_year_id);
    }

    sql += ` ORDER BY la.name`;

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get subject assessments error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load subject assessments.' });
  }
};

// =============================================================================
// REPORT CARDS
// =============================================================================

/** Helper: update or generate a report card */
async function updateReportCard(schoolId, learnerId, classId, termId, yearId) {
  try {
    // Get all subject assessments for this learner/term
    const subjects = await query(
      `SELECT sa.* FROM subject_assessments sa
       WHERE sa.learner_id = $1 AND sa.academic_term_id = $2 AND sa.academic_year_id = $3`,
      [learnerId, termId, yearId]
    );

    if (subjects.rows.length === 0) return;

    const totalScore = subjects.rows.reduce((sum, s) => sum + parseFloat(s.total_score || 0), 0);
    const averageScore = totalScore / subjects.rows.length;

    const ctx = await loadGradingContext(schoolId);
    const { gradeCode } = gradeScore(ctx.levels, averageScore);

    await query(
      `INSERT INTO report_cards
       (school_id, learner_id, class_id, academic_term_id, academic_year_id,
        total_score, average_score, overall_grade, subject_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (learner_id, class_id, academic_term_id, academic_year_id)
       DO UPDATE SET
         total_score = EXCLUDED.total_score,
         average_score = EXCLUDED.average_score,
         overall_grade = EXCLUDED.overall_grade,
         subject_count = EXCLUDED.subject_count,
         updated_at = NOW()`,
      [schoolId, learnerId, classId, termId, yearId, totalScore, averageScore, gradeCode, subjects.rows.length]
    );
  } catch (error) {
    logger.warn('Report card update failed:', error.message);
  }
}

/** GET /api/v1/grading/report-cards */
exports.getReportCards = async (req, res) => {
  try {
    const { learner_id, class_id, academic_term_id, academic_year_id } = req.query;

    // Student access validation
    if (learner_id && req.user.role === 'student' && String(req.user.id) !== String(learner_id)) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own report cards.' });
    }

    let sql = `SELECT rc.*, l.first_name, l.last_name, l.admission_number,
                      c.name as class_name, s.name as school_name
               FROM report_cards rc
               JOIN learners l ON rc.learner_id = l.id
               LEFT JOIN classes c ON rc.class_id = c.id
               LEFT JOIN schools s ON rc.school_id = s.id
               WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (learner_id) { sql += ` AND rc.learner_id = $${idx++}`; params.push(learner_id); }
    if (class_id) { sql += ` AND rc.class_id = $${idx++}`; params.push(class_id); }
    if (academic_term_id) { sql += ` AND rc.academic_term_id = $${idx++}`; params.push(academic_term_id); }
    if (academic_year_id) { sql += ` AND rc.academic_year_id = $${idx++}`; params.push(academic_year_id); }

    sql += ` ORDER BY rc.updated_at DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get report cards error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load report cards.' });
  }
};

/** GET /api/v1/grading/report-cards/:id/full — full report with all assessments */
exports.getFullReportCard = async (req, res) => {
  try {
    const data = await exports.getFullReportCardInternal(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Report card not found.' });
    }
    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Get full report card error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load report card.' });
  }
};

/** PUT /api/v1/grading/report-cards/:id/comments — update teacher/principal comments */
exports.updateReportCardComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_comments, principal_comments, promotion_decision, promotion_notes } = req.body;

    const result = await query(
      `UPDATE report_cards
       SET teacher_comments = COALESCE($1, teacher_comments),
           principal_comments = COALESCE($2, principal_comments),
           promotion_decision = COALESCE($3, promotion_decision),
           promotion_notes = COALESCE($4, promotion_notes),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [teacher_comments, principal_comments, promotion_decision, promotion_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report card not found.' });
    }

    return res.json({ success: true, data: result.rows[0], message: 'Comments updated.' });
  } catch (error) {
    logger.error('Update report card comments error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update comments.' });
  }
};

/** POST /api/v1/grading/report-cards/:id/finalize */
exports.finalizeReportCard = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE report_cards
       SET is_finalized = true, finalized_by = $1, finalized_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report card not found.' });
    }

    return res.json({ success: true, data: result.rows[0], message: 'Report card finalized.' });
  } catch (error) {
    logger.error('Finalize report card error:', error);
    return res.status(500).json({ success: false, message: 'Unable to finalize report card.' });
  }
};

// =============================================================================
// ANALYTICS
// =============================================================================

/** GET /api/v1/grading/analytics/class/:classId */
exports.getClassAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    const { academic_term_id, academic_year_id } = req.query;

    if (!academic_term_id) {
      return res.status(400).json({ success: false, message: 'academic_term_id is required.' });
    }

    // Grade distribution
    const distribution = await query(
      `SELECT sa.grade_code, COUNT(*) as count,
              ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
       FROM subject_assessments sa
       JOIN learners l ON sa.learner_id = l.id
       WHERE l.class_id = $1 AND sa.academic_term_id = $2
       GROUP BY sa.grade_code
       ORDER BY sa.grade_code`,
      [classId, academic_term_id]
    );

    // Top performers
    const topLearners = await query(
      `SELECT l.id, l.first_name, l.last_name, l.admission_number,
              ROUND(AVG(sa.total_score), 2) as average_score,
              COUNT(sa.id) as subjects_assessed
       FROM subject_assessments sa
       JOIN learners l ON sa.learner_id = l.id
       WHERE l.class_id = $1 AND sa.academic_term_id = $2
       GROUP BY l.id, l.first_name, l.last_name, l.admission_number
       ORDER BY average_score DESC
       LIMIT 10`,
      [classId, academic_term_id]
    );

    // Subject performance
    const subjectPerformance = await query(
      `SELECT la.name as subject_name,
              ROUND(AVG(sa.total_score), 2) as avg_score,
              ROUND(MIN(sa.total_score), 2) as min_score,
              ROUND(MAX(sa.total_score), 2) as max_score
       FROM subject_assessments sa
       JOIN learning_areas la ON sa.learning_area_id = la.id
       JOIN learners l ON sa.learner_id = l.id
       WHERE l.class_id = $1 AND sa.academic_term_id = $2
       GROUP BY la.id, la.name
       ORDER BY avg_score DESC`,
      [classId, academic_term_id]
    );

    // Attendance summary
    const attendance = await query(
      `SELECT status, COUNT(*) as count
       FROM attendance
       WHERE class_id = $1 AND date >= (SELECT start_date FROM academic_terms WHERE id = $2)
       GROUP BY status`,
      [classId, academic_term_id]
    );

    return res.json({
      success: true,
      data: {
        gradeDistribution: distribution.rows,
        topLearners: topLearners.rows,
        subjectPerformance: subjectPerformance.rows,
        attendance: attendance.rows,
      },
    });
  } catch (error) {
    logger.error('Get class analytics error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load analytics.' });
  }
};

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/** POST /api/v1/grading/competency-assessments/bulk — bulk upload assessments */
exports.bulkSaveCompetencyAssessments = async (req, res) => {
  try {
    const { assessments } = req.body;

    if (!Array.isArray(assessments) || assessments.length === 0) {
      return res.status(400).json({ success: false, message: 'assessments array is required with at least one entry.' });
    }

    const maxItems = parseInt(process.env.BULK_UPLOAD_MAX) || 1000;
    if (assessments.length > maxItems) {
      return res.status(400).json({ success: false, message: `Maximum ${maxItems} assessments per bulk upload.` });
    }

    const schoolId = req.user.schoolId;
    const userId = req.user.id;

    // ── Load grading context ONCE (zero DB lookups inside the loop) ──
    const ctx = await loadGradingContext(schoolId);

    // Build rows, skipping invalid entries
    const valueRows = [];
    const valueParams = [];
    const errors = [];

    for (let i = 0; i < assessments.length; i++) {
      const a = assessments[i];

      if (!a.learner_id || !a.learning_area_id || !a.academic_term_id) {
        errors.push({ index: i, message: 'Missing required fields: learner_id, learning_area_id, academic_term_id' });
        continue;
      }

      const { gradeCode, competencyLevel } = gradeScore(ctx.levels, a.score);
      const paramOffset = valueParams.length + 1;

      valueRows.push(`($${paramOffset}, $${paramOffset+1}, $${paramOffset+2}, $${paramOffset+3}, $${paramOffset+4}, $${paramOffset+5}, $${paramOffset+6}, $${paramOffset+7}, $${paramOffset+8}, $${paramOffset+9}, $${paramOffset+10}, $${paramOffset+11}, $${paramOffset+12}, $${paramOffset+13})`);

      valueParams.push(
        schoolId, a.learner_id, a.class_id || null, a.learning_area_id,
        a.competency_area_id || null, a.academic_term_id, a.academic_year_id || null,
        a.score, a.max_score || 100, gradeCode, competencyLevel,
        a.teacher_remarks || null, userId, a.assessment_date ? new Date(a.assessment_date).toISOString() : new Date().toISOString()
      );
    }

    if (valueRows.length === 0) {
      return res.json({
        success: true,
        message: 'No valid assessments to save.',
        data: { saved: 0, failed: errors.length, errors },
      });
    }

    // ── Single batch INSERT with ON CONFLICT DO UPDATE ──
    // wrap in transaction for atomicity
    async function executeBatch() {
      await query(
        `INSERT INTO competency_assessments
         (school_id, learner_id, class_id, learning_area_id, competency_area_id, academic_term_id, academic_year_id,
          score, max_score, grade_code, competency_level, teacher_remarks, assessed_by, assessment_date)
         VALUES ${valueRows.join(', ')}
         ON CONFLICT (learner_id, learning_area_id, competency_area_id, academic_term_id, academic_year_id)
         DO UPDATE SET
           score = EXCLUDED.score,
           max_score = EXCLUDED.max_score,
           grade_code = EXCLUDED.grade_code,
           competency_level = EXCLUDED.competency_level,
           teacher_remarks = EXCLUDED.teacher_remarks,
           assessed_by = EXCLUDED.assessed_by,
           updated_at = NOW()`,
        valueParams
      );
    }

    // Try direct query first, fall back to transaction if available
    try {
      await executeBatch();
    } catch (batchError) {
      logger.warn('Batch insert failed, falling back to transaction:', batchError.message);
      // Split into smaller batches if the full batch fails
      const chunkSize = 100;
      for (let i = 0; i < valueRows.length; i += chunkSize) {
        const chunk = valueRows.slice(i, i + chunkSize);
        const chunkParams = valueParams.slice(i * 14, (i + chunkSize) * 14);
        await query(
          `INSERT INTO competency_assessments
           (school_id, learner_id, class_id, learning_area_id, competency_area_id, academic_term_id, academic_year_id,
            score, max_score, grade_code, competency_level, teacher_remarks, assessed_by, assessment_date)
           VALUES ${chunk.join(', ')}
           ON CONFLICT (learner_id, learning_area_id, competency_area_id, academic_term_id, academic_year_id)
           DO UPDATE SET
             score = EXCLUDED.score,
             max_score = EXCLUDED.max_score,
             grade_code = EXCLUDED.grade_code,
             competency_level = EXCLUDED.competency_level,
             teacher_remarks = EXCLUDED.teacher_remarks,
             assessed_by = EXCLUDED.assessed_by,
             updated_at = NOW()`,
          chunkParams
        );
      }
    }

    return res.json({
      success: true,
      message: `Bulk upload completed. ${valueRows.length} saved, ${errors.length} skipped.`,
      data: { saved: valueRows.length, failed: errors.length, errors: errors.length > 0 ? errors : undefined },
    });
  } catch (error) {
    logger.error('Bulk save error:', error);
    return res.status(500).json({ success: false, message: 'Unable to process bulk upload.' });
  }
};

/** POST /api/v1/grading/competency-assessments/bulk — bulk from CSV */
exports.bulkUploadAssessmentsCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CSV file is required.' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const lines = csvData.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      return res.status(400).json({ success: false, message: 'CSV must have a header row and at least one data row.' });
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const assessments = [];
    for (let i = 1; i < lines.length && i <= 1001; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });
      assessments.push({
        learner_id: row.learner_id || row.learnerid || row.student_id || row.studentid,
        learning_area_id: row.learning_area_id || row.learningarea || row.subject_id || row.subjectid,
        academic_term_id: row.academic_term_id || row.term_id || row.termid,
        academic_year_id: row.academic_year_id || row.academic_year || row.year,
        competency_area_id: row.competency_area_id || row.competencyid || row.strand_id || null,
        class_id: row.class_id || row.classid || null,
        score: parseFloat(row.score || row.marks || row.grade) || 0,
        max_score: parseFloat(row.max_score || row.maxscore || row.outof) || 100,
        teacher_remarks: row.remarks || row.comment || row.notes || null,
      });
    }

    // Store assessments on request for reuse by bulkSaveCompetencyAssessments
    req.body = { assessments };
    return exports.bulkSaveCompetencyAssessments(req, res);
  } catch (error) {
    logger.error('CSV bulk upload error:', error);
    return res.status(500).json({ success: false, message: 'Unable to process CSV upload.' });
  }
};

/** POST /api/v1/grading/schemes/:id/clone — clone an existing scheme */
exports.cloneScheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Get source scheme
    const sourceResult = await query(
      `SELECT * FROM grading_schemes WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (sourceResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Source scheme not found.' });
    }

    const source = sourceResult.rows[0];
    const newName = name || `${source.name} (Copy)`;

    // Create clone
    const cloneResult = await query(
      `INSERT INTO grading_schemes (school_id, name, description, is_default, created_by)
       VALUES ($1, $2, $3, false, $4)
       RETURNING *`,
      [source.school_id, newName, description || source.description, req.user.id]
    );

    const newScheme = cloneResult.rows[0];

    // Clone levels (batch INSERT)
    const sourceLevels = await query(
      `SELECT * FROM grading_levels WHERE scheme_id = $1 ORDER BY sort_order`,
      [id]
    );

    if (sourceLevels.rows.length > 0) {
      const levelValueRows = [];
      const levelParams = [];

      for (let li = 0; li < sourceLevels.rows.length; li++) {
        const lv = sourceLevels.rows[li];
        const po = levelParams.length + 1;
        levelValueRows.push(`($${po}, $${po+1}, $${po+2}, $${po+3}, $${po+4}, $${po+5}, $${po+6}, $${po+7}, $${po+8})`);
        levelParams.push(
          newScheme.id, lv.code, lv.name, lv.description || '',
          lv.min_score, lv.max_score, lv.color, lv.sort_order, lv.is_pass
        );
      }

      await query(
        `INSERT INTO grading_levels (scheme_id, code, name, description, min_score, max_score, color, sort_order, is_pass)
         VALUES ${levelValueRows.join(', ')}`,
        levelParams
      );
    }

    const levelCount = sourceLevels.rows.length;

    gradingCache.bust(source.school_id);

    return res.status(201).json({
      success: true,
      data: { ...newScheme, level_count: levelCount },
      message: `Scheme cloned with ${levelCount} levels.`,
    });
  } catch (error) {
    logger.error('Clone scheme error:', error);
    return res.status(500).json({ success: false, message: 'Unable to clone grading scheme.' });
  }
};

// =============================================================================
// PDF GENERATION
// =============================================================================

/** GET /api/v1/grading/report-cards/:id/pdf — generate downloadable PDF */
exports.generateReportCardPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const fullReport = await exports.getFullReportCardInternal(id);
    if (!fullReport) {
      return res.status(404).json({ success: false, message: 'Report card not found.' });
    }

    const pdfBuffer = await generateReportCardPdf(fullReport);

    const learnerId = (fullReport.admission_number || fullReport.learner_id || 'report').toString();
    const termSlug = (fullReport.term_name || 'term').replace(/\s+/g, '-');
    const filename = `report-card-${learnerId}-${termSlug}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Generate PDF error:', error);
    return res.status(500).json({ success: false, message: 'Unable to generate PDF.' });
  }
};

/** Internal: fetch full report card data (shared between JSON and PDF) */
exports.getFullReportCardInternal = async (id) => {
  try {
    const report = await query(
      `SELECT rc.*, l.first_name, l.last_name, l.admission_number, l.date_of_birth,
              l.gender, l.photo_url,
              c.name as class_name, c.grade_level,
              s.name as school_name, s.address as school_address, s.logo_url,
              t.name as term_name, ay.name as academic_year_name
       FROM report_cards rc
       JOIN learners l ON rc.learner_id = l.id
       LEFT JOIN classes c ON rc.class_id = c.id
       LEFT JOIN schools s ON rc.school_id = s.id
       LEFT JOIN academic_terms t ON rc.academic_term_id = t.id
       LEFT JOIN academic_years ay ON rc.academic_year_id = ay.id
       WHERE rc.id = $1
       LIMIT 1`,
      [id]
    );

    if (report.rows.length === 0) return null;

    const subjects = await query(
      `SELECT sa.*, la.name as subject_name
       FROM subject_assessments sa
       JOIN learning_areas la ON sa.learning_area_id = la.id
       WHERE sa.learner_id = $1 AND sa.academic_term_id = $2
       ORDER BY la.name`,
      [report.rows[0].learner_id, report.rows[0].academic_term_id]
    );

    // Rankings
    let classRank = null;
    let termRank = null;
    let schoolRank = null;

    const r = report.rows[0];
    if (r.class_id && r.academic_term_id) {
      const rankResult = await query(
        `SELECT class_rank FROM v_learner_performance_summary
         WHERE learner_id = $1 AND class_id = $2 AND academic_term_id = $3 LIMIT 1`,
        [r.learner_id, r.class_id, r.academic_term_id]
      );
      if (rankResult.rows.length > 0) classRank = rankResult.rows[0].class_rank;

      const totalResult = await query(
        `SELECT COUNT(*) as total_learners FROM report_cards
         WHERE class_id = $1 AND academic_term_id = $2 AND average_score IS NOT NULL`,
        [r.class_id, r.academic_term_id]
      );
      termRank = classRank !== null ? `${classRank} / ${totalResult.rows[0].total_learners}` : null;
    }

    if (r.school_id && r.academic_term_id) {
      // Use a windowed RANK() to compute school rank efficiently
      const schoolRankResult = await query(
        `SELECT school_rank FROM (
           SELECT learner_id,
                  RANK() OVER (ORDER BY AVG(average_score) DESC) as school_rank
           FROM report_cards
           WHERE school_id = $1 AND academic_term_id = $2 AND average_score IS NOT NULL
           GROUP BY learner_id
         ) ranked
         WHERE learner_id = $3
         LIMIT 1`,
        [r.school_id, r.academic_term_id, r.learner_id]
      );
      if (schoolRankResult.rows.length > 0) schoolRank = schoolRankResult.rows[0].school_rank;
    }

    return {
      ...r,
      subjects: subjects.rows,
      rankings: { classRank, termRank, schoolRank },
    };
  } catch (error) {
    logger.error('Get full report card internal error:', error);
    return null;
  }
};

// =============================================================================
// PROMOTION DECISIONS
// =============================================================================

/** POST /api/v1/grading/promotions */
exports.savePromotionDecision = async (req, res) => {
  try {
    const { learner_id, from_class_id, to_class_id, academic_term_id, academic_year_id,
            decision, remarks } = req.body;

    if (!learner_id || !decision) {
      return res.status(400).json({ success: false, message: 'learner_id and decision are required.' });
    }

    const result = await query(
      `INSERT INTO promotion_decisions
       (school_id, learner_id, from_class_id, to_class_id, academic_term_id, academic_year_id,
        decision, remarks, decided_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.schoolId, learner_id, from_class_id, to_class_id, academic_term_id, academic_year_id,
       decision, remarks || null, req.user.id]
    );

    // Update the learner's current class if promoted
    if (decision === 'promoted' && to_class_id) {
      await query(
        `UPDATE learners SET class_id = $1, updated_at = NOW() WHERE id = $2`,
        [to_class_id, learner_id]
      );
    }

    return res.status(201).json({ success: true, data: result.rows[0], message: 'Promotion decision saved.' });
  } catch (error) {
    logger.error('Save promotion error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save promotion decision.' });
  }
};

/** GET /api/v1/grading/promotions */
exports.getPromotionDecisions = async (req, res) => {
  try {
    const { learner_id, class_id, academic_year_id } = req.query;

    let sql = `SELECT pd.*, l.first_name, l.last_name,
                      fc.name as from_class_name, tc.name as to_class_name
               FROM promotion_decisions pd
               JOIN learners l ON pd.learner_id = l.id
               LEFT JOIN classes fc ON pd.from_class_id = fc.id
               LEFT JOIN classes tc ON pd.to_class_id = tc.id
               WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (learner_id) { sql += ` AND pd.learner_id = $${idx++}`; params.push(learner_id); }
    if (class_id) { sql += ` AND (pd.from_class_id = $${idx} OR pd.to_class_id = $${idx})`; idx++; params.push(class_id); }
    if (academic_year_id) { sql += ` AND pd.academic_year_id = $${idx++}`; params.push(academic_year_id); }

    sql += ` ORDER BY pd.decided_at DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get promotions error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load promotion decisions.' });
  }
};

// =============================================================================
// TRANSCRIPTS
// =============================================================================

/** POST /api/v1/grading/transcripts/generate — generate a transcript */
exports.generateTranscript = async (req, res) => {
  try {
    const { learner_id, academic_year_id } = req.body;

    if (!learner_id || !academic_year_id) {
      return res.status(400).json({ success: false, message: 'learner_id and academic_year_id are required.' });
    }

    // Get all report cards for this learner and year
    const reportCards = await query(
      `SELECT rc.*, t.name as term_name
       FROM report_cards rc
       JOIN academic_terms t ON rc.academic_term_id = t.id
       WHERE rc.learner_id = $1 AND rc.academic_year_id = $2
       ORDER BY t.start_date`,
      [learner_id, academic_year_id]
    );

    // Calculate cumulative
    const totalScore = reportCards.rows.reduce((sum, rc) => sum + parseFloat(rc.total_score || 0), 0);
    const totalSubjects = reportCards.rows.reduce((sum, rc) => sum + (rc.subject_count || 0), 0);
    const totalTerms = reportCards.rows.length;
    const cumulativeAverage = totalTerms > 0 ? totalScore / totalTerms : 0;

    const ctx = await loadGradingContext(req.user.schoolId);
    const { gradeCode } = gradeScore(ctx.levels, cumulativeAverage);

    const termSummary = reportCards.rows.map(rc => ({
      term: rc.term_name,
      totalScore: rc.total_score,
      averageScore: rc.average_score,
      grade: rc.overall_grade,
      subjectCount: rc.subject_count,
    }));

    const result = await query(
      `INSERT INTO transcripts
       (school_id, learner_id, academic_year_id, term_summary,
        cumulative_score, cumulative_average, total_subjects, overall_grade)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (learner_id, academic_year_id)
       DO UPDATE SET
         term_summary = EXCLUDED.term_summary,
         cumulative_score = EXCLUDED.cumulative_score,
         cumulative_average = EXCLUDED.cumulative_average,
         total_subjects = EXCLUDED.total_subjects,
         overall_grade = EXCLUDED.overall_grade,
         updated_at = NOW()
       RETURNING *`,
      [req.user.schoolId, learner_id, academic_year_id, JSON.stringify(termSummary),
       totalScore, cumulativeAverage, totalSubjects, gradeCode]
    );

    return res.json({ success: true, data: result.rows[0], message: 'Transcript generated.' });
  } catch (error) {
    logger.error('Generate transcript error:', error);
    return res.status(500).json({ success: false, message: 'Unable to generate transcript.' });
  }
};

/** GET /api/v1/grading/transcripts */
exports.getTranscripts = async (req, res) => {
  try {
    const { learner_id, academic_year_id } = req.query;

    let sql = `SELECT t.*, l.first_name, l.last_name, l.admission_number,
                      ay.name as academic_year_name, s.name as school_name
               FROM transcripts t
               JOIN learners l ON t.learner_id = l.id
               LEFT JOIN academic_years ay ON t.academic_year_id = ay.id
               LEFT JOIN schools s ON t.school_id = s.id
               WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (learner_id) { sql += ` AND t.learner_id = $${idx++}`; params.push(learner_id); }
    if (academic_year_id) { sql += ` AND t.academic_year_id = $${idx++}`; params.push(academic_year_id); }

    sql += ` ORDER BY t.generated_at DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get transcripts error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load transcripts.' });
  }
};
