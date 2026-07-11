// =============================================================================
// parent.controller.js
// Phase 3 — Parents & Guardian Portal Access
//
// Tables:  parents, users, learner_parents, learners,
//          learner_enrollments, invoices, payments, assessments,
//          attendance, notifications, email_verification_tokens
// Pattern: matches teacher.controller.js, class.controller.js, learner.controller.js
// Auth:    Bearer JWT → req.user.id / req.user.schoolId / req.user.role
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler     = require('express-async-handler');
const bcrypt           = require('bcryptjs');
const crypto           = require('crypto');

// ---------------------------------------------------------------------------
// Supabase service-role client (bypasses RLS for admin operations)
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RELATIONSHIPS = ['father', 'mother', 'guardian', 'sibling', 'grandparent', 'other'];

const INVITE_EXPIRY_DAYS = 7;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const paginate = (query, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  return query.range(from, from + parseInt(limit) - 1);
};

/**
 * Helper to get school_id from req.user (handles both camelCase and snake_case)
 */
const getSchoolId = (req) => {
  return req.user.schoolId || req.user.school_id;
};

/**
 * Normalise a Kenyan phone number to +254XXXXXXXXX
 * Mirrors normalize_ke_phone() DB function
 */
const normalizePhone = (raw) => {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+254')) return cleaned;
  if (cleaned.startsWith('254') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length === 10) return `+254${cleaned.slice(1)}`;
  return cleaned;
};

/**
 * Send portal invite.
 * In production swap the console.log for your email/SMS provider
 */
const dispatchInvite = async ({ channel, to, firstName, inviteUrl, schoolName }) => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`[INVITE] ${channel.toUpperCase()} → ${to} | url: ${inviteUrl}`);
  } else {
    console.log(`[DEV INVITE] channel=${channel} to=${to} firstName=${firstName} url=${inviteUrl}`);
  }
};

// =============================================================================
// 1. POST /api/v1/parents
//    Register a parent + ALWAYS create a user account
// =============================================================================
const registerParent = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const {
    first_name, last_name, email,
    phone_number, national_id, passport_number,
    occupation, relationship, date_of_birth,
    learner_id, learner_relationship,
  } = req.body;

  // ── Validation ─────────────────────────────────────────────────────────────
  if (!first_name || !last_name) {
    return res.status(400).json({ success: false, message: 'First name and last name are required' });
  }

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required for parent registration' });
  }

  if (!national_id && !passport_number) {
    return res.status(400).json({ 
      success: false, 
      message: 'Either national_id or passport_number is required' 
    });
  }

  if (relationship && !RELATIONSHIPS.includes(relationship)) {
    return res.status(400).json({
      success: false,
      message: `Invalid relationship. Must be one of: ${RELATIONSHIPS.join(', ')}`,
    });
  }

  const normalizedPhone = normalizePhone(phone_number);

  // ── Check duplicate: same email in this school ─────────────────────────────
  const { data: dupUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .eq('school_id', school_id)
    .eq('role', 'parent')
    .maybeSingle();

  if (dupUser) {
    return res.status(409).json({ success: false, message: 'A parent account with this email already exists' });
  }

  // ── ALWAYS create user account ─────────────────────────────────────
  // Portal login = parent's email (username) + phone number (password).
  // Falls back to a random temp password only if no phone was supplied,
  // in which case the parent must use the invite link to set one.
  const initialPassword = normalizedPhone || crypto.randomBytes(10).toString('hex');
  const passwordHash = await bcrypt.hash(initialPassword, 10);

  const { data: newUser, error: userErr } = await supabase
    .from('users')
    .insert({
      email:          email.toLowerCase().trim(),
      password_hash:  passwordHash,
      first_name:     first_name.trim(),
      last_name:      last_name.trim(),
      phone_number:   normalizedPhone,
      role:           'parent',
      status:         'pending',
      email_verified: false,
      school_id:      school_id,
      is_active:      true,
    })
    .select('id')
    .single();

  if (userErr) {
    return res.status(500).json({ success: false, message: 'Failed to create user account', error: userErr.message });
  }

  const userId = newUser.id;

  // ── Insert parent record with school_id ────────────────────────────
  const { data: parent, error: parentErr } = await supabase
    .from('parents')
    .insert({
      user_id:        userId,
      school_id:      school_id,
      first_name:     first_name.trim(),
      last_name:      last_name.trim(),
      email:          email.toLowerCase().trim(),
      phone_number:   normalizedPhone,
      national_id:    national_id?.trim() || null,
      passport_number: passport_number?.trim() || null,
      occupation:     occupation?.trim() || null,
      relationship:   relationship || 'guardian',
      date_of_birth:  date_of_birth || null,
      is_active:      true,
    })
    .select('id, first_name, last_name, email, phone_number, national_id, passport_number, occupation, relationship, date_of_birth, is_active, created_at')
    .single();

  if (parentErr) {
    // Roll back user if parent insert failed
    await supabase.from('users').delete().eq('id', userId);
    return res.status(500).json({ success: false, message: 'Failed to register parent', error: parentErr.message });
  }

  // ── Optionally link to a learner ───────────────────────────────────────────
  let linkResult = null;
  if (learner_id) {
    const { data: learner } = await supabase
      .from('learners')
      .select('id')
      .eq('id', learner_id)
      .eq('school_id', school_id)
      .is('deleted_at', null)
      .single();

    if (learner) {
      const { data: link } = await supabase
        .from('learner_parents')
        .insert({
          learner_id,
          parent_id:    parent.id,
          is_primary:   true,
          relationship: learner_relationship || relationship || 'guardian',
        })
        .select('id, is_primary, relationship')
        .single();

      await supabase
        .from('learners')
        .update({ parent_id: parent.id, updated_at: new Date().toISOString() })
        .eq('id', learner_id)
        .is('parent_id', null);

      linkResult = link;
    }
  }

  res.status(201).json({
    success: true,
    message: 'Parent registered successfully',
    data: {
      ...parent,
      user_id: userId,
      account_created: true,
      login: {
        email: parent.email,
        // Only surfaced here (dev convenience); never logged/emailed in plaintext elsewhere.
        password_source: normalizedPhone ? 'phone_number' : 'temporary_generated',
      },
      linked_learner: linkResult,
    },
  });
});

// =============================================================================
// 2. GET /api/v1/parents
//    List all parents for the school (OPTIMIZED - no timeout)
// =============================================================================
const listParents = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;

  // For super_admin, don't require school_id
  if (!school_id && role !== 'super_admin') {
    return res.status(400).json({ 
      success: false, 
      message: 'School ID not found for this user' 
    });
  }

  const {
    search, is_active,
    has_account,
    page = 1, limit = 20,
    sort_by = 'last_name', sort_order = 'asc',
  } = req.query;

  // Build query - for super_admin, don't filter by school_id
  let query = supabase
    .from('parents')
    .select(`
      id, 
      first_name, 
      last_name, 
      email, 
      phone_number,
      national_id, 
      passport_number,
      occupation, 
      relationship, 
      is_active, 
      created_at,
      updated_at,
      user_id
    `, { count: 'exact' });
  
  // Only filter by school_id if user is not super_admin
  if (role !== 'super_admin' && school_id) {
    query = query.eq('school_id', school_id);
  }

  // Apply filters
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }
  
  if (has_account === 'true') {
    query = query.not('user_id', 'is', null);
  }
  if (has_account === 'false') {
    query = query.is('user_id', null);
  }

  if (search) {
    const q = `%${search}%`;
    query = query.or(
      `first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q},national_id.ilike.${q},phone_number.ilike.${q}`
    );
  }

  // Add sorting
  const validSort = ['last_name', 'first_name', 'created_at', 'email'];
  const sortField = validSort.includes(sort_by) ? sort_by : 'last_name';
  query = query.order(sortField, { ascending: sort_order !== 'desc' });

  // Add pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;
  query = query.range(from, to);

  // Execute query with timeout protection
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Query timeout')), 30000)
  );
  
  try {
    const { data, error, count } = await Promise.race([query, timeoutPromise]);
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch parents', 
        error: error.message 
      });
    }

    // Fetch user details for parents with user_id
    const parentIds = (data || []).filter(p => p.user_id).map(p => p.user_id);
    let userMap = {};
    
    if (parentIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, status, email_verified, last_login')
        .in('id', parentIds);
      
      if (users) {
        userMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }
    }

    // Enrich parent data with user info
    const enrichedParents = (data || []).map(parent => ({
      ...parent,
      user: parent.user_id ? userMap[parent.user_id] || null : null,
    }));

    res.json({
      success: true,
      data: enrichedParents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (err) {
    console.error('Query failed:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Database query timeout',
      error: err.message 
    });
  }
});

// =============================================================================
// 3. GET /api/v1/parents/:id
//    Full parent profile + all linked learners (OPTIMIZED)
// =============================================================================
const getParent = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id } = req.params;

  // Build query - for super_admin, don't filter by school_id
  let query = supabase
    .from('parents')
    .select(`
      id, 
      first_name, 
      last_name, 
      email, 
      phone_number,
      national_id, 
      passport_number,
      occupation, 
      relationship, 
      date_of_birth,
      is_active,
      created_at, 
      updated_at,
      user_id
    `)
    .eq('id', id);
  
  // Only filter by school_id if user is not super_admin
  if (role !== 'super_admin' && school_id) {
    query = query.eq('school_id', school_id);
  }
  
  const { data: parent, error } = await query.single();

  if (error || !parent) {
    return res.status(404).json({ success: false, message: 'Parent not found' });
  }

  // Get user details separately (simpler)
  let userDetails = null;
  if (parent.user_id) {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, status, email_verified, last_login, created_at')
      .eq('id', parent.user_id)
      .single();
    userDetails = user;
  }

  // Get linked learners (simplified)
  const { data: learnerLinks } = await supabase
    .from('learner_parents')
    .select(`
      id, 
      is_primary, 
      relationship,
      learner_id
    `)
    .eq('parent_id', id);

  // Get learner details separately
  const learnerIds = (learnerLinks || []).map(l => l.learner_id).filter(Boolean);
  
  let learners = [];
  if (learnerIds.length) {
    const { data: learnerData } = await supabase
      .from('learners')
      .select(`
        id, 
        first_name, 
        last_name, 
        middle_name,
        admission_number, 
        gender, 
        date_of_birth,
        grade_level, 
        stream_name, 
        is_active
      `)
      .in('id', learnerIds);
    learners = learnerData || [];
  }

  // Combine links with learner details
  const linkedLearners = (learnerLinks || []).map(link => ({
    link_id: link.id,
    is_primary: link.is_primary,
    relationship: link.relationship,
    ...learners.find(l => l.id === link.learner_id)
  }));

  res.json({
    success: true,
    data: {
      ...parent,
      user: userDetails,
      linked_learners: linkedLearners,
      total_children: linkedLearners.length,
    },
  });
});

// =============================================================================
// 4. PUT /api/v1/parents/:id
//    Update parent contact info (and sync to users table)
// =============================================================================
const updateParent = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  // Build query to check existing parent
  let checkQuery = supabase
    .from('parents')
    .select('id, user_id')
    .eq('id', id);
  
  // Only filter by school_id if user is not super_admin
  if (role !== 'super_admin' && school_id) {
    checkQuery = checkQuery.eq('school_id', school_id);
  }
  
  const { data: existing } = await checkQuery.single();

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Parent not found' });
  }

  const {
    first_name, last_name, email,
    phone_number, national_id, passport_number,
    occupation, relationship, date_of_birth, is_active,
  } = req.body;

  if (relationship && !RELATIONSHIPS.includes(relationship)) {
    return res.status(400).json({ success: false, message: `Invalid relationship. Must be one of: ${RELATIONSHIPS.join(', ')}` });
  }

  const normalizedPhone = phone_number ? normalizePhone(phone_number) : undefined;

  // Build parents update payload
  const parentUpdates = {};
  if (first_name !== undefined) parentUpdates.first_name = first_name.trim();
  if (last_name !== undefined) parentUpdates.last_name = last_name.trim();
  if (email !== undefined) parentUpdates.email = email.toLowerCase().trim();
  if (normalizedPhone !== undefined) parentUpdates.phone_number = normalizedPhone;
  if (national_id !== undefined) parentUpdates.national_id = national_id?.trim() || null;
  if (passport_number !== undefined) parentUpdates.passport_number = passport_number?.trim() || null;
  if (occupation !== undefined) parentUpdates.occupation = occupation?.trim() || null;
  if (relationship !== undefined) parentUpdates.relationship = relationship;
  if (date_of_birth !== undefined) parentUpdates.date_of_birth = date_of_birth || null;
  if (is_active !== undefined) parentUpdates.is_active = is_active;

  if (!Object.keys(parentUpdates).length) {
    return res.status(400).json({ success: false, message: 'No updatable fields provided' });
  }

  parentUpdates.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('parents')
    .update(parentUpdates)
    .eq('id', id)
    .select('id, first_name, last_name, email, phone_number, national_id, passport_number, occupation, relationship, date_of_birth, is_active, updated_at')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update parent', error: error.message });
  }

  // Sync to users table if account exists
  if (existing.user_id) {
    const userUpdates = {};
    if (first_name !== undefined) userUpdates.first_name = first_name.trim();
    if (last_name !== undefined) userUpdates.last_name = last_name.trim();
    if (normalizedPhone !== undefined) userUpdates.phone_number = normalizedPhone;
    if (email !== undefined) userUpdates.email = email.toLowerCase().trim();
    if (is_active !== undefined) {
      userUpdates.is_active = is_active;
      userUpdates.status = is_active ? 'active' : 'suspended';
    }

    if (Object.keys(userUpdates).length) {
      userUpdates.updated_at = new Date().toISOString();
      await supabase.from('users').update(userUpdates).eq('id', existing.user_id);
    }
  }

  res.json({ success: true, message: 'Parent updated', data: updated });
});

// =============================================================================
// 5. POST /api/v1/parents/:id/link-learner
//    Link an existing parent to an existing learner
// =============================================================================
const linkLearner = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { learner_id, relationship, is_primary } = req.body;

  if (!learner_id) {
    return res.status(400).json({ success: false, message: 'learner_id is required' });
  }

  // Verify parent exists and belongs to this school
  let parentQuery = supabase
    .from('parents')
    .select('id, first_name, last_name')
    .eq('id', id);
  
  if (role !== 'super_admin' && school_id) {
    parentQuery = parentQuery.eq('school_id', school_id);
  }
  
  const { data: parent } = await parentQuery.single();

  if (!parent) {
    return res.status(404).json({ success: false, message: 'Parent not found' });
  }

  // Verify learner exists and belongs to this school
  let learnerQuery = supabase
    .from('learners')
    .select('id, first_name, last_name, parent_id')
    .eq('id', learner_id)
    .is('deleted_at', null);
  
  if (role !== 'super_admin' && school_id) {
    learnerQuery = learnerQuery.eq('school_id', school_id);
  }
  
  const { data: learner } = await learnerQuery.single();

  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  // Check link doesn't already exist
  const { data: existingLink } = await supabase
    .from('learner_parents')
    .select('id')
    .eq('parent_id', id)
    .eq('learner_id', learner_id)
    .maybeSingle();

  if (existingLink) {
    return res.status(409).json({
      success: false,
      message: `${parent.first_name} is already linked to ${learner.first_name}`,
    });
  }

  // If marking as primary, demote any existing primary parent
  if (is_primary) {
    await supabase
      .from('learner_parents')
      .update({ is_primary: false })
      .eq('learner_id', learner_id)
      .eq('is_primary', true);
  }

  const { data: link, error } = await supabase
    .from('learner_parents')
    .insert({
      parent_id: id,
      learner_id,
      is_primary: is_primary ?? false,
      relationship: relationship || 'guardian',
    })
    .select('id, is_primary, relationship')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to link learner', error: error.message });
  }

  // If primary and learner has no parent_id set, set it
  if (is_primary && !learner.parent_id) {
    await supabase
      .from('learners')
      .update({ parent_id: id, updated_at: new Date().toISOString() })
      .eq('id', learner_id);
  }

  res.status(201).json({
    success: true,
    message: `${parent.first_name} linked to ${learner.first_name} ${learner.last_name}`,
    data: {
      link_id: link.id,
      parent_id: id,
      learner_id,
      is_primary: link.is_primary,
      relationship: link.relationship,
    },
  });
});

// =============================================================================
// 6. DELETE /api/v1/parents/:id/unlink/:learnerId
//    Remove the parent ↔ learner link
// =============================================================================
const unlinkLearner = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id, learnerId } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  // Verify parent belongs to school
  let parentQuery = supabase
    .from('parents')
    .select('id, first_name, last_name')
    .eq('id', id);
  
  if (role !== 'super_admin' && school_id) {
    parentQuery = parentQuery.eq('school_id', school_id);
  }
  
  const { data: parent } = await parentQuery.single();

  if (!parent) {
    return res.status(404).json({ success: false, message: 'Parent not found' });
  }

  // Verify learner belongs to school
  let learnerQuery = supabase
    .from('learners')
    .select('id, first_name, last_name, parent_id')
    .eq('id', learnerId)
    .is('deleted_at', null);
  
  if (role !== 'super_admin' && school_id) {
    learnerQuery = learnerQuery.eq('school_id', school_id);
  }
  
  const { data: learner } = await learnerQuery.single();

  if (!learner) {
    return res.status(404).json({ success: false, message: 'Learner not found' });
  }

  // Find the link
  const { data: link } = await supabase
    .from('learner_parents')
    .select('id, is_primary')
    .eq('parent_id', id)
    .eq('learner_id', learnerId)
    .maybeSingle();

  if (!link) {
    return res.status(404).json({ success: false, message: 'No link exists between this parent and learner' });
  }

  // Remove the junction row
  const { error } = await supabase
    .from('learner_parents')
    .delete()
    .eq('id', link.id);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to unlink learner', error: error.message });
  }

  // If this was the primary parent, clear or update learner.parent_id
  if (link.is_primary && learner.parent_id === id) {
    const { data: nextPrimary } = await supabase
      .from('learner_parents')
      .select('parent_id')
      .eq('learner_id', learnerId)
      .eq('is_primary', true)
      .maybeSingle();

    await supabase
      .from('learners')
      .update({
        parent_id: nextPrimary?.parent_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', learnerId);
  }

  res.json({
    success: true,
    message: `${parent.first_name} ${parent.last_name} unlinked from ${learner.first_name} ${learner.last_name}`,
  });
});

// =============================================================================
// 7. POST /api/v1/parents/:id/send-invite
//    Create or reset user account and send portal invite link
// =============================================================================
const sendInvite = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { channel = 'email', resend = false } = req.body;

  if (!['email', 'sms'].includes(channel)) {
    return res.status(400).json({ success: false, message: 'channel must be email or sms' });
  }

  // Verify parent belongs to this school
  let parentQuery = supabase
    .from('parents')
    .select('id, first_name, last_name, email, phone_number, user_id')
    .eq('id', id);
  
  if (role !== 'super_admin' && school_id) {
    parentQuery = parentQuery.eq('school_id', school_id);
  }
  
  const { data: parent } = await parentQuery.single();

  if (!parent) {
    return res.status(404).json({ success: false, message: 'Parent not found' });
  }

  // Validate channel prerequisites
  if (channel === 'email' && !parent.email) {
    return res.status(400).json({ success: false, message: 'Parent has no email address. Update contact info first.' });
  }
  if (channel === 'sms' && !parent.phone_number) {
    return res.status(400).json({ success: false, message: 'Parent has no phone number. Update contact info first.' });
  }

  // Get school name
  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', school_id)
    .single();

  // Ensure parent has a user account
  let userId = parent.user_id;

  if (!userId) {
    if (!parent.email) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create portal account without an email address',
      });
    }

    // Portal login = email (username) + phone number (password), matching registerParent.
    const tempPassword = parent.phone_number || crypto.randomBytes(12).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert({
        email: parent.email,
        password_hash: passwordHash,
        first_name: parent.first_name,
        last_name: parent.last_name,
        phone_number: parent.phone_number || null,
        role: 'parent',
        status: 'pending',
        email_verified: false,
        school_id,
        is_active: true,
      })
      .select('id')
      .single();

    if (userErr) {
      return res.status(500).json({ success: false, message: 'Failed to create portal account', error: userErr.message });
    }

    userId = newUser.id;

    await supabase
      .from('parents')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq('id', id);
  } else if (resend) {
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', userId);
  }

  // Generate invite token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await supabase.from('email_verification_tokens').insert({
    user_id: userId,
    token_hash: rawToken,
    expires_at: expiresAt.toISOString(),
  });

  // Build invite URL
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/portal/activate?token=${rawToken}`;

  // Send invite
  const to = channel === 'email' ? parent.email : parent.phone_number;

  await dispatchInvite({
    channel,
    to,
    firstName: parent.first_name,
    inviteUrl,
    schoolName: school?.name || 'Your School',
  });

  // Log notification
  await supabase.from('notifications').insert({
    school_id,
    recipient_user_id: userId,
    channel,
    category: 'parent_invite',
    subject: channel === 'email' ? `${school?.name || 'Your School'} — Parent Portal Access` : null,
    body: channel === 'email'
      ? `Dear ${parent.first_name}, activate your parent portal: ${inviteUrl}`
      : `${school?.name}: Activate parent portal: ${inviteUrl}`,
    related_table: 'parents',
    related_id: id,
    status: 'delivered',
    scheduled_at: new Date().toISOString(),
  });

  const isDev = process.env.NODE_ENV !== 'production';

  res.json({
    success: true,
    message: `Portal invite sent via ${channel} to ${to}`,
    data: {
      parent_id: id,
      user_id: userId,
      channel,
      to,
      expires_at: expiresAt.toISOString(),
      ...(isDev && { invite_url: inviteUrl, token: rawToken }),
    },
  });
});

// =============================================================================
// 8. GET /api/v1/parents/me/children
//    Self-service portal endpoint — a logged-in parent's own linked learners,
//    each with a lightweight performance snapshot.
//    Supports parents with MULTIPLE children (returns all of them at once).
// =============================================================================
const getMyChildren = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;

  if (role !== 'parent') {
    return res.status(403).json({ success: false, message: 'Parent access only' });
  }

  // Resolve the parents row for this logged-in user
  const { data: parent, error: parentErr } = await supabase
    .from('parents')
    .select('id, first_name, last_name, email, phone_number, school_id')
    .eq('user_id', userId)
    .single();

  if (parentErr || !parent) {
    return res.status(404).json({ success: false, message: 'Parent profile not found for this account' });
  }

  // All learners linked to this parent (one row per child, however many there are)
  const { data: links } = await supabase
    .from('learner_parents')
    .select('learner_id, is_primary, relationship')
    .eq('parent_id', parent.id);

  const learnerIds = (links || []).map((l) => l.learner_id).filter(Boolean);

  if (!learnerIds.length) {
    return res.json({
      success: true,
      data: { parent, children: [], total_children: 0 },
    });
  }

  const { data: learners } = await supabase
    .from('learners')
    .select(`
      id, first_name, last_name, middle_name, admission_number,
      gender, date_of_birth, grade_level, stream_name, class_id, is_active
    `)
    .in('id', learnerIds);

  // Latest exam summary per child (best-effort — a missing summary shouldn't break the list)
  const { buildLearnerSummaries } = require('./results.controller');
  const children = await Promise.all(
    (learners || []).map(async (learner) => {
      const link = (links || []).find((l) => l.learner_id === learner.id);
      let latestExam = null;
      try {
        const summaries = await buildLearnerSummaries(parent.school_id, learner.id);
        latestExam = summaries?.[0] || null; // most recent exam first
      } catch (e) {
        latestExam = null;
      }

      return {
        ...learner,
        relationship: link?.relationship || null,
        is_primary_guardian: !!link?.is_primary,
        latest_exam_summary: latestExam,
      };
    })
  );

  res.json({
    success: true,
    data: { parent, children, total_children: children.length },
  });
});

// =============================================================================
// 9. POST /api/v1/parents/fix-school-id (ADMIN ONLY - Fix missing school_id)
// =============================================================================
const fixMissingSchoolId = asyncHandler(async (req, res) => {
  const { role } = req.user;

  if (role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Super admin only' });
  }

  const { target_school_id } = req.body;

  if (!target_school_id) {
    return res.status(400).json({ success: false, message: 'target_school_id required' });
  }

  // Update all parents with null school_id
  const { data, error, count } = await supabase
    .from('parents')
    .update({ school_id: target_school_id, updated_at: new Date().toISOString() })
    .is('school_id', null)
    .select();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to update', error: error.message });
  }

  res.json({
    success: true,
    message: `Updated ${count || 0} parent records`,
    updated_count: count || 0,
  });
});

// =============================================================================
// Export
// =============================================================================
module.exports = {
  registerParent,
  listParents,
  getParent,
  updateParent,
  linkLearner,
  unlinkLearner,
  sendInvite,
  getMyChildren,
  fixMissingSchoolId,
};
