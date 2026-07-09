// =============================================================================
// exam.controller.js
// Exam Setup — create & manage examinations
//
// Table:   exams
// Joins:   academic_years (as "term" — see academicTermsController.js, which
//          treats each academic_years row as a Term with a `year` + `name`),
//          classes (grade_level + stream_name)
// Pattern: matches class.controller.js
// Auth:    Bearer JWT → req.user.schoolId / req.user.role
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

// ---------------------------------------------------------------------------
// Supabase client (service-role)
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EXAM_TYPES = ['CAT', 'Mid-Term', 'End-Term', 'Mock', 'Final'];

// ---------------------------------------------------------------------------
// Helper: paginate
// ---------------------------------------------------------------------------
const paginate = (query, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
};

const EXAM_SELECT = `
  *,
  academic_years:term_id (id, name, year, is_current, is_active),
  classes:class_id (id, grade_level, stream_name)
`;

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// =============================================================================
// 1. POST /api/v1/exams
//    Create a new exam
// =============================================================================
const createExam = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const {
    term_id,
    class_id,
    exam_name,
    exam_type,
    start_date,
    end_date,
    description,
  } = req.body;

  // ── Validation ────────────────────────────────────────────────────────────
  const errors = [];
  if (!term_id) errors.push('term_id (academic year / term) is required');
  if (!class_id) errors.push('class_id (grade & stream) is required');
  if (!exam_name || !exam_name.trim()) errors.push('exam_name is required');
  if (!exam_type) errors.push('exam_type is required');
  if (exam_type && !EXAM_TYPES.includes(exam_type)) {
    errors.push(`exam_type must be one of: ${EXAM_TYPES.join(', ')}`);
  }

  const startDate = parseDate(start_date);
  const endDate = parseDate(end_date);
  if (!startDate) errors.push('start_date is required and must be a valid date');
  if (!endDate) errors.push('end_date is required and must be a valid date');
  if (startDate && endDate && endDate < startDate) {
    errors.push('end_date cannot be before start_date');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  // Verify term belongs to this school
  const { data: term } = await supabase
    .from('academic_years')
    .select('id, school_id')
    .eq('id', term_id)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!term) {
    return res.status(400).json({ success: false, message: 'Academic year / term not found for this school' });
  }

  // Verify class belongs to this school
  const { data: cls } = await supabase
    .from('classes')
    .select('id, school_id')
    .eq('id', class_id)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!cls) {
    return res.status(400).json({ success: false, message: 'Class / stream not found for this school' });
  }

  const { data: newExam, error } = await supabase
    .from('exams')
    .insert({
      school_id: schoolId,
      term_id,
      class_id,
      exam_name: exam_name.trim(),
      exam_type,
      start_date,
      end_date,
      description: description?.trim() || null,
      is_active: true,
      created_by: userId || null,
      updated_by: userId || null,
    })
    .select(EXAM_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to create exam', error: error.message });
  }

  return res.status(201).json({ success: true, data: newExam });
});

// =============================================================================
// 2. GET /api/v1/exams
//    List exams (paginated, searchable, filterable)
// =============================================================================
const listExams = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const {
    page = 1,
    limit = 20,
    search,
    exam_type,
    term_id,
    class_id,
    grade_level,
    is_active,
    sort_by = 'start_date',
    sort_order = 'desc',
  } = req.query;

  let query = supabase
    .from('exams')
    .select(EXAM_SELECT)
    .eq('school_id', schoolId);

  if (search) {
    query = query.ilike('exam_name', `%${search}%`);
  }
  if (exam_type) {
    query = query.eq('exam_type', exam_type);
  }
  if (term_id) {
    query = query.eq('term_id', term_id);
  }
  if (class_id) {
    query = query.eq('class_id', class_id);
  }
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  const validSort = ['start_date', 'end_date', 'exam_name', 'exam_type', 'created_at'];
  const sortBy = validSort.includes(sort_by) ? sort_by : 'start_date';
  const isDescending = sort_order === 'desc';
  query = query.order(sortBy, { ascending: !isDescending });

  query = paginate(query, parseInt(page), parseInt(limit));

  const { data: exams, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
  }

  // grade_level filter applied client-side after join, since it lives on the
  // joined `classes` row rather than directly on `exams`.
  let filteredExams = exams || [];
  if (grade_level) {
    filteredExams = filteredExams.filter((e) => e.classes?.grade_level === grade_level);
  }

  // Total count (mirrors the same filters, minus pagination)
  let totalQuery = supabase
    .from('exams')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId);

  if (search) totalQuery = totalQuery.ilike('exam_name', `%${search}%`);
  if (exam_type) totalQuery = totalQuery.eq('exam_type', exam_type);
  if (term_id) totalQuery = totalQuery.eq('term_id', term_id);
  if (class_id) totalQuery = totalQuery.eq('class_id', class_id);
  if (is_active !== undefined) totalQuery = totalQuery.eq('is_active', is_active === 'true');

  const { count: total_count } = await totalQuery;

  return res.json({
    success: true,
    data: {
      exams: filteredExams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_count: total_count || 0,
      },
    },
  });
});

// =============================================================================
// 3. GET /api/v1/exams/:id
// =============================================================================
const getExam = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const { data: exam, error } = await supabase
    .from('exams')
    .select(EXAM_SELECT)
    .eq('id', id)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch exam', error: error.message });
  }
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  return res.json({ success: true, data: exam });
});

// =============================================================================
// 4. PUT /api/v1/exams/:id
// =============================================================================
const updateExam = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { data: existing } = await supabase
    .from('exams')
    .select('id, start_date, end_date')
    .eq('id', id)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  const {
    term_id,
    class_id,
    exam_name,
    exam_type,
    start_date,
    end_date,
    description,
    is_active,
  } = req.body;

  const errors = [];
  if (exam_type !== undefined && !EXAM_TYPES.includes(exam_type)) {
    errors.push(`exam_type must be one of: ${EXAM_TYPES.join(', ')}`);
  }

  const nextStart = start_date !== undefined ? parseDate(start_date) : new Date(existing.start_date);
  const nextEnd = end_date !== undefined ? parseDate(end_date) : new Date(existing.end_date);
  if (start_date !== undefined && !nextStart) errors.push('start_date must be a valid date');
  if (end_date !== undefined && !nextEnd) errors.push('end_date must be a valid date');
  if (nextStart && nextEnd && nextEnd < nextStart) {
    errors.push('end_date cannot be before start_date');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  if (term_id) {
    const { data: term } = await supabase
      .from('academic_years')
      .select('id')
      .eq('id', term_id)
      .eq('school_id', schoolId)
      .maybeSingle();
    if (!term) {
      return res.status(400).json({ success: false, message: 'Academic year / term not found for this school' });
    }
  }

  if (class_id) {
    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('id', class_id)
      .eq('school_id', schoolId)
      .maybeSingle();
    if (!cls) {
      return res.status(400).json({ success: false, message: 'Class / stream not found for this school' });
    }
  }

  const updatePayload = { updated_by: userId || null };
  if (term_id !== undefined) updatePayload.term_id = term_id;
  if (class_id !== undefined) updatePayload.class_id = class_id;
  if (exam_name !== undefined) updatePayload.exam_name = exam_name?.trim();
  if (exam_type !== undefined) updatePayload.exam_type = exam_type;
  if (start_date !== undefined) updatePayload.start_date = start_date;
  if (end_date !== undefined) updatePayload.end_date = end_date;
  if (description !== undefined) updatePayload.description = description?.trim() || null;
  if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);

  const { data: updated, error } = await supabase
    .from('exams')
    .update(updatePayload)
    .eq('id', id)
    .eq('school_id', schoolId)
    .select(EXAM_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update exam', error: error.message });
  }

  return res.json({ success: true, data: updated });
});

// =============================================================================
// 5. DELETE /api/v1/exams/:id
// =============================================================================
const deleteExam = asyncHandler(async (req, res) => {
  const { schoolId, role } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { data: existing } = await supabase
    .from('exams')
    .select('id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', id)
    .eq('school_id', schoolId);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete exam', error: error.message });
  }

  return res.json({ success: true, data: { message: 'Exam deleted successfully' } });
});

module.exports = {
  EXAM_TYPES,
  createExam,
  listExams,
  getExam,
  updateExam,
  deleteExam,
};
