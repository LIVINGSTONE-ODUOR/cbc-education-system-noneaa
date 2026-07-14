// =============================================================================
// assignment.controller.js
// Assignments module — teachers create assignments (optionally with a PDF or
// Word attachment) for a class + subject; learners submit online; teachers
// grade, comment on, and return submissions.
//
// Tables:  assignments, assignment_submissions
// Joins:   classes, learning_areas, teachers, learners
// Pattern: matches exam.controller.js
// Auth:    Bearer JWT → req.user.schoolId / req.user.role / req.user.id
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Attachments live in their own Supabase Storage bucket. Create this bucket
// once in the Supabase dashboard (Storage → New bucket → "assignment-files",
// public read) before this feature is used in production.
const ATTACHMENTS_BUCKET = 'assignment-files';

const ASSIGNMENT_SELECT = `
  *,
  classes:class_id (id, grade_level, stream_name),
  learning_areas:learning_area_id (id, name, code),
  teachers:teacher_id (id, users:user_id (first_name, last_name))
`;

// first_name/last_name live on `users`, not `teachers` — teachers only has
// a user_id FK. Supabase returns the nested join as teachers.users.{...};
// flatten it back to teachers.{first_name,last_name} so the API response
// shape (and the frontend's AssignmentTeacher type) doesn't have to change.
const flattenTeacher = (row) => {
  if (row?.teachers?.users) {
    row.teachers = {
      id: row.teachers.id,
      first_name: row.teachers.users.first_name,
      last_name: row.teachers.users.last_name,
    };
  }
  return row;
};

const paginate = (query, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Resolves the teacher row for the logged-in user. Returns null if this
// account has no teacher record (or the caller isn't a teacher at all).
const getTeacherForUser = async (schoolId, userId) => {
  const { data } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();
  return data;
};

// Verifies a teacher is actually assigned to teach this subject in this
// class before letting them create/see assignments for it.
const verifyTeacherAssignment = async (teacherId, classId, learningAreaId) => {
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

// Video mimetypes teachers can upload (covers the common browser/mobile
// export formats). Extend here if a school needs another codec/container.
const VIDEO_MIMETYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov
  'video/x-matroska', // .mkv
]);

const DOC_SIZE_LIMIT = 15 * 1024 * 1024; // 15MB — PDF/Word
const VIDEO_SIZE_LIMIT = 300 * 1024 * 1024; // 300MB — lecture/demo clips

const uploadAttachment = async (schoolId, file) => {
  const isPdf = file.mimetype === 'application/pdf';
  const isWord =
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isVideo = VIDEO_MIMETYPES.has(file.mimetype);

  if (!isPdf && !isWord && !isVideo) {
    throw Object.assign(
      new Error('Only PDF, Word (.doc/.docx), or video (.mp4/.webm/.mov/.mkv) attachments are allowed'),
      { status: 400 }
    );
  }

  const sizeLimit = isVideo ? VIDEO_SIZE_LIMIT : DOC_SIZE_LIMIT;
  if (file.size > sizeLimit) {
    const limitLabel = isVideo ? '300MB' : '15MB';
    throw Object.assign(new Error(`Attachment exceeds the ${limitLabel} limit`), { status: 400 });
  }

  const timestamp = Date.now();
  const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${schoolId}/${timestamp}-${safeName}`;

  const { error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

  if (error) {
    throw Object.assign(new Error(`Failed to upload attachment: ${error.message}`), { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(filePath);

  return {
    attachment_url: publicUrlData?.publicUrl || null,
    attachment_name: file.originalname,
    attachment_type: isPdf ? 'pdf' : isWord ? 'word' : 'video',
  };
};

// Only trust an attachment_url the client hands back if it actually points
// at our own bucket — prevents a caller from pointing attachment_url at an
// arbitrary external link via the JSON (non-multipart) creation path.
const isOwnBucketUrl = (url) => typeof url === 'string' && url.includes(`/storage/v1/object/public/${ATTACHMENTS_BUCKET}/`);

const ALLOWED_ATTACHMENT_TYPES = new Set(['pdf', 'word', 'video']);

// Used when the client already uploaded the file directly to Supabase Storage
// (see createAttachmentUploadUrl below) and is now just telling us the result.
const resolvePreUploadedAttachment = (body) => {
  const { attachment_url, attachment_name, attachment_type } = body || {};
  if (!attachment_url) return null;
  if (!isOwnBucketUrl(attachment_url) || !ALLOWED_ATTACHMENT_TYPES.has(attachment_type)) {
    throw Object.assign(new Error('Invalid attachment reference'), { status: 400 });
  }
  return {
    attachment_url,
    attachment_name: attachment_name ? String(attachment_name).slice(0, 255) : null,
    attachment_type,
  };
};

// =============================================================================
// 0. POST /api/v1/assignments/attachments/sign-upload
//    Returns a short-lived signed URL the browser can PUT the file to
//    directly — used for video, so large files don't have to be streamed
//    through this Node process (which was hitting proxy/timeout aborts on
//    slower connections). Body: { fileName, mimeType, fileSize }.
// =============================================================================
const createAttachmentUploadUrl = asyncHandler(async (req, res) => {
  const { schoolId, role } = req.user;
  if (!['teacher', 'school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { fileName, mimeType, fileSize } = req.body;
  if (!fileName || !mimeType || !fileSize) {
    return res.status(400).json({ success: false, message: 'fileName, mimeType, and fileSize are required' });
  }

  const isVideo = VIDEO_MIMETYPES.has(mimeType);
  if (!isVideo) {
    // PDF/Word are small enough to keep going through the existing
    // multipart route — this endpoint exists specifically for video.
    return res.status(400).json({ success: false, message: 'This upload method currently supports video files only' });
  }
  if (Number(fileSize) > VIDEO_SIZE_LIMIT) {
    return res.status(400).json({ success: false, message: 'Attachment exceeds the 300MB limit' });
  }

  const timestamp = Date.now();
  const safeName = String(fileName).replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${schoolId}/${timestamp}-${safeName}`;

  const { data, error } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUploadUrl(filePath);
  if (error) {
    return res.status(500).json({ success: false, message: `Failed to prepare upload: ${error.message}` });
  }

  const { data: publicUrlData } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(filePath);

  return res.status(200).json({
    success: true,
    data: {
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      contentType: mimeType,
      attachment_url: publicUrlData?.publicUrl || null,
      attachment_name: fileName,
      attachment_type: 'video',
    },
  });
});

// =============================================================================
// 1. POST /api/v1/assignments
//    Create an assignment. Teachers may only create for a class+subject
//    they're assigned to; admins may create for any class+subject.
// =============================================================================
const createAssignment = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;

  if (!['teacher', 'school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { class_id, learning_area_id, title, description, due_date, max_grade } = req.body;

  const errors = [];
  if (!class_id) errors.push('class_id is required');
  if (!learning_area_id) errors.push('learning_area_id is required');
  if (!title || !title.trim()) errors.push('title is required');
  const dueDate = parseDate(due_date);
  if (!dueDate) errors.push('due_date is required and must be a valid date');
  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  let teacherId = null;
  if (role === 'teacher') {
    const teacher = await getTeacherForUser(schoolId, userId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'No teacher record found for this account' });
    }
    const allowed = await verifyTeacherAssignment(teacher.id, class_id, learning_area_id);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You are not assigned to teach this subject in this class' });
    }
    teacherId = teacher.id;
  } else {
    // Admin creating on behalf of a class — still needs *a* teacher_id for
    // the FK; use the class/subject's currently assigned teacher if one exists.
    const { data: assignment } = await supabase
      .from('teacher_assignments')
      .select('teacher_id')
      .eq('class_id', class_id)
      .eq('learning_area_id', learning_area_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();
    if (!assignment) {
      return res.status(400).json({ success: false, message: 'No teacher is assigned to this class/subject yet' });
    }
    teacherId = assignment.teacher_id;
  }

  let attachment = { attachment_url: null, attachment_name: null, attachment_type: null };
  try {
    if (req.file) {
      attachment = await uploadAttachment(schoolId, req.file);
    } else {
      attachment = resolvePreUploadedAttachment(req.body) || attachment;
    }
  } catch (e) {
    return res.status(e.status || 500).json({ success: false, message: e.message });
  }

  const { data: created, error } = await supabase
    .from('assignments')
    .insert({
      school_id: schoolId,
      class_id,
      learning_area_id,
      teacher_id: teacherId,
      title: title.trim(),
      description: description?.trim() || null,
      due_date: dueDate,
      max_grade: max_grade ? Number(max_grade) : 100,
      ...attachment,
    })
    .select(ASSIGNMENT_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to create assignment', error: error.message });
  }

  return res.status(201).json({ success: true, data: flattenTeacher(created) });
});

// =============================================================================
// 2. GET /api/v1/assignments
//    List assignments. Teachers see only their own; admins see everything
//    in the school. Filterable by class_id / learning_area_id.
// =============================================================================
const listAssignments = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { class_id, learning_area_id, page = 1, limit = 20 } = req.query;

  let query = supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('due_date', { ascending: false });

  if (role === 'teacher') {
    const teacher = await getTeacherForUser(schoolId, userId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'No teacher record found for this account' });
    }
    query = query.eq('teacher_id', teacher.id);
  }

  if (class_id) query = query.eq('class_id', class_id);
  if (learning_area_id) query = query.eq('learning_area_id', learning_area_id);

  query = paginate(query, parseInt(page), parseInt(limit));

  const { data: assignments, error } = await query;
  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch assignments', error: error.message });
  }

  // Submission counts per assignment (so the list can show "12/30 submitted").
  const ids = (assignments || []).map((a) => a.id);
  let countsByAssignment = {};
  if (ids.length > 0) {
    const { data: subRows } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, status')
      .in('assignment_id', ids);
    (subRows || []).forEach((s) => {
      if (!countsByAssignment[s.assignment_id]) {
        countsByAssignment[s.assignment_id] = { submitted: 0, graded: 0 };
      }
      countsByAssignment[s.assignment_id].submitted += 1;
      if (s.status === 'graded' || s.status === 'returned') {
        countsByAssignment[s.assignment_id].graded += 1;
      }
    });
  }

  const enriched = (assignments || []).map((a) => ({
    ...flattenTeacher(a),
    submission_counts: countsByAssignment[a.id] || { submitted: 0, graded: 0 },
  }));

  return res.json({ success: true, data: { assignments: enriched } });
});

// =============================================================================
// 3. GET /api/v1/assignments/:id
// =============================================================================
const getAssignment = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch assignment', error: error.message });
  }
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  return res.json({ success: true, data: flattenTeacher(assignment) });
});

// =============================================================================
// 4. PUT /api/v1/assignments/:id
// =============================================================================
const updateAssignment = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { id } = req.params;

  const { data: existing } = await supabase
    .from('assignments')
    .select('id, teacher_id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  if (role === 'teacher') {
    const teacher = await getTeacherForUser(schoolId, userId);
    if (!teacher || teacher.id !== existing.teacher_id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own assignments' });
    }
  } else if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { title, description, due_date, max_grade, is_active } = req.body;
  const updatePayload = {};
  if (title !== undefined) updatePayload.title = title.trim();
  if (description !== undefined) updatePayload.description = description?.trim() || null;
  if (due_date !== undefined) {
    const parsed = parseDate(due_date);
    if (!parsed) {
      return res.status(400).json({ success: false, message: 'due_date must be a valid date' });
    }
    updatePayload.due_date = parsed;
  }
  if (max_grade !== undefined) updatePayload.max_grade = Number(max_grade);
  if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);

  if (req.file) {
    try {
      const attachment = await uploadAttachment(schoolId, req.file);
      Object.assign(updatePayload, attachment);
    } catch (e) {
      return res.status(e.status || 500).json({ success: false, message: e.message });
    }
  }

  const { data: updated, error } = await supabase
    .from('assignments')
    .update(updatePayload)
    .eq('id', id)
    .eq('school_id', schoolId)
    .select(ASSIGNMENT_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update assignment', error: error.message });
  }

  return res.json({ success: true, data: flattenTeacher(updated) });
});

// =============================================================================
// 5. DELETE /api/v1/assignments/:id   (soft delete)
// =============================================================================
const deleteAssignment = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { id } = req.params;

  const { data: existing } = await supabase
    .from('assignments')
    .select('id, teacher_id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  if (role === 'teacher') {
    const teacher = await getTeacherForUser(schoolId, userId);
    if (!teacher || teacher.id !== existing.teacher_id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own assignments' });
    }
  } else if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { error } = await supabase
    .from('assignments')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id)
    .eq('school_id', schoolId);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete assignment', error: error.message });
  }

  return res.json({ success: true, data: { message: 'Assignment deleted successfully' } });
});

// =============================================================================
// 6. GET /api/v1/assignments/:id/submissions
//    Teacher-only: every learner in the class, with their submission (if any).
// =============================================================================
const listSubmissions = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { id } = req.params;

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, class_id, teacher_id')
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  if (role === 'teacher') {
    const teacher = await getTeacherForUser(schoolId, userId);
    if (!teacher || teacher.id !== assignment.teacher_id) {
      return res.status(403).json({ success: false, message: 'You can only view submissions for your own assignments' });
    }
  } else if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  // Every enrolled learner in the class...
  const { data: enrollments, error: enrollErr } = await supabase
    .from('learner_enrollments')
    .select('learner_id, learners:learner_id (id, first_name, last_name, admission_number, profile_photo)')
    .eq('class_id', assignment.class_id)
    .eq('status', 'enrolled');

  if (enrollErr) {
    return res.status(500).json({ success: false, message: 'Failed to fetch class roster', error: enrollErr.message });
  }

  const roster = (enrollments || []).filter((e) => e.learners);

  // ...joined against whatever they've submitted for this assignment.
  const { data: submissions, error: subErr } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', id);

  if (subErr) {
    return res.status(500).json({ success: false, message: 'Failed to fetch submissions', error: subErr.message });
  }

  const submissionByLearner = new Map((submissions || []).map((s) => [s.learner_id, s]));

  const rows = roster.map((e) => ({
    learner_id: e.learner_id,
    learner: e.learners,
    submission: submissionByLearner.get(e.learner_id) || null,
  }));

  return res.json({ success: true, data: { assignment_id: id, students: rows } });
});

// =============================================================================
// 7. PUT /api/v1/assignments/submissions/:submissionId
//    Teacher grades, comments on, and/or returns a submission.
// =============================================================================
const gradeSubmission = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { submissionId } = req.params;
  const { grade, teacher_comment, status } = req.body;

  const { data: submission } = await supabase
    .from('assignment_submissions')
    .select('id, assignment_id, assignments:assignment_id (id, school_id, teacher_id, max_grade)')
    .eq('id', submissionId)
    .maybeSingle();

  if (!submission || !submission.assignments || submission.assignments.school_id !== schoolId) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }

  if (role === 'teacher') {
    const teacher = await getTeacherForUser(schoolId, userId);
    if (!teacher || teacher.id !== submission.assignments.teacher_id) {
      return res.status(403).json({ success: false, message: 'You can only grade your own assignment submissions' });
    }
  } else if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  if (status && !['submitted', 'late', 'graded', 'returned'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  if (grade !== undefined && grade !== null) {
    const numGrade = Number(grade);
    const maxGrade = Number(submission.assignments.max_grade || 100);
    if (Number.isNaN(numGrade) || numGrade < 0 || numGrade > maxGrade) {
      return res.status(400).json({ success: false, message: `grade must be between 0 and ${maxGrade}` });
    }
  }

  const updatePayload = { graded_by: userId };
  if (grade !== undefined) updatePayload.grade = grade === null ? null : Number(grade);
  if (teacher_comment !== undefined) updatePayload.teacher_comment = teacher_comment?.trim() || null;
  updatePayload.status = status || 'graded';
  updatePayload.graded_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('assignment_submissions')
    .update(updatePayload)
    .eq('id', submissionId)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update submission', error: error.message });
  }

  return res.json({ success: true, data: updated });
});

// =============================================================================
// 8. POST /api/v1/assignments/:id/submit
//    Learner-only: submit (or resubmit before grading) their work.
// =============================================================================
const submitAssignment = asyncHandler(async (req, res) => {
  const { schoolId, role, id: userId } = req.user;
  const { id } = req.params;
  const { submission_text } = req.body;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'This endpoint is for student accounts only' });
  }

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, school_id, due_date')
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  const { data: learner } = await supabase
    .from('learners')
    .select('id')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (!learner) {
    return res.status(404).json({ success: false, message: 'No learner record found for this account' });
  }

  let attachment = { file_url: null, file_name: null };
  if (req.file) {
    try {
      const uploaded = await uploadAttachment(schoolId, req.file);
      attachment = { file_url: uploaded.attachment_url, file_name: uploaded.attachment_name };
    } catch (e) {
      return res.status(e.status || 500).json({ success: false, message: e.message });
    }
  }

  const isLate = new Date() > new Date(assignment.due_date);

  const { data: submission, error } = await supabase
    .from('assignment_submissions')
    .upsert(
      {
        assignment_id: id,
        learner_id: learner.id,
        submission_text: submission_text?.trim() || null,
        ...attachment,
        status: isLate ? 'late' : 'submitted',
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'assignment_id,learner_id' }
    )
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit assignment', error: error.message });
  }

  return res.status(201).json({ success: true, data: submission });
});

// =============================================================================
// 9. GET /api/v1/assignments/learner/:learnerId/due
//    Returns this learner's upcoming/overdue assignments for their current
//    class, each annotated with the learner's own submission status. Used by
//    the Parent Portal dashboard ("Assignments due" card).
//
//    Authorization mirrors attendance.controller.js's getLearnerAttendanceSummary:
//      - parent  -> must have a learner_parents link to this exact learner
//      - student -> may only ever view their OWN record (id resolved from
//                   their own login, URL param is ignored)
//      - teacher/school_admin/super_admin -> any learner in their own school
// =============================================================================
const getLearnerAssignmentsDue = asyncHandler(async (req, res) => {
  const { schoolId, id: userId, role } = req.user;
  let { learnerId } = req.params;
  const { include_submitted } = req.query;

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
      return res.status(403).json({ success: false, message: "Not authorized to view this learner's assignments" });
    }
  }

  // Resolve the learner's current class the same way results/attendance do —
  // via learner_enrollments, not a direct learners.class_id column.
  const { data: enrollment } = await supabase
    .from('learner_enrollments')
    .select('class_id, classes:class_id ( id, grade_level, stream_name )')
    .eq('learner_id', learnerId)
    .eq('status', 'enrolled')
    .maybeSingle();

  if (!enrollment) {
    return res.json({
      success: true,
      data: {
        learner: { id: learner.id, first_name: learner.first_name, last_name: learner.last_name },
        class: null,
        total_due: 0,
        assignments: [],
      },
    });
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      id, title, description, due_date, max_grade,
      attachment_url, attachment_name, attachment_type,
      learning_areas:learning_area_id ( id, name, code )
    `)
    .eq('class_id', enrollment.class_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('due_date', { ascending: true });

  if (assignmentsError) {
    return res.status(500).json({ success: false, message: 'Failed to fetch assignments', error: assignmentsError.message });
  }

  const all = assignments || [];
  const ids = all.map((a) => a.id);

  let submissionByAssignment = {};
  if (ids.length > 0) {
    const { data: subs } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, status, submitted_at, grade, teacher_comment')
      .eq('learner_id', learnerId)
      .in('assignment_id', ids);

    submissionByAssignment = (subs || []).reduce((acc, s) => {
      acc[s.assignment_id] = s;
      return acc;
    }, {});
  }

  const now = new Date();
  const enriched = all.map((a) => {
    const submission = submissionByAssignment[a.id] || null;
    const dueDate = new Date(a.due_date);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      learning_area: a.learning_areas ? { id: a.learning_areas.id, name: a.learning_areas.name, code: a.learning_areas.code } : null,
      due_date: a.due_date,
      max_grade: a.max_grade,
      attachment_url: a.attachment_url,
      attachment_name: a.attachment_name,
      attachment_type: a.attachment_type,
      submission_status: submission?.status || 'not_submitted',
      grade: submission?.grade ?? null,
      teacher_comment: submission?.teacher_comment ?? null,
      submitted_at: submission?.submitted_at ?? null,
      is_overdue: !submission && dueDate < now,
    };
  });

  // By default only show what the parent actually cares about: work that
  // still needs to be done. include_submitted=true returns everything,
  // useful for a future "assignment history" view.
  const dueList = include_submitted === 'true'
    ? enriched
    : enriched.filter((a) => a.submission_status === 'not_submitted');

  return res.json({
    success: true,
    data: {
      learner: { id: learner.id, first_name: learner.first_name, last_name: learner.last_name },
      class: enrollment.classes,
      total_due: dueList.filter((a) => a.submission_status === 'not_submitted').length,
      assignments: dueList.slice(0, include_submitted === 'true' ? 50 : 10),
    },
  });
});

module.exports = {
  createAttachmentUploadUrl,
  createAssignment,
  listAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  listSubmissions,
  gradeSubmission,
  submitAssignment,
  getLearnerAssignmentsDue,
};
