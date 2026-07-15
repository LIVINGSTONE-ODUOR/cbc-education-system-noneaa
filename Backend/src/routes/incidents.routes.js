const express = require('express');
const { authenticateOwner, auditLog, securityHeaders } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

router.use(securityHeaders);

const ALLOWED_STATUSES = ['open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'];

// GET /api/v1/incidents — full list for triage (includes reporter contact info,
// unlike the public status page which reads from the public_incident_reports
// view). Gated to website-owner accounts (see /owner/login): system status is
// a marketing-site/status-page concern, not a school-platform admin one, so
// this deliberately uses authenticateOwner rather than the school-platform
// authenticate + authorize('super_admin') pattern used elsewhere in this repo.
router.get('/', authenticateOwner, async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.status(500).json({ success: false, message: 'Database not configured' });
    }

    const result = await db.query(
      `SELECT id, reporter_name, reporter_email, incident_type, affected_service,
              severity, title, description, steps_to_reproduce, status,
              created_at, updated_at
       FROM incident_reports
       ORDER BY created_at DESC
       LIMIT 200`
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error listing incident reports:', error);
    return res.status(500).json({ success: false, message: 'Failed to load incident reports' });
  }
});

// PATCH /api/v1/incidents/:id/status — the only thing a triager actually
// does day-to-day: move a report through open → investigating → identified
// → monitoring → resolved (or closed, for duplicates/non-issues).
router.patch('/:id/status', authenticateOwner, auditLog('INCIDENT_STATUS_CHANGE'), async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.status(500).json({ success: false, message: 'Database not configured' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const result = await db.query(
      `UPDATE incident_reports SET status = $1 WHERE id = $2
       RETURNING id, title, status, updated_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Incident report not found' });
    }

    return res.json({ success: true, data: result.rows[0], message: 'Incident status updated' });
  } catch (error) {
    console.error('Error updating incident status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update incident status' });
  }
});

module.exports = router;
