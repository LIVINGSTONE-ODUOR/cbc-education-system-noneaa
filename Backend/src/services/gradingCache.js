/**
 * Grading Cache Service — CBC Education System
 *
 * Provides in-memory caching for grading schemes and levels to eliminate
 * redundant database lookups during assessment operations.
 *
 * Cache TTL: 5 minutes
 * Auto-invalidation on scheme/level mutations via cache.bust(schoolId)
 */

const { query } = require('../config/database');
const logger = require('../utils/logger');

// ─── Cache Store ────────────────────────────────────────────────────────────────
const store = {
  schemes: new Map(),   // schoolId -> { scheme, timestamp }
  levels: new Map(),    // schemeId -> { levels[], timestamp }
};

const TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Internal Helpers ──────────────────────────────────────────────────────────

function isValid(entry) {
  return entry && Date.now() - entry.timestamp < TTL_MS;
}

function makeEntry(data) {
  return { data, timestamp: Date.now() };
}

// ─── Public API ─────────────────────────────────────────────────────────────────

const gradingCache = {

  /**
   * Get the default scheme for a school (cached or fresh).
   * Auto-creates a default CBC scheme if none exists.
   */
  async getScheme(schoolId) {
    if (!schoolId) return null;

    const cached = store.schemes.get(schoolId);
    if (isValid(cached)) return cached.data;

    // Cache miss — fetch from DB
    let result = await query(
      `SELECT * FROM grading_schemes WHERE school_id = $1 AND is_default = true AND is_active = true LIMIT 1`,
      [schoolId]
    );

    if (result.rows.length > 0) {
      store.schemes.set(schoolId, makeEntry(result.rows[0]));
      return result.rows[0];
    }

    // No default scheme — create one
    const scheme = await query(
      `INSERT INTO grading_schemes (school_id, name, description, is_default)
       VALUES ($1, 'CBC Standard', 'Default CBC Competency-Based grading scheme', true)
       RETURNING *`,
      [schoolId]
    );

    const levels = [
      { code: 'BE', name: 'Below Expectation', min: 0, max: 24, color: '#EF4444', sort: 1, pass: false },
      { code: 'ME', name: 'Meeting Expectation', min: 25, max: 49, color: '#F59E0B', sort: 2, pass: true },
      { code: 'AE', name: 'Above Expectation', min: 50, max: 74, color: '#3B82F6', sort: 3, pass: true },
      { code: 'EE', name: 'Exceeding Expectation', min: 75, max: 100, color: '#10B981', sort: 4, pass: true },
    ];

    for (const lv of levels) {
      await query(
        `INSERT INTO grading_levels (scheme_id, code, name, min_score, max_score, color, sort_order, is_pass)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [scheme.rows[0].id, lv.code, lv.name, lv.min, lv.max, lv.color, lv.sort, lv.pass]
      );
    }

    store.schemes.set(schoolId, makeEntry(scheme.rows[0]));
    return scheme.rows[0];
  },

  /**
   * Get all active grading levels for a scheme (cached or fresh).
   * Returns a flat array sorted by sort_order.
   */
  async getLevels(schemeId) {
    if (!schemeId) return [];

    const cached = store.levels.get(schemeId);
    if (isValid(cached)) return cached.data;

    const result = await query(
      `SELECT * FROM grading_levels WHERE scheme_id = $1 AND is_active = true ORDER BY sort_order`,
      [schemeId]
    );

    store.levels.set(schemeId, makeEntry(result.rows));
    return result.rows;
  },

  /**
   * Calculate grade from a score using cached levels.
   * Zero database lookups inside loops.
   */
  calculateGradeFromLevels(levels, score) {
    if (!levels || levels.length === 0 || score === null || score === undefined) {
      return { gradeCode: 'N/A', competencyLevel: 'Not Assessed' };
    }

    const parsedScore = parseFloat(score);
    for (const level of levels) {
      if (parsedScore >= parseFloat(level.min_score) && parsedScore <= parseFloat(level.max_score)) {
        return { gradeCode: level.code, competencyLevel: level.name };
      }
    }

    return { gradeCode: 'N/A', competencyLevel: 'Not Assessed' };
  },

  /**
   * Convenience: load scheme + levels in one call, return { scheme, levels }.
   */
  async getSchemeWithLevels(schoolId) {
    const scheme = await this.getScheme(schoolId);
    if (!scheme) return { scheme: null, levels: [] };

    const levels = await this.getLevels(scheme.id);
    return { scheme, levels };
  },

  /**
   * Convenience: calculate grade for a score given a school.
   * Loads scheme + levels if needed, then matches in-memory.
   */
  async calculateGrade(schoolId, score) {
    const { levels } = await this.getSchemeWithLevels(schoolId);
    return this.calculateGradeFromLevels(levels, score);
  },

  /**
   * Invalidate cache for a school (or all if no schoolId provided).
   * Call this whenever schemes or levels are mutated.
   */
  bust(schoolId) {
    if (schoolId) {
      store.schemes.delete(schoolId);
      // Find and delete levels for any scheme belonging to this school
      for (const [key] of store.levels) {
        // We don't know the scheme->school mapping from cache keys alone,
        // so mark all for refresh. This is still cheap.
        store.levels.delete(key);
      }
    } else {
      store.schemes.clear();
      store.levels.clear();
    }
    logger.debug('Grading cache busted' + (schoolId ? ` for school ${schoolId}` : ' (all)'));
  },

  /** Clear all caches (for testing) */
  clear() {
    store.schemes.clear();
    store.levels.clear();
  },
};

module.exports = gradingCache;
