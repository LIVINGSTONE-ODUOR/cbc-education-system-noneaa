// =============================================================================
// lostFound.controller.js
// Lost & Found board — students report items they've lost or found on campus.
//
// Table:   lost_found_items
// Pattern: matches studyGroup.controller.js
// Auth:    Bearer JWT → req.user.schoolId / req.user.role / req.user.id
//
// Scope: visible school-wide to any authenticated user (students, teachers,
// admins) so a teacher finding a student's water bottle can post it too.
// Only students post from the Student Portal today; only the reporter can
// resolve or delete their own post.
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ITEM_SELECT = `
  id, item_type, title, description, location, contact_info, status,
  created_at, updated_at, resolved_at, reported_by,
  reporter:reported_by ( id, first_name, last_name )
`;

// Resolves the learner row for the logged-in student, the same way
// studyGroup.controller.js does it: the admission number is the local part
// of the student's login email.
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

// ---------------------------------------------------------------------------
// GET /api/v1/lost-found
// Query: status ('open' | 'resolved', default 'open'), type ('lost' | 'found')
// School-wide list, newest first.
// ---------------------------------------------------------------------------
const listItems = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { status, type } = req.query;

  let query = supabase
    .from('lost_found_items')
    .select(ITEM_SELECT)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (status === 'resolved') {
    query = query.eq('status', 'resolved');
  } else if (status !== 'all') {
    query = query.eq('status', 'open'); // default: only open posts
  }

  if (type === 'lost' || type === 'found') {
    query = query.eq('item_type', type);
  }

  const { data: items, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch lost & found items', error: error.message });
  }

  return res.json({ success: true, data: { items: items || [] } });
});

// ---------------------------------------------------------------------------
// POST /api/v1/lost-found
// Body: { item_type* ('lost'|'found'), title*, description, location, contact_info }
// ---------------------------------------------------------------------------
const createItem = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can post to the Lost & Found board' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const { item_type, title, description, location, contact_info } = req.body;

  if (!item_type || !['lost', 'found'].includes(item_type)) {
    return res.status(400).json({ success: false, message: "item_type must be 'lost' or 'found'" });
  }
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }

  const { data: item, error } = await supabase
    .from('lost_found_items')
    .insert({
      school_id: schoolId,
      reported_by: learner.id,
      item_type,
      title: title.trim(),
      description: description || null,
      location: location || null,
      contact_info: contact_info || null,
    })
    .select(ITEM_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to create lost & found post', error: error.message });
  }

  return res.status(201).json({ success: true, message: 'Posted to Lost & Found', data: { item } });
});

// ---------------------------------------------------------------------------
// POST /api/v1/lost-found/:id/resolve
// Reporter-only. Marks an item as resolved (claimed / returned).
// ---------------------------------------------------------------------------
const resolveItem = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;
  const { id } = req.params;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only the person who posted this item can resolve it' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const { data: item } = await supabase
    .from('lost_found_items')
    .select('id, reported_by')
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!item) {
    return res.status(404).json({ success: false, message: 'Lost & Found post not found' });
  }
  if (item.reported_by !== learner.id) {
    return res.status(403).json({ success: false, message: 'Only the person who posted this item can resolve it' });
  }

  const { error } = await supabase
    .from('lost_found_items')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to resolve post', error: error.message });
  }

  return res.json({ success: true, message: 'Marked as resolved' });
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/lost-found/:id
// Reporter-only. Soft-deletes the post.
// ---------------------------------------------------------------------------
const deleteItem = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;
  const { id } = req.params;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only the person who posted this item can delete it' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const { data: item } = await supabase
    .from('lost_found_items')
    .select('id, reported_by')
    .eq('id', id)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!item) {
    return res.status(404).json({ success: false, message: 'Lost & Found post not found' });
  }
  if (item.reported_by !== learner.id) {
    return res.status(403).json({ success: false, message: 'Only the person who posted this item can delete it' });
  }

  const { error } = await supabase
    .from('lost_found_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete post', error: error.message });
  }

  return res.json({ success: true, message: 'Post deleted' });
});

module.exports = {
  listItems,
  createItem,
  resolveItem,
  deleteItem,
};
