// =============================================================================
// learner.controller.js
// Phase 3 — Learner Management
//
// Tables:  learners, classes, learner_enrollments, parents
// Auth:    Bearer JWT → req.user.id / req.user.schoolId / req.user.role
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');
const csv = require('csv-parse/sync');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Supabase service-role client (bypasses RLS for admin operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Valid grade levels from schema CHECK constraint
const GRADE_LEVELS = [
  'PP1', 'PP2',
  'Grade 1', 'Grade 2', 'Grade 3',
  'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9',
];

// Valid gender values
const GENDERS = ['male', 'female'];

// Valid nationalities
const NATIONALITIES = ['Kenyan', 'Ugandan', 'Tanzanian', 'Rwandan', 'Burundian', 'South Sudanese', 'Other'];

// ---------------------------------------------------------------------------
// Helper: get school_id from req.user (handles both camelCase and snake_case)
// ---------------------------------------------------------------------------
const getSchoolId = (req) => {
  return req.user.schoolId || req.user.school_id;
};

// =============================================================================
// 1. POST /api/v1/learners
//    Register a new learner with ALL fields + create parent
// =============================================================================
const registerLearner = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;

  if (!['school_admin', 'super_admin', 'teacher'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const {
    // Basic info
    first_name,
    last_name,
    middle_name,
    admission_number,
    date_of_birth,
    gender,
    email,

    // Government & CBC
    birth_certificate_number,
    nemis_number,
    nationality,

    // Health info
    special_needs,
    medical_conditions,
    allergies,

    // Academic info
    previous_school,
    admission_date,
    academic_year,

    // Photo
    profile_photo,

    // Parent info
    parent_info,

    // ✅ Enrollment during registration
    class_id,
    enrollment_date,
    academic_year_id,
    term_id,
  } = req.body;

  // Validation
  if (!first_name || !last_name || !admission_number || !date_of_birth || !gender) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: first_name, last_name, admission_number, date_of_birth, gender'
    });
  }

  if (!GENDERS.includes(gender.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Gender must be one of: ${GENDERS.join(', ')}`
    });
  }

  if (nationality && !NATIONALITIES.includes(nationality)) {
    return res.status(400).json({
      success: false,
      message: `Nationality must be one of: ${NATIONALITIES.join(', ')}`
    });
  }

  // Check if admission number already exists for this school
  const { data: existing } = await supabase
    .from('learners')
    .select('id')
    .eq('admission_number', admission_number)
    .eq('school_id', school_id)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Admission number already exists for this school'
    });
  }

  // Check if NEMIS number is unique (if provided)
  if (nemis_number) {
    const { data: existingNemis } = await supabase
      .from('learners')
      .select('id')
      .eq('nemis_number', nemis_number)
      .maybeSingle();

    if (existingNemis) {
      return res.status(409).json({
        success: false,
        message: 'NEMIS number already exists for another learner'
      });
    }
  }

  // Check if email is unique (if provided)
  if (email) {
    const { data: existingEmail } = await supabase
      .from('learners')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists for another learner'
      });
    }
  }

  // ✅ Create learner with ALL new fields
  const learnerPayload = {
    school_id,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    middle_name: middle_name?.trim() || null,
    admission_number,
    date_of_birth,
    gender: gender.toLowerCase(),
    email: email?.trim() || null,
    profile_photo: profile_photo || null,
    special_needs: special_needs || null,
    medical_conditions: medical_conditions || null,
    allergies: allergies || null,
    birth_certificate_number: birth_certificate_number?.trim() || null,
    nemis_number: nemis_number?.trim() || null,
    nationality: nationality || 'Kenyan',
    previous_school: previous_school || null,
    admission_date: admission_date || new Date().toISOString().split('T')[0],
    academic_year: academic_year || new Date().getFullYear().toString(),
    is_active: true,
    created_by: req.user.id  // ✅ ADD THIS
  };

  const { data: learner, error } = await supabase
    .from('learners')
    .insert(learnerPayload)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to register learner',
      error: error.message
    });
  }

  // ✅ Create parent if parent_info provided
  let parentInfo = null;
  if (parent_info && parent_info.email) {
    try {
      // Check if parent already exists with this email
      const { data: existingParent } = await supabase
        .from('parents')
        .select('id, first_name, last_name, email')
        .eq('email', parent_info.email.toLowerCase().trim())
        .eq('school_id', school_id)
        .maybeSingle();

      if (existingParent) {
        parentInfo = existingParent;
        
        // Link existing parent to learner
        const { data: existingLink } = await supabase
          .from('learner_parents')
          .select('id')
          .eq('parent_id', existingParent.id)
          .eq('learner_id', learner.id)
          .maybeSingle();

        if (!existingLink) {
          await supabase
            .from('learner_parents')
            .insert({
              learner_id: learner.id,
              parent_id: existingParent.id,
              relationship: parent_info.relationship || 'guardian',
              is_primary: true
            });

          await supabase
            .from('learners')
            .update({ parent_id: existingParent.id })
            .eq('id', learner.id);
        }
      } else {
        // ✅ CREATE USER FIRST
        const tempPassword = crypto.randomBytes(12).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: parent_info.email.toLowerCase().trim(),
            password_hash: passwordHash,
            first_name: parent_info.first_name,
            last_name: parent_info.last_name,
            phone_number: parent_info.phone_number || null,
            role: 'parent',
            status: 'pending',
            email_verified: false,
            school_id,
            is_active: true
          })
          .select('id')
          .single();

        if (userError) {
          console.warn('Failed to create parent user:', userError);
          return;
        }

        // ✅ CREATE PARENT WITH USER_ID
        const { data: parentRecord, error: parentError } = await supabase
          .from('parents')
          .insert({
            user_id: newUser.id, // ✅ THIS IS REQUIRED
            school_id,
            first_name: parent_info.first_name,
            last_name: parent_info.last_name,
            email: parent_info.email.toLowerCase().trim(),
            phone_number: parent_info.phone_number || null,
            national_id: parent_info.national_id || null,
            occupation: parent_info.occupation || null,
            relationship: parent_info.relationship || 'guardian',
            is_active: true
          })
          .select()
          .single();

        if (!parentError && parentRecord) {
          parentInfo = parentRecord;

          // Link parent to learner
          await supabase
            .from('learner_parents')
            .insert({
              learner_id: learner.id,
              parent_id: parentRecord.id,
              relationship: parent_info.relationship || 'guardian',
              is_primary: true
            });

          await supabase
            .from('learners')
            .update({ parent_id: parentRecord.id })
            .eq('id', learner.id);
        }
      }
    } catch (error) {
      console.warn('Error handling parent creation:', error);
    }
  }

  // ✅ Option A: Create enrollment atomically during registration (if class_id provided)
  // This ensures /learners and /learners/classes stay consistent and class learner_count matches.
  if (class_id) {
    // Validate class exists and belongs to this school, then fetch its academic_year_id if not provided
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, academic_year_id')
      .eq('id', class_id)
      .eq('school_id', school_id)
      .single();

    if (classError || !classData) {
      // Learner is already created; fail hard to avoid silent orphan.
      return res.status(400).json({
        success: false,
        message: 'Class not found or does not belong to this school',
        error: classError?.message || 'Class validation failed',
      });
    }

    // Use class's academic_year_id if not explicitly provided
    const enrollmentYearId = academic_year_id || classData.academic_year_id;

    // Validate academic_year_id exists (required FK)
    if (!enrollmentYearId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot enroll learner: class does not have an associated academic year',
        error: 'Class academic_year_id is null or missing',
      });
    }

    const enrollmentPayload = {
      learner_id: learner.id,
      class_id,
      school_id,
      academic_year_id: enrollmentYearId,
      enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
      status: 'enrolled',
    };
    // NOTE: term_id is intentionally omitted — the live learner_enrollments
    // table does not have this column yet. Add it back once a migration
    // adds learner_enrollments.term_id (see Backend/migrations).

    console.log('[registerLearner] Creating enrollment with payload:', enrollmentPayload);

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('learner_enrollments')
      .insert(enrollmentPayload)
      .select()
      .single();

    if (enrollmentError) {
      console.error('[registerLearner] Enrollment insert failed:', {
        error: enrollmentError.message,
        code: enrollmentError.code,
        details: enrollmentError.details,
      });
      // Learner is already created; fail hard to avoid silent count mismatch.
      return res.status(500).json({
        success: false,
        message: 'Learner registered, but failed to create enrollment for selected class',
        error: enrollmentError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Learner registered successfully',
      data: {
        ...learner,
        parent: parentInfo,
        enrollment,
      },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Learner registered successfully',
    data: {
      ...learner,
      parent: parentInfo
    }
  });
});


// =============================================================================
// 2. GET /api/v1/learners
//    List learners with pagination and filtering - UPDATED with new fields
// =============================================================================
const listLearners = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;

  if (!school_id && role !== 'super_admin') {
    return res.status(400).json({
      success: false,
      message: 'School ID required'
    });
  }

  const {
    page = 1,
    limit = 20,
    search,
    gender,
    nationality,
    is_active,
    has_parent,
    sort_by = 'first_name',
    sort_order = 'asc'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  // ✅ Build query with ALL columns including new fields
  let query = supabase
    .from('learners')
    .select(
      `
      id,
      admission_number,
      first_name,
      last_name,
      middle_name,
      date_of_birth,
      gender,
      email,
      profile_photo,
      special_needs,
      medical_conditions,
      allergies,
      is_active,
      parent_id,
      birth_certificate_number,
      nemis_number,
      nationality,
      previous_school,
      admission_date,
      academic_year,
      created_at,
      updated_at
    `,
      { count: 'exact' }
    );

  // Apply school filter (skip for super_admin)
  if (role !== 'super_admin' && school_id) {
    query = query.eq('school_id', school_id);
  }

  // Apply filters
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  if (gender) {
    query = query.eq('gender', gender.toLowerCase());
  }

  if (nationality) {
    query = query.eq('nationality', nationality);
  }

  if (has_parent === 'true') {
    query = query.not('parent_id', 'is', null);
  }
  if (has_parent === 'false') {
    query = query.is('parent_id', null);
  }

  if (search) {
    const q = `%${search}%`;
    query = query.or(
      `first_name.ilike.${q},last_name.ilike.${q},admission_number.ilike.${q},email.ilike.${q},nemis_number.ilike.${q}`
    );
  }

  // Add sorting
  const validSort = ['first_name', 'last_name', 'admission_number', 'created_at', 'nemis_number'];
  const sortField = validSort.includes(sort_by) ? sort_by : 'first_name';
  query = query.order(sortField, { ascending: sort_order !== 'desc' });

  // Add pagination
  query = query.range(from, to);

  const { data: learners, error, count } = await query;

  if (error) {
    console.error('List learners error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learners',
      error: error.message
    });
  }

  // Get parent info for learners that have parent relationships
  const learnerIds = (learners || []).map((l) => l.id);
  let parentMap = {};

  if (learnerIds.length > 0) {
    const { data: parentLinks } = await supabase
      .from('learner_parents')
      .select(
        `
        learner_id,
        parents (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          relationship,
          occupation
        )
      `
      )
      .in('learner_id', learnerIds);

    if (parentLinks) {
      parentMap = parentLinks.reduce((acc, link) => {
        acc[link.learner_id] = link.parents;
        return acc;
      }, {});
    }
  }

  // Get current enrollment for each learner
  let enrollmentMap = {};

  if (learnerIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('learner_enrollments')
      .select(
        `
        learner_id,
        class_id,
        status,
        classes!inner (
          id,
          grade_level,
          stream_name
        )
      `
      )
      .in('learner_id', learnerIds)
      .eq('status', 'enrolled');

    if (enrollments) {
      enrollmentMap = enrollments.reduce((acc, enrollment) => {
        acc[enrollment.learner_id] = {
          class_id: enrollment.class_id,
          grade_level: enrollment.classes?.grade_level,
          stream_name: enrollment.classes?.stream_name
        };
        return acc;
      }, {});
    }
  }

  // Enrich learners with parent and enrollment data
  const enrichedLearners = (learners || []).map((learner) => ({
    ...learner,
    current_class: enrollmentMap[learner.id] || null,
    parent: parentMap[learner.id] || null
  }));

  res.json({
    success: true,
    data: enrichedLearners,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count || 0,
      pages: Math.ceil((count || 0) / limitNum)
    }
  });
});

// =============================================================================
// 3. GET /api/v1/learners/:id
//    Get learner details - UPDATED with new fields and parent relationship
// =============================================================================
const getLearner = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id } = req.params;

  // ✅ Build query with ALL new columns
  let query = supabase
    .from('learners')
    .select(
      `
      id,
      admission_number,
      first_name,
      last_name,
      middle_name,
      date_of_birth,
      gender,
      email,
      profile_photo,
      special_needs,
      medical_conditions,
      allergies,
      is_active,
      parent_id,
      birth_certificate_number,
      nemis_number,
      nationality,
      previous_school,
      admission_date,
      academic_year,
      created_at,
      updated_at
    `
    )
    .eq('id', id);

  // Apply school filter (skip for super_admin)
  if (role !== 'super_admin' && school_id) {
    query = query.eq('school_id', school_id);
  }

  const { data: learner, error } = await query.single();

  if (error || !learner) {
    return res.status(404).json({
      success: false,
      message: 'Learner not found'
    });
  }

  // ✅ Get parent info via learner_parents relationship table
  let parentInfo = null;
  const { data: parentRelationships } = await supabase
    .from('learner_parents')
    .select(
      `
      id,
      relationship,
      is_primary,
      parents (
        id,
        first_name,
        last_name,
        email,
        phone_number,
        national_id,
        occupation,
        relationship,
        users (
          id,
          email,
          first_name,
          last_name,
          phone_number
        )
      )
    `
    )
    .eq('learner_id', id)
    .order('is_primary', { ascending: false });

  if (parentRelationships && parentRelationships.length > 0) {
    const primaryParent = parentRelationships.find((p) => p.is_primary) || parentRelationships[0];
    parentInfo = {
      ...primaryParent.parents,
      relationship: primaryParent.relationship || primaryParent.parents?.relationship
    };
  }

  // Get enrollment history
  const { data: enrollments } = await supabase
    .from('learner_enrollments')
    .select(
      `
      id,
      class_id,
      academic_year_id,
      enrollment_date,
      exit_date,
      status,
      exit_reason,
      created_at
    `
    )
    .eq('learner_id', id)
    .order('enrollment_date', { ascending: false });

  // Get class details for each enrollment
  const classIds = (enrollments || []).map((e) => e.class_id).filter(Boolean);
  let classMap = {};

  if (classIds.length > 0) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, grade_level, stream_name')
      .in('id', classIds);

    if (classes) {
      classMap = classes.reduce((acc, cls) => {
        acc[cls.id] = cls;
        return acc;
      }, {});
    }
  }

  // Enrich enrollments with class data
  const enrichedEnrollments = (enrollments || []).map((enrollment) => ({
    ...enrollment,
    class: classMap[enrollment.class_id] || null
  }));

  res.json({
    success: true,
    data: {
      ...learner,
      learner_parents: parentRelationships || [],
      parents: parentInfo, // For compatibility with old structure
      enrollments: enrichedEnrollments,
      current_enrollment: enrichedEnrollments.find((e) => e.status === 'enrolled') || null
    }
  });
});

// =============================================================================
// 4. PUT /api/v1/learners/:id
//    Update learner - FIXED to create parent with user account
// =============================================================================
const updateLearner = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin', 'teacher'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const updates = req.body;
  
  // ✅ EXTRACT parent_info BEFORE deleting it
  const parent_info = updates.parent_info;
  delete updates.parent_info;

  // Remove fields that shouldn't be updated directly
  delete updates.id;
  delete updates.school_id;
  delete updates.created_at;
  delete updates.created_by;
  delete updates.deleted_by;

  // Validate gender if provided
  if (updates.gender && !GENDERS.includes(updates.gender.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Gender must be one of: ${GENDERS.join(', ')}`
    });
  }

  // Validate nationality if provided
  if (updates.nationality && !NATIONALITIES.includes(updates.nationality)) {
    return res.status(400).json({
      success: false,
      message: `Nationality must be one of: ${NATIONALITIES.join(', ')}`
    });
  }

  // Check if admission number conflict (if updating admission_number)
  if (updates.admission_number) {
    let checkQuery = supabase
      .from('learners')
      .select('id')
      .eq('admission_number', updates.admission_number)
      .neq('id', id);

    if (role !== 'super_admin' && school_id) {
      checkQuery = checkQuery.eq('school_id', school_id);
    }

    const { data: existing } = await checkQuery.maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Admission number already exists for this school'
      });
    }
  }

  // Check if NEMIS number conflict (if updating nemis_number)
  if (updates.nemis_number) {
    let checkQuery = supabase
      .from('learners')
      .select('id')
      .eq('nemis_number', updates.nemis_number)
      .neq('id', id);

    const { data: existing } = await checkQuery.maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'NEMIS number already exists for another learner'
      });
    }
  }

  // Check if email conflict (if updating email)
  if (updates.email) {
    let checkQuery = supabase
      .from('learners')
      .select('id')
      .eq('email', updates.email.toLowerCase().trim())
      .neq('id', id);

    if (role !== 'super_admin' && school_id) {
      checkQuery = checkQuery.eq('school_id', school_id);
    }

    const { data: existing } = await checkQuery.maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists for another learner'
      });
    }
  }

  // Normalize gender
  if (updates.gender) {
    updates.gender = updates.gender.toLowerCase();
  }

  updates.updated_at = new Date().toISOString();

  // Build update query
  let updateQuery = supabase
    .from('learners')
    .update(updates)
    .eq('id', id);

  // Apply school filter (skip for super_admin)
  if (role !== 'super_admin' && school_id) {
    updateQuery = updateQuery.eq('school_id', school_id);
  }

  const { data: learner, error } = await updateQuery.select().single();

  if (error) {
    console.error('[updateLearner] Update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update learner',
      error: error.message
    });
  }

  if (!learner) {
    return res.status(404).json({
      success: false,
      message: 'Learner not found'
    });
  }

  // ✅ HANDLE PARENT UPDATE/CREATE with user account
  let parentInfo = null;
  if (parent_info && parent_info.email) {
    try {
      // Check if parent exists with this email in this school
      const { data: existingParent } = await supabase
        .from('parents')
        .select('id, first_name, last_name, email, user_id')
        .eq('email', parent_info.email.toLowerCase().trim())
        .eq('school_id', school_id)
        .maybeSingle();

      if (existingParent) {
        parentInfo = existingParent;
        console.log('[updateLearner] Found existing parent:', existingParent.id);

        // Check if learner is already linked to this parent
        const { data: existingLink } = await supabase
          .from('learner_parents')
          .select('id')
          .eq('parent_id', existingParent.id)
          .eq('learner_id', id)
          .maybeSingle();

        // If not linked, link them
        if (!existingLink) {
          await supabase
            .from('learner_parents')
            .insert({
              learner_id: id,
              parent_id: existingParent.id,
              relationship: parent_info.relationship || 'guardian',
              is_primary: true
            });

          // Update learner's parent_id if not set
          if (!learner.parent_id) {
            await supabase
              .from('learners')
              .update({ parent_id: existingParent.id })
              .eq('id', id);
          }
        }
      } else {
        // ✅ CREATE NEW PARENT WITH USER ACCOUNT
        console.log('[updateLearner] Creating new parent account');

        // Generate temporary password for user account
        const tempPassword = crypto.randomBytes(12).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // Create user first
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: parent_info.email.toLowerCase().trim(),
            password_hash: passwordHash,
            first_name: parent_info.first_name,
            last_name: parent_info.last_name,
            phone_number: parent_info.phone_number || null,
            role: 'parent',
            status: 'pending',
            email_verified: false,
            school_id,
            is_active: true
          })
          .select('id')
          .single();

        if (userError) {
          console.error('[updateLearner] Failed to create user:', userError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create parent user account',
            error: userError.message
          });
        }

        const userId = newUser.id;
        console.log('[updateLearner] Created user:', userId);

        // Now create parent record with user_id
        const { data: parentRecord, error: parentError } = await supabase
          .from('parents')
          .insert({
            user_id: userId, // ✅ SET USER_ID
            school_id,
            first_name: parent_info.first_name,
            last_name: parent_info.last_name,
            email: parent_info.email.toLowerCase().trim(),
            phone_number: parent_info.phone_number || null,
            national_id: parent_info.national_id || null,
            occupation: parent_info.occupation || null,
            relationship: parent_info.relationship || 'guardian',
            is_active: true
          })
          .select()
          .single();

        if (parentError) {
          console.error('[updateLearner] Failed to create parent:', parentError);
          // Roll back user if parent creation fails
          await supabase.from('users').delete().eq('id', userId);
          return res.status(500).json({
            success: false,
            message: 'Failed to create parent record',
            error: parentError.message
          });
        }

        parentInfo = parentRecord;
        console.log('[updateLearner] Created parent:', parentRecord.id);

        // Link parent to learner
        await supabase
          .from('learner_parents')
          .insert({
            learner_id: id,
            parent_id: parentRecord.id,
            relationship: parent_info.relationship || 'guardian',
            is_primary: true
          });

        // Update learner's parent_id
        await supabase
          .from('learners')
          .update({ parent_id: parentRecord.id })
          .eq('id', id);
      }
    } catch (error) {
      console.error('[updateLearner] Error handling parent:', error);
      // Don't fail the whole update, just log the warning
    }
  }

  // Get updated parent info from learner_parents if not set above
  if (!parentInfo) {
    const { data: parentRelationships } = await supabase
      .from('learner_parents')
      .select(
        `
        id,
        relationship,
        is_primary,
        parents (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          national_id,
          occupation,
          relationship
        )
      `
      )
      .eq('learner_id', id)
      .order('is_primary', { ascending: false });

    if (parentRelationships && parentRelationships.length > 0) {
      const primaryParent = parentRelationships[0];
      parentInfo = primaryParent.parents;
    }
  }

  res.json({
    success: true,
    message: 'Learner updated successfully',
    data: {
      ...learner,
      parent: parentInfo
    }
  });
});



// =============================================================================
// 5. DELETE /api/v1/learners/:id
//    Soft delete learner (set is_active = false)
// =============================================================================
const deleteLearner = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  // Check if learner has active enrollments
  const { data: activeEnrollments } = await supabase
    .from('learner_enrollments')
    .select('id')
    .eq('learner_id', id)
    .eq('status', 'enrolled');

  if (activeEnrollments && activeEnrollments.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete learner with active enrollments. Please withdraw first.'
    });
  }

  // Build update query
  let updateQuery = supabase
    .from('learners')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  // Apply school filter (skip for super_admin)
  if (role !== 'super_admin' && school_id) {
    updateQuery = updateQuery.eq('school_id', school_id);
  }

  const { data: learner, error } = await updateQuery.select().single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete learner',
      error: error.message
    });
  }

  if (!learner) {
    return res.status(404).json({
      success: false,
      message: 'Learner not found'
    });
  }

  res.json({
    success: true,
    message: 'Learner deleted successfully'
  });
});

// =============================================================================
// 6. POST /api/v1/learners/:id/enroll
//    Enroll learner in a class
// =============================================================================
const enrollLearner = asyncHandler(async (req, res) => {
  console.log('[DEBUG enrollLearner] START:', {
    learnerId: req.params.id,
    classId: req.body.class_id,
    schoolId: getSchoolId(req),
    user: req.user
      ? { role: req.user.role, schoolId: req.user.schoolId, school_id: req.user.school_id }
      : null
  });

  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id } = req.params;
  const { class_id, enrollment_date, academic_year_id, term_id } = req.body;

  if (!class_id) {
    return res.status(400).json({
      success: false,
      message: 'class_id is required'
    });
  }

  // Verify learner belongs to school
  let learnerQuery = supabase
    .from('learners')
    .select('id, first_name, last_name, is_active, school_id')
    .eq('id', id);

  if (role !== 'super_admin' && school_id) {
    learnerQuery = learnerQuery.eq('school_id', school_id);
  }

  const { data: learner, error: learnerError } = await learnerQuery.single();
  console.log('[DEBUG enrollLearner] Learner:', learner, 'Error:', learnerError);

  if (!learner) {
    return res.status(404).json({
      success: false,
      message: 'Learner not found'
    });
  }

  if (!learner.is_active) {
    return res.status(400).json({
      success: false,
      message: 'Cannot enroll inactive learner'
    });
  }

  // Verify class belongs to school
  let classQuery = supabase
    .from('classes')
    .select('id, grade_level, stream_name, capacity, school_id')
    .eq('id', class_id);

  if (role !== 'super_admin' && school_id) {
    classQuery = classQuery.eq('school_id', school_id);
  }

  const { data: classData, error: classError } = await classQuery.single();
  console.log('[DEBUG enrollLearner] Class:', classData, 'Error:', classError);

  if (!classData) {
    return res.status(404).json({
      success: false,
      message: 'Class not found'
    });
  }

  // Check current enrollment count
  const { count: enrolledCount } = await supabase
    .from('learner_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', class_id)
    .eq('status', 'enrolled');

  if (classData.capacity && enrolledCount >= classData.capacity) {
    return res.status(400).json({
      success: false,
      message: 'Class is at full capacity'
    });
  }

  // Check if learner is already enrolled in this class
  const { data: existingEnrollment } = await supabase
    .from('learner_enrollments')
    .select('id, status')
    .eq('learner_id', id)
    .eq('class_id', class_id)
    .maybeSingle();

  if (existingEnrollment) {
    if (existingEnrollment.status === 'enrolled') {
      return res.status(409).json({
        success: false,
        message: 'Learner is already enrolled in this class'
      });
    } else {
      // Re-enroll (update existing)
      const { data: enrollment, error } = await supabase
        .from('learner_enrollments')
        .update({
          status: 'enrolled',
          enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
          exit_date: null,
          exit_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingEnrollment.id)
        .select()
        .single();

      if (error) {
        console.error('[DEBUG enrollLearner] Re-enroll error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to re-enroll learner',
          error: error.message
        });
      }

      console.log('[DEBUG enrollLearner] Re-enrolled successfully:', enrollment);
      return res.json({
        success: true,
        message: 'Learner re-enrolled successfully',
        data: enrollment
      });
    }
  }

  // Get academic_year_id if not provided
  let finalAcademicYearId = academic_year_id;
  if (!finalAcademicYearId) {
    const { data: currentYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .limit(1)
      .single();

    console.log('[DEBUG enrollLearner] Current academic year:', currentYear);
    if (currentYear) {
      finalAcademicYearId = currentYear.id;
    }
  }

  // ✅ Create enrollment with school_id
  const enrollmentPayload = {
    learner_id: id,
    class_id,
    school_id: school_id || learner.school_id,
    academic_year_id: finalAcademicYearId,
    enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
    status: 'enrolled'
  };
  console.log('[DEBUG enrollLearner] Creating enrollment with payload:', enrollmentPayload);

  const { data: enrollment, error } = await supabase
    .from('learner_enrollments')
    .insert(enrollmentPayload)
    .select()
    .single();

  if (error) {
    console.error('[DEBUG enrollLearner] Insert error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to enroll learner',
      error: error.message,
      details: error
    });
  }

  console.log('[DEBUG enrollLearner] Success:', enrollment);
  res.status(201).json({
    success: true,
    message: 'Learner enrolled successfully',
    data: enrollment
  });
});

// =============================================================================
// 7. GET /api/v1/learners/:id/enrollments
//    Get learner enrollment history
// =============================================================================
const getEnrollmentHistory = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id } = req.params;

  // Verify learner belongs to school
  let learnerQuery = supabase
    .from('learners')
    .select('id')
    .eq('id', id);

  if (role !== 'super_admin' && school_id) {
    learnerQuery = learnerQuery.eq('school_id', school_id);
  }

  const { data: learner } = await learnerQuery.single();

  if (!learner) {
    return res.status(404).json({
      success: false,
      message: 'Learner not found'
    });
  }

  const { data: enrollments, error } = await supabase
    .from('learner_enrollments')
    .select(
      `
      id,
      class_id,
      academic_year_id,
      enrollment_date,
      exit_date,
      status,
      exit_reason,
      created_at
    `
    )
    .eq('learner_id', id)
    .order('enrollment_date', { ascending: false });

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollment history',
      error: error.message
    });
  }

  // Get class details
  const classIds = (enrollments || []).map((e) => e.class_id).filter(Boolean);
  let classMap = {};

  if (classIds.length > 0) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, grade_level, stream_name')
      .in('id', classIds);

    if (classes) {
      classMap = classes.reduce((acc, cls) => {
        acc[cls.id] = cls;
        return acc;
      }, {});
    }
  }

  const enrichedEnrollments = (enrollments || []).map((enrollment) => ({
    ...enrollment,
    class: classMap[enrollment.class_id] || null
  }));

  res.json({
    success: true,
    data: enrichedEnrollments
  });
});

// =============================================================================
// 8. POST /api/v1/learners/bulk-import
//    Bulk import learners from CSV - UPDATED with new fields
// =============================================================================
const bulkImportLearners = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No CSV file provided'
    });
  }

  try {
    const csvData = req.file.buffer.toString('utf-8');
    const records = csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const results = {
      successful: [],
      failed: []
    };

    for (const record of records) {
      try {
        // Validate required fields
        if (!record.first_name || !record.last_name || !record.admission_number) {
          throw new Error('Missing required fields: first_name, last_name, admission_number');
        }

        // Validate gender
        if (record.gender && !GENDERS.includes(record.gender.toLowerCase())) {
          throw new Error(`Invalid gender: ${record.gender}. Must be male or female`);
        }

        // ✅ Include new fields in learner data
        const learnerData = {
          school_id,
          first_name: record.first_name.trim(),
          last_name: record.last_name.trim(),
          middle_name: record.middle_name?.trim() || null,
          admission_number: record.admission_number.trim(),
          date_of_birth: record.date_of_birth,
          gender: record.gender?.toLowerCase() || null,
          email: record.email?.trim() || null,
          profile_photo: record.profile_photo || null,
          special_needs: record.special_needs || null,
          medical_conditions: record.medical_conditions || null,
          allergies: record.allergies || null,
          birth_certificate_number: record.birth_certificate_number?.trim() || null,
          nemis_number: record.nemis_number?.trim() || null,
          nationality: record.nationality || 'Kenyan',
          previous_school: record.previous_school || null,
          admission_date: record.admission_date || new Date().toISOString().split('T')[0],
          academic_year: record.academic_year || new Date().getFullYear().toString(),
          is_active: true
        };

        // Insert learner
        const { data: learner, error } = await supabase
          .from('learners')
          .insert(learnerData)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        results.successful.push({
          admission_number: learner.admission_number,
          name: `${learner.first_name} ${learner.last_name}`,
          id: learner.id
        });
      } catch (error) {
        results.failed.push({
          row: record,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${results.successful.length} successful, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process CSV file',
      error: error.message
    });
  }
});

// =============================================================================
// 9. POST /api/v1/learners/:id/withdraw
//    Withdraw learner from current class
// =============================================================================
const withdrawLearner = asyncHandler(async (req, res) => {
  const school_id = getSchoolId(req);
  const { role } = req.user;
  const { id } = req.params;
  const { exit_date, exit_reason } = req.body;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  // Find current active enrollment
  const { data: enrollment } = await supabase
    .from('learner_enrollments')
    .select('id')
    .eq('learner_id', id)
    .eq('status', 'enrolled')
    .maybeSingle();

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'No active enrollment found for this learner'
    });
  }

  // Update enrollment status
  const { error } = await supabase
    .from('learner_enrollments')
    .update({
      status: 'withdrawn',
      exit_date: exit_date || new Date().toISOString().split('T')[0],
      exit_reason: exit_reason || 'Withdrawn',
      updated_at: new Date().toISOString()
    })
    .eq('id', enrollment.id);

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to withdraw learner',
      error: error.message
    });
  }

  res.json({
    success: true,
    message: 'Learner withdrawn successfully'
  });
});

// =============================================================================
// Export all functions
// =============================================================================
module.exports = {
  registerLearner,
  listLearners,
  getLearner,
  updateLearner,
  deleteLearner,
  enrollLearner,
  getEnrollmentHistory,
  bulkImportLearners,
  withdrawLearner
};
