// =============================================================================
// message.controller.js
// General-purpose messaging for teacher, student, and school_admin accounts.
//
// IMPORTANT: this reuses the SAME `messages` table that already backs the
// Parent Portal's chat UI (see parentDashboard.controller.js — getMessages /
// getMessageContacts / sendMessage / getConversation). That table already
// supports parent <-> teacher and parent <-> principal messaging; parents
// keep using those dedicated endpoints unchanged. This controller adds the
// missing directions so the same inbox works for everyone:
//   student <-> teacher
//   teacher <-> parent   (reply side; parents already have the send side)
//   student/parent/teacher <-> school_admin
//
// Tables:  messages, users, teachers, teacher_assignments, classes,
//          learners, learner_enrollments, learner_parents, parents,
//          school_admins
// Pattern: matches parentDashboard.controller.js (Supabase client)
// Auth:    Bearer JWT -> req.user.id / req.user.schoolId / req.user.role
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const getSchoolId = (req) => req.user.schoolId || req.user.school_id;

// ---------------------------------------------------------------------------
// Who is allowed to message whom (either direction). Keys are normalised,
// lowercase `users.role` values.
// ---------------------------------------------------------------------------
const ALLOWED_PAIRS = [
  ['student', 'teacher'],
  ['parent', 'teacher'],
  ['student', 'school_admin'],
  ['parent', 'school_admin'],
  ['teacher', 'school_admin'],
];

const canMessage = (roleA, roleB) => {
  const a = (roleA || '').toLowerCase();
  const b = (roleB || '').toLowerCase();
  return ALLOWED_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
};

const fullName = (u) => `${u?.first_name || ''} ${u?.last_name || ''}`.trim();

// -----------------------------------------------------------------------
// Helpers to resolve "who am I" for the two roles that aren't the `users`
// row itself (teacher, student), mirroring the existing patterns in
// assignment.controller.js / learner.controller.js so behaviour stays
// consistent across the codebase.
// -----------------------------------------------------------------------

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

// Student accounts log in as `{admission_number}@{school_subdomain}...`
// (see learner.controller.js registerLearner / listLearners) — there is no
// direct FK from `learners` to `users`, so we match on that prefix.
const getLearnerForStudentUser = async (schoolId, email) => {
  const admissionNumber = (email || '').split('@')[0];
  if (!admissionNumber) return null;
  const { data } = await supabase
    .from('learners')
    .select('id, first_name, last_name, admission_number')
    .eq('school_id', schoolId)
    .eq('admission_number', admissionNumber)
    .maybeSingle();
  return data;
};

// Maps learner_id -> that learner's own student user account (id), by
// matching admission_number against the email prefix of every 'student'
// user in the school. One query regardless of how many learners.
const mapLearnersToStudentUsers = async (schoolId, learners) => {
  const { data: studentUsers } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .is('deleted_at', null);

  const byAdmission = new Map();
  (studentUsers || []).forEach((u) => {
    const admissionNumber = (u.email || '').split('@')[0];
    if (admissionNumber) byAdmission.set(admissionNumber, u);
  });

  return learners
    .map((l) => {
      const u = byAdmission.get(l.admission_number);
      return u ? { user_id: u.id, name: fullName(l) || fullName(u), role_label: 'Student' } : null;
    })
    .filter(Boolean);
};

const getClassIdsForTeacher = async (teacherId) => {
  const [{ data: assigned }, { data: classTeacherOf }] = await Promise.all([
    supabase
      .from('teacher_assignments')
      .select('class_id')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .is('deleted_at', null),
    supabase.from('classes').select('id').eq('class_teacher_id', teacherId),
  ]);
  const ids = new Set();
  (assigned || []).forEach((a) => a.class_id && ids.add(a.class_id));
  (classTeacherOf || []).forEach((c) => c.id && ids.add(c.id));
  return [...ids];
};

const getEnrolledLearners = async (classIds) => {
  if (classIds.length === 0) return [];
  const { data: enrollments } = await supabase
    .from('learner_enrollments')
    .select('learner_id')
    .in('class_id', classIds)
    .eq('status', 'enrolled');
  const learnerIds = [...new Set((enrollments || []).map((e) => e.learner_id).filter(Boolean))];
  if (learnerIds.length === 0) return [];
  const { data: learners } = await supabase
    .from('learners')
    .select('id, first_name, last_name, admission_number')
    .in('id', learnerIds);
  return learners || [];
};

const getParentsOfLearners = async (learnerIds) => {
  if (learnerIds.length === 0) return [];
  const { data: links } = await supabase
    .from('learner_parents')
    .select('learner_id, parents:parent_id ( user_id, users:user_id ( id, first_name, last_name ) )')
    .in('learner_id', learnerIds);

  const byUserId = new Map();
  (links || []).forEach((l) => {
    const u = l.parents?.users;
    if (!u?.id || byUserId.has(u.id)) return;
    byUserId.set(u.id, { user_id: u.id, name: fullName(u), role_label: 'Parent' });
  });
  return [...byUserId.values()];
};

const getSchoolAdmins = async (schoolId) => {
  const { data: rows } = await supabase
    .from('school_admins')
    .select('user_id, is_principal, users:user_id ( id, first_name, last_name )')
    .eq('school_id', schoolId);

  return (rows || [])
    .filter((r) => r.users?.id)
    .map((r) => ({
      user_id: r.users.id,
      name: fullName(r.users),
      role_label: r.is_principal ? 'Principal' : 'School Admin',
    }));
};

const getTeachersOfClass = async (classId) => {
  if (!classId) return [];
  const byUserId = new Map();

  const { data: classRow } = await supabase
    .from('classes')
    .select('teachers:class_teacher_id ( user_id, first_name, last_name )')
    .eq('id', classId)
    .maybeSingle();

  if (classRow?.teachers?.user_id) {
    byUserId.set(classRow.teachers.user_id, {
      user_id: classRow.teachers.user_id,
      name: fullName(classRow.teachers),
      role_label: 'Class Teacher',
    });
  }

  const { data: assignments } = await supabase
    .from('teacher_assignments')
    .select('teachers:teacher_id ( user_id, first_name, last_name ), learning_areas:learning_area_id ( name )')
    .eq('class_id', classId)
    .eq('is_active', true)
    .is('deleted_at', null);

  (assignments || []).forEach((a) => {
    const t = a.teachers;
    if (!t?.user_id || byUserId.has(t.user_id)) return;
    byUserId.set(t.user_id, {
      user_id: t.user_id,
      name: fullName(t),
      role_label: a.learning_areas?.name ? `${a.learning_areas.name} Teacher` : 'Subject Teacher',
    });
  });

  return [...byUserId.values()];
};

// Attaches last_message / last_message_at / unread_count to each contact,
// so the UI can render a chat-app-style contact list without a second
// round trip per contact. One query for everything touching this user.
const enrichWithConversationPreview = async (userId, contacts) => {
  if (contacts.length === 0) return contacts;
  const otherIds = contacts.map((c) => c.user_id);

  const { data: rows } = await supabase
    .from('messages')
    .select('sender_user_id, recipient_user_id, body, is_read, created_at')
    .or(`sender_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(500);

  const lastByOther = new Map();
  const unreadByOther = new Map();

  (rows || []).forEach((m) => {
    const other = m.sender_user_id === userId ? m.recipient_user_id : m.sender_user_id;
    if (!otherIds.includes(other)) return;
    if (!lastByOther.has(other)) {
      lastByOther.set(other, { last_message: m.body, last_message_at: m.created_at });
    }
    if (m.recipient_user_id === userId && !m.is_read) {
      unreadByOther.set(other, (unreadByOther.get(other) || 0) + 1);
    }
  });

  return contacts
    .map((c) => ({
      ...c,
      last_message: lastByOther.get(c.user_id)?.last_message || null,
      last_message_at: lastByOther.get(c.user_id)?.last_message_at || null,
      unread_count: unreadByOther.get(c.user_id) || 0,
    }))
    .sort((a, b) => {
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return new Date(b.last_message_at) - new Date(a.last_message_at);
    });
};

// =============================================================================
// GET /api/v1/messages/contacts?search=
// Who the current user may message, scoped by role:
//   teacher      -> their students, those students' parents, school admins
//   student      -> their teachers, school admins
//   school_admin -> all teachers, plus anyone matching ?search= (parent/student)
// =============================================================================
exports.getContacts = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const schoolId = getSchoolId(req);
  const search = (req.query.search || '').trim();

  if (!schoolId) {
    return res.status(400).json({ success: false, message: 'Your account is not associated with a school.' });
  }

  if (role === 'teacher') {
    const teacher = await getTeacherForUser(schoolId, userId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'No teacher record found for this account' });
    }
    const classIds = await getClassIdsForTeacher(teacher.id);
    const learners = await getEnrolledLearners(classIds);
    const learnerIds = learners.map((l) => l.id);

    const [students, parents, admins] = await Promise.all([
      mapLearnersToStudentUsers(schoolId, learners),
      getParentsOfLearners(learnerIds),
      getSchoolAdmins(schoolId),
    ]);

    const contacts = await enrichWithConversationPreview(userId, [...students, ...parents, ...admins]);
    return res.json({ success: true, message: 'Contacts fetched', data: { students, parents, admins, contacts } });
  }

  if (role === 'student') {
    const learner = await getLearnerForStudentUser(schoolId, req.user.email);
    if (!learner) {
      return res.status(404).json({ success: false, message: 'Learner record not found for this account' });
    }
    const { data: enrollment } = await supabase
      .from('learner_enrollments')
      .select('class_id')
      .eq('learner_id', learner.id)
      .eq('status', 'enrolled')
      .maybeSingle();

    const [teachers, admins] = await Promise.all([
      getTeachersOfClass(enrollment?.class_id || null),
      getSchoolAdmins(schoolId),
    ]);

    const contacts = await enrichWithConversationPreview(userId, [...teachers, ...admins]);
    return res.json({ success: true, message: 'Contacts fetched', data: { teachers, admins, contacts } });
  }

  if (role === 'school_admin') {
    const { data: teacherUsers } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('school_id', schoolId)
      .eq('role', 'teacher')
      .is('deleted_at', null);

    const teachers = (teacherUsers || []).map((u) => ({ user_id: u.id, name: fullName(u), role_label: 'Teacher' }));

    let searchResults = [];
    if (search.length >= 2) {
      const { data: matches } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .eq('school_id', schoolId)
        .in('role', ['parent', 'student'])
        .is('deleted_at', null)
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
        .limit(20);
      searchResults = (matches || []).map((u) => ({
        user_id: u.id,
        name: fullName(u),
        role_label: u.role === 'parent' ? 'Parent' : 'Student',
      }));
    }

    const contacts = await enrichWithConversationPreview(userId, [...teachers, ...searchResults]);
    return res.json({ success: true, message: 'Contacts fetched', data: { teachers, searchResults, contacts } });
  }

  return res.json({ success: true, message: 'Contacts fetched', data: { contacts: [] } });
});

// =============================================================================
// GET /api/v1/messages/conversation/:otherUserId?learner_id=
// Full thread with one other user. If learner_id is omitted, returns every
// message exchanged with them regardless of which child (if any) it was
// about. Marks any unread messages addressed to the caller as read.
// =============================================================================
exports.getConversation = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const schoolId = getSchoolId(req);
  const { otherUserId } = req.params;
  const { learner_id: learnerId } = req.query;

  const { data: other } = await supabase
    .from('users')
    .select('id, first_name, last_name, role, school_id')
    .eq('id', otherUserId)
    .maybeSingle();

  if (!other) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  if (other.school_id !== schoolId) {
    return res.status(403).json({ success: false, message: 'That user is not in your school.' });
  }
  if (!canMessage(role, other.role)) {
    return res.status(403).json({ success: false, message: 'You are not permitted to message this user.' });
  }

  let query = supabase
    .from('messages')
    .select('id, subject, body, is_read, created_at, sender_user_id, recipient_user_id, learner_id')
    .or(
      `and(sender_user_id.eq.${userId},recipient_user_id.eq.${otherUserId}),and(sender_user_id.eq.${otherUserId},recipient_user_id.eq.${userId})`
    )
    .order('created_at', { ascending: true });

  if (learnerId) query = query.eq('learner_id', learnerId);

  const { data: messages, error } = await query;
  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch conversation', error: error.message });
  }

  const unreadIds = (messages || [])
    .filter((m) => m.recipient_user_id === userId && !m.is_read)
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
  }

  return res.json({
    success: true,
    message: 'Conversation fetched',
    data: {
      contact: { id: other.id, name: fullName(other), role: other.role },
      messages: messages || [],
    },
  });
});

// =============================================================================
// POST /api/v1/messages
// Body: { recipient_user_id, learner_id?, subject?, body }
// =============================================================================
exports.sendMessage = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const schoolId = getSchoolId(req);
  const { recipient_user_id, learner_id, subject, body } = req.body || {};

  if (!recipient_user_id || !body?.trim()) {
    return res.status(400).json({ success: false, message: 'recipient_user_id and body are required' });
  }
  if (body.trim().length > 5000) {
    return res.status(400).json({ success: false, message: 'Message is too long (max 5000 characters)' });
  }
  if (recipient_user_id === userId) {
    return res.status(400).json({ success: false, message: 'You cannot message yourself' });
  }

  const { data: recipient } = await supabase
    .from('users')
    .select('id, role, school_id')
    .eq('id', recipient_user_id)
    .maybeSingle();

  if (!recipient || recipient.school_id !== schoolId) {
    return res.status(400).json({ success: false, message: 'Invalid recipient' });
  }
  if (!canMessage(role, recipient.role)) {
    return res.status(403).json({ success: false, message: 'You are not permitted to message this user.' });
  }

  const { data: created, error } = await supabase
    .from('messages')
    .insert({
      school_id: schoolId,
      learner_id: learner_id || null,
      sender_user_id: userId,
      recipient_user_id,
      subject: subject?.trim() || null,
      body: body.trim(),
      is_read: false,
    })
    .select('id, subject, body, is_read, created_at, sender_user_id, recipient_user_id, learner_id')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
  }

  return res.status(201).json({ success: true, message: 'Message sent', data: created });
});

// =============================================================================
// GET /api/v1/messages/inbox?limit=20
// Flat "most recent messages sent to me" list + unread count. Handy for a
// nav badge or a simple inbox view (mirrors parentDashboard's getMessages).
// =============================================================================
exports.getInbox = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const limit = parseInt(req.query.limit, 10) || 20;

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id, subject, body, is_read, created_at, learner_id,
      sender:sender_user_id ( id, first_name, last_name, role )
    `)
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch inbox', error: error.message });
  }

  const { count: unreadCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_user_id', userId)
    .eq('is_read', false);

  return res.json({
    success: true,
    message: 'Inbox fetched',
    data: { unread_count: unreadCount || 0, messages: messages || [] },
  });
});
