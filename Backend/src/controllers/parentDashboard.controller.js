// =============================================================================
// parentDashboard.controller.js
// Backs the 5 Parent Portal dashboard cards that were previously "Coming
// soon" placeholders: unread messages, latest announcements, teacher
// comments, today's timetable, and school events.
//
// Tables:  messages, announcements, teacher_comments, class_timetable,
//          school_events
// Joins:   learners, learner_parents, parents, classes, teachers, users,
//          learning_areas, learner_enrollments
// Pattern: matches assignment.controller.js / attendance.controller.js
// Auth:    Bearer JWT -> req.user.id / req.user.schoolId / req.user.role
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const getSchoolId = (req) => req.user.schoolId || req.user.school_id;

// Resolves the parent row for the logged-in user. Returns null if this
// account has no parent record.
const getParentForUser = async (userId) => {
  const { data } = await supabase
    .from('parents')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
};

// Confirms the logged-in parent is actually linked to this learner before
// letting them see learner-specific data. Mirrors the check used in
// assignment.controller.js / attendanceController for the same purpose.
const verifyParentLink = async (userId, learnerId) => {
  const parentRow = await getParentForUser(userId);
  if (!parentRow) return false;

  const { data: link } = await supabase
    .from('learner_parents')
    .select('id')
    .eq('parent_id', parentRow.id)
    .eq('learner_id', learnerId)
    .maybeSingle();

  return !!link;
};

// Returns the class_id a learner is currently enrolled in, or null.
const getLearnerClassId = async (learnerId) => {
  const { data } = await supabase
    .from('learner_enrollments')
    .select('class_id')
    .eq('learner_id', learnerId)
    .eq('status', 'enrolled')
    .maybeSingle();
  return data?.class_id || null;
};

// Returns the class_ids of every child linked to this parent (used to scope
// class-targeted announcements to the parent's own children).
const getParentChildrenClassIds = async (parentId) => {
  const { data: links } = await supabase
    .from('learner_parents')
    .select('learner_id')
    .eq('parent_id', parentId);

  const learnerIds = (links || []).map((l) => l.learner_id);
  if (learnerIds.length === 0) return [];

  const { data: enrollments } = await supabase
    .from('learner_enrollments')
    .select('class_id')
    .in('learner_id', learnerIds)
    .eq('status', 'enrolled');

  return [...new Set((enrollments || []).map((e) => e.class_id).filter(Boolean))];
};

// -----------------------------------------------------------------------
// 1. Messages
// -----------------------------------------------------------------------

// GET /api/v1/parent-dashboard/messages?limit=10
// Returns the parent's inbox (most recent first) plus an unread count.
const getMessages = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const limit = parseInt(req.query.limit) || 10;

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id, subject, body, is_read, created_at,
      sender:sender_user_id (id, first_name, last_name, role),
      learner:learner_id (id, first_name, last_name)
    `)
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }

  const { count: unreadCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_user_id', userId)
    .eq('is_read', false);

  return res.json({
    success: true,
    message: 'Messages fetched successfully',
    data: { unread_count: unreadCount || 0, messages: messages || [] },
  });
});

// PUT /api/v1/parent-dashboard/messages/:id/read
const markMessageRead = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { id } = req.params;

  const { data, error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', id)
    .eq('recipient_user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update message', error: error.message });
  }
  if (!data) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }

  return res.json({ success: true, message: 'Message marked as read', data: {} });
});

// -----------------------------------------------------------------------
// 2. Announcements
// -----------------------------------------------------------------------

// GET /api/v1/parent-dashboard/announcements?limit=10
// School-wide announcements plus any targeted at the parent's children's
// classes.
const getAnnouncements = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id: userId } = req.user;
  const limit = parseInt(req.query.limit) || 10;

  const parentRow = await getParentForUser(userId);
  const classIds = parentRow ? await getParentChildrenClassIds(parentRow.id) : [];

  let query = supabase
    .from('announcements')
    .select('id, title, body, class_id, created_at, classes:class_id (id, grade_level, stream_name)')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  // School-wide (class_id is null) OR targeted at one of this parent's
  // children's classes.
  const orFilter = classIds.length > 0
    ? `class_id.is.null,class_id.in.(${classIds.join(',')})`
    : 'class_id.is.null';
  query = query.or(orFilter);

  const { data: announcements, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch announcements', error: error.message });
  }

  return res.json({ success: true, message: 'Announcements fetched successfully', data: { announcements: announcements || [] } });
});

// -----------------------------------------------------------------------
// 3. Teacher comments
// -----------------------------------------------------------------------

// GET /api/v1/parent-dashboard/learner/:learnerId/comments?limit=10
const getTeacherComments = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const { learnerId } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  if (role === 'parent' && !(await verifyParentLink(userId, learnerId))) {
    return res.status(403).json({ success: false, message: "Not authorized to view this learner's comments" });
  }

  const { data: comments, error } = await supabase
    .from('teacher_comments')
    .select(`
      id, comment, created_at,
      teachers:teacher_id (id, first_name, last_name),
      learning_areas:learning_area_id (id, name)
    `)
    .eq('learner_id', learnerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch teacher comments', error: error.message });
  }

  return res.json({ success: true, message: 'Teacher comments fetched successfully', data: { comments: comments || [] } });
});

// -----------------------------------------------------------------------
// 4. Timetable
// -----------------------------------------------------------------------

// GET /api/v1/parent-dashboard/learner/:learnerId/timetable
// Returns the learner's full weekly timetable, grouped by day on the client.
const getTimetable = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const { learnerId } = req.params;

  if (role === 'parent' && !(await verifyParentLink(userId, learnerId))) {
    return res.status(403).json({ success: false, message: "Not authorized to view this learner's timetable" });
  }

  const classId = await getLearnerClassId(learnerId);
  if (!classId) {
    return res.json({ success: true, message: 'No active class enrollment found', data: { class: null, periods: [] } });
  }

  const { data: periods, error } = await supabase
    .from('class_timetable')
    .select(`
      id, day_of_week, start_time, end_time, room,
      learning_areas:learning_area_id (id, name),
      teachers:teacher_id (id, first_name, last_name)
    `)
    .eq('class_id', classId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch timetable', error: error.message });
  }

  return res.json({ success: true, message: 'Timetable fetched successfully', data: { class_id: classId, periods: periods || [] } });
});

// -----------------------------------------------------------------------
// 5. School events
// -----------------------------------------------------------------------

// GET /api/v1/parent-dashboard/events?limit=10
// Upcoming events only (event_date >= today), soonest first.
const getSchoolEvents = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const limit = parseInt(req.query.limit) || 10;
  const today = new Date().toISOString().slice(0, 10);

  const { data: events, error } = await supabase
    .from('school_events')
    .select('id, title, description, event_date, start_time, location, audience')
    .eq('school_id', schoolId)
    .in('audience', ['all', 'parents'])
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(limit);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch school events', error: error.message });
  }

  return res.json({ success: true, message: 'School events fetched successfully', data: { events: events || [] } });
});

// -----------------------------------------------------------------------
// 6. Child profile
// -----------------------------------------------------------------------

// GET /api/v1/parent-dashboard/learner/:learnerId/profile
// Everything for the "Child Profile" card: photo, admission number,
// grade & class, stream, date of birth, class teacher, medical info, and
// emergency contacts (every guardian linked to the learner).
const getChildProfile = asyncHandler(async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id: userId, role } = req.user;
  const { learnerId } = req.params;

  if (role === 'parent' && !(await verifyParentLink(userId, learnerId))) {
    return res.status(403).json({ success: false, message: "Not authorized to view this learner's profile" });
  }

  const { data: learner, error: learnerError } = await supabase
    .from('learners')
    .select(`
      id, first_name, last_name, admission_number, profile_photo,
      date_of_birth, gender, medical_conditions, allergies, special_needs
    `)
    .eq('id', learnerId)
    .eq('school_id', schoolId)
    .maybeSingle();

  if (learnerError) {
    return res.status(500).json({ success: false, message: 'Failed to fetch child profile', error: learnerError.message });
  }
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  // Grade, stream, and class teacher — via the learner's current enrollment.
  const { data: enrollment } = await supabase
    .from('learner_enrollments')
    .select(`
      classes:class_id (
        id, grade_level, stream_name,
        teachers:class_teacher_id ( id, first_name, last_name, user:user_id ( email, phone_number ) )
      )
    `)
    .eq('learner_id', learnerId)
    .eq('status', 'enrolled')
    .maybeSingle();

  const classInfo = enrollment?.classes || null;
  const classTeacher = classInfo?.teachers
    ? {
        name: `${classInfo.teachers.first_name || ''} ${classInfo.teachers.last_name || ''}`.trim(),
        email: classInfo.teachers.user?.email || null,
        phone: classInfo.teachers.user?.phone_number || null,
      }
    : null;

  // Emergency contacts — every guardian linked to this learner.
  const { data: parentLinks } = await supabase
    .from('learner_parents')
    .select(`
      is_primary, relationship,
      parent:parent_id ( id, first_name, last_name, phone_number, email )
    `)
    .eq('learner_id', learnerId);

  const emergencyContacts = (parentLinks || [])
    .filter((link) => link.parent)
    .map((link) => ({
      name: `${link.parent.first_name || ''} ${link.parent.last_name || ''}`.trim(),
      relationship: link.relationship || null,
      phone: link.parent.phone_number || null,
      email: link.parent.email || null,
      is_primary: !!link.is_primary,
    }));

  return res.json({
    success: true,
    message: 'Child profile fetched successfully',
    data: {
      id: learner.id,
      first_name: learner.first_name,
      last_name: learner.last_name,
      admission_number: learner.admission_number,
      photo_url: learner.profile_photo || null,
      date_of_birth: learner.date_of_birth,
      grade_level: classInfo?.grade_level || null,
      stream_name: classInfo?.stream_name || null,
      class_teacher: classTeacher,
      medical: {
        conditions: learner.medical_conditions || null,
        allergies: learner.allergies || null,
        special_needs: learner.special_needs || null,
      },
      emergency_contacts: emergencyContacts,
    },
  });
});

module.exports = {
  getMessages,
  markMessageRead,
  getAnnouncements,
  getTeacherComments,
  getTimetable,
  getSchoolEvents,
  getChildProfile,
};
