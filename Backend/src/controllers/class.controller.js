// =============================================================================
// class.controller.js
// Classes & Learners Management
//
// Tables:  classes, teacher_assignments, learner_enrollments, timetable_slots
// Pattern: matches teacher.controller.js & curriculum.controller.js
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

// ---------------------------------------------------------------------------
// Helper: paginate
// ---------------------------------------------------------------------------
const paginate = (query, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
};

// ---------------------------------------------------------------------------
// Helper: get current academic year for school
// ---------------------------------------------------------------------------
const getCurrentAcademicYear = async (schoolId) => {
  const { data } = await supabase
    .from('academic_years')
    .select('id, name')
    .eq('school_id', schoolId)
    .eq('is_current', true)
    .maybeSingle();
  return data;
};

// Valid grade levels from schema CHECK constraint
const VALID_GRADE_LEVELS = [
  'PP1', 'PP2',
  'Grade 1', 'Grade 2', 'Grade 3',
  'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9',
];

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// =============================================================================
// 1. POST /api/v1/classes
//    Create a new class for the given academic year
// =============================================================================
const createClass = asyncHandler(async (req, res) => {
  const { schoolId, role } = req.user;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const {
    grade_level,
    stream_name,
    class_teacher_id,
    branch_id,
    academic_year_id,
    capacity,
    learning_area_ids, // optional: subjects this class takes, assigned at creation time
  } = req.body;

  if (learning_area_ids !== undefined && !Array.isArray(learning_area_ids)) {
    return res.status(400).json({ success: false, message: 'learning_area_ids must be an array' });
  }

  // ── Validation ────────────────────────────────────────────────────────────
  if (!grade_level) {
    return res.status(400).json({ success: false, message: 'grade_level is required' });
  }
  if (!VALID_GRADE_LEVELS.includes(grade_level)) {
    return res.status(400).json({
      success: false,
      message: `Invalid grade_level. Must be one of: ${VALID_GRADE_LEVELS.join(', ')}`,
    });
  }

  // Resolve academic year (use provided or fall back to current year)
  let yearId = academic_year_id;
  if (!yearId) {
    const current = await getCurrentAcademicYear(schoolId);
    if (!current) {
      return res.status(400).json({ success: false, message: 'No active academic year found' });
    }
    yearId = current.id;
  }

  // Verify academic year belongs to this school
  const { data: year } = await supabase
    .from('academic_years')
    .select('id, name')
    .eq('id', yearId)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!year) {
    return res.status(400).json({ success: false, message: 'Academic year not found or does not belong to this school' });
  }

  // Verify class teacher exists (if provided)
  if (class_teacher_id) {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', class_teacher_id)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .maybeSingle();

    if (!teacher) {
      return res.status(400).json({ success: false, message: 'Class teacher not found or not active' });
    }
  }

  // Validate learning_area_ids up front (before creating the class) so we
  // never end up with a class that has no valid subjects because of a typo.
  let validatedLearningAreaIds = [];
  if (Array.isArray(learning_area_ids) && learning_area_ids.length > 0) {
    const { data: foundAreas, error: findErr } = await supabase
      .from('learning_areas')
      .select('id, school_id')
      .in('id', learning_area_ids)
      .is('deleted_at', null);

    if (findErr) {
      return res.status(500).json({ success: false, message: 'Failed to validate learning_area_ids', error: findErr.message });
    }

    const visibleIds = (foundAreas || [])
      .filter((la) => la.school_id === null || la.school_id === schoolId)
      .map((la) => la.id);

    const missing = learning_area_ids.filter((laId) => !visibleIds.includes(laId));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unknown or inaccessible learning_area id(s): ${missing.join(', ')}`,
      });
    }
    validatedLearningAreaIds = learning_area_ids;
  }

  // Create class
  const { data: newClass, error } = await supabase
    .from('classes')
    .insert({
      school_id: schoolId,
      academic_year_id: yearId,
      grade_level: grade_level.trim(),
      stream_name: stream_name?.trim() || null,
      class_teacher_id: class_teacher_id || null,
      branch_id: branch_id || null,
      capacity: capacity ? Math.max(1, parseInt(capacity)) : 50,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to create class', error: error.message });
  }

  // Assign subjects to the new class, if any were provided. Best-effort:
  // the class itself is already created at this point, so a failure here
  // is surfaced as a warning rather than rolling back the class.
  if (validatedLearningAreaIds.length > 0) {
    const rows = validatedLearningAreaIds.map((learning_area_id) => ({
      class_id: newClass.id,
      learning_area_id,
      school_id: schoolId,
      created_by: req.user.id || null,
    }));

    const { error: assignErr } = await supabase.from('class_learning_areas').insert(rows);
    if (assignErr) {
      return res.status(201).json({
        success: true,
        data: newClass,
        warning: `Class created, but subject assignment failed: ${assignErr.message}`,
      });
    }
  }

  return res.status(201).json({ success: true, data: newClass });
});

// =============================================================================
// 2. GET /api/v1/classes
//    List all classes (paginated, with filters)
// =============================================================================
const listClasses = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const {
    page = 1,
    limit = 20,
    academic_year_id,
    grade_level,
    is_active,
    branch_id,
    sort_by = 'grade_level',
    sort_order = 'asc',
  } = req.query;

  let query = supabase
    .from('classes')
    .select(`
      *,
      academic_years!inner(id, name),
      branches(id, name),
      teachers:class_teacher_id(id, user_id, users(first_name, last_name))
    `)
    .eq('school_id', schoolId);

  if (academic_year_id) {
    query = query.eq('academic_year_id', academic_year_id);
  }
  // No default filter - return ALL classes for the school

  if (grade_level) {
    query = query.eq('grade_level', grade_level);
  }

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  if (branch_id) {
    query = query.eq('branch_id', branch_id);
  }

  // Apply sort
  const isDescending = sort_order === 'desc';
  query = query.order(sort_by, { ascending: !isDescending });

  // Paginate
  query = paginate(query, parseInt(page), parseInt(limit));

  const { data: classes, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch classes', error: error.message });
  }

  // NOTE: keep totalQuery filters in sync with the main query for correct pagination metadata.
  let totalQuery = supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('is_active', true);

  if (academic_year_id) {
    totalQuery = totalQuery.eq('academic_year_id', academic_year_id);
  }
  if (grade_level) {
    totalQuery = totalQuery.eq('grade_level', grade_level);
  }
  if (is_active !== undefined) {
    totalQuery = totalQuery.eq('is_active', is_active === 'true');
  }
  if (branch_id) {
    totalQuery = totalQuery.eq('branch_id', branch_id);
  }

  const { count: total_count } = await totalQuery;

  // Add live learner_count per class (enrolled learners)
  const classIds = (classes || []).map((c) => c.id);
  let learnerCounts = {};

  if (classIds.length > 0) {
    // Count enrolled learners per class_id (aggregated client-side —
    // the supabase-js/PostgREST query builder has no .group() method)
    const { data: enrollments, error: enrollmentCountError } = await supabase
      .from('learner_enrollments')
      .select('class_id')
      .eq('status', 'enrolled')
      .in('class_id', classIds);

    if (enrollmentCountError) {
      console.error('[listClasses] learner_count aggregation error:', enrollmentCountError);
    } else {
      learnerCounts = (enrollments || []).reduce((acc, row) => {
        acc[row.class_id] = (acc[row.class_id] || 0) + 1;
        return acc;
      }, {});
    }
  }

  const enrichedClasses = (classes || []).map((cls) => ({
    ...cls,
    learner_count: learnerCounts[cls.id] || 0,
  }));

  return res.json({
    success: true,
    data: {
      classes: enrichedClasses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_count: total_count || 0,
      },
    },
  });
});

// =============================================================================
// 3. GET /api/v1/classes/:id
//    Get class detail + recent learners + subject assignments
// =============================================================================
const getClass = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  // Fetch class
  const { data: classData, error } = await supabase
    .from('classes')
    .select(`
      *,
      academic_years(id, name),
      branches(id, name),
      teachers:class_teacher_id(id, user_id, users(first_name, last_name, email))
    `)
    .eq('id', id)
    .eq('school_id', schoolId)
    .single();

  if (error || !classData) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  // Fetch recent learners (10 most recent)
  const { data: learners } = await supabase
    .from('learner_enrollments')
    .select(`
      id,
      learner_id,
      status,
      enrollment_date,
      learners(id, first_name, last_name, admission_number, gender)
    `)
    .eq('class_id', id)
    .eq('status', 'enrolled')
    .order('enrollment_date', { ascending: false })
    .limit(10);

  // Fetch subject assignments
  const { data: assignments } = await supabase
    .from('teacher_assignments')
    .select(`
      id,
      teacher_id,
      subject_id,
      teachers(user_id, users(first_name, last_name)),
      subjects(id, name, code)
    `)
    .eq('class_id', id)
    .eq('is_active', true);

  classData.recent_learners = learners || [];
  classData.subject_assignments = assignments || [];

  return res.json({ success: true, data: classData });
});

// =============================================================================
// 4. PUT /api/v1/classes/:id
//    Update class details
// =============================================================================
const updateClass = asyncHandler(async (req, res) => {
  const { schoolId, role } = req.user;
  const { id } = req.params;
  const { class_teacher_id, capacity, stream_name, branch_id, is_active } = req.body;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  // Verify class belongs to school
  const { data: classData } = await supabase
    .from('classes')
    .select('id, capacity')
    .eq('id', id)
    .eq('school_id', schoolId)
    .single();

  if (!classData) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  // Validate capacity against enrolled learners
  if (capacity !== undefined) {
    const { data: enrolled } = await supabase
      .from('learner_enrollments')
      .select('id')
      .eq('class_id', id)
      .eq('status', 'enrolled');

    const enrolled_count = enrolled?.length || 0;
    if (parseInt(capacity) < enrolled_count) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce capacity to ${capacity}. Currently ${enrolled_count} learners enrolled.`,
      });
    }
  }

  // Verify class teacher if provided
  if (class_teacher_id) {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', class_teacher_id)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .maybeSingle();

    if (!teacher) {
      return res.status(400).json({ success: false, message: 'Class teacher not found or not active' });
    }
  }

  // Update class
  const updatePayload = {};
  if (class_teacher_id !== undefined) updatePayload.class_teacher_id = class_teacher_id;
  if (capacity !== undefined) updatePayload.capacity = Math.max(1, parseInt(capacity));
  if (stream_name !== undefined) updatePayload.stream_name = stream_name?.trim() || null;
  if (branch_id !== undefined) updatePayload.branch_id = branch_id;
  if (is_active !== undefined) updatePayload.is_active = is_active;
  updatePayload.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('classes')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update class', error: error.message });
  }

  return res.json({ success: true, data: updated });
});

// =============================================================================
// 5. DELETE /api/v1/classes/:id
//    Soft-delete class (blocked if learners enrolled)
// =============================================================================
const deleteClass = asyncHandler(async (req, res) => {
  const { schoolId, role } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  // Verify class belongs to school
  const { data: classData } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .single();

  if (!classData) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  // Check for enrolled learners
  const { data: enrolled } = await supabase
    .from('learner_enrollments')
    .select('id')
    .eq('class_id', id)
    .eq('status', 'enrolled');

  if (enrolled && enrolled.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete class. ${enrolled.length} learners currently enrolled.`,
    });
  }

  // Soft-delete class
  const { error } = await supabase
    .from('classes')
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete class', error: error.message });
  }

  // Deactivate teacher assignments
  await supabase
    .from('teacher_assignments')
    .update({ is_active: false })
    .eq('class_id', id);

  return res.json({ success: true, message: 'Class deleted successfully' });
});

// =============================================================================
// 6. GET /api/v1/classes/:id/learners
//    Full paginated roster for the class
// =============================================================================
const getClassLearners = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;
  const {
    page = 1,
    limit = 50,
    status = 'enrolled',
    gender,
    search,
    sort_by = 'learners.first_name',
    sort_order = 'asc',
  } = req.query;

  // Verify class belongs to school
  const { data: classData } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .single();

  if (!classData) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  let query = supabase
    .from('learner_enrollments')
    .select(`
      id,
      learner_id,
      status,
      enrollment_date,
      learners(
        id,
        first_name,
        last_name,
        admission_number,
        date_of_birth,
        gender,
        email
      )
    `)
    .eq('class_id', id);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // Note: Gender and search filtering done app-side (nested relation filters can be unreliable)
  // Fetch all results first, then filter/search/sort/paginate in JavaScript for reliability
  
  // Apply sort at DB level if it's on enrollment fields (not on nested learner fields)
  const isDescending = sort_order === 'desc';
  if (sort_by.startsWith('learners.')) {
    // For nested field sorting, we'll do it app-side after fetch
    query = query.order('enrollment_date', { ascending: false });
  } else {
    query = query.order(sort_by, { ascending: !isDescending });
  }

  // Fetch all for this class (no pagination yet - we'll paginate after filtering)
  const { data: allLearners, error } = await query;

  if (error) {
    console.error('[getClassLearners] Query error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      query_params: { id, status, gender, search, sort_by, sort_order, page, limit },
    });
    return res.status(500).json({ success: false, message: 'Failed to fetch learners', error: error.message });
  }

  // App-side filtering for gender and search
  let filtered = (allLearners || []);

  if (gender) {
    filtered = filtered.filter(e => e.learners?.gender?.toLowerCase() === gender.toLowerCase());
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(e => {
      const learner = e.learners || {};
      return (
        learner.first_name?.toLowerCase().includes(searchLower) ||
        learner.last_name?.toLowerCase().includes(searchLower) ||
        learner.admission_number?.toLowerCase().includes(searchLower)
      );
    });
  }

  // App-side sorting for nested fields
  if (sort_by.startsWith('learners.')) {
    const field = sort_by.replace('learners.', '');
    filtered.sort((a, b) => {
      const valA = a.learners?.[field] || '';
      const valB = b.learners?.[field] || '';
      const cmp = String(valA).localeCompare(String(valB));
      return sort_order === 'desc' ? -cmp : cmp;
    });
  }

  // App-side pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum;
  const paginatedLearners = filtered.slice(from, to);

  return res.json({
    success: true,
    data: {
      learners: paginatedLearners,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_count: filtered.length,
      },
    },
  });
});

// =============================================================================
// 7. GET /api/v1/classes/:id/timetable
//    Weekly schedule grid grouped by day → periods
// =============================================================================
const getClassTimetable = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;
  const { academic_year_id, term_id } = req.query;

  // Verify class belongs to school
  const { data: classData } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .single();

  if (!classData) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  // Determine academic year
  let yearId = academic_year_id;
  if (!yearId) {
    const current = await getCurrentAcademicYear(schoolId);
    if (current) yearId = current.id;
  }

  // Fetch timetable slots
  let query = supabase
    .from('timetable_slots')
    .select(`
      id,
      day_of_week,
      period_number,
      period_name,
      start_time,
      end_time,
      subject_id,
      teacher_id,
      subjects(id, name, code),
      teachers:teacher_id(id, user_id, users(first_name, last_name))
    `)
    .eq('class_id', id);

  if (yearId) query = query.eq('academic_year_id', yearId);
  if (term_id) query = query.eq('term_id', term_id);

  const { data: slots, error } = await query.order('day_of_week').order('period_number');

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch timetable', error: error.message });
  }

  // Group by day → periods
  const timetable = {};
  DAYS_ORDER.forEach((day) => {
    timetable[day] = [];
  });

  (slots || []).forEach((slot) => {
    const day = slot.day_of_week?.toLowerCase() || 'monday';
    if (timetable[day]) {
      timetable[day].push(slot);
    }
  });

  return res.json({ success: true, data: { timetable, total_slots: slots?.length || 0 } });
});

// =============================================================================
// 8. GET /api/v1/classes/:id/learning-areas
//    Resolve the subject list a class takes:
//      1. If the class has explicit rows in class_learning_areas, those ARE
//         the subject list (this is what setClassLearningAreas writes).
//      2. Otherwise, fall back to the original grade_levels/class_ids
//         resolution on learning_areas, so classes that never used this
//         feature keep behaving exactly as before.
// =============================================================================
const getClassLearningAreas = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const { data: classData } = await supabase
    .from('classes')
    .select('id, grade_level')
    .eq('id', id)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!classData) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  // 1. Explicit assignment
  const { data: explicit, error: explicitErr } = await supabase
    .from('class_learning_areas')
    .select('learning_areas:learning_area_id (id, name, code, description, grade_levels, is_active)')
    .eq('class_id', id);

  if (explicitErr) {
    return res.status(500).json({ success: false, message: 'Failed to fetch class subjects', error: explicitErr.message });
  }

  if (explicit && explicit.length > 0) {
    const learning_areas = explicit
      .map((row) => row.learning_areas)
      .filter((la) => la && la.is_active !== false);
    return res.json({ success: true, data: { learning_areas, source: 'class_assignment' } });
  }

  // 2. Fallback: same rule curriculum.controller.js uses for grade_level/class_id filters
  const { data: fallback, error: fallbackErr } = await supabase
    .from('learning_areas')
    .select('id, name, code, description, grade_levels, class_ids, is_active, school_id')
    .is('deleted_at', null)
    .eq('is_active', true)
    .or(`school_id.is.null,school_id.eq.${schoolId}`);

  if (fallbackErr) {
    return res.status(500).json({ success: false, message: 'Failed to fetch class subjects', error: fallbackErr.message });
  }

  const learning_areas = (fallback || []).filter((la) => {
    const gradeOk = !la.grade_levels || la.grade_levels.length === 0 || la.grade_levels.includes(classData.grade_level);
    const classOk = !la.class_ids || la.class_ids.length === 0 || la.class_ids.includes(id);
    return gradeOk && classOk;
  });

  return res.json({ success: true, data: { learning_areas, source: 'grade_default' } });
});

// =============================================================================
// 9. PUT /api/v1/classes/:id/learning-areas
//    Replace the explicit subject assignment for a class.
//    Body: { learning_area_ids: string[] }
//    Passing [] clears the explicit assignment (class falls back to the
//    grade-level default again).
// =============================================================================
const setClassLearningAreas = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { id } = req.params;
  const { learning_area_ids } = req.body;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  if (!Array.isArray(learning_area_ids)) {
    return res.status(400).json({ success: false, message: 'learning_area_ids must be an array' });
  }

  const { data: classData } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!classData) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  if (learning_area_ids.length > 0) {
    const { data: found, error: findErr } = await supabase
      .from('learning_areas')
      .select('id, school_id')
      .in('id', learning_area_ids)
      .is('deleted_at', null);

    if (findErr) {
      return res.status(500).json({ success: false, message: 'Failed to validate learning_area_ids', error: findErr.message });
    }

    const visibleIds = (found || [])
      .filter((la) => la.school_id === null || la.school_id === schoolId)
      .map((la) => la.id);

    const missing = learning_area_ids.filter((laId) => !visibleIds.includes(laId));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unknown or inaccessible learning_area id(s): ${missing.join(', ')}`,
      });
    }
  }

  // Replace: clear existing assignment rows for this class, then insert the new set
  const { error: deleteErr } = await supabase
    .from('class_learning_areas')
    .delete()
    .eq('class_id', id);

  if (deleteErr) {
    return res.status(500).json({ success: false, message: 'Failed to update class subjects', error: deleteErr.message });
  }

  if (learning_area_ids.length > 0) {
    const rows = learning_area_ids.map((learning_area_id) => ({
      class_id: id,
      learning_area_id,
      school_id: schoolId,
      created_by: userId || null,
    }));

    const { error: insertErr } = await supabase.from('class_learning_areas').insert(rows);
    if (insertErr) {
      return res.status(500).json({ success: false, message: 'Failed to assign subjects to class', error: insertErr.message });
    }
  }

  return res.json({
    success: true,
    message: `Class subjects updated (${learning_area_ids.length} subject${learning_area_ids.length === 1 ? '' : 's'})`,
  });
});

// =============================================================================
// Exports
// =============================================================================
module.exports = {
  createClass,
  listClasses,
  getClass,
  updateClass,
  deleteClass,
  getClassLearners,
  getClassTimetable,
  getClassLearningAreas,
  setClassLearningAreas,
};
