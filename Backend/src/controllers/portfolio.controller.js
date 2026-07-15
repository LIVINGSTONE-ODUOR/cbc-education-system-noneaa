// =============================================================================
// portfolio.controller.js
// Student Portfolio — projects, certificates, and achievements a student
// collects across multiple academic years. Private: a learner only ever
// sees and manages their own portfolio.
//
// Table:   portfolio_items
// Pattern: matches lostFound.controller.js / studyGroup.controller.js
// Auth:    Bearer JWT → req.user.schoolId / req.user.role / req.user.email
//
// NOTE: no file-upload support yet — entries can carry an optional external
// link (Google Drive, GitHub, an image host, etc.) instead of an uploaded
// file. If a real upload endpoint is added later (see StudentAssignments'
// submission flow for the existing multer pattern in this codebase), swap
// external_link for an uploaded file_url here, following that same pattern.
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ITEM_SELECT = `
  id, category, title, description, organization, academic_year, date_achieved,
  external_link, created_at, updated_at
`;

const VALID_CATEGORIES = ['project', 'certificate', 'achievement'];

// Resolves the learner row for the logged-in student, the same way
// studyGroup.controller.js does it: the admission number is the local part
// of the student's login email.
const getOwnLearner = async (schoolId, email) => {
  const admissionNumber = (email || '').split('@')[0];
  const { data } = await supabase
    .from('learners')
    .select('id')
    .eq('admission_number', admissionNumber)
    .eq('school_id', schoolId)
    .maybeSingle();
  return data;
};

// ---------------------------------------------------------------------------
// GET /api/v1/portfolio
// Query: category ('project'|'certificate'|'achievement'), academic_year
// Returns only the caller's own portfolio, newest first.
// ---------------------------------------------------------------------------
const listItems = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students have a portfolio' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const { category, academic_year } = req.query;

  let query = supabase
    .from('portfolio_items')
    .select(ITEM_SELECT)
    .eq('learner_id', learner.id)
    .is('deleted_at', null)
    .order('date_achieved', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (category && VALID_CATEGORIES.includes(category)) {
    query = query.eq('category', category);
  }
  if (academic_year) {
    query = query.eq('academic_year', academic_year);
  }

  const { data: items, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch portfolio', error: error.message });
  }

  return res.json({ success: true, data: { items: items || [] } });
});

// ---------------------------------------------------------------------------
// POST /api/v1/portfolio
// Body: { category*, title*, description, organization, academic_year,
//         date_achieved, external_link }
// ---------------------------------------------------------------------------
const createItem = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can add to a portfolio' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const { category, title, description, organization, academic_year, date_achieved, external_link } = req.body;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }

  const { data: item, error } = await supabase
    .from('portfolio_items')
    .insert({
      school_id: schoolId,
      learner_id: learner.id,
      category,
      title: title.trim(),
      description: description || null,
      organization: organization || null,
      academic_year: academic_year || null,
      date_achieved: date_achieved || null,
      external_link: external_link || null,
    })
    .select(ITEM_SELECT)
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to add portfolio item', error: error.message });
  }

  return res.status(201).json({ success: true, message: 'Added to your portfolio', data: { item } });
});

// ---------------------------------------------------------------------------
// PUT /api/v1/portfolio/:id
// Body: any of { category, title, description, organization, academic_year,
//         date_achieved, external_link }
// ---------------------------------------------------------------------------
const updateItem = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;
  const { id } = req.params;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only the portfolio owner can edit it' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const { category, title, description, organization, academic_year, date_achieved, external_link } = req.body;

  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  const updates = {};
  if (category !== undefined) updates.category = category;
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (organization !== undefined) updates.organization = organization;
  if (academic_year !== undefined) updates.academic_year = academic_year;
  if (date_achieved !== undefined) updates.date_achieved = date_achieved;
  if (external_link !== undefined) updates.external_link = external_link;

  const { data: item, error } = await supabase
    .from('portfolio_items')
    .update(updates)
    .eq('id', id)
    .eq('learner_id', learner.id)
    .is('deleted_at', null)
    .select(ITEM_SELECT)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update portfolio item', error: error.message });
  }
  if (!item) {
    return res.status(404).json({ success: false, message: 'Portfolio item not found' });
  }

  return res.json({ success: true, message: 'Portfolio item updated', data: { item } });
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/portfolio/:id
// ---------------------------------------------------------------------------
const deleteItem = asyncHandler(async (req, res) => {
  const { schoolId, email, role } = req.user;
  const { id } = req.params;

  if (role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only the portfolio owner can delete this item' });
  }

  const learner = await getOwnLearner(schoolId, email);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  const { data: item } = await supabase
    .from('portfolio_items')
    .select('id')
    .eq('id', id)
    .eq('learner_id', learner.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!item) {
    return res.status(404).json({ success: false, message: 'Portfolio item not found' });
  }

  const { error } = await supabase
    .from('portfolio_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete portfolio item', error: error.message });
  }

  return res.json({ success: true, message: 'Removed from your portfolio' });
});

module.exports = {
  listItems,
  createItem,
  updateItem,
  deleteItem,
};
