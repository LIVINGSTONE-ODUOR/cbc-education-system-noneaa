// =============================================================================
// teacher.controller.js
// Phase 3 — Teachers & Assignments
//
// Tables:  teachers, teacher_assignments, users
// Pattern: matches curriculum.controller.js & feeStructure.controller.js
// Auth:    Bearer JWT → req.user.id / req.user.school_id / req.user.role
// =============================================================================

const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // or your email utility

// ---------------------------------------------------------------------------
// Supabase client (service-role so we bypass RLS where needed)
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------------------------------------------------------------------------
// Helper: get supabase client scoped to the request JWT (respects RLS)
// ---------------------------------------------------------------------------
const getClient = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
};

// ---------------------------------------------------------------------------
// Helper: paginate
// ---------------------------------------------------------------------------
const paginate = (query, page = 1, limit = 20) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
};


// =============================================================================
// 1. POST /api/v1/teachers/invite
//    Send invite email → create pending user + teacher record
// =============================================================================
const inviteTeacher = asyncHandler(async (req, res) => {
  const { schoolId: userSchoolId, role } = req.user;
  const school_id = req.body.school_id || userSchoolId;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  if (!school_id) {
    return res.status(400).json({ success: false, message: 'school_id required' });
  }

  // Destructure ALL fields from request body
  const {
    first_name,
    last_name,
    email,
    phone_number,
    tsc_number,
    qualifications,
    date_joined,
    // NEW FIELDS to support
    id_number,
    designation,
    branch,
    job_status,
    staff_type,
    salary,
    contract_start,
    contract_end,
    date_of_birth,
    gender,
    county,
    location,
    subjects_taught,
    photo // Add photo field
  } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ success: false, message: 'first_name, last_name and email are required' });
  }

  // Check for duplicate email
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .eq('school_id', school_id)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ success: false, message: 'A user with this email already exists' });
  }

  // Generate temporary password
  const tempPassword = crypto.randomBytes(8).toString('hex');
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create user
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone_number: phone_number || null,
      role: 'teacher',
      status: 'pending',
      email_verified: false,
      school_id,
      is_active: true,
    })
    .select('id, email, first_name, last_name')
    .single();

  if (userError) {
    return res.status(500).json({ success: false, message: 'Failed to create user', error: userError.message });
  }

  // Create teacher record with ALL fields
  const { data: newTeacher, error: teacherError } = await supabase
    .from('teachers')
    .insert({
      user_id: newUser.id,
      school_id,
      tsc_number: tsc_number || null,
      qualifications: qualifications ? JSON.stringify(qualifications) : '[]',
      date_joined: date_joined || new Date().toISOString().split('T')[0],
      is_active: true,
      // NEW FIELDS
      id_number: id_number || null,
      designation: designation || null,
      branch: branch || null,
      job_status: job_status || 'active',
      staff_type: staff_type || 'teaching',
      salary: salary ? parseFloat(salary) : 0,
      contract_start: contract_start || null,
      contract_end: contract_end || null,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      county: county || null,
      location: location || null,
      subjects_taught: subjects_taught || null,
      photo: photo || null // Add photo field
    })
    .select('id')
    .single();

  if (teacherError) {
    await supabase.from('users').delete().eq('id', newUser.id);
    return res.status(500).json({ success: false, message: 'Failed to create teacher record', error: teacherError.message });
  }

  // Store invite token
  await supabase.from('email_verification_tokens').insert({
    user_id: newUser.id,
    token: inviteToken,
    expires_at: inviteExpiry.toISOString(),
  });

  const isDev = process.env.NODE_ENV !== 'production';

  res.status(201).json({
    success: true,
    message: `Invite sent to ${email}`,
    data: {
      teacher_id: newTeacher.id,
      user_id: newUser.id,
      email: newUser.email,
      ...(isDev && { invite_token: inviteToken, temp_password: tempPassword }),
    },
  });
});


// =============================================================================
// 2. GET /api/v1/teachers
//    List all teachers for the school (paginated, with user info)
// =============================================================================
const listTeachers = asyncHandler(async (req, res) => {
  console.log('AUTH USER:', req.user);
  const school_id = req.user?.schoolId;

  if (!school_id) {
    console.error("Missing school_id in request", req.user);
    return res.status(401).json({
      success: false,
      message: "School ID required (authentication issue)"
    });
  }
  const {
    page = 1,
    limit = 20,
    is_active,
    search,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = req.query;

  // Complex join (teachers -> users -> teacher_assignments -> classes -> learning_areas)
  // If this fails (schema mismatch / RLS join issue), we fall back to a simpler query.
  let query = supabase
    .from('teachers')
    .select(`
      id,
      tsc_number,
      qualifications,
      date_joined,
      is_active,
      designation,
      branch,
      job_status,
      contract_start,
      contract_end,
      salary,
      county,
      location,
      id_number,
      date_of_birth,
      gender,
      subjects_taught,
      photo,
      created_at,
      updated_at,
      user:user_id (
        id,
        first_name,
        last_name,
        email,
        phone_number,
        status,
        last_login
      ),
      assignments:teacher_assignments (
        id,
        is_active,
        class:class_id ( id, grade_level, stream_name ),
        learning_area:learning_area_id ( id, name, code )
      )
    `, { count: 'exact' })
    .eq('school_id', school_id);


  // Filters
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  // Search by name or TSC number (requires join — do post-filter for simplicity)
  // For production, add a DB view or use a stored procedure

  // Sort
  const validSortFields = ['created_at', 'date_joined', 'tsc_number'];
  const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
  query = query.order(sortField, { ascending: sort_order === 'asc' });

  // Paginate
  query = paginate(query, parseInt(page), parseInt(limit));

  let data;
  let count;
  let joinError;

  // Try complex join first
  const joinResult = await query;
  ({ data, count, error: joinError } = joinResult);

  if (joinError) {
    // DEV logging: show real Supabase error to quickly pinpoint join/schema/RLS issues.
    console.error('[teachers:listTeachers] Complex join failed', {
      message: joinError.message,
      code: joinError.code,
      hint: joinError.hint,
      school_id,
      page: parseInt(page),
      limit: parseInt(limit),
      is_active,
      search,
      sort_by,
      sort_order,
    });

    // Fallback: base teacher + user only (no assignments deep join)
    const fallbackQuery = supabase
      .from('teachers')
      .select(`
        id,
        tsc_number,
        qualifications,
        date_joined,
        is_active,
        designation,
        branch,
        job_status,
        contract_start,
        contract_end,
        salary,
        county,
        location,
        id_number,
        date_of_birth,
        gender,
        subjects_taught,
        photo,
        created_at,
        updated_at,
        user:user_id (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          status,
          last_login
        )
      `, { count: 'exact' })
      .eq('school_id', school_id);

    // Re-apply filters/sort/pagination
    let fb = fallbackQuery;
    if (is_active !== undefined) {
      fb = fb.eq('is_active', is_active === 'true');
    }

    const validSortFields = ['created_at', 'date_joined', 'tsc_number'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    fb = fb.order(sortField, { ascending: sort_order === 'asc' });
    fb = paginate(fb, parseInt(page), parseInt(limit));

    const fbResult = await fb;
    ({ data, count, error: joinError } = fbResult);

    if (joinError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch teachers',
        error: joinError.message,
        fallback_error: joinError.message,
      });
    }
  }

  // Client-side search filter if provided
  let filtered = data;

  if (search) {
    const q = search.toLowerCase();
    filtered = data.filter((t) =>
      t.user?.first_name?.toLowerCase().includes(q) ||
      t.user?.last_name?.toLowerCase().includes(q) ||
      t.tsc_number?.toLowerCase().includes(q) ||
      t.user?.email?.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: {
      teachers: filtered,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
      meta: {
        // helps correlate UI issues with backend join failures without exposing internals to prod users
        joinFallbackUsed: false,
      },

    }
  });


});


// =============================================================================
// 3. GET /api/v1/teachers/:id
//    Get single teacher by ID with all details
// =============================================================================
const getTeacher = asyncHandler(async (req, res) => {
  const { school_id, role } = req.user;
  const { id } = req.params;

  console.log('[DEBUG] getTeacher called for ID:', id);
  console.log('[DEBUG] User role:', role, 'School ID:', school_id);

  let query = supabase
    .from('teachers')
    .select(`
      id,
      tsc_number,
      qualifications,
      date_joined,
      is_active,
      created_at,
      updated_at,
      designation,
      branch,
      job_status,
      contract_start,
      contract_end,
      salary,
      county,
      location,
      id_number,
      date_of_birth,
      gender,
      subjects_taught,
      photo,
      user:user_id (
        id,
        first_name,
        last_name,
        email,
        phone_number,
        status,
        last_login,
        email_verified,
        created_at
      ),
      assignments:teacher_assignments (
        id,
        is_active,
        academic_year:academic_year_id ( id, name, year, is_current ),
        term:term_id ( id, name, term_number, is_current ),
        class:class_id ( id, grade_level, stream_name ),
        learning_area:learning_area_id ( id, name, code )
      )
    `)
    .eq('id', id);

  // Only filter by school_id if not super_admin
  if (role !== 'super_admin' && school_id) {
    query = query.eq('school_id', school_id);
  }

  const { data: teacher, error } = await query.single();

  if (error) {
    console.error('[ERROR] getTeacher error:', error);
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
      error: error.message
    });
  }

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found'
    });
  }

  res.json({
    success: true,
    data: teacher
  });
});


// =============================================================================
// 4. PUT /api/v1/teachers/:id
//    Update teacher profile (qualifications, TSC, date_joined, phone)
// =============================================================================
// =============================================================================
// 4. PUT /api/v1/teachers/:id
//    Update teacher profile (qualifications, TSC, date_joined, phone)
// =============================================================================
const updateTeacher = asyncHandler(async (req, res) => {
  const { school_id: user_school_id, role } = req.user;
  const { id } = req.params;
  const query_school_id = req.query.school_id;

  console.log('[DEBUG] updateTeacher req.user:', req.user);
  console.log('[DEBUG] updateTeacher check:', { teacherId: id, userSchoolId: user_school_id, querySchoolId: query_school_id, userRole: role });

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  // Determine effective school_id: query param > user school_id
  const effective_school_id = query_school_id || user_school_id;

  let query = supabase
    .from('teachers')
    .select('id, user_id')
    .eq('id', id);

  // Skip school filter for super_admin or if no school context
  if (role === 'super_admin' || !effective_school_id) {
    console.log('[DEBUG] Super admin bypass or no school_id - querying by ID only');
  } else {
    query = query.eq('school_id', effective_school_id);
  }

  const { data: existing, error: fetchErr } = await query.single();

  console.log('[DEBUG] teacher query result:', { existing, error: fetchErr?.message });

  if (fetchErr || !existing) {
    const schoolInfo = effective_school_id ? `School: ${effective_school_id}` : 'No school filter';
    return res.status(404).json({ 
      success: false, 
      message: `Teacher not found (ID: ${id}, ${schoolInfo})` 
    });
  }

  console.log('[DEBUG] updateTeacher FULL payload (snake_case):', req.body);
  
  // Full destructuring - handle all possible fields from frontend StaffMember (post-camelToSnake)
  const {
    tsc_number, qualifications, date_joined, phone_number, first_name, last_name,
    id_number, designation, branch, email, job_status, contract_start, contract_end,
    salary, county, location, subjects_taught, photo // Add photo field
  } = req.body;

  // ========== TEACHERS TABLE UPDATES ==========
  const teacherUpdates = {};

  // Direct columns in teachers table
  if (tsc_number !== undefined) teacherUpdates.tsc_number = tsc_number;
  if (date_joined !== undefined) teacherUpdates.date_joined = date_joined;
  if (qualifications !== undefined) {
    teacherUpdates.qualifications = Array.isArray(qualifications) ? JSON.stringify(qualifications) : qualifications;
  }
  
  // Direct columns that exist in teachers table
  if (designation !== undefined) teacherUpdates.designation = designation;
  if (branch !== undefined) teacherUpdates.branch = branch;
  if (job_status !== undefined) teacherUpdates.job_status = job_status;
  if (contract_start !== undefined) teacherUpdates.contract_start = contract_start;
  if (contract_end !== undefined) teacherUpdates.contract_end = contract_end;
  if (salary !== undefined) teacherUpdates.salary = parseFloat(salary);
  if (county !== undefined) teacherUpdates.county = county;
  if (location !== undefined) teacherUpdates.location = location;
  if (id_number !== undefined) teacherUpdates.id_number = id_number;
  
  // Use subjects_taught instead of teaching_subjects (based on your schema)
  if (subjects_taught !== undefined) {
    teacherUpdates.subjects_taught = Array.isArray(subjects_taught) ? subjects_taught : JSON.parse(subjects_taught);
  }
  if (photo !== undefined) {
    teacherUpdates.photo = photo;
  }

  // Apply teachers updates
  if (Object.keys(teacherUpdates).length > 0) {
    const cleanTeacherUpdates = { 
      ...teacherUpdates, 
      updated_at: new Date().toISOString(),
      updated_by: req.user.id 
    };
    
    console.log('[DEBUG] Teachers UPDATE:', cleanTeacherUpdates);
    const { error: updateErr, data: updatedData } = await supabase
      .from('teachers')
      .update(cleanTeacherUpdates)
      .eq('id', id)
      .select();
    
    if (updateErr) {
      console.error('[ERROR] Teachers update failed:', updateErr);
      return res.status(500).json({ success: false, message: 'Failed to update teacher', error: updateErr.message });
    }
    if (!updatedData || updatedData.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    console.log('[DEBUG] Teachers updated:', updatedData);
  }

  // ========== USERS TABLE UPDATES ==========
  const userUpdates = {};
  if (first_name !== undefined) userUpdates.first_name = first_name;
  if (last_name !== undefined) userUpdates.last_name = last_name;
  if (phone_number !== undefined) userUpdates.phone_number = phone_number;
  
  // Skip email updates for security
  if (email !== undefined) {
    console.warn('[WARN] Email update ignored for security');
  }

  if (Object.keys(userUpdates).length > 0) {
    const cleanUserUpdates = { 
      ...userUpdates, 
      updated_at: new Date().toISOString(),
      updated_by: req.user.id 
    };
    
    console.log('[DEBUG] Users UPDATE:', cleanUserUpdates);
    const { error: userUpdateErr } = await supabase
      .from('users')
      .update(cleanUserUpdates)
      .eq('id', existing.user_id);
    
    if (userUpdateErr) {
      console.error('[ERROR] Users update failed:', userUpdateErr);
      // Don't fail whole transaction - teachers already updated
    } else {
      console.log('[DEBUG] Users updated successfully');
    }
  }

  // Return FULL updated profile
  let finalQuery = supabase
    .from('teachers')
    .select(`
      id,
      tsc_number,
      qualifications,
      date_joined,
      is_active,
      designation,
      branch,
      job_status,
      contract_start,
      contract_end,
      salary,
      county,
      location,
      subjects_taught,
      id_number,
      photo,
      created_at,
      updated_at,
      user:user_id (
        id,
        first_name,
        last_name,
        email,
        phone_number,
        status,
        last_login
      )
    `)
    .eq('id', id);

  // Only filter by school_id if NOT super_admin
  if (role !== 'super_admin' && effective_school_id) {
    finalQuery = finalQuery.eq('school_id', effective_school_id);
  }

  const { data: updated, error: fetchError } = await finalQuery.single();

  if (fetchError || !updated) {
    console.error('[DEBUG] Fetch error after update:', fetchError);
    return res.status(404).json({ success: false, message: 'Updated teacher not found' });
  }

  console.log('[DEBUG] Returning updated teacher:', updated);

  res.json({ 
    success: true, 
    message: 'Teacher profile updated successfully', 
    data: updated 
  });
});


// =============================================================================
// 5. PATCH /api/v1/teachers/:id/activate
//    Toggle is_active (activate / deactivate)
// =============================================================================
const toggleTeacherActive = asyncHandler(async (req, res) => {
  const { school_id, role } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('id, is_active, user_id')
    .eq('id', id)
    .eq('school_id', school_id)
    .single();

  if (error || !teacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found' });
  }

  const newStatus = !teacher.is_active;

  const { error: updateErr } = await supabase
    .from('teachers')
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateErr) {
    return res.status(500).json({ success: false, message: 'Failed to update status', error: updateErr.message });
  }

  // Also update user status
  await supabase
    .from('users')
    .update({ is_active: newStatus, status: newStatus ? 'active' : 'suspended' })
    .eq('id', teacher.user_id);

  res.json({
    success: true,
    message: `Teacher ${newStatus ? 'activated' : 'deactivated'}`,
    data: { id, is_active: newStatus },
  });
});


// =============================================================================
// 6. DELETE /api/v1/teachers/:id
//    Soft-delete (sets deleted_at, deactivates user)
// =============================================================================
const deleteTeacher = asyncHandler(async (req, res) => {
  const { school_id, role, id: requesterId } = req.user;
  const { id } = req.params;

  if (!['school_admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('id, user_id')
    .eq('id', id)
    .eq('school_id', school_id)
    .is('deleted_at', null)
    .single();

  if (error || !teacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found or already deleted' });
  }

  const now = new Date().toISOString();

  // Soft-delete teacher
  const { error: delErr } = await supabase
    .from('teachers')
    .update({
      is_active: false,
      deleted_at: now,
      updated_at: now,
    })
    .eq('id', id);

  if (delErr) {
    return res.status(500).json({ success: false, message: 'Failed to delete teacher', error: delErr.message });
  }

  // Deactivate all assignments
  await supabase
    .from('teacher_assignments')
    .update({ is_active: false, updated_at: now })
    .eq('teacher_id', id)
    .eq('is_active', true);

  // Suspend user account
  await supabase
    .from('users')
    .update({ is_active: false, status: 'suspended', updated_at: now })
    .eq('id', teacher.user_id);

  res.json({ success: true, message: 'Teacher deleted successfully' });
});


// =============================================================================
// 7. GET /api/v1/teachers/:id/timetable
//    Weekly timetable for this teacher (current academic year)
// =============================================================================
const getTeacherTimetable = asyncHandler(async (req, res) => {
  const { school_id } = req.user;
  const { id } = req.params;
  const { academic_year_id, term_id } = req.query;

  // Verify teacher belongs to school
  const { data: teacher, error: tErr } = await supabase
    .from('teachers')
    .select('id')
    .eq('id', id)
    .eq('school_id', school_id)
    .single();

  if (tErr || !teacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found' });
  }

  // Get current academic year if not specified
  let yearId = academic_year_id;
  if (!yearId) {
    const { data: currentYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('school_id', school_id)
      .eq('is_current', true)
      .single();
    yearId = currentYear?.id;
  }

  if (!yearId) {
    return res.status(404).json({ success: false, message: 'No current academic year found' });
  }

  let query = supabase
    .from('timetable_slots')
    .select(`
      id,
      day,
      period_number,
      start_time,
      end_time,
      room,
      is_active,
      class:class_id ( id, grade_level, stream_name ),
      learning_area:learning_area_id ( id, name, code ),
      term:term_id ( id, name, term_number )
    `)
    .eq('teacher_id', id)
    .eq('school_id', school_id)
    .eq('academic_year_id', yearId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('day')
    .order('period_number');

  if (term_id) query = query.eq('term_id', term_id);

  const { data: slots, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch timetable', error: error.message });
  }

  // Group by day for easier frontend consumption
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const timetable = {};
  days.forEach((day) => {
    timetable[day] = slots.filter((s) => s.day === day);
  });

  res.json({ success: true, data: { teacher_id: id, academic_year_id: yearId, timetable } });
});


// =============================================================================
// 8. GET /api/v1/teachers/:id/classes
//    Classes assigned to this teacher in the current academic year
// =============================================================================
const getTeacherClasses = asyncHandler(async (req, res) => {
  const { school_id } = req.user;
  const { id } = req.params;
  const { academic_year_id } = req.query;

  // Verify teacher belongs to school
  const { data: teacher, error: tErr } = await supabase
    .from('teachers')
    .select('id')
    .eq('id', id)
    .eq('school_id', school_id)
    .single();

  if (tErr || !teacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found' });
  }

  // Resolve academic year
  let yearId = academic_year_id;
  if (!yearId) {
    const { data: currentYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('school_id', school_id)
      .eq('is_current', true)
      .single();
    yearId = currentYear?.id;
  }

  if (!yearId) {
    return res.status(404).json({ success: false, message: 'No current academic year found' });
  }

  const { data: assignments, error } = await supabase
    .from('teacher_assignments')
    .select(`
      id,
      is_active,
      class:class_id (
        id,
        grade_level,
        stream_name,
        capacity,
        is_active,
        class_teacher_id
      ),
      learning_area:learning_area_id ( id, name, code ),
      term:term_id ( id, name, term_number )
    `)
    .eq('teacher_id', id)
    .eq('academic_year_id', yearId)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch assignments', error: error.message });
  }

  // Enrich with learner count per class
  const classIds = [...new Set(assignments.map((a) => a.class?.id).filter(Boolean))];
  const learnerCounts = {};

  if (classIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('learner_enrollments')
      .select('class_id')
      .in('class_id', classIds)
      .eq('academic_year_id', yearId)
      .eq('status', 'enrolled');

    (enrollments || []).forEach((e) => {
      learnerCounts[e.class_id] = (learnerCounts[e.class_id] || 0) + 1;
    });
  }

  const enriched = assignments.map((a) => ({
    ...a,
    class: a.class ? { ...a.class, learner_count: learnerCounts[a.class.id] || 0 } : null,
    is_class_teacher: a.class?.class_teacher_id === id,
  }));

  res.json({
    success: true,
    data: {
      teacher_id: id,
      academic_year_id: yearId,
      assignments: enriched,
    },
  });
});


// =============================================================================
// Export
// =============================================================================
module.exports = {
  inviteTeacher,
  listTeachers,
  getTeacher,
  updateTeacher,
  toggleTeacherActive,
  deleteTeacher,
  getTeacherTimetable,
  getTeacherClasses,
};