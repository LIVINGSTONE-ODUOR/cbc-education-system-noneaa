// =============================================================================
// studentProfile.controller.js
// Teacher Portal — "Student Profile" screen.
//
// Tables read:  learners, learner_enrollments, learner_parents,
//               attendance_records, exam_results, learner_discipline_records,
//               learner_notes, teacher_assignments
// Auth:         Bearer JWT → req.user.id / req.user.schoolId / req.user.role
//
// Both endpoints are teacher-scoped: a teacher can only view/annotate a
// learner who is currently enrolled in a class that teacher is assigned to.
// This mirrors the existing getMyClassStudents check in teacher.controller.js.
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------------------------------------------------------------------------
// Helper: resolve the logged-in user's teacher record, and confirm they're
// assigned to the class the given learner is currently enrolled in.
// Returns { teacher, classId } on success, or null (with a response already
// sent) on failure.
// ---------------------------------------------------------------------------
const assertTeacherCanAccessLearner = async (req, res, learnerId) => {
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

  const { data: enrollment, error: enrollErr } = await supabase
    .from('learner_enrollments')
    .select('class_id, learners:learner_id ( id, school_id )')
    .eq('learner_id', learnerId)
    .eq('status', 'enrolled')
    .maybeSingle();

  if (enrollErr || !enrollment || !enrollment.learners || enrollment.learners.school_id !== schoolId) {
    res.status(404).json({ success: false, message: 'Student not found' });
    return null;
  }

  const { data: assignment } = await supabase
    .from('teacher_assignments')
    .select('id')
    .eq('teacher_id', teacher.id)
    .eq('class_id', enrollment.class_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (!assignment) {
    res.status(403).json({ success: false, message: 'You are not assigned to this student\'s class' });
    return null;
  }

  return { teacher, classId: enrollment.class_id };
};

// =============================================================================
// GET /api/v1/teachers/me/students/:learnerId
// Full profile: photo, admission no., parents, medical info, attendance
// history, discipline records, academic history, comments & teacher notes.
// =============================================================================
const getStudentProfile = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { learnerId } = req.params;

  const access = await assertTeacherCanAccessLearner(req, res, learnerId);
  if (!access) return; // response already sent
  const { classId } = access;

  const { data: learner, error: learnerErr } = await supabase
    .from('learners')
    .select(`
      id, admission_number, first_name, last_name, profile_photo,
      date_of_birth, gender, medical_conditions, allergies, special_needs
    `)
    .eq('id', learnerId)
    .eq('school_id', schoolId)
    .single();

  if (learnerErr || !learner) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  // Parents / guardians (all linked, not just primary)
  const { data: parentLinks } = await supabase
    .from('learner_parents')
    .select(`
      is_primary, relationship,
      parent:parent_id ( id, first_name, last_name, phone_number, email )
    `)
    .eq('learner_id', learnerId);

  const parents = (parentLinks || [])
    .filter((link) => link.parent)
    .map((link) => ({
      name: `${link.parent.first_name || ''} ${link.parent.last_name || ''}`.trim() || null,
      phone: link.parent.phone_number || null,
      email: link.parent.email || null,
      relationship: link.relationship || null,
      is_primary: !!link.is_primary,
    }));

  // Attendance history — most recent 60 records, plus a summary rate
  const { data: attendanceRows } = await supabase
    .from('attendance_records')
    .select('attendance_date, status, remarks')
    .eq('learner_id', learnerId)
    .order('attendance_date', { ascending: false })
    .limit(60);

  const attendanceHistory = attendanceRows || [];
  const presentCount = attendanceHistory.filter((r) => r.status === 'present' || r.status === 'late').length;
  const attendanceRate = attendanceHistory.length
    ? Math.round((presentCount / attendanceHistory.length) * 100)
    : null;

  // Academic history — full exam result list (not just this class's average)
  const { data: resultRows } = await supabase
    .from('exam_results')
    .select(`
      marks_obtained, max_marks, is_absent,
      learning_areas:learning_area_id ( name ),
      exams:exam_id ( exam_name, start_date, exam_type )
    `)
    .eq('school_id', schoolId)
    .eq('learner_id', learnerId)
    .order('created_at', { ascending: false });

  const academicHistory = (resultRows || [])
    .filter((r) => !r.is_absent && r.max_marks)
    .map((r) => ({
      exam_name: r.exams?.exam_name || 'Unknown exam',
      exam_type: r.exams?.exam_type || null,
      date: r.exams?.start_date || null,
      subject: r.learning_areas?.name || 'Unknown',
      score_percent: Math.round((Number(r.marks_obtained) / Number(r.max_marks)) * 1000) / 10,
    }));

  // Discipline records
  const { data: disciplineRows } = await supabase
    .from('learner_discipline_records')
    .select('id, incident_date, category, description, action_taken, recorded_by:recorded_by ( first_name, last_name )')
    .eq('learner_id', learnerId)
    .is('deleted_at', null)
    .order('incident_date', { ascending: false });

  const discipline = (disciplineRows || []).map((d) => ({
    id: d.id,
    date: d.incident_date,
    category: d.category,
    description: d.description,
    action_taken: d.action_taken,
    recorded_by: d.recorded_by ? `${d.recorded_by.first_name || ''} ${d.recorded_by.last_name || ''}`.trim() : null,
  }));

  // Notes — comments + teacher notes
  const { data: noteRows } = await supabase
    .from('learner_notes')
    .select('id, note_type, content, created_at, author:author_id ( first_name, last_name )')
    .eq('learner_id', learnerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const notes = (noteRows || []).map((n) => ({
    id: n.id,
    note_type: n.note_type,
    content: n.content,
    created_at: n.created_at,
    author: n.author ? `${n.author.first_name || ''} ${n.author.last_name || ''}`.trim() : 'Unknown',
  }));

  res.json({
    success: true,
    data: {
      learner_id: learner.id,
      admission_number: learner.admission_number,
      name: `${learner.first_name} ${learner.last_name}`.trim(),
      photo: learner.profile_photo || null,
      date_of_birth: learner.date_of_birth,
      gender: learner.gender,
      medical: {
        conditions: learner.medical_conditions || null,
        allergies: learner.allergies || null,
        special_needs: learner.special_needs || null,
      },
      parents,
      attendance: { rate: attendanceRate, history: attendanceHistory },
      academic_history: academicHistory,
      discipline,
      notes,
    },
  });
});

// =============================================================================
// POST /api/v1/teachers/me/students/:learnerId/notes
// Add a comment or a private teacher note.
// Body: { note_type: 'comment' | 'teacher_note', content: string }
// =============================================================================
const addStudentNote = asyncHandler(async (req, res) => {
  const { schoolId, id: userId } = req.user;
  const { learnerId } = req.params;
  const { note_type, content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Note content is required' });
  }
  if (!['comment', 'teacher_note'].includes(note_type)) {
    return res.status(400).json({ success: false, message: "note_type must be 'comment' or 'teacher_note'" });
  }

  const access = await assertTeacherCanAccessLearner(req, res, learnerId);
  if (!access) return; // response already sent
  const { classId } = access;

  const { data: note, error } = await supabase
    .from('learner_notes')
    .insert({
      school_id: schoolId,
      learner_id: learnerId,
      class_id: classId,
      author_id: userId,
      note_type,
      content: content.trim(),
    })
    .select('id, note_type, content, created_at')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to save note', error: error.message });
  }

  res.status(201).json({ success: true, data: note });
});

module.exports = {
  getStudentProfile,
  addStudentNote,
};
