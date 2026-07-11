// =============================================================================
// attendance.controller.js
// Daily Learner Attendance
//
// Tables:  attendance_records, classes, learner_enrollments, learners
// Pattern: matches class.controller.js
// Auth:    Bearer JWT → req.user.schoolId / req.user.role / req.user.id
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

const VALID_STATUSES = ['present', 'absent', 'late', 'excused'];

const todayISO = () => new Date().toISOString().split('T')[0];

// -----------------------------------------------------------------------
// Guards against a teacher marking/viewing attendance for a class they
// are not assigned to. school_admin / super_admin are not restricted —
// they may act on any class within their own school (already enforced
// separately via school_id checks on the class itself).
// Returns true if access is allowed, otherwise sends a 403 and returns false.
// -----------------------------------------------------------------------
const ensureTeacherAssignedToClass = async (req, res, classId) => {
  const { schoolId, role, id: userId } = req.user;

  if (role !== 'teacher') return true; // admins are handled by class/school checks

  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (teacherError) {
    res.status(500).json({ success: false, message: 'Failed to verify teacher account', error: teacherError.message });
    return false;
  }
  if (!teacher) {
    res.status(404).json({ success: false, message: 'No teacher record found for this account' });
    return false;
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('teacher_assignments')
    .select('id')
    .eq('teacher_id', teacher.id)
    .eq('class_id', classId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (assignmentError) {
    res.status(500).json({ success: false, message: 'Failed to verify class assignment', error: assignmentError.message });
    return false;
  }
  if (!assignment) {
    res.status(403).json({ success: false, message: 'You are not assigned to this class' });
    return false;
  }

  return true;
};

// =============================================================================
// 1. GET /api/v1/attendance/class/:classId/roster
//    Query: date (defaults to today)
//    Returns the full enrolled roster for the class, merged with any
//    attendance already recorded for that date (so the UI can load &
//    update existing attendance instead of creating duplicates).
// =============================================================================
const getClassRoster = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { classId } = req.params;
  const attendanceDate = req.query.date || todayISO();

  // Verify class belongs to this school
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, grade_level, stream_name, school_id')
    .eq('id', classId)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (classError) {
    return res.status(500).json({ success: false, message: 'Failed to verify class', error: classError.message });
  }
  if (!classData) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  if (!(await ensureTeacherAssignedToClass(req, res, classId))) return;

  // Fetch enrolled learners for this class (no hardcoded data - live DB roster)
  const { data: enrollments, error: enrollError } = await supabase
    .from('learner_enrollments')
    .select(`
      id,
      learner_id,
      status,
      learners(
        id,
        first_name,
        last_name,
        admission_number,
        gender,
        profile_photo
      )
    `)
    .eq('class_id', classId)
    .eq('status', 'enrolled');

  if (enrollError) {
    return res.status(500).json({ success: false, message: 'Failed to fetch class roster', error: enrollError.message });
  }

  const roster = (enrollments || []).filter((e) => e.learners);
  const learnerIds = roster.map((e) => e.learner_id);

  // Fetch existing attendance for this class + date (if any)
  let attendanceByLearner = {};
  if (learnerIds.length > 0) {
    const { data: existingRecords, error: attError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('class_id', classId)
      .eq('attendance_date', attendanceDate)
      .in('learner_id', learnerIds);

    if (attError) {
      return res.status(500).json({ success: false, message: 'Failed to fetch attendance records', error: attError.message });
    }

    attendanceByLearner = (existingRecords || []).reduce((acc, r) => {
      acc[r.learner_id] = r;
      return acc;
    }, {});
  }

  const learners = roster
    .map((e) => {
      const learner = e.learners;
      const existing = attendanceByLearner[e.learner_id];
      return {
        enrollment_id: e.id,
        learner_id: e.learner_id,
        admission_number: learner.admission_number,
        first_name: learner.first_name,
        last_name: learner.last_name,
        gender: learner.gender || null,
        photo_url: learner.profile_photo || null,
        attendance_id: existing?.id || null,
        status: existing?.status || null,
        arrival_time: existing?.arrival_time || null,
        remarks: existing?.remarks || '',
      };
    })
    .sort((a, b) =>
      `${a.first_name || ''} ${a.last_name || ''}`.localeCompare(
        `${b.first_name || ''} ${b.last_name || ''}`
      )
    );

  const total = learners.length;
  const present = learners.filter((l) => l.status === 'present').length;
  const absent = learners.filter((l) => l.status === 'absent').length;
  const late = learners.filter((l) => l.status === 'late').length;
  const excused = learners.filter((l) => l.status === 'excused').length;
  const marked = present + absent + late + excused;
  const attendance_rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return res.json({
    success: true,
    data: {
      class: classData,
      date: attendanceDate,
      already_marked: marked > 0,
      summary: { total, present, absent, late, excused, marked, attendance_rate },
      learners,
    },
  });
});

// =============================================================================
// 2. POST /api/v1/attendance/class/:classId
//    Body: { attendance_date, records: [{ learner_id, status, arrival_time, remarks }] }
//    Upserts attendance so re-saving the same class + date updates the
//    existing rows instead of creating duplicates.
// =============================================================================
const saveClassAttendance = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { classId } = req.params;
  const { attendance_date, records } = req.body;

  if (!['school_admin', 'super_admin', 'teacher'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  if (!attendance_date) {
    return res.status(400).json({ success: false, message: 'attendance_date is required' });
  }
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, message: 'records array is required' });
  }

  // Verify class belongs to this school
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (classError) {
    return res.status(500).json({ success: false, message: 'Failed to verify class', error: classError.message });
  }
  if (!classData) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  if (!(await ensureTeacherAssignedToClass(req, res, classId))) return;

  // Validate each record
  for (const r of records) {
    if (!r.learner_id) {
      return res.status(400).json({ success: false, message: 'Each record requires a learner_id' });
    }
    if (!VALID_STATUSES.includes(r.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${r.status}" for learner ${r.learner_id}. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }
  }

  const rows = records.map((r) => ({
    school_id: schoolId,
    class_id: classId,
    learner_id: r.learner_id,
    attendance_date,
    status: r.status,
    arrival_time: r.arrival_time || null,
    remarks: r.remarks?.trim() || null,
    marked_by: userId || null,
    updated_at: new Date().toISOString(),
  }));

  // Upsert on (class_id, learner_id, attendance_date) so saving twice for
  // the same class/date updates existing rows rather than duplicating them.
  const { data: saved, error } = await supabase
    .from('attendance_records')
    .upsert(rows, { onConflict: 'class_id,learner_id,attendance_date' })
    .select('*');

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to save attendance', error: error.message });
  }

  return res.json({
    success: true,
    message: `Attendance saved for ${saved.length} learner(s)`,
    data: { saved_count: saved.length, records: saved },
  });
});

// =============================================================================
// 3. GET /api/v1/attendance/teachers/roster
//    Query: date (defaults to today)
//    Returns every active teacher for the school, merged with any
//    attendance already recorded for that date. Mirrors getClassRoster
//    but for teachers/staff instead of a class of learners.
// =============================================================================
const getTeacherRoster = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const attendanceDate = req.query.date || todayISO();

  const { data: teacherRows, error: teacherError } = await supabase
    .from('teachers')
    .select(`
      id,
      designation,
      is_active,
      photo,
      tsc_number,
      user:user_id ( id, first_name, last_name, email )
    `)
    .eq('school_id', schoolId)
    .eq('is_active', true);

  if (teacherError) {
    return res.status(500).json({ success: false, message: 'Failed to fetch teachers', error: teacherError.message });
  }

  const teachers = (teacherRows || []).filter((t) => t.user);
  const teacherIds = teachers.map((t) => t.id);

  let attendanceByTeacher = {};
  if (teacherIds.length > 0) {
    const { data: existingRecords, error: attError } = await supabase
      .from('teacher_attendance_records')
      .select('*')
      .eq('school_id', schoolId)
      .eq('attendance_date', attendanceDate)
      .in('teacher_id', teacherIds);

    if (attError) {
      return res.status(500).json({ success: false, message: 'Failed to fetch teacher attendance records', error: attError.message });
    }

    attendanceByTeacher = (existingRecords || []).reduce((acc, r) => {
      acc[r.teacher_id] = r;
      return acc;
    }, {});
  }

  const roster = teachers
    .map((t) => {
      const existing = attendanceByTeacher[t.id];
      return {
        teacher_id: t.id,
        staff_number: t.tsc_number || null,
        first_name: t.user.first_name,
        last_name: t.user.last_name,
        email: t.user.email,
        designation: t.designation || null,
        photo_url: t.photo || null,
        attendance_id: existing?.id || null,
        status: existing?.status || null,
        check_in_time: existing?.check_in_time || null,
        check_out_time: existing?.check_out_time || null,
        remarks: existing?.remarks || '',
      };
    })
    .sort((a, b) =>
      `${a.first_name || ''} ${a.last_name || ''}`.localeCompare(
        `${b.first_name || ''} ${b.last_name || ''}`
      )
    );

  const total = roster.length;
  const present = roster.filter((t) => t.status === 'present').length;
  const absent = roster.filter((t) => t.status === 'absent').length;
  const late = roster.filter((t) => t.status === 'late').length;
  const excused = roster.filter((t) => t.status === 'excused').length;
  const marked = present + absent + late + excused;
  const attendance_rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return res.json({
    success: true,
    data: {
      date: attendanceDate,
      already_marked: marked > 0,
      summary: { total, present, absent, late, excused, marked, attendance_rate },
      teachers: roster,
    },
  });
});

// =============================================================================
// 4. POST /api/v1/attendance/teachers
//    Body: { attendance_date, records: [{ teacher_id, status, check_in_time, check_out_time, remarks }] }
//    Upserts teacher attendance so re-saving the same date updates the
//    existing rows instead of creating duplicates.
// =============================================================================
const saveTeacherAttendance = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { attendance_date, records } = req.body;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  if (!attendance_date) {
    return res.status(400).json({ success: false, message: 'attendance_date is required' });
  }
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, message: 'records array is required' });
  }

  for (const r of records) {
    if (!r.teacher_id) {
      return res.status(400).json({ success: false, message: 'Each record requires a teacher_id' });
    }
    if (!VALID_STATUSES.includes(r.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${r.status}" for teacher ${r.teacher_id}. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }
  }

  // Verify every teacher belongs to this school before writing anything.
  const teacherIds = records.map((r) => r.teacher_id);
  const { data: validTeachers, error: verifyError } = await supabase
    .from('teachers')
    .select('id')
    .eq('school_id', schoolId)
    .in('id', teacherIds);

  if (verifyError) {
    return res.status(500).json({ success: false, message: 'Failed to verify teachers', error: verifyError.message });
  }
  const validIds = new Set((validTeachers || []).map((t) => t.id));
  const invalid = teacherIds.filter((id) => !validIds.has(id));
  if (invalid.length > 0) {
    return res.status(404).json({ success: false, message: `Teacher(s) not found in this school: ${invalid.join(', ')}` });
  }

  const rows = records.map((r) => ({
    school_id: schoolId,
    teacher_id: r.teacher_id,
    attendance_date,
    status: r.status,
    check_in_time: r.check_in_time || null,
    check_out_time: r.check_out_time || null,
    remarks: r.remarks?.trim() || null,
    marked_by: userId || null,
    updated_at: new Date().toISOString(),
  }));

  const { data: saved, error } = await supabase
    .from('teacher_attendance_records')
    .upsert(rows, { onConflict: 'teacher_id,attendance_date' })
    .select('*');

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to save teacher attendance', error: error.message });
  }

  return res.json({
    success: true,
    message: `Attendance saved for ${saved.length} teacher(s)`,
    data: { saved_count: saved.length, records: saved },
  });
});

// =============================================================================
// 5. GET /api/v1/attendance/learner/:learnerId/summary
//    Query: term_id (optional, defaults to the school's current term)
//    Returns attendance stats + recent history for ONE learner. Used by the
//    Parent Portal dashboard ("Attendance summary" card) and can equally be
//    called by a teacher/admin looking at a single learner's record, or by
//    a student viewing their own.
//
//    Authorization mirrors getLearnerResults in results.controller.js:
//      - parent  -> must have a learner_parents link to this exact learner
//      - student -> may only ever view their OWN record (id resolved from
//                   their own login, URL param is ignored)
//      - teacher/school_admin/super_admin -> any learner in their own school
// =============================================================================
const getLearnerAttendanceSummary = asyncHandler(async (req, res) => {
  const { schoolId, id: userId, role } = req.user;
  let { learnerId } = req.params;
  const { term_id } = req.query;

  if (role === 'student') {
    const admissionNumber = (req.user.email || '').split('@')[0];
    const { data: ownLearner } = await supabase
      .from('learners')
      .select('id')
      .eq('admission_number', admissionNumber)
      .eq('school_id', schoolId)
      .maybeSingle();

    if (!ownLearner) {
      return res.status(404).json({ success: false, message: 'Learner not found' });
    }
    learnerId = ownLearner.id;
  }

  // Look up the learner. Parents are authorized via learner_parents below
  // rather than school_id equality — same reasoning documented in
  // results.controller.js's getLearnerResults.
  let learnerQuery = supabase
    .from('learners')
    .select('id, first_name, last_name, admission_number')
    .eq('id', learnerId);

  if (role !== 'parent') {
    learnerQuery = learnerQuery.eq('school_id', schoolId);
  }

  const { data: learner } = await learnerQuery.maybeSingle();

  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  if (role === 'parent') {
    const { data: parentRow } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: link } = parentRow
      ? await supabase
          .from('learner_parents')
          .select('id')
          .eq('parent_id', parentRow.id)
          .eq('learner_id', learnerId)
          .maybeSingle()
      : { data: null };

    if (!link) {
      return res.status(403).json({ success: false, message: "Not authorized to view this learner's attendance" });
    }
  }

  // Resolve which term to scope the summary to: the one requested, or
  // whichever the school has flagged as current. Falls back to "all time"
  // (no date filter) if the school has no terms set up yet.
  let term = null;
  if (term_id) {
    const { data } = await supabase
      .from('academic_terms')
      .select('id, name, year, start_date, end_date')
      .eq('id', term_id)
      .eq('school_id', schoolId)
      .maybeSingle();
    term = data || null;
  } else {
    const { data } = await supabase
      .from('academic_terms')
      .select('id, name, year, start_date, end_date')
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .maybeSingle();
    term = data || null;
  }

  let recordsQuery = supabase
    .from('attendance_records')
    .select('attendance_date, status, arrival_time, remarks')
    .eq('learner_id', learnerId)
    .order('attendance_date', { ascending: false });

  if (term) {
    recordsQuery = recordsQuery
      .gte('attendance_date', term.start_date)
      .lte('attendance_date', term.end_date);
  }

  const { data: records, error: recordsError } = await recordsQuery;

  if (recordsError) {
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance records', error: recordsError.message });
  }

  const all = records || [];
  const total = all.length;
  const present = all.filter((r) => r.status === 'present').length;
  const absent = all.filter((r) => r.status === 'absent').length;
  const late = all.filter((r) => r.status === 'late').length;
  const excused = all.filter((r) => r.status === 'excused').length;
  const attendance_rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return res.json({
    success: true,
    data: {
      learner: { id: learner.id, first_name: learner.first_name, last_name: learner.last_name, admission_number: learner.admission_number },
      term,
      summary: { total_days: total, present, absent, late, excused, attendance_rate },
      recent_records: all.slice(0, 10),
    },
  });
});

module.exports = {
  getClassRoster,
  saveClassAttendance,
  getTeacherRoster,
  saveTeacherAttendance,
  getLearnerAttendanceSummary,
};
