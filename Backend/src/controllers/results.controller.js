// =============================================================================
// results.controller.js
// Final Results — enter, view, search & compare learner exam results
//
// Table:   exam_results
// Joins:   learners, learning_areas (subjects), exams, classes
// Pattern: matches exam.controller.js
// Auth:    Bearer JWT → req.user.schoolId / req.user.role
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CAN_WRITE = ['school_admin', 'super_admin', 'teacher'];

// ---------------------------------------------------------------------------
// Helper: resolve the calling user's own teacher_id from their JWT user id.
// Returns null if they have no teacher record in this school.
// ---------------------------------------------------------------------------
const resolveTeacherId = async (schoolId, userId) => {
  const { data } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();
  return data?.id || null;
};

// ---------------------------------------------------------------------------
// Helper: is this teacher actively assigned to teach `learningAreaId` in
// `classId`? Used to gate marks entry/viewing so a teacher can only touch
// results for their own subject(s) and class(es).
// ---------------------------------------------------------------------------
const isTeacherAssigned = async (teacherId, classId, learningAreaId) => {
  if (!teacherId || !classId || !learningAreaId) return false;
  const { data } = await supabase
    .from('teacher_assignments')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('class_id', classId)
    .eq('learning_area_id', learningAreaId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();
  return Boolean(data);
};

const RESULT_SELECT = `
  id, school_id, exam_id, learner_id, learning_area_id, class_id, term_id,
  marks_obtained, max_marks, percentage, performance_level, remarks, is_absent,
  created_at, updated_at,
  learners:learner_id ( id, first_name, last_name, admission_number ),
  learning_areas:learning_area_id ( id, name, code ),
  exams:exam_id ( id, exam_name, exam_type, term_id, start_date ),
  classes:class_id ( id, grade_level, stream_name )
`;

// ---------------------------------------------------------------------------
// Helper: build exam-level summaries (subjects + totals + class position)
// for one learner, across one or more exams.
// ---------------------------------------------------------------------------
const buildLearnerSummaries = async (schoolId, learnerId, examIds = null) => {
  let query = supabase
    .from('exam_results')
    .select(RESULT_SELECT)
    .eq('school_id', schoolId)
    .eq('learner_id', learnerId);

  if (examIds && examIds.length) {
    query = query.in('exam_id', examIds);
  }

  const { data: rows, error } = await query;
  if (error) throw error;

  const byExam = {};
  (rows || []).forEach((row) => {
    const key = row.exam_id;
    if (!byExam[key]) {
      byExam[key] = {
        exam_id: row.exam_id,
        exam: row.exams,
        class_id: row.class_id,
        subjects: [],
        total_marks: 0,
        total_max: 0,
      };
    }
    byExam[key].subjects.push({
      learning_area: row.learning_areas,
      marks_obtained: row.marks_obtained,
      max_marks: row.max_marks,
      percentage: row.percentage,
      performance_level: row.performance_level,
      is_absent: row.is_absent,
      remarks: row.remarks,
    });
    if (!row.is_absent) {
      byExam[key].total_marks += Number(row.marks_obtained);
      byExam[key].total_max += Number(row.max_marks);
    }
  });

  const summaries = await Promise.all(
    Object.values(byExam).map(async (exam) => {
      const average = exam.total_max > 0 ? (exam.total_marks / exam.total_max) * 100 : 0;

      // Class position: rank this learner among classmates who sat the same exam
      let position = null;
      let class_size = null;
      if (exam.class_id) {
        const { data: classRows } = await supabase
          .from('exam_results')
          .select('learner_id, marks_obtained, max_marks, is_absent')
          .eq('school_id', schoolId)
          .eq('exam_id', exam.exam_id)
          .eq('class_id', exam.class_id);

        if (classRows && classRows.length) {
          const totals = {};
          classRows.forEach((r) => {
            if (r.is_absent) return;
            if (!totals[r.learner_id]) totals[r.learner_id] = { marks: 0, max: 0 };
            totals[r.learner_id].marks += Number(r.marks_obtained);
            totals[r.learner_id].max += Number(r.max_marks);
          });
          const ranked = Object.entries(totals)
            .map(([learner_id, t]) => ({
              learner_id,
              average: t.max > 0 ? (t.marks / t.max) * 100 : 0,
            }))
            .sort((a, b) => b.average - a.average);

          class_size = ranked.length;
          const idx = ranked.findIndex((r) => r.learner_id === learnerId);
          position = idx >= 0 ? idx + 1 : null;
        }
      }

      return {
        exam_id: exam.exam_id,
        exam: exam.exam,
        total_marks: exam.total_marks,
        total_max: exam.total_max,
        average_percentage: Math.round(average * 100) / 100,
        overall_grade:
          average >= 80 ? 'EE' : average >= 50 ? 'ME' : average >= 30 ? 'AE' : 'BE',
        position,
        class_size,
        subjects: exam.subjects,
      };
    })
  );

  // Most recent exam first
  summaries.sort((a, b) => {
    const da = a.exam?.start_date ? new Date(a.exam.start_date) : new Date(0);
    const db = b.exam?.start_date ? new Date(b.exam.start_date) : new Date(0);
    return db - da;
  });

  return summaries;
};

// =============================================================================
// 1. POST /api/v1/results/bulk
//    Bulk upsert marks for many learners at once (one exam + one subject)
// =============================================================================
const bulkUpsertResults = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;

  if (!CAN_WRITE.includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { exam_id, learning_area_id, class_id, results } = req.body;

  const errors = [];
  if (!exam_id) errors.push('exam_id is required');
  if (!learning_area_id) errors.push('learning_area_id is required');
  if (!Array.isArray(results) || results.length === 0) {
    errors.push(
      'results must be a non-empty array of { learner_id, marks_obtained, max_marks?, is_absent?, remarks? }'
    );
  }
  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  // Verify exam belongs to this school, and grab its term_id for denormalization
  const { data: exam } = await supabase
    .from('exams')
    .select('id, school_id, term_id')
    .eq('id', exam_id)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!exam) {
    return res.status(400).json({ success: false, message: 'Exam not found for this school' });
  }

  // Verify subject belongs to this school (or is a shared national subject)
  const { data: subject } = await supabase
    .from('learning_areas')
    .select('id, school_id')
    .eq('id', learning_area_id)
    .maybeSingle();

  if (!subject || (subject.school_id && subject.school_id !== schoolId)) {
    return res.status(400).json({ success: false, message: 'Subject (learning area) not found for this school' });
  }

  // Teachers may only enter marks for a subject/class they're actively
  // assigned to. Admins bypass this check entirely.
  if (role === 'teacher') {
    if (!class_id) {
      return res.status(400).json({
        success: false,
        message: 'class_id is required when submitting marks as a teacher',
      });
    }
    const teacherId = await resolveTeacherId(schoolId, userId);
    const assigned = await isTeacherAssigned(teacherId, class_id, learning_area_id);
    if (!assigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to teach this subject for this class',
      });
    }
  }

  const rowErrors = [];
  const rows = results.map((r, idx) => {
    if (!r.learner_id) {
      rowErrors.push(`Row ${idx + 1}: learner_id is required`);
    }
    const maxMarks = r.max_marks !== undefined ? Number(r.max_marks) : 100;
    const marksObtained = r.is_absent ? 0 : Number(r.marks_obtained);
    if (!r.is_absent && (Number.isNaN(marksObtained) || marksObtained < 0)) {
      rowErrors.push(`Row ${idx + 1}: marks_obtained must be a non-negative number`);
    }
    if (!r.is_absent && marksObtained > maxMarks) {
      rowErrors.push(`Row ${idx + 1}: marks_obtained cannot exceed max_marks`);
    }
    return {
      school_id: schoolId,
      exam_id,
      learner_id: r.learner_id,
      learning_area_id,
      class_id: class_id || null,
      term_id: exam.term_id,
      marks_obtained: marksObtained,
      max_marks: maxMarks,
      is_absent: Boolean(r.is_absent),
      remarks: r.remarks?.trim() || null,
      updated_by: userId || null,
      created_by: userId || null,
    };
  });

  if (rowErrors.length) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: rowErrors });
  }

  const { data: saved, error } = await supabase
    .from('exam_results')
    .upsert(rows, { onConflict: 'exam_id,learner_id,learning_area_id' })
    .select(RESULT_SELECT);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to save results', error: error.message });
  }

  return res.status(201).json({ success: true, data: { saved_count: saved.length, results: saved } });
});

// =============================================================================
// 2. GET /api/v1/results
//    View results for an exam (optionally filtered by class / subject)
// =============================================================================
const listResults = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { exam_id, class_id, learning_area_id, page = 1, limit = 50 } = req.query;

  if (!exam_id) {
    return res.status(400).json({ success: false, message: 'exam_id is required' });
  }

  // Teachers may only view results for classes they're actively assigned to
  // teach at least one subject in. If they ask for one specific subject, it
  // must be one of theirs; otherwise we transparently scope the query to
  // just the subjects they're assigned (so the "all subjects for this
  // learner's class" marks sheet still works, just narrowed to their own).
  let restrictLearningAreaIds = null;
  if (role === 'teacher') {
    if (!class_id) {
      return res.status(400).json({
        success: false,
        message: 'class_id is required to view results as a teacher',
      });
    }
    const teacherId = await resolveTeacherId(schoolId, userId);
    const { data: myAssignments } = await supabase
      .from('teacher_assignments')
      .select('learning_area_id')
      .eq('teacher_id', teacherId)
      .eq('class_id', class_id)
      .eq('is_active', true)
      .is('deleted_at', null);

    const assignedAreaIds = [...new Set((myAssignments || []).map((a) => a.learning_area_id))];

    if (learning_area_id) {
      if (!assignedAreaIds.includes(learning_area_id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to teach this subject for this class',
        });
      }
    } else if (assignedAreaIds.length === 0) {
      return res.json({ success: true, data: { results: [] } });
    } else {
      restrictLearningAreaIds = assignedAreaIds;
    }
  }

  let query = supabase
    .from('exam_results')
    .select(RESULT_SELECT)
    .eq('school_id', schoolId)
    .eq('exam_id', exam_id);

  if (class_id) query = query.eq('class_id', class_id);
  if (learning_area_id) query = query.eq('learning_area_id', learning_area_id);
  if (restrictLearningAreaIds) query = query.in('learning_area_id', restrictLearningAreaIds);

  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data: results, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }

  return res.json({ success: true, data: { results: results || [] } });
});

// =============================================================================
// 3. GET /api/v1/results/learner/:learner_id
//    Search + view the full final-result history for one learner
// =============================================================================
const getLearnerResults = asyncHandler(async (req, res) => {
  const { schoolId, id: userId, role } = req.user;
  const { learner_id } = req.params;

  const { data: learner } = await supabase
    .from('learners')
    .select(
      'id, first_name, last_name, admission_number, class_id, classes:class_id ( id, grade_level, stream_name )'
    )
    .eq('id', learner_id)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  // Parents may only view results for their OWN linked children — never
  // other learners in the school, even if they guess the id.
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
          .eq('learner_id', learner_id)
          .maybeSingle()
      : { data: null };

    if (!link) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this learner\'s results' });
    }
  }

  const summaries = await buildLearnerSummaries(schoolId, learner_id);

  return res.json({ success: true, data: { learner, exams: summaries } });
});

// =============================================================================
// 4. GET /api/v1/results/search?query=
//    Search learners by name / admission number (powers the results search box)
// =============================================================================
const searchLearners = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { query = '' } = req.query;

  if (!query.trim()) {
    return res.json({ success: true, data: { learners: [] } });
  }

  // Teachers only search among learners in classes they're actively
  // assigned to teach at least one subject in.
  let restrictClassIds = null;
  if (role === 'teacher') {
    const teacherId = await resolveTeacherId(schoolId, userId);
    const { data: assignments } = await supabase
      .from('teacher_assignments')
      .select('class_id')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .is('deleted_at', null);
    restrictClassIds = [...new Set((assignments || []).map((a) => a.class_id).filter(Boolean))];
    if (restrictClassIds.length === 0) {
      return res.json({ success: true, data: { learners: [] } });
    }
  }

  const q = `%${query.trim()}%`;
  let dbQuery = supabase
    .from('learners')
    .select(
      'id, first_name, last_name, admission_number, class_id, classes:class_id ( grade_level, stream_name )'
    )
    .eq('school_id', schoolId)
    .or(`first_name.ilike.${q},last_name.ilike.${q},admission_number.ilike.${q}`)
    .limit(10);

  if (restrictClassIds) {
    dbQuery = dbQuery.in('class_id', restrictClassIds);
  }

  const { data: learners, error } = await dbQuery;

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to search learners', error: error.message });
  }

  return res.json({ success: true, data: { learners: learners || [] } });
});

// =============================================================================
// 5. GET /api/v1/results/compare?learner_id=&exam_ids=id1,id2,id3
//    Compare a learner's performance across two or more exams
// =============================================================================
const compareResults = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { learner_id, exam_ids } = req.query;

  if (!learner_id) {
    return res.status(400).json({ success: false, message: 'learner_id is required' });
  }

  const examIdList = exam_ids
    ? String(exam_ids).split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  const summaries = await buildLearnerSummaries(schoolId, learner_id, examIdList);

  // Per-subject trend across the selected exams: { "Mathematics": [{exam_name, percentage}, ...] }
  const subjectTrend = {};
  summaries.forEach((examSummary) => {
    examSummary.subjects.forEach((s) => {
      const name = s.learning_area?.name || 'Unknown';
      if (!subjectTrend[name]) subjectTrend[name] = [];
      subjectTrend[name].push({
        exam_id: examSummary.exam_id,
        exam_name: examSummary.exam?.exam_name,
        percentage: s.percentage,
        performance_level: s.performance_level,
      });
    });
  });

  return res.json({
    success: true,
    data: {
      exams: summaries,
      subject_trend: subjectTrend,
    },
  });
});

// =============================================================================
// 6. DELETE /api/v1/results/:id
// =============================================================================
const deleteResult = asyncHandler(async (req, res) => {
  const { schoolId, role } = req.user;
  const { id } = req.params;

  if (!CAN_WRITE.includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { error } = await supabase
    .from('exam_results')
    .delete()
    .eq('id', id)
    .eq('school_id', schoolId);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete result', error: error.message });
  }

  return res.json({ success: true, data: { message: 'Result deleted successfully' } });
});

module.exports = {
  bulkUpsertResults,
  listResults,
  getLearnerResults,
  searchLearners,
  compareResults,
  deleteResult,
  buildLearnerSummaries,
};
