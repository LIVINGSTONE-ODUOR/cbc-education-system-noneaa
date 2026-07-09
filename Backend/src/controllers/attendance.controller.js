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

module.exports = {
  getClassRoster,
  saveClassAttendance,
};
