/**
 * Performance Monitoring Routes — CBC Education System
 *
 * Provides endpoints to retrieve performance metrics and reports.
 * - GET /report    → Full human-readable report + structured summary
 * - GET /summary   → Lightweight JSON summary (for embedding in dashboards)
 *
 * Access: super_admin and school_admin in all environments.
 */

const express = require('express');
const router = express.Router();
const perf = require('../services/performanceMonitor');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/v1/performance/report
 * Returns a detailed login performance report.
 * Includes both the structured summary and a human-readable text report.
 */
router.get('/report', authenticate, authorize('super_admin', 'school_admin'), (req, res) => {
  try {
    const summary = perf.getSummary();
    const report = perf.generateReport();

    logger.info('Performance report requested by user:', req.user?.id);

    return res.json({
      success: true,
      data: {
        summary,
        report,
      },
    });
  } catch (error) {
    logger.error('Failed to generate performance report:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate performance report.',
    });
  }
});

/**
 * GET /api/v1/performance/summary
 * Returns a lightweight JSON summary of login performance metrics.
 * Suitable for embedding in admin dashboards or monitoring widgets.
 * Returns only the structured data (no human-readable text report).
 */
router.get('/summary', authenticate, authorize('super_admin', 'school_admin'), (req, res) => {
  try {
    const summary = perf.getSummary();

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Failed to generate performance summary:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate performance summary.',
    });
  }
});

module.exports = router;
