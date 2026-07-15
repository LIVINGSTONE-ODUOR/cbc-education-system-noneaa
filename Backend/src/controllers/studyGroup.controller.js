// =============================================================================
// studyGroup.controller.js
// Peer collaboration groups — students form study groups / project teams
// scoped to their own class, with a simple shared message feed.
//
// Tables:  study_groups, study_group_members, study_group_messages
// Joins:   classes, learning_areas, learners
// Pattern: matches assignment.controller.js / exam.controller.js
// Auth:    Bearer JWT → req.user.schoolId / req.user.role / req.user.id
//
// Scope of this first version: any learner in a class can create a group for
// that class and any classmate can join it (up to max_members). Teachers and
// admins can view groups for classes in their school but do not manage
// membership here — this is a student-led feature.
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GROUP_SELECT = `
  id, name, description, class_id, learning_area_id, created_by, max_members, is_active, created_at, updated_at,
  learning_areas:learning_area_id ( id, name, code ),
  creator:created_by ( id, first_name, last_name )
`;

// Resolves the learner row for the logged-in student, the same way
// assignment.controller.js / exam.controller.js do it: the admission number
// is the local part of the student's login email.
const getOwnLearner = async (schoolId, email) => {
  const admissionNumber = (email || '').split('@')[0];
  const { data } = await supabase
    .from('learners')
    .select('id, first_name, last_name')
    .eq('admission_number', admissionNumber)
    .eq('school_id', schoolId)
    .maybeSingle();
  return data;
};

// Resolves a learner's current class via learner_enrollments, matching the
// pattern used for assignments/attendance/results.
const getLearnerClassId = async (learnerId) => {
  const { data } = await supabase
    .from('learner_enrollments')
    .select('class_id')
    .eq('learner_id', learnerId)
    .eq('status', 'enrolled')
    .maybeSingle();
  return data?.class_id || null;
};

const getMemberCount = async (groupId) => {
  const { count } = await supabase
    .from('study_group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId);
  return count || 0;
};

const isMember = async (groupId, learnerId) => {
  const { data } = await supabase
    .from('study_group_members')
    .select('id, role')
    .eq('group_id', groupId)
    .eq('learner_id', learnerId)
    .maybeSingle();
  return data;
};

// ---------------------------------------------------------------------------
// GET /api/v1/study-groups
// Query: class_id (required for teacher/admin; defaults to the caller's own
//        class for students)
// Lists active study groups for one class, with member count and whether the
// caller has already joined.
// ---------------------------------------------------------------------------
const listStudyGroups = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;
  let classId = req.query.class_id;
  let callerLearner = null;

  if (role === 'student') {
    callerLearner = await getOwnLearner(schoolId, email);
    if (!callerLearner) {
      return res.status(404).json({ success: false, message: 'Learner not found' });
    }
    classId = classId || (await getLearnerClassId(callerLearner.id));
  }

  if (!classId) {
    return res.status(400).json({ success: false, message: 'class_id is required' });
  }

  const { data: groups, error } = await supabase
    .from('study_groups')
    .select(GROUP_SELECT)
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch study groups', error: error.message });
  }

  const enriched = await Promise.all(
    (groups || []).map(async (g) => {
      const memberCount = await getMemberCount(g.id);
      const membership = callerLearner ? await isMember(g.id, callerLearner.id) : null;
      return {
        ...g,
        member_count: memberCount,
        is_member: !!membership,
        my_role: membership?.role || null,
      };
    })
  );

  return res.json({ success: true, data: { groups: enriched } });
});

// ---------------------------------------------------------------------------
// POST /api/v1/study-groups
// Body: { name*, description, learning_area_id, max_members }
// A student creates a group for their own class and is auto-added as owner.
// ---------------------------------------------------------------------------
const createStudyGroup = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can create study groups' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const classId = await getLearnerClassId(learner.id);
  if (!classId) {
    return res.status(400).json({ success: false, message: 'You must be enrolled in a class to create a study group' });
  }

  const { name, description, learning_area_id, max_members } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  const { data: group, error } = await supabase
    .from('study_groups')
    .insert({
      school_id: schoolId,
      class_id: classId,
      learning_area_id: learning_area_id || null,
      name: name.trim(),
      description: description || null,
      created_by: learner.id,
      max_members: max_members ? Number(max_members) : 10,
    })
    .select(GROUP_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to create study group', error: error.message });
  }

  const { error: memberError } = await supabase
    .from('study_group_members')
    .insert({ group_id: group.id, learner_id: learner.id, role: 'owner' });

  if (memberError) {
    return res.status(500).json({ success: false, message: 'Group created but failed to add you as a member', error: memberError.message });
  }

  return res.status(201).json({ success: true, message: 'Study group created', data: { group: { ...group, member_count: 1, is_member: true, my_role: 'owner' } } });
});

// ---------------------------------------------------------------------------
// GET /api/v1/study-groups/:id
// Group detail with its member list.
// ---------------------------------------------------------------------------
const getStudyGroup = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const { data: group, error } = await supabase
    .from('study_groups')
    .select(GROUP_SELECT)
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch study group', error: error.message });
  }
  if (!group) {
    return res.status(404).json({ success: false, message: 'Study group not found' });
  }

  const { data: members, error: membersError } = await supabase
    .from('study_group_members')
    .select('id, role, joined_at, learners:learner_id ( id, first_name, last_name, admission_number )')
    .eq('group_id', id)
    .order('joined_at', { ascending: true });

  if (membersError) {
    return res.status(500).json({ success: false, message: 'Failed to fetch members', error: membersError.message });
  }

  return res.json({ success: true, data: { group, members: members || [] } });
});

// ---------------------------------------------------------------------------
// POST /api/v1/study-groups/:id/join
// A student (classmate) joins an existing group, if there's room.
// ---------------------------------------------------------------------------
const joinStudyGroup = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;
  const { id } = req.params;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can join study groups' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const { data: group } = await supabase
    .from('study_groups')
    .select('id, class_id, max_members, is_active')
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!group || !group.is_active) {
    return res.status(404).json({ success: false, message: 'Study group not found' });
  }

  const myClassId = await getLearnerClassId(learner.id);
  if (myClassId !== group.class_id) {
    return res.status(403).json({ success: false, message: 'You can only join study groups in your own class' });
  }

  const existing = await isMember(id, learner.id);
  if (existing) {
    return res.status(409).json({ success: false, message: 'You are already in this group' });
  }

  const memberCount = await getMemberCount(id);
  if (memberCount >= group.max_members) {
    return res.status(409).json({ success: false, message: 'This group is full' });
  }

  const { error } = await supabase
    .from('study_group_members')
    .insert({ group_id: id, learner_id: learner.id, role: 'member' });

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to join study group', error: error.message });
  }

  return res.json({ success: true, message: 'Joined study group' });
});

// ---------------------------------------------------------------------------
// POST /api/v1/study-groups/:id/leave
// ---------------------------------------------------------------------------
const leaveStudyGroup = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;
  const { id } = req.params;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can leave study groups' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const membership = await isMember(id, learner.id);
  if (!membership) {
    return res.status(404).json({ success: false, message: 'You are not in this group' });
  }

  if (membership.role === 'owner') {
    return res.status(409).json({
      success: false,
      message: 'As the owner, delete the group instead of leaving, or transfer ownership first.',
    });
  }

  const { error } = await supabase
    .from('study_group_members')
    .delete()
    .eq('group_id', id)
    .eq('learner_id', learner.id);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to leave study group', error: error.message });
  }

  return res.json({ success: true, message: 'Left study group' });
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/study-groups/:id
// Owner-only. Soft-deletes the group.
// ---------------------------------------------------------------------------
const deleteStudyGroup = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;
  const { id } = req.params;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only the group owner can delete this group' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const membership = await isMember(id, learner.id);
  if (!membership || membership.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Only the group owner can delete this group' });
  }

  const { error } = await supabase
    .from('study_groups')
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('school_id', schoolId);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete study group', error: error.message });
  }

  return res.json({ success: true, message: 'Study group deleted' });
});

// ---------------------------------------------------------------------------
// GET /api/v1/study-groups/:id/messages
// ---------------------------------------------------------------------------
const listGroupMessages = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;
  const { id } = req.params;

  if (role === 'student') {
    const learner = await getOwnLearner(schoolId, email);
    if (!learner || !(await isMember(id, learner.id))) {
      return res.status(403).json({ success: false, message: 'You must be a member of this group to view its messages' });
    }
  }

  const { data: messages, error } = await supabase
    .from('study_group_messages')
    .select('id, message, created_at, learners:learner_id ( id, first_name, last_name )')
    .eq('group_id', id)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }

  return res.json({ success: true, data: { messages: messages || [] } });
});

// ---------------------------------------------------------------------------
// POST /api/v1/study-groups/:id/messages
// Body: { message* }
// ---------------------------------------------------------------------------
const postGroupMessage = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;
  const { id } = req.params;
  const { message } = req.body;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only student group members can post messages' });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'message is required' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner || !(await isMember(id, learner.id))) {
    return res.status(403).json({ success: false, message: 'You must be a member of this group to post messages' });
  }

  const { data: created, error } = await supabase
    .from('study_group_messages')
    .insert({ group_id: id, learner_id: learner.id, message: message.trim() })
    .select('id, message, created_at, learners:learner_id ( id, first_name, last_name )')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to post message', error: error.message });
  }

  return res.status(201).json({ success: true, data: { message: created } });
});

module.exports = {
  listStudyGroups,
  createStudyGroup,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  deleteStudyGroup,
  listGroupMessages,
  postGroupMessage,
};
