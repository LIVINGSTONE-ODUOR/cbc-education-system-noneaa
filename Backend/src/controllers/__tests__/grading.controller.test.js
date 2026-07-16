/**
 * Unit tests for the CBC Grading System Controller
 *
 * Tests all endpoints: schemes, levels, competency assessments,
 * subject assessments, report cards, analytics, promotions, transcripts,
 * and role-based access validation (student, parent, admin).
 *
 * MOCK STRATEGY: The controller uses a module-level scheme cache (Map with
 * 5-min TTL) that persists across tests in the same Jest worker. To avoid
 * fragility from cache hits vs misses, the default mock implementation
 * handles common SQL patterns (scheme + grade lookups). Tests override
 * specific INSERT queries via mockResolvedValueOnce for their expected data.
 */

// Module mocks — must be before requiring the controller
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  boot: jest.fn(),
}));

const { query } = require('../../config/database');
const gradingController = require('../grading.controller');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function buildReq(overrides = {}) {
  return {
    query: {},
    params: {},
    body: {},
    user: { id: 'user-1', schoolId: 'school-1', role: 'school_admin' },
    ...overrides,
  };
}

/**
 * Set up default query mock that handles common SQL patterns.
 * Tests can override specific responses via mockResolvedValueOnce
 * (which takes priority over mockImplementation).
 */
function setupDefaultQueryMocks() {
  query.mockImplementation((sql) => {
    // Scheme lookup (grading_schemes)
    if (sql.includes('grading_schemes')) {
      return Promise.resolve({ rows: [{ id: 'scheme-1', school_id: 'school-1' }] });
    }
    // Grade calculation (grading_levels with min/max score comparison)
    if (sql.includes('grading_levels') && sql.includes('min_score') && sql.includes('max_score')) {
      return Promise.resolve({ rows: [{ code: 'EE', name: 'Exceeding Expectation' }] });
    }
    // Generic: empty result
    return Promise.resolve({ rows: [] });
  });
}

beforeEach(() => {
  query.mockClear();
  setupDefaultQueryMocks();
});

// ──────────────────────────────────────────────────────────────────────────────
// GRADING SCHEMES
// ──────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/grading/schemes', () => {
  test('returns schemes list for a school', async () => {
    const rows = [
      { id: 's1', school_id: 'school-1', name: 'CBC Standard', is_default: true, level_count: 4 },
    ];
    query.mockImplementationOnce(() => Promise.resolve({ rows }));

    const req = buildReq({ query: { school_id: 'school-1' } });
    const res = mockRes();

    await gradingController.getSchemes(req, res);

    expect(query).toHaveBeenCalledWith(expect.stringContaining('grading_schemes'), ['school-1']);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: rows });
  });

  test('falls back to req.user.schoolId when query param is missing', async () => {
    const rows = [{ id: 's1', school_id: 'school-1', name: 'Default' }];
    query.mockImplementationOnce(() => Promise.resolve({ rows }));

    const req = buildReq({ query: {} });
    const res = mockRes();

    await gradingController.getSchemes(req, res);

    expect(query).toHaveBeenCalledWith(expect.any(String), ['school-1']);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: rows });
  });

  test('returns 400 if no school ID is available', async () => {
    const req = buildReq({ query: {}, user: { id: 'u1', role: 'admin' } });
    const res = mockRes();

    await gradingController.getSchemes(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: expect.any(String) });
  });

  test('returns 500 on database error', async () => {
    query.mockImplementationOnce(() => Promise.reject(new Error('DB down')));

    const req = buildReq({ query: { school_id: 'school-1' } });
    const res = mockRes();

    await gradingController.getSchemes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('POST /api/v1/grading/schemes', () => {
  test('creates a scheme successfully', async () => {
    const newScheme = { id: 's1', school_id: 'school-1', name: 'Test Scheme', is_default: false };
    query.mockImplementationOnce(() => Promise.resolve({ rows: [newScheme] }));

    const req = buildReq({ body: { name: 'Test Scheme' } });
    const res = mockRes();

    await gradingController.createScheme(req, res);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO grading_schemes'),
      expect.arrayContaining(['school-1', 'Test Scheme'])
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: newScheme, message: expect.any(String) });
  });

  test('requires a name', async () => {
    const req = buildReq({ body: { school_id: 'school-1' } });
    const res = mockRes();

    await gradingController.createScheme(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: expect.stringContaining('name') });
  });

  test('returns 400 if no school ID', async () => {
    const req = buildReq({ body: { name: 'X' }, user: { id: 'u1', role: 'admin' } });
    const res = mockRes();

    await gradingController.createScheme(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('unsets other defaults when is_default is true', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] })); // unset-defaults
    query.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 's1', name: 'Default' }] })); // INSERT

    const req = buildReq({ body: { name: 'New Default', is_default: true } });
    const res = mockRes();

    await gradingController.createScheme(req, res);

    expect(query.mock.calls[0][0]).toContain('UPDATE grading_schemes');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('returns 500 on database error', async () => {
    query.mockImplementationOnce(() => Promise.reject(new Error('DB write failed')));

    const req = buildReq({ body: { name: 'Fail Scheme' } });
    const res = mockRes();

    await gradingController.createScheme(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('PUT /api/v1/grading/schemes/:id', () => {
  test('updates a scheme (no is_default change)', async () => {
    const updated = { id: 's1', name: 'Updated' };
    query.mockImplementationOnce(() => Promise.resolve({ rows: [updated] }));

    const req = buildReq({ params: { id: 's1' }, body: { name: 'Updated' } });
    const res = mockRes();

    await gradingController.updateScheme(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated, message: expect.any(String) });
  });

  test('updates a scheme with is_default (includes unset-default query)', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] })); // unset-default
    query.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 's1', is_default: true }] })); // UPDATE

    const req = buildReq({ params: { id: 's1' }, body: { name: 'Updated', is_default: true } });
    const res = mockRes();

    await gradingController.updateScheme(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ is_default: true }),
      message: expect.any(String),
    });
  });

  test('returns 404 if scheme not found', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

    const req = buildReq({ params: { id: 'nonexistent' }, body: { name: 'X' } });
    const res = mockRes();

    await gradingController.updateScheme(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('DELETE /api/v1/grading/schemes/:id', () => {
  test('deletes a scheme', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 's1' }] }));

    const req = buildReq({ params: { id: 's1' } });
    const res = mockRes();

    await gradingController.deleteScheme(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: expect.any(String) });
  });

  test('returns 404 if scheme not found', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

    const req = buildReq({ params: { id: 'nonexistent' } });
    const res = mockRes();

    await gradingController.deleteScheme(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GRADING LEVELS
// ──────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/grading/schemes/:id/levels', () => {
  test('returns levels ordered by sort_order', async () => {
    const levels = [
      { id: 'l1', scheme_id: 's1', code: 'BE', sort_order: 1 },
    ];
    query.mockImplementationOnce(() => Promise.resolve({ rows: levels }));

    const req = buildReq({ params: { id: 's1' } });
    const res = mockRes();

    await gradingController.getLevels(req, res);

    expect(query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY sort_order'), ['s1']);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: levels });
  });
});

describe('POST /api/v1/grading/levels', () => {
  test('creates a level', async () => {
    const level = { id: 'l1', scheme_id: 's1', code: 'EE', name: 'Exceeding', min_score: 75, max_score: 100 };
    query.mockImplementationOnce(() => Promise.resolve({ rows: [level] }));

    const req = buildReq({ body: { scheme_id: 's1', code: 'EE', name: 'Exceeding', min_score: 75, max_score: 100 } });
    const res = mockRes();

    await gradingController.createLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: level, message: expect.any(String) });
  });

  test('validates required fields', async () => {
    const req = buildReq({ body: { scheme_id: 's1' } });
    const res = mockRes();

    await gradingController.createLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: expect.stringContaining('Required') });
  });
});

describe('PUT /api/v1/grading/levels/:id', () => {
  test('updates a level', async () => {
    const updated = { id: 'l1', name: 'Above Expectation' };
    query.mockImplementationOnce(() => Promise.resolve({ rows: [updated] }));

    const req = buildReq({ params: { id: 'l1' }, body: { name: 'Above Expectation' } });
    const res = mockRes();

    await gradingController.updateLevel(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated, message: expect.any(String) });
  });

  test('returns 404 if level not found', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

    const req = buildReq({ params: { id: 'l1' }, body: { name: 'X' } });
    const res = mockRes();

    await gradingController.updateLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('DELETE /api/v1/grading/levels/:id', () => {
  test('deletes a level', async () => {
    const req = buildReq({ params: { id: 'l1' } });
    const res = mockRes();

    await gradingController.deleteLevel(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: expect.any(String) });
  });

  test('handles database error gracefully', async () => {
    query.mockImplementation(() => Promise.reject(new Error('DB error')));

    const req = buildReq({ params: { id: 'l1' } });
    const res = mockRes();

    await gradingController.deleteLevel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// COMPETENCY ASSESSMENTS
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/grading/competency-assessments', () => {
  test('saves an assessment with grade calculation', async () => {
    const saved = { id: 'ca-1', learner_id: 'learner-1', score: 65, grade_code: 'EE', competency_level: 'Exceeding Expectation' };
    // Override for INSERT into competency_assessments
    const baseImpl = query.getMockImplementation();
    query.mockImplementation((sql, params) => {
      if (sql.includes('INSERT INTO competency_assessments')) {
        return Promise.resolve({ rows: [saved] });
      }
      return baseImpl(sql, params);
    });

    const req = buildReq({
      body: { learner_id: 'learner-1', learning_area_id: 'area-1', competency_area_id: 'comp-1', academic_term_id: 'term-1', score: 65 },
    });
    const res = mockRes();

    await gradingController.saveCompetencyAssessment(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ grade_code: 'EE' }),
      message: expect.any(String),
    });
  });

  test('validates required fields', async () => {
    const req = buildReq({ body: { learner_id: 'l1' } });
    const res = mockRes();

    await gradingController.saveCompetencyAssessment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('GET /api/v1/grading/competency-assessments', () => {
  test('returns assessments for an admin user', async () => {
    const assessments = [{ id: 'ca-1', score: 80, grade_code: 'EE' }];
    query.mockImplementationOnce(() => Promise.resolve({ rows: assessments }));

    const req = buildReq({ query: { learner_id: 'learner-1', academic_term_id: 'term-1' } });
    const res = mockRes();

    await gradingController.getCompetencyAssessments(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: assessments });
  });

  test('allows a student to view their own assessments', async () => {
    const assessments = [{ id: 'ca-1', score: 90 }];
    query.mockImplementationOnce(() => Promise.resolve({ rows: assessments }));

    const req = buildReq({
      query: { learner_id: 'student-1', academic_term_id: 'term-1' },
      user: { id: 'student-1', role: 'student', schoolId: 'school-1' },
    });
    const res = mockRes();

    await gradingController.getCompetencyAssessments(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: assessments });
  });

  test('blocks a student from viewing another student\'s assessments', async () => {
    const req = buildReq({
      query: { learner_id: 'other-student', academic_term_id: 'term-1' },
      user: { id: 'my-student-id', role: 'student', schoolId: 'school-1' },
    });
    const res = mockRes();

    await gradingController.getCompetencyAssessments(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: expect.stringContaining('Access denied') });
  });

  test('allows a parent to view their linked child\'s assessments', async () => {
    const assessments = [{ id: 'ca-1', score: 75 }];
    query.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 'lp-1' }] })); // parent check
    query.mockImplementationOnce(() => Promise.resolve({ rows: assessments }));       // data

    const req = buildReq({
      query: { learner_id: 'child-1', academic_term_id: 'term-1' },
      user: { id: 'parent-user-1', role: 'parent', schoolId: 'school-1' },
    });
    const res = mockRes();

    await gradingController.getCompetencyAssessments(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: assessments });
  });

  test('blocks a parent from viewing a non-linked child', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] })); // parent check fails

    const req = buildReq({
      query: { learner_id: 'not-my-child', academic_term_id: 'term-1' },
      user: { id: 'parent-user-1', role: 'parent', schoolId: 'school-1' },
    });
    const res = mockRes();

    await gradingController.getCompetencyAssessments(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 400 if learner_id or academic_term_id missing', async () => {
    const req = buildReq({ query: { learner_id: 'l1' } });
    const res = mockRes();

    await gradingController.getCompetencyAssessments(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('handles parent check query failure gracefully', async () => {
    query.mockImplementationOnce(() => Promise.reject(new Error('Connection lost')));

    const req = buildReq({
      query: { learner_id: 'child-1', academic_term_id: 'term-1' },
      user: { id: 'parent-user-1', role: 'parent', schoolId: 'school-1' },
    });
    const res = mockRes();

    await gradingController.getCompetencyAssessments(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SUBJECT ASSESSMENTS
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/grading/subject-assessments', () => {
  test('saves a subject assessment and triggers report card update', async () => {
    const saved = { id: 'sa-1', total_score: 35, grade_code: 'EE' };
    // Override for INSERT into subject_assessments
    const baseImpl = query.getMockImplementation();
    query.mockImplementation((sql, params) => {
      if (sql.includes('INSERT INTO subject_assessments') && sql.includes('RETURNING')) {
        return Promise.resolve({ rows: [saved] });
      }
      return baseImpl(sql, params);
    });

    const req = buildReq({
      body: { learner_id: 'learner-1', learning_area_id: 'area-1', academic_term_id: 'term-1', academic_year_id: 'year-1', total_score: 35 },
    });
    const res = mockRes();

    await gradingController.saveSubjectAssessment(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ grade_code: 'EE' }),
      message: expect.any(String),
    });
  });

  test('validates required fields', async () => {
    const req = buildReq({ body: { learner_id: 'l1' } });
    const res = mockRes();

    await gradingController.saveSubjectAssessment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('GET /api/v1/grading/subject-assessments', () => {
  test('returns assessments for school_admin', async () => {
    const assessments = [{ id: 'sa-1', total_score: 80, subject_name: 'Math' }];
    query.mockImplementationOnce(() => Promise.resolve({ rows: assessments }));

    const req = buildReq({ query: { learner_id: 'learner-1' } });
    const res = mockRes();

    await gradingController.getSubjectAssessments(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: assessments });
  });

  test('blocks student cross-access', async () => {
    const req = buildReq({
      query: { learner_id: 'other-learner' },
      user: { id: 'my-id', role: 'student', schoolId: 'school-1' },
    });
    const res = mockRes();

    await gradingController.getSubjectAssessments(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('allows parent with linked child', async () => {
    const assessments = [{ id: 'sa-1', total_score: 70, subject_name: 'English' }];
    query.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 'lp-1' }] })); // parent check
    query.mockImplementationOnce(() => Promise.resolve({ rows: assessments }));       // data

    const req = buildReq({
      query: { learner_id: 'child-1' },
      user: { id: 'parent-user-1', role: 'parent', schoolId: 'school-1' },
    });
    const res = mockRes();

    await gradingController.getSubjectAssessments(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: assessments });
  });

  test('blocks parent with non-linked child', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

    const req = buildReq({
      query: { learner_id: 'not-my-child' },
      user: { id: 'parent-user-1', role: 'parent', schoolId: 'school-1' },
    });
    const res = mockRes();

    await gradingController.getSubjectAssessments(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('requires learner_id', async () => {
    const req = buildReq({ query: {} });
    const res = mockRes();

    await gradingController.getSubjectAssessments(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// REPORT CARDS
// ──────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/grading/report-cards', () => {
  test('returns report cards filtered by learner', async () => {
    const reports = [{ id: 'rc-1', learner_id: 'l1', overall_grade: 'EE' }];
    query.mockImplementationOnce(() => Promise.resolve({ rows: reports }));

    const req = buildReq({ query: { learner_id: 'l1' } });
    const res = mockRes();

    await gradingController.getReportCards(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: reports });
  });

  test('blocks student cross-access', async () => {
    const req = buildReq({
      query: { learner_id: 'other' },
      user: { id: 'me', role: 'student', schoolId: 'school-1' },
    });
    const res = mockRes();

    await gradingController.getReportCards(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns empty array when no reports', async () => {
    const req = buildReq({ query: { learner_id: 'l1' } });
    const res = mockRes();

    await gradingController.getReportCards(req, res);

    // Default mock returns { rows: [] } → empty data
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });
});

describe('GET /api/v1/grading/report-cards/:id/full', () => {
  test('returns full report card with subjects', async () => {
    const reportRow = { id: 'rc-1', learner_id: 'l1', class_name: 'Grade 4', school_name: 'Test School', overall_grade: 'EE', average_score: 85 };
    const subjects = [{ id: 'sa-1', subject_name: 'Math', total_score: 90, grade_code: 'EE' }];

    query.mockImplementationOnce(() => Promise.resolve({ rows: [reportRow] })); // report query
    query.mockImplementationOnce(() => Promise.resolve({ rows: subjects }));    // subjects query

    const req = buildReq({ params: { id: 'rc-1' } });
    const res = mockRes();

    await gradingController.getFullReportCard(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ id: 'rc-1', subjects }),
    });
  });

  test('returns 404 when report not found', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

    const req = buildReq({ params: { id: 'nonexistent' } });
    const res = mockRes();

    await gradingController.getFullReportCard(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('PUT /api/v1/grading/report-cards/:id/comments', () => {
  test('updates comments', async () => {
    const updated = { id: 'rc-1', teacher_comments: 'Good progress' };
    query.mockImplementationOnce(() => Promise.resolve({ rows: [updated] }));

    const req = buildReq({ params: { id: 'rc-1' }, body: { teacher_comments: 'Good progress', principal_comments: 'Keep it up' } });
    const res = mockRes();

    await gradingController.updateReportCardComments(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated, message: expect.any(String) });
  });

  test('returns 404 when report card not found', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

    const req = buildReq({ params: { id: 'nonexistent' }, body: {} });
    const res = mockRes();

    await gradingController.updateReportCardComments(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('POST /api/v1/grading/report-cards/:id/finalize', () => {
  test('finalizes a report card', async () => {
    const finalized = { id: 'rc-1', is_finalized: true, finalized_by: 'user-1' };
    query.mockImplementationOnce(() => Promise.resolve({ rows: [finalized] }));

    const req = buildReq({ params: { id: 'rc-1' } });
    const res = mockRes();

    await gradingController.finalizeReportCard(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: finalized, message: expect.any(String) });
  });

  test('returns 404 when report card not found', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

    const req = buildReq({ params: { id: 'nonexistent' } });
    const res = mockRes();

    await gradingController.finalizeReportCard(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ──────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/grading/analytics/class/:classId', () => {
  test('returns full analytics for a class', async () => {
    const distribution = [{ grade_code: 'EE', count: 10, percentage: '50.0' }];
    const topLearners = [{ id: 'l1', first_name: 'John', average_score: 90 }];
    const subjectPerformance = [{ subject_name: 'Math', avg_score: 75 }];
    const attendance = [{ status: 'present', count: 100 }];

    query.mockImplementationOnce(() => Promise.resolve({ rows: distribution }));
    query.mockImplementationOnce(() => Promise.resolve({ rows: topLearners }));
    query.mockImplementationOnce(() => Promise.resolve({ rows: subjectPerformance }));
    query.mockImplementationOnce(() => Promise.resolve({ rows: attendance }));

    const req = buildReq({ params: { classId: 'class-1' }, query: { academic_term_id: 'term-1' } });
    const res = mockRes();

    await gradingController.getClassAnalytics(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { gradeDistribution: distribution, topLearners, subjectPerformance, attendance },
    });
  });

  test('requires academic_term_id', async () => {
    const req = buildReq({ params: { classId: 'class-1' }, query: {} });
    const res = mockRes();

    await gradingController.getClassAnalytics(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PROMOTIONS
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/grading/promotions', () => {
  test('saves a promotion (promoted with learner class update)', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 'pd-1', decision: 'promoted' }] })); // INSERT
    query.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 'l1', class_id: 'class-2' }] }));   // UPDATE learner

    const req = buildReq({ body: { learner_id: 'l1', from_class_id: 'class-1', to_class_id: 'class-2', decision: 'promoted' } });
    const res = mockRes();

    await gradingController.savePromotionDecision(req, res);

    expect(query.mock.calls[1][0]).toContain('UPDATE learners');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('does not update learner class for non-promoted decisions', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 'pd-2', decision: 'retained' }] }));

    const req = buildReq({ body: { learner_id: 'l1', decision: 'retained' } });
    const res = mockRes();

    await gradingController.savePromotionDecision(req, res);

    expect(query).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('requires learner_id and decision', async () => {
    const req = buildReq({ body: { learner_id: 'l1' } });
    const res = mockRes();

    await gradingController.savePromotionDecision(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('handles database error', async () => {
    query.mockImplementationOnce(() => Promise.reject(new Error('Insert failed')));

    const req = buildReq({ body: { learner_id: 'l1', decision: 'promoted' } });
    const res = mockRes();

    await gradingController.savePromotionDecision(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('GET /api/v1/grading/promotions', () => {
  test('returns promotion decisions', async () => {
    const decisions = [{ id: 'pd-1', decision: 'promoted', first_name: 'John' }];
    query.mockImplementationOnce(() => Promise.resolve({ rows: decisions }));

    const req = buildReq({ query: { learner_id: 'l1' } });
    const res = mockRes();

    await gradingController.getPromotionDecisions(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: decisions });
  });

  test('filters by class_id (uses OR between from_class and to_class)', async () => {
    query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

    const req = buildReq({ query: { class_id: 'class-1' } });
    const res = mockRes();

    await gradingController.getPromotionDecisions(req, res);

    expect(query.mock.calls[0][0]).toContain('pd.from_class_id');
    expect(query.mock.calls[0][0]).toContain('pd.to_class_id');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// TRANSCRIPTS
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/grading/transcripts/generate', () => {
  test('generates a transcript from report cards', async () => {
    const reportCards = [
      { id: 'rc-1', term_name: 'Term 1', total_score: 400, average_score: 80, overall_grade: 'EE', subject_count: 5 },
    ];
    const transcript = { id: 'transcript-1', cumulative_average: '82.00' };

    const baseImpl = query.getMockImplementation();
    query.mockImplementation((sql, params) => {
      if (sql.includes('FROM report_cards')) {
        return Promise.resolve({ rows: reportCards });
      }
      if (sql.includes('INSERT INTO transcripts')) {
        return Promise.resolve({ rows: [transcript] });
      }
      return baseImpl(sql, params);
    });

    const req = buildReq({ body: { learner_id: 'l1', academic_year_id: 'year-1' } });
    const res = mockRes();

    await gradingController.generateTranscript(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ id: 'transcript-1' }),
      message: expect.any(String),
    });
  });

  test('validates required fields', async () => {
    const req = buildReq({ body: { learner_id: 'l1' } });
    const res = mockRes();

    await gradingController.generateTranscript(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('GET /api/v1/grading/transcripts', () => {
  test('returns transcripts', async () => {
    const transcripts = [{ id: 't-1', learner_id: 'l1', cumulative_average: 82 }];
    query.mockImplementationOnce(() => Promise.resolve({ rows: transcripts }));

    const req = buildReq({ query: { learner_id: 'l1' } });
    const res = mockRes();

    await gradingController.getTranscripts(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: transcripts });
  });
});
