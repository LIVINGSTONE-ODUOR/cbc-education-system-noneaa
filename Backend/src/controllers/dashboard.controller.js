/**
 * Dashboard Controller — CBC Education System
 *
 * Provides API endpoints for the school admin dashboard:
 * - School statistics (learners, teachers, classes, performance)
 * - Recent activities feed
 * - Dashboard widget configuration
 * - Learner performance summary
 */

const { query } = require('../config/database');
const logger = require('../utils/logger');

// =============================================================================
// SCHOOL STATISTICS
// =============================================================================

/**
 * Compute fresh stats for a school and upsert them into school_stats.
 * Shared by getSchoolStats (self-healing fallback) and refreshSchoolStats
 * (explicit refresh) so the two can't drift out of sync.
 */
async function computeAndCacheSchoolStats(schoolId) {
  const [learnerStats, teacherStats, classStats, performanceStats, attendanceStats, activeTerm] =
    await Promise.all([
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM learners WHERE school_id = $1`, [schoolId]),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM teachers WHERE school_id = $1`, [schoolId]),
      query(`SELECT COUNT(*) as total FROM classes WHERE school_id = $1`, [schoolId]),
      query(`SELECT COALESCE(AVG(average_score), 0) as avg_score, COUNT(*) as graded FROM report_cards WHERE school_id = $1 AND is_finalized = true`, [schoolId]),
      query(`SELECT COALESCE(AVG(CASE WHEN status = 'present' THEN 100.0 ELSE 0 END), 0) as rate FROM attendance_records WHERE school_id = $1`, [schoolId]),
      query(`SELECT id, name FROM academic_terms WHERE NOW() BETWEEN start_date AND end_date LIMIT 1`, []),
    ]);

  const termId = activeTerm.rows[0]?.id || null;

  const computed = {
    school_id: schoolId,
    total_learners: parseInt(learnerStats.rows[0]?.total || 0),
    active_learners: parseInt(learnerStats.rows[0]?.active || 0),
    total_teachers: parseInt(teacherStats.rows[0]?.total || 0),
    active_teachers: parseInt(teacherStats.rows[0]?.active || 0),
    total_classes: parseInt(classStats.rows[0]?.total || 0),
    average_score: parseFloat(performanceStats.rows[0]?.avg_score || 0),
    attendance_rate: parseFloat(attendanceStats.rows[0]?.rate || 0),
    active_term_name: activeTerm.rows[0]?.name || null,
  };

  // Upsert into school_stats so the cached view is accurate next time.
  await query(
    `INSERT INTO school_stats
     (school_id, total_learners, active_learners, total_teachers, active_teachers,
      total_classes, average_score, attendance_rate, active_term_id, calculated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     ON CONFLICT (school_id)
     DO UPDATE SET
       total_learners = EXCLUDED.total_learners,
       active_learners = EXCLUDED.active_learners,
       total_teachers = EXCLUDED.total_teachers,
       active_teachers = EXCLUDED.active_teachers,
       total_classes = EXCLUDED.total_classes,
       average_score = EXCLUDED.average_score,
       attendance_rate = EXCLUDED.attendance_rate,
       active_term_id = EXCLUDED.active_term_id,
       calculated_at = NOW(),
       updated_at = NOW()`,
    [
      schoolId,
      computed.total_learners,
      computed.active_learners,
      computed.total_teachers,
      computed.active_teachers,
      computed.total_classes,
      computed.average_score,
      computed.attendance_rate,
      termId,
    ]
  );

  return computed;
}

/** GET /api/v1/dashboard/stats — get school dashboard summary statistics */
exports.getSchoolStats = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.user.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID is required.' });

    // Try the cached view first — but only trust it if school_stats has
    // actually been populated at least once (stats_updated_at set). The
    // view's columns are all COALESCE(..., 0), so an unpopulated cache and
    // a genuinely empty school were previously indistinguishable: new
    // schools with real learners/teachers/classes would see permanent
    // zeros on the dashboard until someone happened to call
    // POST /stats/refresh, which nothing does automatically.
    const viewResult = await query(
      `SELECT * FROM v_school_dashboard_summary WHERE school_id = $1 LIMIT 1`,
      [schoolId]
    );

    if (viewResult.rows.length > 0 && viewResult.rows[0].stats_updated_at) {
      return res.json({ success: true, data: viewResult.rows[0] });
    }

    // Cache was never populated for this school — compute fresh stats now
    // and cache them (self-healing), so this only happens once per school.
    const computed = await computeAndCacheSchoolStats(schoolId);
    return res.json({ success: true, data: computed });
  } catch (error) {
    logger.error('Get school stats error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load school statistics.' });
  }
};

/** GET /api/v1/dashboard/stats/refresh — force refresh school stats */
exports.refreshSchoolStats = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.user.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID is required.' });

    await computeAndCacheSchoolStats(schoolId);

    return res.json({ success: true, message: 'School statistics refreshed.' });
  } catch (error) {
    logger.error('Refresh school stats error:', error);
    return res.status(500).json({ success: false, message: 'Unable to refresh school statistics.' });
  }
};

// =============================================================================
// SCHOOL ACTIVITIES
// =============================================================================

/** GET /api/v1/dashboard/activities — get recent school activities */
exports.getSchoolActivities = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.user.schoolId;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID is required.' });

    const result = await query(
      `SELECT sa.*, u.first_name, u.last_name
       FROM school_activities sa
       LEFT JOIN users u ON sa.user_id = u.id
       WHERE sa.school_id = $1
       ORDER BY sa.created_at DESC
       LIMIT $2`,
      [schoolId, limit]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get activities error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load activities.' });
  }
};

/** POST /api/v1/dashboard/activities — create a new activity entry */
exports.createSchoolActivity = async (req, res) => {
  try {
    const schoolId = req.body.school_id || req.user.schoolId;
    const { activity_type, description, metadata } = req.body;

    if (!schoolId || !activity_type || !description) {
      return res.status(400).json({ success: false, message: 'school_id, activity_type, and description are required.' });
    }

    const result = await query(
      `INSERT INTO school_activities (school_id, user_id, activity_type, description, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [schoolId, req.user.id, activity_type, description, metadata ? JSON.stringify(metadata) : '{}']
    );

    return res.status(201).json({ success: true, data: result.rows[0], message: 'Activity recorded.' });
  } catch (error) {
    logger.error('Create activity error:', error);
    return res.status(500).json({ success: false, message: 'Unable to record activity.' });
  }
};

// =============================================================================
// DASHBOARD WIDGETS
// =============================================================================

/** GET /api/v1/dashboard/widgets — get user's dashboard widget configuration */
exports.getDashboardWidgets = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM dashboard_widgets
       WHERE user_id = $1
       ORDER BY position`,
      [req.user.id]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get widgets error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load widgets.' });
  }
};

/** PUT /api/v1/dashboard/widgets — save/update widget configuration */
exports.saveDashboardWidget = async (req, res) => {
  try {
    const { widget_key, title, widget_type, position, config, is_visible } = req.body;

    if (!widget_key) {
      return res.status(400).json({ success: false, message: 'widget_key is required.' });
    }

    const result = await query(
      `INSERT INTO dashboard_widgets (user_id, widget_key, title, widget_type, position, config, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, widget_key)
       DO UPDATE SET
         title = COALESCE($3, dashboard_widgets.title),
         widget_type = COALESCE($4, dashboard_widgets.widget_type),
         position = COALESCE($5, dashboard_widgets.position),
         config = COALESCE($6, dashboard_widgets.config),
         is_visible = COALESCE($7, dashboard_widgets.is_visible),
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, widget_key, title || null, widget_type || 'card', position ?? 0, config ? JSON.stringify(config) : '{}', is_visible !== false]
    );

    return res.json({ success: true, data: result.rows[0], message: 'Widget saved.' });
  } catch (error) {
    logger.error('Save widget error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save widget.' });
  }
};

/** DELETE /api/v1/dashboard/widgets/:widgetKey — remove a widget */
exports.deleteDashboardWidget = async (req, res) => {
  try {
    const { widgetKey } = req.params;
    await query(
      `DELETE FROM dashboard_widgets WHERE user_id = $1 AND widget_key = $2`,
      [req.user.id, widgetKey]
    );
    return res.json({ success: true, message: 'Widget removed.' });
  } catch (error) {
    logger.error('Delete widget error:', error);
    return res.status(500).json({ success: false, message: 'Unable to remove widget.' });
  }
};

// =============================================================================
// LEARNER PERFORMANCE SUMMARY
// =============================================================================

/** GET /api/v1/dashboard/learner-performance — top/bottom performers */
exports.getLearnerPerformance = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.user.schoolId;
    const classId = req.query.class_id;
    const academicTermId = req.query.academic_term_id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const sort = req.query.sort || 'top'; // 'top' or 'bottom'

    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID is required.' });

    let sql = `
      SELECT lps.*
      FROM v_learner_performance_summary lps
      JOIN learners l ON lps.learner_id = l.id
      JOIN classes c ON lps.class_id = c.id
      WHERE c.school_id = $1`;

    const params = [schoolId];
    let idx = 2;

    if (classId) {
      sql += ` AND lps.class_id = $${idx++}`;
      params.push(classId);
    }
    if (academicTermId) {
      sql += ` AND lps.academic_term_id = $${idx++}`;
      params.push(academicTermId);
    }

    sql += ` ORDER BY lps.average_score ${sort === 'bottom' ? 'ASC' : 'DESC'} NULLS LAST
             LIMIT $${idx}`;
    params.push(limit);

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get learner performance error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load learner performance.' });
  }
};

// =============================================================================
// DASHBOARD PERFORMANCE COMPUTATION
// =============================================================================

/** Internal helper: compute grade distribution for a school/class */
async function computeGradeDistribution(schoolId, classId, academicTermId) {
  const params = [academicTermId];
  let idx = 2;
  let whereClause = 'WHERE sa.academic_term_id = $1';

  if (classId) {
    whereClause += ` AND sa.class_id = $${idx++}`;
    params.push(classId);
  } else {
    whereClause += ` AND l.school_id = $${idx++}`;
    params.push(schoolId);
  }

  const result = await query(
    `SELECT sa.grade_code, COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
     FROM subject_assessments sa
     JOIN learners l ON sa.learner_id = l.id
     ${whereClause}
     GROUP BY sa.grade_code
     ORDER BY sa.grade_code`,
    params
  );

  return result.rows;
}

/** GET /api/v1/dashboard/analytics/grade-distribution */
exports.getGradeDistribution = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.user.schoolId;
    const classId = req.query.class_id;
    let academicTermId = req.query.academic_term_id;

    if (!academicTermId) {
      // Default to the currently active term instead of requiring the
      // caller to know it — the dashboard's chart card never passes this,
      // so this endpoint previously 400'd on every dashboard load and the
      // pie chart silently showed "no data" (frontend catches the error
      // and falls back to an empty array).
      const activeTerm = await query(
        `SELECT id FROM academic_terms WHERE NOW() BETWEEN start_date AND end_date LIMIT 1`,
        []
      );
      academicTermId = activeTerm.rows[0]?.id || null;
    }

    if (!academicTermId) {
      // Still nothing — no active term configured for this school at all.
      return res.json({ success: true, data: [] });
    }

    const distribution = await computeGradeDistribution(schoolId, classId, academicTermId);
    return res.json({ success: true, data: distribution });
  } catch (error) {
    logger.error('Get grade distribution error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load grade distribution.' });
  }
};

// =============================================================================
// CLASS PERFORMANCE COMPARISON
// =============================================================================

/** GET /api/v1/dashboard/analytics/class-performance — avg score per class */
exports.getClassPerformance = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.user.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID is required.' });

    let academicTermId = req.query.academic_term_id;
    if (!academicTermId) {
      const activeTerm = await query(
        `SELECT id FROM academic_terms WHERE NOW() BETWEEN start_date AND end_date LIMIT 1`,
        []
      );
      academicTermId = activeTerm.rows[0]?.id || null;
    }

    const params = [schoolId];
    let termFilter = '';
    if (academicTermId) {
      params.push(academicTermId);
      termFilter = ` AND rc.academic_term_id = $${params.length}`;
    }

    const result = await query(
      `SELECT
         c.id AS class_id,
         c.grade_level,
         c.stream_name,
         c.grade_level || COALESCE(' — ' || c.stream_name, '') AS class_name,
         COALESCE(AVG(rc.average_score), 0) AS average_score,
         COUNT(DISTINCT rc.learner_id) AS learner_count
       FROM classes c
       LEFT JOIN report_cards rc
         ON rc.class_id = c.id AND rc.is_finalized = true${termFilter}
       WHERE c.school_id = $1
       GROUP BY c.id, c.grade_level, c.stream_name
       ORDER BY c.grade_level, c.stream_name`,
      params
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get class performance error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load class performance.' });
  }
};

// =============================================================================
// ATTENDANCE TREND
// =============================================================================

/** GET /api/v1/dashboard/analytics/attendance-trend — daily attendance rate over time */
exports.getAttendanceTrend = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.user.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID is required.' });

    const days = Math.min(parseInt(req.query.days) || 14, 90);

    const result = await query(
      `SELECT
         attendance_date,
         COUNT(*) FILTER (WHERE status = 'present') AS present_count,
         COUNT(*) FILTER (WHERE status = 'absent') AS absent_count,
         COUNT(*) FILTER (WHERE status = 'late') AS late_count,
         COUNT(*) AS total_count,
         ROUND(
           COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 1
         ) AS attendance_rate
       FROM attendance_records
       WHERE school_id = $1
         AND attendance_date >= (CURRENT_DATE - $2::int)
       GROUP BY attendance_date
       ORDER BY attendance_date`,
      [schoolId, days]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get attendance trend error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load attendance trend.' });
  }
};

// =============================================================================
// ENROLLMENT BY GRADE
// =============================================================================

/** GET /api/v1/dashboard/analytics/enrollment-by-grade — learner count per grade level */
exports.getEnrollmentByGrade = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.user.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID is required.' });

    const result = await query(
      `SELECT
         c.grade_level,
         COUNT(DISTINCT le.learner_id) AS students
       FROM learner_enrollments le
       JOIN classes c ON le.class_id = c.id
       WHERE le.school_id = $1 AND le.status = 'enrolled'
       GROUP BY c.grade_level
       ORDER BY c.grade_level`,
      [schoolId]
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get enrollment by grade error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load enrollment by grade.' });
  }
};

// NOTE: All functions are already exported individually via exports.* above.
// The previous module.exports = { getSchoolStats, ... } block at the bottom
// caused EVERY dashboard endpoint to return 404 because the shorthand
// property names looked for local variables named getSchoolStats etc.,
// which never existed — the functions were attached to exports.*.
// The shorthand resolved every handler to undefined, Express silently
// skipped the routes, and they fell through to the 404 handler.
// This line is intentionally empty — remove the old block.
