/**
 * Performance Monitor — CBC Education System
 *
 * Tracks timing metrics for critical operations (login, DB queries, etc.)
 * and logs them for analysis. In production, only warnings/errors are logged.
 * In development, full timing details are available.
 *
 * ALERTING: When the rolling average login time exceeds the 3-second
 * threshold, a warning is emitted. A 5-minute cooldown prevents log spam.
 */

const logger = require('../utils/logger');

const isProduction = (process.env.NODE_ENV || 'development').toLowerCase() === 'production';

// In-memory metrics store (reset on restart — use a real monitoring tool for persistence)
const metrics = {
  loginTimings: [],
  queryTimings: [],
};

const MAX_SAMPLES = 1000;

// ─── Alerting thresholds ──────────────────────────────────────────────────────
const AVG_LOGIN_ALERT_MS = 3000;       // 3-second rolling average threshold
const AVG_LOGIN_ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5-minute cooldown
let lastAvgLoginAlertAt = 0;           // Timestamp of the last average alert

// ─── Per-operation slow threshold (per-step, not average) ─────────────────────
const SLOW_OP_THRESHOLD_MS = 500;

const perf = {
  /**
   * Track a timing measurement.
   * @param {string} operation - Name of the operation (e.g. 'login.user_lookup')
   * @param {number} durationMs - Duration in milliseconds
   * @param {object} [metadata] - Optional metadata (e.g. { success: true })
   */
  track(operation, durationMs, metadata = {}) {
    const entry = {
      operation,
      durationMs,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    // Store in appropriate category
    if (operation.startsWith('login.')) {
      metrics.loginTimings.push(entry);
      if (metrics.loginTimings.length > MAX_SAMPLES) metrics.loginTimings.shift();
    } else if (operation.startsWith('query.')) {
      metrics.queryTimings.push(entry);
      if (metrics.queryTimings.length > MAX_SAMPLES) metrics.queryTimings.shift();
    }

    // 1. Per-operation slow threshold (individual step > 500ms)
    if (durationMs > SLOW_OP_THRESHOLD_MS && !isProduction) {
      logger.warn(`⏱ SLOW ${operation}: ${durationMs.toFixed(0)}ms`, metadata);
    }

    // 2. Rolling average alert (average across ALL logins > 3s)
    //    Only fires for 'login.token_generate' since it's the last step in
    //    the login flow — this avoids alerting N times per slow login.
    if (operation === 'login.token_generate') {
      this._checkAverageAlert();
    }
  },

  /**
   * Check if the rolling average login time exceeds the alert threshold
   * and fire a warning if it does (respecting cooldown).
   * @private
   */
  _checkAverageAlert() {
    if (metrics.loginTimings.length < 5) return; // Not enough samples yet

    const total = metrics.loginTimings.reduce((sum, m) => sum + m.durationMs, 0);
    const avgMs = total / metrics.loginTimings.length;

    if (avgMs > AVG_LOGIN_ALERT_MS) {
      const now = Date.now();
      if (now - lastAvgLoginAlertAt > AVG_LOGIN_ALERT_COOLDOWN_MS) {
        lastAvgLoginAlertAt = now;
        // Count how many slow logins contributed to this
        const slowCount = metrics.loginTimings.filter(m => m.durationMs > AVG_LOGIN_ALERT_MS).length;
        logger.warn(
          `⚠ AVERAGE LOGIN TIME EXCEEDS ${AVG_LOGIN_ALERT_MS / 1000}s THRESHOLD: ` +
          `${avgMs.toFixed(0)}ms avg over ${metrics.loginTimings.length} logins ` +
          `(${slowCount} logins exceeded threshold) — check DB indexes, connection pooling, or network latency`
        );
      }
    }
  },

  /**
   * Creates a timing wrapper for async functions.
   * Usage: const result = await perf.trackAsync('login.user_lookup', async () => { ... });
   */
  async trackAsync(operation, fn, metadata = {}) {
    const start = Date.now();
    try {
      const result = await fn();
      this.track(operation, Date.now() - start, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.track(operation, Date.now() - start, { ...metadata, success: false, error: error.message });
      throw error;
    }
  },

  /** Get current metrics summary */
  getSummary() {
    const avgLogin = metrics.loginTimings.length > 0
      ? metrics.loginTimings.reduce((sum, m) => sum + m.durationMs, 0) / metrics.loginTimings.length
      : 0;

    const avgQuery = metrics.queryTimings.length > 0
      ? metrics.queryTimings.reduce((sum, m) => sum + m.durationMs, 0) / metrics.queryTimings.length
      : 0;

    const slowLoginCount = metrics.loginTimings.filter(m => m.durationMs > AVG_LOGIN_ALERT_MS).length;

    return {
      loginCount: metrics.loginTimings.length,
      averageLoginTimeMs: Math.round(avgLogin * 10) / 10,
      slowestLoginMs: metrics.loginTimings.length > 0
        ? Math.round(Math.max(...metrics.loginTimings.map(m => m.durationMs)))
        : 0,
      fastestLoginMs: metrics.loginTimings.length > 0
        ? Math.round(Math.min(...metrics.loginTimings.map(m => m.durationMs)))
        : 0,
      loginsExceedingAlertThreshold: slowLoginCount,
      averageLoginAlertFired: avgLogin > AVG_LOGIN_ALERT_MS,
      averageQueryTimeMs: Math.round(avgQuery * 10) / 10,
      queryCount: metrics.queryTimings.length,
      loginBreakdown: {
        userLookup: metrics.loginTimings.filter(m => m.operation === 'login.user_lookup'),
        passwordVerify: metrics.loginTimings.filter(m => m.operation === 'login.password_verify'),
        sessionCreate: metrics.loginTimings.filter(m => m.operation === 'login.session_create'),
        tokenGenerate: metrics.loginTimings.filter(m => m.operation === 'login.token_generate'),
      },
    };
  },

  /** Generate a human-readable performance report */
  generateReport() {
    const summary = this.getSummary();
    const report = [
      '════════════════════════════════════════════',
      '     LOGIN PERFORMANCE REPORT',
      '════════════════════════════════════════════',
      '',
      `Total logins tracked: ${summary.loginCount}`,
      `Average login time:   ${summary.averageLoginTimeMs}ms`,
      `Slowest login:        ${summary.slowestLoginMs}ms`,
      `Fastest login:        ${summary.fastestLoginMs}ms`,
      `Average query time:   ${summary.averageQueryTimeMs}ms`,
      '',
      '── Login Step Breakdown ──',
      '',
    ];

    for (const [step, timings] of Object.entries(summary.loginBreakdown)) {
      if (timings.length > 0) {
        const avg = timings.reduce((s, m) => s + m.durationMs, 0) / timings.length;
        report.push(`  ${step}: avg ${Math.round(avg)}ms (${timings.length} samples)`);
      }
    }

    report.push(
      '',
      '── Alerts ──',
      '',
    );

    if (summary.averageLoginAlertFired) {
      report.push(
        `  🚨 ALERT: Rolling average ${summary.averageLoginTimeMs}ms exceeds ${AVG_LOGIN_ALERT_MS / 1000}s threshold`,
        `  ${summary.loginsExceedingAlertThreshold} of ${summary.loginCount} logins exceeded ${AVG_LOGIN_ALERT_MS / 1000}s`,
      );
    } else if (summary.loginCount > 0) {
      report.push(`  ✅ Average login (${summary.averageLoginTimeMs}ms) is under ${AVG_LOGIN_ALERT_MS / 1000}s alert threshold`);
    } else {
      report.push('  No login data to evaluate.');
    }

    report.push(
      '',
      '── Recommendations ──',
      '',
      summary.averageLoginTimeMs > AVG_LOGIN_ALERT_MS
        ? `  🚨 Average login (${summary.averageLoginTimeMs}ms) exceeds ${AVG_LOGIN_ALERT_MS / 1000}s target — investigate slow queries`
        : `  ✅ Average login (${summary.averageLoginTimeMs}ms) is under ${AVG_LOGIN_ALERT_MS / 1000}s target`,
      summary.averageQueryTimeMs > 100
        ? '  ⚠ Average query time high — check indexes and connection pooling'
        : '  ✅ Queries are well optimized',
      '',
      '════════════════════════════════════════════',
    );

    return report.join('\n');
  },

  /** Reset alert cooldown (useful for tests) */
  _resetAlertCooldown() {
    lastAvgLoginAlertAt = 0;
  },
};

module.exports = perf;
