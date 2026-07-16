// =============================================================================
// timetable.controller.js
// School Timetable — admin builder for weekly class schedules
//
// Table:   timetable_slots (see migrations/20260715_ensure_timetable_slots.sql)
// Pattern: matches class.controller.js & teacher.controller.js
// Auth:    Bearer JWT → req.user.schoolId / req.user.role
//
// Business rules enforced on every create/update:
//   1. A class cannot have two slots that overlap on the same day
//      (covers "two subjects can't be learnt at the same time in one
//      stream", since a stream IS a class here).
//   2. A teacher cannot be double-booked — no two slots for the same
//      teacher may overlap on the same day, even across different classes.
//   3. start_time must be before end_time, and day must be a school day
//      (monday–friday).
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const respond = (res, status, success, message, data = null, errors = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};

// ---------------------------------------------------------------------------
// Helper: resolve the current academic year for a school when the caller
// didn't pass one explicitly.
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

// ---------------------------------------------------------------------------
// Helper: do two [start, end) time ranges overlap?
// Times are 'HH:MM' or 'HH:MM:SS' strings — safe to compare lexically.
// ---------------------------------------------------------------------------
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

// ---------------------------------------------------------------------------
// Helper: find every active slot for the school/year that conflicts with
// the given day/time — because it's the same class, the same teacher
// (regardless of class), or — when a room was given — the same room
// (regardless of class/teacher). Excludes `excludeId` so updates can
// compare against everything except themselves.
// ---------------------------------------------------------------------------
const SELECT_WITH_RELATIONS = `
  id, day, start_time, end_time, room, class_id, teacher_id,
  class:class_id ( id, grade_level, stream_name ),
  teacher:teacher_id ( id, user_id, users:user_id ( first_name, last_name ) ),
  learning_area:learning_area_id ( id, name, code )
`;

const findConflicts = async ({ schoolId, academicYearId, day, startTime, endTime, classId, teacherId, room, excludeId }) => {
  let query = supabase
    .from('timetable_slots')
    .select(SELECT_WITH_RELATIONS)
    .eq('school_id', schoolId)
    .eq('academic_year_id', academicYearId)
    .eq('day', day)
    .eq('is_active', true)
    .is('deleted_at', null)
    .or(`class_id.eq.${classId},teacher_id.eq.${teacherId}`);

  if (excludeId) query = query.neq('id', excludeId);

  const { data: candidates, error } = await query;
  if (error) throw error;

  const classConflicts = [];
  const teacherConflicts = [];

  (candidates || []).forEach((slot) => {
    if (!overlaps(startTime, endTime, slot.start_time, slot.end_time)) return;
    if (slot.class_id === classId) classConflicts.push(slot);
    if (slot.teacher_id === teacherId) teacherConflicts.push(slot);
  });

  // Room clash check runs as its own query — a booked room conflicts
  // regardless of which class or teacher is using it, so it can't ride on
  // the class_id/teacher_id `.or()` filter above. Only runs when a room
  // was actually specified; blank rooms never clash with each other.
  const roomConflicts = [];
  const trimmedRoom = typeof room === 'string' ? room.trim() : '';
  if (trimmedRoom) {
    let roomQuery = supabase
      .from('timetable_slots')
      .select(SELECT_WITH_RELATIONS)
      .eq('school_id', schoolId)
      .eq('academic_year_id', academicYearId)
      .eq('day', day)
      .eq('is_active', true)
      .is('deleted_at', null)
      .ilike('room', trimmedRoom);

    if (excludeId) roomQuery = roomQuery.neq('id', excludeId);

    const { data: roomCandidates, error: roomError } = await roomQuery;
    if (roomError) throw roomError;

    (roomCandidates || []).forEach((slot) => {
      if (!overlaps(startTime, endTime, slot.start_time, slot.end_time)) return;
      // Don't double-report a slot that's already flagged as a class or
      // teacher conflict — the room clash is a distinct, additional case
      // (different class + different teacher, same room, same time).
      if (slot.class_id === classId || slot.teacher_id === teacherId) return;
      roomConflicts.push(slot);
    });
  }

  return { classConflicts, teacherConflicts, roomConflicts };
};

const formatConflict = (slot) => ({
  id: slot.id,
  day: slot.day,
  start_time: slot.start_time,
  end_time: slot.end_time,
  room: slot.room || null,
  class: slot.class ? `${slot.class.grade_level}${slot.class.stream_name ? ' ' + slot.class.stream_name : ''}` : null,
  teacher: slot.teacher?.users ? `${slot.teacher.users.first_name} ${slot.teacher.users.last_name}` : null,
  learning_area: slot.learning_area?.name || null,
});

// =============================================================================
// GET /api/v1/timetable
//   Query: class_id* | academic_year_id | term_id
//   Weekly grid for one class: { monday: [...], tuesday: [...], ... }
// =============================================================================
const getTimetable = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { class_id, academic_year_id, term_id } = req.query;

  if (!class_id) {
    return respond(res, 400, false, 'class_id is required');
  }

  const { data: classRow } = await supabase
    .from('classes')
    .select('id, grade_level, stream_name')
    .eq('id', class_id)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!classRow) {
    return respond(res, 404, false, 'Class not found');
  }

  let yearId = academic_year_id;
  if (!yearId) {
    const current = await getCurrentAcademicYear(schoolId);
    if (current) yearId = current.id;
  }
  if (!yearId) {
    return respond(res, 404, false, 'No current academic year found. Pass academic_year_id explicitly.');
  }

  let query = supabase
    .from('timetable_slots')
    .select(`
      id, day, period_number, start_time, end_time, room, term_id,
      class_id, teacher_id, learning_area_id,
      teacher:teacher_id ( id, user_id, users:user_id ( first_name, last_name ) ),
      learning_area:learning_area_id ( id, name, code )
    `)
    .eq('school_id', schoolId)
    .eq('class_id', class_id)
    .eq('academic_year_id', yearId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('day')
    .order('start_time');

  if (term_id) query = query.eq('term_id', term_id);

  const { data: slots, error } = await query;
  if (error) {
    logger.error('Failed to fetch timetable', { error: error.message });
    return respond(res, 500, false, 'Failed to fetch timetable', null, error.message);
  }

  const timetable = {};
  DAYS.forEach((day) => { timetable[day] = []; });
  (slots || []).forEach((slot) => {
    if (timetable[slot.day]) timetable[slot.day].push(slot);
  });

  return respond(res, 200, true, 'Timetable fetched', {
    class: classRow,
    academic_year_id: yearId,
    timetable,
    total_slots: slots?.length || 0,
  });
});

// =============================================================================
// GET /api/v1/timetable/school-wide?academic_year_id=&term_id=
//   Every class's weekly grid in one response, for the admin's "Print
//   Timetable" button — full school name, term, and academic year, plus
//   every lesson/class/teacher-per-subject so the printout is self-contained.
// =============================================================================
const getSchoolTimetable = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { academic_year_id, term_id } = req.query;

  // Was 'name, address' — schools has no 'address' column, only
  // physical_address/postal_address (see school.controller.js), so this was
  // always returning a blank address. Aliased back to 'address' so nothing
  // downstream that reads school.address has to change.
  const { data: school } = await supabase
    .from('schools')
    .select('name, address:physical_address')
    .eq('id', schoolId)
    .maybeSingle();

  let yearId = academic_year_id;
  let yearRow = null;
  if (yearId) {
    const { data } = await supabase.from('academic_years').select('id, name').eq('id', yearId).maybeSingle();
    yearRow = data;
  } else {
    yearRow = await getCurrentAcademicYear(schoolId);
    if (yearRow) yearId = yearRow.id;
  }
  if (!yearId) {
    return respond(res, 404, false, 'No current academic year found. Pass academic_year_id explicitly.');
  }

  let termRow = null;
  if (term_id) {
    const { data } = await supabase.from('academic_terms').select('id, name').eq('id', term_id).maybeSingle();
    termRow = data;
  } else {
    const { data } = await supabase
      .from('academic_terms')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .maybeSingle();
    termRow = data;
  }

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, grade_level, stream_name')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('grade_level')
    .order('stream_name');
  if (classesError) {
    logger.error('Failed to fetch classes for school timetable', { error: classesError.message });
    return respond(res, 500, false, 'Failed to fetch classes', null, classesError.message);
  }

  let slotsQuery = supabase
    .from('timetable_slots')
    .select(`
      id, day, start_time, end_time, room, class_id,
      teacher:teacher_id ( id, user_id, users:user_id ( first_name, last_name ) ),
      learning_area:learning_area_id ( id, name, code )
    `)
    .eq('school_id', schoolId)
    .eq('academic_year_id', yearId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('day')
    .order('start_time');
  if (term_id) slotsQuery = slotsQuery.eq('term_id', term_id);

  const { data: slots, error: slotsError } = await slotsQuery;
  if (slotsError) {
    logger.error('Failed to fetch school-wide timetable', { error: slotsError.message });
    return respond(res, 500, false, 'Failed to fetch timetable', null, slotsError.message);
  }

  const emptyByDay = () => DAYS.reduce((acc, d) => ({ ...acc, [d]: [] }), {});
  const slotsByClass = {};
  (slots || []).forEach((slot) => {
    if (!slotsByClass[slot.class_id]) slotsByClass[slot.class_id] = emptyByDay();
    if (slotsByClass[slot.class_id][slot.day]) slotsByClass[slot.class_id][slot.day].push(slot);
  });

  const classes_timetable = (classes || []).map((c) => ({
    id: c.id,
    grade_level: c.grade_level,
    stream_name: c.stream_name,
    timetable: slotsByClass[c.id] || emptyByDay(),
  }));

  return respond(res, 200, true, 'School-wide timetable fetched', {
    school: school || null,
    academic_year: yearRow ? { id: yearRow.id, name: yearRow.name } : { id: yearId, name: null },
    term: termRow || null,
    classes: classes_timetable,
  });
});

// =============================================================================
// GET /api/v1/timetable/print-header?academic_year_id=&term_id=
//   Lightweight school name / term / academic year lookup shared by the
//   print buttons in the Teacher, Parent, and Student portals (their own
//   timetable data comes from getMyTimetable / getLearnerTimetable — this
//   just fills in the printout's header). Any authenticated school user.
// =============================================================================
const getPrintHeader = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { academic_year_id, term_id } = req.query;

  // Was 'name, address' — schools has no 'address' column, only
  // physical_address/postal_address (see school.controller.js), so this was
  // always returning a blank school_address on the printout.
  const { data: school } = await supabase
    .from('schools')
    .select('name, address:physical_address')
    .eq('id', schoolId)
    .maybeSingle();

  let yearRow = null;
  if (academic_year_id) {
    const { data } = await supabase.from('academic_years').select('id, name').eq('id', academic_year_id).maybeSingle();
    yearRow = data;
  } else {
    yearRow = await getCurrentAcademicYear(schoolId);
  }

  let termRow = null;
  if (term_id) {
    const { data } = await supabase.from('academic_terms').select('id, name').eq('id', term_id).maybeSingle();
    termRow = data;
  } else {
    const { data } = await supabase
      .from('academic_terms')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .maybeSingle();
    termRow = data;
  }

  return respond(res, 200, true, 'Print header fetched', {
    school_name: school?.name || null,
    school_address: school?.address || null,
    academic_year_name: yearRow?.name || null,
    term_name: termRow?.name || null,
  });
});

// =============================================================================
// GET /api/v1/timetable/teacher-load?academic_year_id=&term_id=
//   Per-teacher, per-day lesson counts against that day's configured lesson
//   cap (Timetable Setup). Flags days a teacher has no lessons at all
//   ("free"), days they're booked beyond the day's lesson cap
//   ("overloaded"), and how many free periods remain otherwise. Powers the
//   admin's Teacher Clash / Free-Period report.
// =============================================================================
const getTeacherLoadReport = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { academic_year_id, term_id } = req.query;

  let yearId = academic_year_id;
  if (!yearId) {
    const current = await getCurrentAcademicYear(schoolId);
    if (current) yearId = current.id;
  }
  if (!yearId) {
    return respond(res, 404, false, 'No current academic year found. Pass academic_year_id explicitly.');
  }

  const { data: settingsRows } = await supabase
    .from('timetable_day_settings')
    .select('day, lessons_count')
    .eq('school_id', schoolId)
    .eq('academic_year_id', yearId);
  const limitByDay = {};
  DAYS.forEach((d) => { limitByDay[d] = 8; });
  (settingsRows || []).forEach((r) => { limitByDay[r.day] = r.lessons_count; });

  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('id, user_id, users:user_id ( first_name, last_name )')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .is('deleted_at', null);
  if (teachersError) {
    logger.error('Failed to fetch teachers for load report', { error: teachersError.message });
    return respond(res, 500, false, 'Failed to fetch teachers', null, teachersError.message);
  }

  let slotsQuery = supabase
    .from('timetable_slots')
    .select(`
      id, day, start_time, end_time, teacher_id,
      class:class_id ( id, grade_level, stream_name ),
      learning_area:learning_area_id ( id, name )
    `)
    .eq('school_id', schoolId)
    .eq('academic_year_id', yearId)
    .eq('is_active', true)
    .is('deleted_at', null);
  if (term_id) slotsQuery = slotsQuery.eq('term_id', term_id);

  const { data: slots, error: slotsError } = await slotsQuery;
  if (slotsError) {
    logger.error('Failed to fetch slots for teacher load report', { error: slotsError.message });
    return respond(res, 500, false, 'Failed to fetch timetable', null, slotsError.message);
  }

  const byTeacher = {};
  (slots || []).forEach((slot) => {
    if (!slot.teacher_id) return;
    if (!byTeacher[slot.teacher_id]) byTeacher[slot.teacher_id] = {};
    if (!byTeacher[slot.teacher_id][slot.day]) byTeacher[slot.teacher_id][slot.day] = [];
    byTeacher[slot.teacher_id][slot.day].push(slot);
  });

  const report = (teachers || []).map((t) => {
    const name = t.users ? `${t.users.first_name} ${t.users.last_name}` : 'Unnamed teacher';

    const days = DAYS.map((day) => {
      const daySlots = (byTeacher[t.id]?.[day] || [])
        .slice()
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      const limit = limitByDay[day];
      const lessonsCount = daySlots.length;

      let status = 'balanced';
      if (lessonsCount === 0) status = 'free';
      else if (lessonsCount > limit) status = 'overloaded';
      else if (lessonsCount <= Math.ceil(limit / 2)) status = 'light';

      return {
        day,
        lessons_count: lessonsCount,
        limit,
        free_periods: Math.max(0, limit - lessonsCount),
        status,
        lessons: daySlots.map((s) => ({
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
          class: s.class ? `${s.class.grade_level}${s.class.stream_name ? ' ' + s.class.stream_name : ''}` : null,
          learning_area: s.learning_area?.name || null,
        })),
      };
    });

    return {
      teacher_id: t.id,
      name,
      weekly_total: days.reduce((sum, d) => sum + d.lessons_count, 0),
      days_unassigned: days.filter((d) => d.lessons_count === 0).length,
      days_overloaded: days.filter((d) => d.status === 'overloaded').length,
      days,
    };
  });

  report.sort((a, b) => a.name.localeCompare(b.name));

  return respond(res, 200, true, 'Teacher load report fetched', { academic_year_id: yearId, teachers: report });
});

// =============================================================================
// GET /api/v1/timetable/curriculum-sync?academic_year_id=&term_id=
//   Read-only cross-check: for every class, resolves its assigned subject
//   list (same rule as class.controller.js -> getClassLearningAreas —
//   explicit class_learning_areas rows first, else the grade_levels/
//   class_ids fallback on learning_areas) and compares it against which
//   learning_area_ids actually have timetable_slots for that class. Flags
//   any subject a class is supposed to take but has zero lessons scheduled,
//   the failure mode where a subject quietly never gets taught. Does not
//   change any data. Admin/super_admin only.
// =============================================================================
const getCurriculumSyncReport = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { academic_year_id, term_id } = req.query;

  let yearId = academic_year_id;
  if (!yearId) {
    const current = await getCurrentAcademicYear(schoolId);
    if (current) yearId = current.id;
  }
  if (!yearId) {
    return respond(res, 404, false, 'No current academic year found. Pass academic_year_id explicitly.');
  }

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, grade_level, stream_name')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('grade_level')
    .order('stream_name');
  if (classesError) {
    logger.error('Failed to fetch classes for curriculum sync report', { error: classesError.message });
    return respond(res, 500, false, 'Failed to fetch classes', null, classesError.message);
  }

  // Every learning area visible to this school — used both to resolve the
  // grade-default fallback and to look up names for explicitly-assigned ids.
  const { data: allLearningAreas, error: laError } = await supabase
    .from('learning_areas')
    .select('id, name, code, grade_levels, class_ids, is_active')
    .is('deleted_at', null)
    .eq('is_active', true)
    .or(`school_id.is.null,school_id.eq.${schoolId}`);
  if (laError) {
    logger.error('Failed to fetch learning areas for curriculum sync report', { error: laError.message });
    return respond(res, 500, false, 'Failed to fetch learning areas', null, laError.message);
  }
  const laById = {};
  (allLearningAreas || []).forEach((la) => { laById[la.id] = la; });

  // Explicit "this class takes these subjects" rows, school-wide in one query.
  const { data: explicitRows, error: explicitErr } = await supabase
    .from('class_learning_areas')
    .select('class_id, learning_area_id')
    .eq('school_id', schoolId);
  if (explicitErr) {
    logger.error('Failed to fetch class_learning_areas for curriculum sync report', { error: explicitErr.message });
    return respond(res, 500, false, 'Failed to fetch class subject assignments', null, explicitErr.message);
  }
  const explicitByClass = {};
  (explicitRows || []).forEach((r) => {
    if (!explicitByClass[r.class_id]) explicitByClass[r.class_id] = [];
    explicitByClass[r.class_id].push(r.learning_area_id);
  });

  // Which learning areas actually have timetable time, per class.
  let slotsQuery = supabase
    .from('timetable_slots')
    .select('class_id, learning_area_id')
    .eq('school_id', schoolId)
    .eq('academic_year_id', yearId)
    .eq('is_active', true)
    .is('deleted_at', null);
  if (term_id) slotsQuery = slotsQuery.eq('term_id', term_id);

  const { data: slots, error: slotsError } = await slotsQuery;
  if (slotsError) {
    logger.error('Failed to fetch timetable slots for curriculum sync report', { error: slotsError.message });
    return respond(res, 500, false, 'Failed to fetch timetable', null, slotsError.message);
  }
  const scheduledByClass = {};
  (slots || []).forEach((s) => {
    if (!s.learning_area_id) return;
    if (!scheduledByClass[s.class_id]) scheduledByClass[s.class_id] = new Set();
    scheduledByClass[s.class_id].add(s.learning_area_id);
  });

  const report = (classes || []).map((c) => {
    const explicitIds = explicitByClass[c.id] || [];
    let assigned;
    let source;
    if (explicitIds.length > 0) {
      assigned = explicitIds.map((laId) => laById[laId]).filter(Boolean);
      source = 'class_assignment';
    } else {
      assigned = (allLearningAreas || []).filter((la) => {
        const gradeOk = !la.grade_levels || la.grade_levels.length === 0 || la.grade_levels.includes(c.grade_level);
        const classOk = !la.class_ids || la.class_ids.length === 0 || la.class_ids.includes(c.id);
        return gradeOk && classOk;
      });
      source = 'grade_default';
    }

    const scheduled = scheduledByClass[c.id] || new Set();
    const missing = assigned.filter((la) => !scheduled.has(la.id));

    return {
      class_id: c.id,
      class_name: `${c.grade_level}${c.stream_name ? ' ' + c.stream_name : ''}`,
      source,
      assigned_count: assigned.length,
      missing_count: missing.length,
      missing_subjects: missing.map((la) => ({ id: la.id, name: la.name, code: la.code })),
    };
  });

  report.sort((a, b) => b.missing_count - a.missing_count || a.class_name.localeCompare(b.class_name));

  const summary = {
    classes_checked: report.length,
    classes_with_gaps: report.filter((r) => r.missing_count > 0).length,
    total_gaps: report.reduce((sum, r) => sum + r.missing_count, 0),
  };

  return respond(res, 200, true, 'Curriculum \u2194 timetable sync report fetched', {
    academic_year_id: yearId,
    term_id: term_id || null,
    summary,
    classes: report,
  });
});

// =============================================================================
// POST /api/v1/timetable
//   Body: { class_id*, learning_area_id*, teacher_id*, day*, start_time*,
//            end_time*, academic_year_id, term_id, room, period_number }
//   `day` may also be an array of days to create the same lesson across
//   several days of the week in one call (e.g. Maths every weekday 8-9AM).
// =============================================================================
const createSlot = asyncHandler(async (req, res) => {
  const { schoolId, id: userId } = req.user;
  const {
    class_id, learning_area_id, teacher_id,
    day, start_time, end_time,
    academic_year_id, term_id, room, period_number,
  } = req.body;

  const missing = ['class_id', 'learning_area_id', 'teacher_id', 'day', 'start_time', 'end_time']
    .filter((f) => !req.body[f]);
  if (missing.length) {
    return respond(res, 400, false, `Missing required field(s): ${missing.join(', ')}`);
  }

  const days = Array.isArray(day) ? day : [day];
  const invalidDays = days.filter((d) => !DAYS.includes(String(d).toLowerCase()));
  if (invalidDays.length) {
    return respond(res, 400, false, `Invalid day(s): ${invalidDays.join(', ')}. Must be one of ${DAYS.join(', ')}.`);
  }
  if (start_time >= end_time) {
    return respond(res, 400, false, 'start_time must be before end_time');
  }

  // Verify class, learning area, and teacher all belong to this school.
  const [{ data: classRow }, { data: learningAreaRow }, { data: teacherRow }] = await Promise.all([
    supabase.from('classes').select('id, grade_level, stream_name').eq('id', class_id).eq('school_id', schoolId).maybeSingle(),
    supabase.from('learning_areas').select('id, name, class_ids, grade_levels').eq('id', learning_area_id).maybeSingle(),
    supabase.from('teachers').select('id, user_id').eq('id', teacher_id).eq('school_id', schoolId).maybeSingle(),
  ]);

  if (!classRow) return respond(res, 404, false, 'Class not found');
  if (!learningAreaRow) return respond(res, 404, false, 'Learning area not found');
  if (!teacherRow) return respond(res, 404, false, 'Teacher not found');

  let yearId = academic_year_id;
  if (!yearId) {
    const current = await getCurrentAcademicYear(schoolId);
    if (current) yearId = current.id;
  }
  if (!yearId) {
    return respond(res, 404, false, 'No current academic year found. Pass academic_year_id explicitly.');
  }

  // Enforce each day's configured lesson cap (set by the admin under
  // Timetable Setup, e.g. Monday = 8 lessons, Friday = 6) before running
  // conflict checks. Days with no explicit setting default to 8.
  const { data: settingsRows } = await supabase
    .from('timetable_day_settings')
    .select('day, lessons_count')
    .eq('school_id', schoolId)
    .eq('academic_year_id', yearId);
  const limitByDay = {};
  (settingsRows || []).forEach((r) => { limitByDay[r.day] = r.lessons_count; });

  for (const d of days) {
    const dayLower = String(d).toLowerCase();
    const limit = limitByDay[dayLower] ?? 8;
    const { count, error: countError } = await supabase
      .from('timetable_slots')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('class_id', class_id)
      .eq('academic_year_id', yearId)
      .eq('day', dayLower)
      .eq('is_active', true)
      .is('deleted_at', null);
    if (countError) throw countError;
    if ((count || 0) >= limit) {
      const label = dayLower.charAt(0).toUpperCase() + dayLower.slice(1);
      return respond(res, 409, false, `${label} already has its full ${limit} lesson(s) for this class. Remove a lesson first or raise the limit in Timetable Setup.`);
    }
  }

  // Run conflict checks for every requested day before inserting anything,
  // so a multi-day request either fully succeeds or fully fails.
  const conflictsByDay = {};
  for (const d of days) {
    const dayLower = String(d).toLowerCase();
    const { classConflicts, teacherConflicts, roomConflicts } = await findConflicts({
      schoolId, academicYearId: yearId, day: dayLower,
      startTime: start_time, endTime: end_time,
      classId: class_id, teacherId: teacher_id, room,
    });
    if (classConflicts.length || teacherConflicts.length || roomConflicts.length) {
      conflictsByDay[dayLower] = {
        class_conflicts: classConflicts.map(formatConflict),
        teacher_conflicts: teacherConflicts.map(formatConflict),
        room_conflicts: roomConflicts.map(formatConflict),
      };
    }
  }

  if (Object.keys(conflictsByDay).length) {
    const messages = [];
    Object.entries(conflictsByDay).forEach(([d, c]) => {
      if (c.class_conflicts.length) {
        const cc = c.class_conflicts[0];
        messages.push(`${d}: this class already has ${cc.learning_area || 'a lesson'} booked ${cc.start_time}–${cc.end_time}`);
      }
      if (c.teacher_conflicts.length) {
        const tc = c.teacher_conflicts[0];
        messages.push(`${d}: this teacher is already teaching ${tc.learning_area || 'another lesson'} in ${tc.class || 'another class'} at ${tc.start_time}–${tc.end_time}`);
      }
      if (c.room_conflicts.length) {
        const rc = c.room_conflicts[0];
        messages.push(`${d}: room ${rc.room} is already booked for ${rc.learning_area || 'another lesson'} (${rc.class || 'another class'}) at ${rc.start_time}–${rc.end_time}`);
      }
    });
    return respond(res, 409, false, `Timetable conflict: ${messages.join('; ')}`, { conflicts: conflictsByDay });
  }

  const now = new Date().toISOString();
  const rows = days.map((d) => ({
    school_id: schoolId,
    academic_year_id: yearId,
    term_id: term_id || null,
    class_id,
    learning_area_id,
    teacher_id,
    day: String(d).toLowerCase(),
    period_number: period_number || null,
    start_time,
    end_time,
    room: room || null,
    is_active: true,
    created_by: userId || null,
    created_at: now,
    updated_at: now,
  }));

  const { data: inserted, error } = await supabase
    .from('timetable_slots')
    .insert(rows)
    .select(`
      id, day, period_number, start_time, end_time, room, class_id, teacher_id, learning_area_id,
      teacher:teacher_id ( id, user_id, users:user_id ( first_name, last_name ) ),
      learning_area:learning_area_id ( id, name, code )
    `);

  if (error) {
    logger.error('Failed to create timetable slot(s)', { error: error.message });
    return respond(res, 500, false, 'Failed to create timetable slot(s)', null, error.message);
  }

  return respond(res, 201, true, 'Timetable slot(s) created', { slots: inserted });
});

// =============================================================================
// POST /api/v1/timetable/copy
//   Body: { source_academic_year_id, source_term_id, target_academic_year_id*,
//            target_term_id, class_ids, overwrite }
//   Bulk-copies every active lesson from one term/year into another so the
//   admin doesn't have to rebuild the whole grid from scratch each term —
//   only tweak what's different. `class_ids` limits the copy to specific
//   classes (defaults to every class that has lessons in the source
//   period). `overwrite` (default false) clears each copied class's
//   existing lessons in the target period first; otherwise a source lesson
//   that would conflict with something already in the target is skipped
//   (not overwritten) and reported back.
// =============================================================================
const copyTimetable = asyncHandler(async (req, res) => {
  const { schoolId, id: userId } = req.user;
  const {
    source_academic_year_id, source_term_id,
    target_academic_year_id, target_term_id,
    class_ids, overwrite,
  } = req.body;

  if (!target_academic_year_id) {
    return respond(res, 400, false, 'target_academic_year_id is required');
  }

  let sourceYearId = source_academic_year_id;
  if (!sourceYearId) {
    const current = await getCurrentAcademicYear(schoolId);
    if (current) sourceYearId = current.id;
  }
  if (!sourceYearId) {
    return respond(res, 404, false, 'No current academic year found. Pass source_academic_year_id explicitly.');
  }

  if (sourceYearId === target_academic_year_id && (source_term_id || null) === (target_term_id || null)) {
    return respond(res, 400, false, 'Source and target must be a different term or academic year.');
  }

  // ── Pull every active lesson in the source period (optionally limited
  //    to specific classes) ────────────────────────────────────────────
  let sourceQuery = supabase
    .from('timetable_slots')
    .select(`
      day, period_number, start_time, end_time, room, class_id, teacher_id, learning_area_id,
      class:class_id ( id, grade_level, stream_name ),
      teacher:teacher_id ( id, user_id, users:user_id ( first_name, last_name ) ),
      learning_area:learning_area_id ( id, name )
    `)
    .eq('school_id', schoolId)
    .eq('academic_year_id', sourceYearId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('day')
    .order('start_time');
  if (source_term_id) sourceQuery = sourceQuery.eq('term_id', source_term_id);
  if (Array.isArray(class_ids) && class_ids.length) sourceQuery = sourceQuery.in('class_id', class_ids);

  const { data: sourceSlots, error: sourceError } = await sourceQuery;
  if (sourceError) {
    logger.error('Failed to fetch source timetable for copy', { error: sourceError.message });
    return respond(res, 500, false, 'Failed to fetch the source timetable', null, sourceError.message);
  }
  if (!sourceSlots || !sourceSlots.length) {
    return respond(res, 404, false, 'No timetable lessons found for the source term/year (with the given class filter, if any).');
  }

  const copiedClassIds = [...new Set(sourceSlots.map((s) => s.class_id))];

  // ── Optionally clear out whatever the copied classes already have in
  //    the target period, before inserting the copies ──────────────────
  if (overwrite === true) {
    let clearQuery = supabase
      .from('timetable_slots')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('school_id', schoolId)
      .eq('academic_year_id', target_academic_year_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .in('class_id', copiedClassIds);
    if (target_term_id) clearQuery = clearQuery.eq('term_id', target_term_id);
    const { error: clearError } = await clearQuery;
    if (clearError) {
      logger.error('Failed to clear target timetable before copy', { error: clearError.message });
      return respond(res, 500, false, 'Failed to clear the target timetable before copying', null, clearError.message);
    }
  }

  // ── Load whatever's still active in the target period (across the
  //    whole school, not just the copied classes — a teacher or room
  //    already booked by an untouched class still counts as a conflict)
  //    and the target's per-day lesson caps, so conflicts and full days
  //    can be checked in memory instead of one query per source lesson. ──
  let targetQuery = supabase
    .from('timetable_slots')
    .select('id, day, start_time, end_time, room, class_id, teacher_id')
    .eq('school_id', schoolId)
    .eq('academic_year_id', target_academic_year_id)
    .eq('is_active', true)
    .is('deleted_at', null);
  if (target_term_id) targetQuery = targetQuery.eq('term_id', target_term_id);

  const [{ data: targetSlots, error: targetError }, { data: settingsRows }] = await Promise.all([
    targetQuery,
    supabase
      .from('timetable_day_settings')
      .select('day, lessons_count')
      .eq('school_id', schoolId)
      .eq('academic_year_id', target_academic_year_id),
  ]);
  if (targetError) {
    logger.error('Failed to fetch target timetable for copy', { error: targetError.message });
    return respond(res, 500, false, 'Failed to fetch the target timetable', null, targetError.message);
  }

  const limitByDay = {};
  DAYS.forEach((d) => { limitByDay[d] = 8; });
  (settingsRows || []).forEach((r) => { limitByDay[r.day] = r.lessons_count; });

  // In-memory working copy of the target grid — updated as each source
  // lesson is accepted, so later lessons are checked against earlier ones
  // copied in this same batch too (e.g. Maths repeated every weekday).
  const working = (targetSlots || []).map((s) => ({ ...s }));
  const classDayCount = {};
  working.forEach((s) => {
    const key = `${s.class_id}|${s.day}`;
    classDayCount[key] = (classDayCount[key] || 0) + 1;
  });

  const describeSourceSlot = (s) => ({
    class: s.class ? `${s.class.grade_level}${s.class.stream_name ? ' ' + s.class.stream_name : ''}` : null,
    teacher: s.teacher?.users ? `${s.teacher.users.first_name} ${s.teacher.users.last_name}` : null,
    learning_area: s.learning_area?.name || null,
    day: s.day,
    start_time: s.start_time,
    end_time: s.end_time,
    room: s.room || null,
  });

  const toInsert = [];
  const skipped = [];
  const now = new Date().toISOString();

  sourceSlots.forEach((s) => {
    const info = describeSourceSlot(s);
    const dayKey = `${s.class_id}|${s.day}`;
    const limit = limitByDay[s.day] ?? 8;

    if ((classDayCount[dayKey] || 0) >= limit) {
      skipped.push({ ...info, reason: `${s.day} is already full for this class in the target period (limit ${limit}).` });
      return;
    }

    const sameDay = working.filter((w) => w.day === s.day);
    const classConflict = sameDay.find((w) => w.class_id === s.class_id && overlaps(s.start_time, s.end_time, w.start_time, w.end_time));
    if (classConflict) {
      skipped.push({ ...info, reason: 'This class already has a lesson at that time in the target period.' });
      return;
    }
    const teacherConflict = sameDay.find((w) => w.teacher_id === s.teacher_id && overlaps(s.start_time, s.end_time, w.start_time, w.end_time));
    if (teacherConflict) {
      skipped.push({ ...info, reason: 'This teacher is already booked at that time in the target period.' });
      return;
    }
    const trimmedRoom = typeof s.room === 'string' ? s.room.trim() : '';
    if (trimmedRoom) {
      const roomConflict = sameDay.find(
        (w) => w.room && w.room.trim().toLowerCase() === trimmedRoom.toLowerCase()
          && w.class_id !== s.class_id && w.teacher_id !== s.teacher_id
          && overlaps(s.start_time, s.end_time, w.start_time, w.end_time)
      );
      if (roomConflict) {
        skipped.push({ ...info, reason: `Room ${s.room} is already booked at that time in the target period.` });
        return;
      }
    }

    const newRow = {
      school_id: schoolId,
      academic_year_id: target_academic_year_id,
      term_id: target_term_id || null,
      class_id: s.class_id,
      learning_area_id: s.learning_area_id,
      teacher_id: s.teacher_id,
      day: s.day,
      period_number: s.period_number || null,
      start_time: s.start_time,
      end_time: s.end_time,
      room: s.room || null,
      is_active: true,
      created_by: userId || null,
      created_at: now,
      updated_at: now,
    };
    toInsert.push(newRow);

    // Reflect this lesson in the in-memory grid immediately so subsequent
    // source lessons see it too.
    working.push({ day: s.day, start_time: s.start_time, end_time: s.end_time, room: s.room, class_id: s.class_id, teacher_id: s.teacher_id });
    classDayCount[dayKey] = (classDayCount[dayKey] || 0) + 1;
  });

  let inserted = [];
  if (toInsert.length) {
    const { data, error: insertError } = await supabase
      .from('timetable_slots')
      .insert(toInsert)
      .select('id');
    if (insertError) {
      logger.error('Failed to insert copied timetable slots', { error: insertError.message });
      return respond(res, 500, false, 'Failed to copy the timetable', null, insertError.message);
    }
    inserted = data || [];
  }

  return respond(res, 200, true, `Copied ${inserted.length} of ${sourceSlots.length} lesson(s)${skipped.length ? `; ${skipped.length} skipped due to conflicts` : ''}`, {
    total_source: sourceSlots.length,
    copied: inserted.length,
    skipped_count: skipped.length,
    skipped,
    target_academic_year_id,
    target_term_id: target_term_id || null,
    classes_copied: copiedClassIds.length,
  });
});

// =============================================================================
// PUT /api/v1/timetable/:id
//   Body (any of): { day, start_time, end_time, teacher_id, learning_area_id,
//                      room, period_number, is_active }
//   Re-runs the same conflict checks against everything except itself.
// =============================================================================
const updateSlot = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;
  const { day, start_time, end_time, teacher_id, learning_area_id, room, period_number, is_active } = req.body;

  const { data: existing } = await supabase
    .from('timetable_slots')
    .select('*')
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) {
    return respond(res, 404, false, 'Timetable slot not found');
  }

  const nextDay = day ? String(day).toLowerCase() : existing.day;
  const nextStart = start_time || existing.start_time;
  const nextEnd = end_time || existing.end_time;
  const nextTeacher = teacher_id || existing.teacher_id;
  const nextClass = existing.class_id; // class is not changeable on an existing slot
  const nextRoom = room !== undefined ? room : existing.room;

  if (day && !DAYS.includes(nextDay)) {
    return respond(res, 400, false, `Invalid day: ${day}. Must be one of ${DAYS.join(', ')}.`);
  }
  if (nextStart >= nextEnd) {
    return respond(res, 400, false, 'start_time must be before end_time');
  }

  if (typeof is_active === 'boolean' && is_active === false) {
    // Deactivating never conflicts with anything.
  } else {
    const { classConflicts, teacherConflicts, roomConflicts } = await findConflicts({
      schoolId,
      academicYearId: existing.academic_year_id,
      day: nextDay,
      startTime: nextStart,
      endTime: nextEnd,
      classId: nextClass,
      teacherId: nextTeacher,
      room: nextRoom,
      excludeId: id,
    });

    if (classConflicts.length) {
      const cc = formatConflict(classConflicts[0]);
      return respond(res, 409, false, `Timetable conflict: this class already has ${cc.learning_area || 'a lesson'} booked ${cc.start_time}–${cc.end_time} on ${nextDay}`, { conflicts: classConflicts.map(formatConflict) });
    }
    if (teacherConflicts.length) {
      const tc = formatConflict(teacherConflicts[0]);
      return respond(res, 409, false, `Timetable conflict: this teacher is already teaching ${tc.learning_area || 'another lesson'} in ${tc.class || 'another class'} at ${tc.start_time}–${tc.end_time} on ${nextDay}`, { conflicts: teacherConflicts.map(formatConflict) });
    }
    if (roomConflicts.length) {
      const rc = formatConflict(roomConflicts[0]);
      return respond(res, 409, false, `Timetable conflict: room ${rc.room} is already booked for ${rc.learning_area || 'another lesson'} (${rc.class || 'another class'}) at ${rc.start_time}–${rc.end_time} on ${nextDay}`, { conflicts: roomConflicts.map(formatConflict) });
    }
  }

  const updates = { updated_at: new Date().toISOString() };
  if (day) updates.day = nextDay;
  if (start_time) updates.start_time = start_time;
  if (end_time) updates.end_time = end_time;
  if (teacher_id) updates.teacher_id = teacher_id;
  if (learning_area_id) updates.learning_area_id = learning_area_id;
  if (room !== undefined) updates.room = room;
  if (period_number !== undefined) updates.period_number = period_number;
  if (typeof is_active === 'boolean') updates.is_active = is_active;

  const { data: updated, error } = await supabase
    .from('timetable_slots')
    .update(updates)
    .eq('id', id)
    .select(`
      id, day, period_number, start_time, end_time, room, class_id, teacher_id, learning_area_id, is_active,
      teacher:teacher_id ( id, user_id, users:user_id ( first_name, last_name ) ),
      learning_area:learning_area_id ( id, name, code )
    `)
    .single();

  if (error) {
    logger.error('Failed to update timetable slot', { error: error.message });
    return respond(res, 500, false, 'Failed to update timetable slot', null, error.message);
  }

  return respond(res, 200, true, 'Timetable slot updated', { slot: updated });
});

// =============================================================================
// DELETE /api/v1/timetable/:id
//   Soft-delete: sets deleted_at + is_active = false.
// =============================================================================
const deleteSlot = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const { data: existing } = await supabase
    .from('timetable_slots')
    .select('id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) {
    return respond(res, 404, false, 'Timetable slot not found');
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('timetable_slots')
    .update({ is_active: false, deleted_at: now, updated_at: now })
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete timetable slot', { error: error.message });
    return respond(res, 500, false, 'Failed to delete timetable slot', null, error.message);
  }

  return respond(res, 200, true, 'Timetable slot deleted');
});

// =============================================================================
// GET /api/v1/timetable/settings?academic_year_id=
//   "Timetable Setup" — how many lessons the admin has configured for each
//   day of the week (e.g. Monday: 8, Friday: 6). Days with nothing saved
//   yet default to 8 so a fresh school still sees a sensible number.
// =============================================================================
const getDaySettings = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { academic_year_id } = req.query;

  let yearId = academic_year_id;
  if (!yearId) {
    const current = await getCurrentAcademicYear(schoolId);
    if (current) yearId = current.id;
  }
  if (!yearId) {
    return respond(res, 404, false, 'No current academic year found. Pass academic_year_id explicitly.');
  }

  const { data: rows, error } = await supabase
    .from('timetable_day_settings')
    .select('day, lessons_count')
    .eq('school_id', schoolId)
    .eq('academic_year_id', yearId);

  if (error) {
    logger.error('Failed to fetch timetable day settings', { error: error.message });
    return respond(res, 500, false, 'Failed to fetch timetable day settings', null, error.message);
  }

  const byDay = {};
  (rows || []).forEach((r) => { byDay[r.day] = r.lessons_count; });
  const settings = DAYS.map((day) => ({ day, lessons_count: byDay[day] ?? 8 }));

  return respond(res, 200, true, 'Timetable day settings fetched', { academic_year_id: yearId, settings });
});

// =============================================================================
// PUT /api/v1/timetable/settings
//   Body: { academic_year_id, days: [{ day, lessons_count }, ...] }
//   Admin sets the number of lessons taught on each day of the week.
// =============================================================================
const updateDaySettings = asyncHandler(async (req, res) => {
  const { schoolId, id: userId } = req.user;
  const { academic_year_id, days } = req.body;

  if (!Array.isArray(days) || !days.length) {
    return respond(res, 400, false, 'days must be a non-empty array of { day, lessons_count }');
  }

  let yearId = academic_year_id;
  if (!yearId) {
    const current = await getCurrentAcademicYear(schoolId);
    if (current) yearId = current.id;
  }
  if (!yearId) {
    return respond(res, 404, false, 'No current academic year found. Pass academic_year_id explicitly.');
  }

  const invalidDay = days.find((d) => !DAYS.includes(String(d.day).toLowerCase()));
  if (invalidDay) {
    return respond(res, 400, false, `Invalid day: ${invalidDay.day}. Must be one of ${DAYS.join(', ')}.`);
  }
  const invalidCount = days.find((d) => !Number.isInteger(d.lessons_count) || d.lessons_count < 1 || d.lessons_count > 20);
  if (invalidCount) {
    return respond(res, 400, false, `lessons_count for ${invalidCount.day} must be a whole number between 1 and 20.`);
  }

  const now = new Date().toISOString();
  const rows = days.map((d) => ({
    school_id: schoolId,
    academic_year_id: yearId,
    day: String(d.day).toLowerCase(),
    lessons_count: d.lessons_count,
    updated_by: userId || null,
    updated_at: now,
  }));

  const { data: saved, error } = await supabase
    .from('timetable_day_settings')
    .upsert(rows, { onConflict: 'school_id,academic_year_id,day' })
    .select('day, lessons_count');

  if (error) {
    logger.error('Failed to update timetable day settings', { error: error.message });
    return respond(res, 500, false, 'Failed to update timetable day settings', null, error.message);
  }

  return respond(res, 200, true, 'Timetable day settings updated', { academic_year_id: yearId, settings: saved });
});

// =============================================================================
// GET /api/v1/timetable/periods
//   Lightweight list of academic years and terms for this school — powers
//   the Year/Term picker on the Print and Timetable Setup screens (e.g.
//   "print last term's timetable" or "plan next term's lesson counts"
//   without disturbing the current term's settings). Years and terms are
//   returned as two independent flat lists, the same way this controller
//   already resolves them separately in getSchoolTimetable/getPrintHeader —
//   there's no assumed academic_year_id link on academic_terms.
// =============================================================================
const getTimetablePeriods = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;

  const [{ data: years, error: yearsError }, { data: terms, error: termsError }] = await Promise.all([
    supabase
      .from('academic_years')
      .select('id, name, is_current')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('is_current', { ascending: false })
      .order('name', { ascending: false }),
    supabase
      .from('academic_terms')
      .select('id, name, is_current')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('is_current', { ascending: false })
      .order('name', { ascending: true }),
  ]);

  if (yearsError) {
    logger.error('Failed to fetch academic years for timetable picker', { error: yearsError.message });
    return respond(res, 500, false, 'Failed to fetch academic years', null, yearsError.message);
  }
  if (termsError) {
    logger.error('Failed to fetch academic terms for timetable picker', { error: termsError.message });
    return respond(res, 500, false, 'Failed to fetch academic terms', null, termsError.message);
  }

  return respond(res, 200, true, 'Timetable periods fetched', {
    academic_years: years || [],
    academic_terms: terms || [],
  });
});

module.exports = {
  getTimetable,
  createSlot,
  copyTimetable,
  updateSlot,
  deleteSlot,
  getDaySettings,
  updateDaySettings,
  getSchoolTimetable,
  getPrintHeader,
  getTeacherLoadReport,
  getCurriculumSyncReport,
  getTimetablePeriods,
};
