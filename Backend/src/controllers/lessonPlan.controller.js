// =============================================================================
// lessonPlan.controller.js
// Teacher Portal — Lesson Planner.
//
// Teacher-facing endpoints (mounted under /api/v1/teachers):
//   GET    /me/lesson-plans                 list own plans (filterable)
//   GET    /me/lesson-plans/:id              one plan
//   POST   /me/lesson-plans                  create/upsert a draft
//   PUT    /me/lesson-plans/:id              edit a draft
//   PATCH  /me/lesson-plans/:id/submit       draft -> submitted
//   DELETE /me/lesson-plans/:id              delete a draft
//
// Principal-facing endpoints (mounted under /api/v1/lesson-plans):
//   GET    /                                  list submitted plans, school-wide
//   PATCH  /:id/review                        approve or request changes
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLAN_SELECT = `
  id, week_number, objectives, activities, resources, homework, status,
  review_comment, reviewed_at, created_at, updated_at,
  class:class_id ( id, grade_level, stream_name ),
  learning_area:learning_area_id ( id, name, code ),
  term:term_id ( id, name, term_number ),
  reviewed_by:reviewed_by ( first_name, last_name )
`;

// ---------------------------------------------------------------------------
// Helper: resolve the logged-in user's teacher record.
// ---------------------------------------------------------------------------
const getTeacherRecord = async (req, res) => {
  const { schoolId, id: userId, role } = req.user;
  if (role !== 'teacher') {
    res.status(403).json({ success: false, message: 'This endpoint is for teacher accounts only' });
    return null;
  }
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!teacher) {
    res.status(404).json({ success: false, message: 'No teacher record found for this account' });
    return null;
  }
  return teacher;
};

// ---------------------------------------------------------------------------
// Helper: confirm the teacher is assigned to teach this subject in this class.
// ---------------------------------------------------------------------------
const verifyAssignment = async (teacherId, classId, learningAreaId) => {
  const { data } = await supabase
    .from('teacher_assignments')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('class_id', classId)
    .eq('learning_area_id', learningAreaId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();
  return !!data;
};

// ---------------------------------------------------------------------------
// Helper: resolve current academic year for the school (same pattern used
// for timetable).
// ---------------------------------------------------------------------------
const getCurrentAcademicYearId = async (schoolId) => {
  const { data } = await supabase
    .from('academic_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('is_current', true)
    .maybeSingle();
  return data?.id || null;
};

// =============================================================================
// GET /api/v1/teachers/me/lesson-plans
// Query params: class_id, learning_area_id, week_number, status
// =============================================================================
const listMyLessonPlans = asyncHandler(async (req, res) => {
  const teacher = await getTeacherRecord(req, res);
  if (!teacher) return;

  const { class_id, learning_area_id, week_number, status } = req.query;

  let query = supabase
    .from('lesson_plans')
    .select(PLAN_SELECT)
    .eq('teacher_id', teacher.id)
    .is('deleted_at', null)
    .order('week_number', { ascending: true });

  if (class_id) query = query.eq('class_id', class_id);
  if (learning_area_id) query = query.eq('learning_area_id', learning_area_id);
  if (week_number) query = query.eq('week_number', Number(week_number));
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch lesson plans', error: error.message });
  }

  res.json({ success: true, data: { plans: data || [] } });
});

// =============================================================================
// GET /api/v1/teachers/me/lesson-plans/:id
// =============================================================================
const getMyLessonPlan = asyncHandler(async (req, res) => {
  const teacher = await getTeacherRecord(req, res);
  if (!teacher) return;

  const { data, error } = await supabase
    .from('lesson_plans')
    .select(PLAN_SELECT)
    .eq('id', req.params.id)
    .eq('teacher_id', teacher.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return res.status(404).json({ success: false, message: 'Lesson plan not found' });
  }
  res.json({ success: true, data });
});

// =============================================================================
// POST /api/v1/teachers/me/lesson-plans
// Body: { class_id, learning_area_id, term_id?, week_number,
//         objectives, activities, resources?, homework? }
// Upserts on (teacher_id, class_id, learning_area_id, term_id, week_number) —
// saving the same week again just updates the existing draft.
// =============================================================================
const createLessonPlan = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const teacher = await getTeacherRecord(req, res);
  if (!teacher) return;

  const { class_id, learning_area_id, term_id, week_number, objectives, activities, resources, homework } = req.body;

  if (!class_id || !learning_area_id || !week_number || !objectives || !activities) {
    return res.status(400).json({
      success: false,
      message: 'class_id, learning_area_id, week_number, objectives, and activities are required',
    });
  }

  const assigned = await verifyAssignment(teacher.id, class_id, learning_area_id);
  if (!assigned) {
    return res.status(403).json({ success: false, message: 'You are not assigned to teach this subject in this class' });
  }

  const academicYearId = await getCurrentAcademicYearId(schoolId);
  if (!academicYearId) {
    return res.status(404).json({ success: false, message: 'No current academic year found' });
  }

  // Does a plan already exist for this exact slot? If so, this call updates
  // it (and only if it's still a draft — submitted/reviewed plans are locked).
  const { data: existing } = await supabase
    .from('lesson_plans')
    .select('id, status')
    .eq('teacher_id', teacher.id)
    .eq('class_id', class_id)
    .eq('learning_area_id', learning_area_id)
    .eq('term_id', term_id || null)
    .eq('week_number', week_number)
    .is('deleted_at', null)
    .maybeSingle();

  if (existing && existing.status !== 'draft') {
    return res.status(409).json({
      success: false,
      message: `A ${existing.status} lesson plan already exists for this week. Only drafts can be edited this way.`,
    });
  }

  const payload = {
    school_id: schoolId,
    teacher_id: teacher.id,
    class_id,
    learning_area_id,
    academic_year_id: academicYearId,
    term_id: term_id || null,
    week_number,
    objectives,
    activities,
    resources: resources || null,
    homework: homework || null,
    status: 'draft',
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing) {
    result = await supabase
      .from('lesson_plans')
      .update(payload)
      .eq('id', existing.id)
      .select(PLAN_SELECT)
      .single();
  } else {
    result = await supabase
      .from('lesson_plans')
      .insert(payload)
      .select(PLAN_SELECT)
      .single();
  }

  if (result.error) {
    return res.status(500).json({ success: false, message: 'Failed to save lesson plan', error: result.error.message });
  }

  res.status(existing ? 200 : 201).json({ success: true, data: result.data });
});

// =============================================================================
// PUT /api/v1/teachers/me/lesson-plans/:id
// Edit a draft. Body: any of objectives/activities/resources/homework/week_number
// =============================================================================
const updateLessonPlan = asyncHandler(async (req, res) => {
  const teacher = await getTeacherRecord(req, res);
  if (!teacher) return;

  const { data: plan } = await supabase
    .from('lesson_plans')
    .select('id, status')
    .eq('id', req.params.id)
    .eq('teacher_id', teacher.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Lesson plan not found' });
  }
  if (plan.status !== 'draft') {
    return res.status(409).json({ success: false, message: 'Only draft lesson plans can be edited' });
  }

  const { objectives, activities, resources, homework, week_number } = req.body;
  const updates = { updated_at: new Date().toISOString() };
  if (objectives !== undefined) updates.objectives = objectives;
  if (activities !== undefined) updates.activities = activities;
  if (resources !== undefined) updates.resources = resources;
  if (homework !== undefined) updates.homework = homework;
  if (week_number !== undefined) updates.week_number = week_number;

  const { data, error } = await supabase
    .from('lesson_plans')
    .update(updates)
    .eq('id', plan.id)
    .select(PLAN_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update lesson plan', error: error.message });
  }
  res.json({ success: true, data });
});

// =============================================================================
// PATCH /api/v1/teachers/me/lesson-plans/:id/submit
// draft -> submitted (locks it for principal review)
// =============================================================================
const submitLessonPlan = asyncHandler(async (req, res) => {
  const teacher = await getTeacherRecord(req, res);
  if (!teacher) return;

  const { data: plan } = await supabase
    .from('lesson_plans')
    .select('id, status')
    .eq('id', req.params.id)
    .eq('teacher_id', teacher.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Lesson plan not found' });
  }
  if (plan.status !== 'draft' && plan.status !== 'changes_requested') {
    return res.status(409).json({ success: false, message: `Plan is already ${plan.status}` });
  }

  const { data, error } = await supabase
    .from('lesson_plans')
    .update({ status: 'submitted', review_comment: null, reviewed_at: null, reviewed_by: null, updated_at: new Date().toISOString() })
    .eq('id', plan.id)
    .select(PLAN_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit lesson plan', error: error.message });
  }
  res.json({ success: true, data });
});

// =============================================================================
// DELETE /api/v1/teachers/me/lesson-plans/:id
// Only drafts can be deleted (soft delete).
// =============================================================================
const deleteLessonPlan = asyncHandler(async (req, res) => {
  const teacher = await getTeacherRecord(req, res);
  if (!teacher) return;

  const { data: plan } = await supabase
    .from('lesson_plans')
    .select('id, status')
    .eq('id', req.params.id)
    .eq('teacher_id', teacher.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Lesson plan not found' });
  }
  if (plan.status !== 'draft') {
    return res.status(409).json({ success: false, message: 'Only draft lesson plans can be deleted' });
  }

  const { error } = await supabase
    .from('lesson_plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', plan.id);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete lesson plan', error: error.message });
  }
  res.json({ success: true, message: 'Lesson plan deleted' });
});

// =============================================================================
// GET /api/v1/lesson-plans  (school_admin / principal only)
// Query params: status (default 'submitted'), teacher_id, class_id
// =============================================================================
const listSchoolLessonPlans = asyncHandler(async (req, res) => {
  const { schoolId, role } = req.user;
  if (role !== 'school_admin') {
    return res.status(403).json({ success: false, message: 'This endpoint is for school admin / principal accounts only' });
  }

  const { status, teacher_id, class_id } = req.query;

  let query = supabase
    .from('lesson_plans')
    .select(`
      ${PLAN_SELECT},
      teacher:teacher_id ( id, user:user_id ( first_name, last_name ) )
    `)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  query = query.eq('status', status || 'submitted');
  if (teacher_id) query = query.eq('teacher_id', teacher_id);
  if (class_id) query = query.eq('class_id', class_id);

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch lesson plans', error: error.message });
  }
  res.json({ success: true, data: { plans: data || [] } });
});

// =============================================================================
// PATCH /api/v1/lesson-plans/:id/review  (school_admin / principal only)
// Body: { status: 'approved' | 'changes_requested', comment? }
// =============================================================================
const reviewLessonPlan = asyncHandler(async (req, res) => {
  const { schoolId, id: userId, role } = req.user;
  if (role !== 'school_admin') {
    return res.status(403).json({ success: false, message: 'This endpoint is for school admin / principal accounts only' });
  }

  const { status, comment } = req.body;
  if (!['approved', 'changes_requested'].includes(status)) {
    return res.status(400).json({ success: false, message: "status must be 'approved' or 'changes_requested'" });
  }

  const { data: plan } = await supabase
    .from('lesson_plans')
    .select('id, status')
    .eq('id', req.params.id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Lesson plan not found' });
  }
  if (plan.status !== 'submitted') {
    return res.status(409).json({ success: false, message: 'Only submitted lesson plans can be reviewed' });
  }

  const { data, error } = await supabase
    .from('lesson_plans')
    .update({
      status,
      review_comment: comment || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', plan.id)
    .select(PLAN_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to review lesson plan', error: error.message });
  }
  res.json({ success: true, data });
});

module.exports = {
  listMyLessonPlans,
  getMyLessonPlan,
  createLessonPlan,
  updateLessonPlan,
  submitLessonPlan,
  deleteLessonPlan,
  listSchoolLessonPlans,
  reviewLessonPlan,
};
