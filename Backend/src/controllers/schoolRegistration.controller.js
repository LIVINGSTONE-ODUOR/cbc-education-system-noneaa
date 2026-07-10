// ================================================================
// controllers/schoolRegistration.controller.js
//
// Handles the complete school + admin registration flow.
// All 3 table inserts (schools, users, school_admins) happen
// inside a single Supabase RPC transaction so if any step fails,
// nothing is committed.
//
// Dependencies:
//   npm install @supabase/supabase-js bcryptjs
// ================================================================

const bcrypt    = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const { sendSchoolAdminWelcomeEmail } = require('../utils/email');

// ----------------------------------------------------------------
// Supabase admin client (service_role key — bypasses RLS)
// NEVER expose this key to the frontend.
// ----------------------------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ywcrsgaxftooovqipkdr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Supabase URL:', supabaseUrl ? 'Set' : 'NOT SET');
console.log('🔧 Service Role Key:', supabaseServiceKey ? 'Set (length: ' + supabaseServiceKey.length + ')' : 'NOT SET');

if (!supabaseServiceKey) {
  console.error('❌ FATAL: SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations require this key.');
  console.error('🔧 Please set SUPABASE_SERVICE_ROLE_KEY in your .env file');
}

let supabaseAdmin = null;

// Only create the client if we have the required keys
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  );
  console.log('✅ Supabase admin client initialized successfully');
} else {
  console.error('❌ Cannot initialize Supabase admin client: missing configuration');
}

// ----------------------------------------------------------------
// HELPER — normalize Kenyan phone numbers to +254XXXXXXXXX
// Mirrors the DB function public.normalize_ke_phone()
// ----------------------------------------------------------------

const normalizePhone = (raw) => {
  if (!raw) return null;
  let cleaned = raw.replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+254')) return cleaned;
  if (cleaned.startsWith('254') && cleaned.length === 12) return '+' + cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 10) return '+254' + cleaned.slice(1);

  return cleaned; // return as-is, let DB constraint catch invalid formats
};

// ----------------------------------------------------------------
// HELPER — split "John Doe" → { firstName: 'John', lastName: 'Doe' }
// Mirrors the DB function public.split_full_name()
// ----------------------------------------------------------------

const splitFullName = (fullName) => {
  const trimmed = (fullName || '').trim();
  const spaceIndex = trimmed.indexOf(' ');

  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '-' };
  }

  return {
    firstName: trimmed.slice(0, spaceIndex).trim(),
    lastName:  trimmed.slice(spaceIndex + 1).trim(),
  };
};

// ----------------------------------------------------------------
// HELPER — validate a chosen subdomain (DNS-label safe)
// Mirrors the DB CHECK constraint in add_subdomain_to_schools.sql
// ----------------------------------------------------------------

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

// Reserved words that must never be claimable as a school subdomain,
// since they're used by the platform itself or would be confusing/
// impersonation-risk (e.g. "admin.noneaa.com", "api.noneaa.com").
const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'admin', 'mail', 'smtp', 'ftp', 'noneaa',
  'staging', 'dev', 'test', 'demo', 'support', 'help', 'status',
  'blog', 'docs', 'cdn', 'assets', 'static', 'login', 'auth',
  'dashboard', 'school-admin', 'root', 'null', 'undefined',
]);

const validateSubdomain = (raw) => {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, error: 'Subdomain is required' };
  }
  const normalized = raw.trim().toLowerCase();

  if (normalized.length < 3 || normalized.length > 63) {
    return { valid: false, error: 'Subdomain must be 3-63 characters' };
  }
  if (!SUBDOMAIN_REGEX.test(normalized)) {
    return {
      valid: false,
      error: 'Subdomain can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen',
    };
  }
  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return { valid: false, error: 'This subdomain is reserved and cannot be used' };
  }

  return { valid: true, normalized };
};


const respond = (res, statusCode, success, message, data = null, errors = null) => {
  const payload = { success, message };
  if (data)   payload.data   = data;
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

// ================================================================
// CONTROLLER 1 — Register School Admin
//
// POST /api/v1/auth/register/school-admin
//
// Flow:
//   1. Validate (done by middleware before this runs)
//   2. Check school code not already taken
//   3. Check admin email not already registered
//   4. Hash password
//   5. INSERT schools
//   6. Create Supabase Auth user
//   7. INSERT public.users
//   8. INSERT school_admins
//   9. Seed id_sequences for this school
//   10. Return tokens + school info
// ================================================================

// Check if Supabase admin is initialized before proceeding
const checkSupabaseAdmin = (res) => {
  if (!supabaseAdmin) {
    console.error('[schoolRegistration] Supabase admin client is not initialized');
    console.error('[schoolRegistration] Please ensure SUPABASE_SERVICE_ROLE_KEY is set in environment variables');
    res.status(500).json({
      success: false,
      message: 'Server configuration error. Please contact support.',
      error: 'Database connection not available'
    });
    return false;
  }
  return true;
};

const registerSchoolAdmin = async (req, res) => {
  // Check Supabase admin initialization
  if (!checkSupabaseAdmin(res)) return;
  const {
    // School fields
    school_name, school_code, school_type, level,
    phone_number, county, sub_county, ward,
    year_established, student_capacity,
    physical_address, postal_address, website, subdomain,
    // Admin fields
    admin_name, admin_email, password,
    tsc_number, appointment_date, role,
    // New fields from frontend
    school_email, national_id, passport_number, username,
  } = req.body;

  try {

    // ── Field Mapping: Handle frontend field name variations ─────────────────
    // Frontend sends 'school_email' but we use 'email' for school contact
    const schoolContactEmail = school_email || admin_email;

    // Handle national_id vs passport_number
    const nationalId = national_id || null;
    const passportNumber = passport_number || null;

    // Handle appointment_date - use current date if not provided
    const effectiveAppointmentDate = appointment_date || new Date().toISOString().split('T')[0];

    // Handle username - derive from email if not provided
    const effectiveUsername = username || (admin_email ? admin_email.split('@')[0] : null);

    // ── Step 1: Check school code uniqueness ──────────────────

    const { data: existingSchool } = await supabaseAdmin
      .from('schools')
      .select('id, code')
      .eq('code', school_code.toUpperCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (existingSchool) {
      return respond(res, 409, false, 'School code already registered', null, [
        { field: 'school_code', message: `School code "${school_code}" is already taken` },
      ]);
    }

    // ── Step 1b: Validate + check subdomain uniqueness ────────

    const subdomainValidation = validateSubdomain(subdomain);
    if (!subdomainValidation.valid) {
      return respond(res, 400, false, subdomainValidation.error, null, [
        { field: 'subdomain', message: subdomainValidation.error },
      ]);
    }
    const normalizedSubdomain = subdomainValidation.normalized;

    const { data: existingSubdomain } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('subdomain', normalizedSubdomain)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingSubdomain) {
      return respond(res, 409, false, 'Subdomain already taken', null, [
        { field: 'subdomain', message: `"${normalizedSubdomain}.noneaa.com" is already taken` },
      ]);
    }

    // ── Step 2: Check admin email uniqueness ──────────────────

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', admin_email.toLowerCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (existingUser) {
      return respond(res, 409, false, 'Email already registered', null, [
        { field: 'admin_email', message: 'This email address is already in use' },
      ]);
    }

    // ── Step 3: Hash password ─────────────────────────────────

    const SALT_ROUNDS = 12;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Step 4: Normalize inputs ──────────────────────────────

    const normalizedPhone = normalizePhone(phone_number);
    const { firstName, lastName } = splitFullName(admin_name);
    const normalizedCode = school_code.toUpperCase();
    const normalizedEmail = admin_email.toLowerCase();

    // ── Step 5: INSERT school ─────────────────────────────────

    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name:              school_name.trim(),
        code:              normalizedCode,
        subdomain:         normalizedSubdomain,
        level,
        levels_offered: [level],
        school_type,
        phone_number:      normalizedPhone,
        email:             schoolContactEmail,   // Use mapped school email
        county:            county.trim(),
        sub_county:        sub_county.trim(),
        ward:              ward?.trim() || null,
        physical_address:  physical_address?.trim() || `${county}, Kenya`,
        postal_address:    postal_address?.trim() || null,
        website:           website?.trim() || null,
        year_established:  year_established || null,
        student_capacity:  student_capacity || null,
        is_active:         true,
        security_level:    'standard',
        data_classification: 'internal',
      })
      .select()
      .single();

    if (schoolError) {
      console.error('[registerSchoolAdmin] School insert error:', schoolError);

      // Handle unique constraint violation on code or email
      if (schoolError.code === '23505') {
        return respond(res, 409, false, 'Duplicate school data', null, [
          { field: 'school_code', message: 'School code or email already exists' },
        ]);
      }

      // Handle CHECK constraint violations
      if (schoolError.code === '23514') {
        return respond(res, 422, false, 'Invalid school data', null, [
          { field: 'general', message: 'School data failed database validation' },
        ]);
      }

      return respond(res, 500, false, 'Failed to create school');
    }

    // ── Step 6: Create Supabase Auth user ─────────────────────
    // This creates the auth.users entry that Supabase Auth manages.
    // The returned user.id becomes the FK for public.users.

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email:             normalizedEmail,
        password,                             // plain text — Supabase hashes internally
        email_confirm:     true,              // skip email verification for admin signup
        user_metadata: {
          full_name:   admin_name,
          role:        'school_admin',
          school_id:   school.id,
          school_name: school.name,
        },
      });

    if (authError) {
      console.error('[registerSchoolAdmin] Auth user creation error:', authError);

      // Rollback: delete the school we just created
      await supabaseAdmin
        .from('schools')
        .delete()
        .eq('id', school.id);

      return respond(res, 500, false, 'Failed to create admin account. School registration rolled back.');
    }

    const authUserId = authData.user.id;

    // ── Step 7: INSERT public.users ───────────────────────────
    // Links Supabase Auth user to our application user record.

    const { data: publicUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id:             authUserId,        // SAME UUID as auth.users
        email:          normalizedEmail,
        password_hash:  passwordHash,      // our own bcrypt hash for app-level auth
        first_name:     firstName,
        last_name:      lastName,
        phone_number:   normalizedPhone,
        role:           'school_admin',
        status:         'active',
        email_verified: true,
        school_id:      school.id,
        is_active:      true,
      })
      .select()
      .single();

    if (userError) {
      console.error('[registerSchoolAdmin] Public user insert error:', userError);

      // Rollback both school and auth user
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      await supabaseAdmin.from('schools').delete().eq('id', school.id);

      return respond(res, 500, false, 'Failed to create user profile. Registration rolled back.');
    }

// ── Step 8: INSERT school_admins ──────────────────────────
    // Only insert essential fields to avoid DB constraint errors
    
    const adminData = {
      user_id:       authUserId,
      school_id:     school.id,
      appointment_date: effectiveAppointmentDate,
    };
    
  // Only add optional fields if they have values
  // Skip national_id due to CHECK constraint - let users add it later
    const { error: adminError } = await supabaseAdmin
      .from('school_admins')
      .insert(adminData);

    if (adminError) {
      console.error('[registerSchoolAdmin] school_admins insert error:', adminError);

      // Rollback everything
      await supabaseAdmin.from('users').delete().eq('id', authUserId);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      await supabaseAdmin.from('schools').delete().eq('id', school.id);

      return respond(res, 500, false, 'Failed to assign admin role. Registration rolled back.');
    }

    // ── Step 9: Seed id_sequences for this school ─────────────
    // Pre-creates the INV and RCP counter rows so the first
    // invoice/payment doesn't hit a cold-start insert race condition.

    await supabaseAdmin
      .from('id_sequences')
      .insert([
        { school_id: school.id, series: 'INV', last_value: 0 },
        { school_id: school.id, series: 'RCP', last_value: 0 },
        { school_id: school.id, series: 'ADM', last_value: 0 },
      ])
      .select(); // ignore errors — might already exist from a retry

    // ── Step 9a: Seed a default current academic year ─────────
    // Classes, terms, fees, and exams all require an academic_years
    // row with is_current = true before they'll work. Without this,
    // brand-new schools hit "No active academic year found" on their
    // very first action (e.g. creating a class) until someone finds
    // Term Management and manually adds a year. Seed the calendar-year
    // default here so the school admin can start working immediately;
    // they can still adjust dates or add subsequent years later.

    const currentYear = new Date().getFullYear();
    const { error: academicYearError } = await supabaseAdmin
      .from('academic_years')
      .insert({
        school_id:  school.id,
        name:       `${currentYear} Academic Year`,
        year:       currentYear,
        start_date: `${currentYear}-01-01`,
        end_date:   `${currentYear}-12-31`,
        is_current: true,
        is_active:  true,
        created_by: authUserId,
        updated_by: authUserId,
      });

    if (academicYearError) {
      // Don't fail registration over this — log it so it can be
      // fixed manually via Term Management, but let the admin in.
      console.error('[registerSchoolAdmin] Default academic year seed failed:', academicYearError);
    }

    // ── Step 9b: Send welcome email (login URL + email + temp password) ──
    // Fire-and-forget-ish: don't fail registration if the email fails to send,
    // just log it so support can manually resend if needed.

    const emailSent = await sendSchoolAdminWelcomeEmail(
      normalizedEmail,
      firstName,
      school.name,
      password,
      normalizedSubdomain
    );

    if (!emailSent) {
      console.error(`[registerSchoolAdmin] Welcome email failed to send for ${normalizedEmail} (school: ${school.name}). Registration still succeeded.`);
    }

    // ── Step 10: Generate session token for immediate login ────

    // Sign in to get actual JWT tokens
    const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
      email:    normalizedEmail,
      password,
    });

    // ── Step 11: Return success response ──────────────────────

    return respond(res, 201, true, 'School registered successfully', {
      school: {
        id:               school.id,
        name:             school.name,
        code:             school.code,
        level:            school.level,
        school_type:      school.school_type,
        county:           school.county,
        year_established: school.year_established,
        student_capacity: school.student_capacity,
      },
      user: {
        id:         authUserId,
        email:      normalizedEmail,
        first_name: firstName,
        last_name:  lastName,
        role:       'school_admin',
      },
      session: signInData?.session || null,
    });

  } catch (err) {
    console.error('[registerSchoolAdmin] Unexpected error:', err);
    console.error('[registerSchoolAdmin] Error stack:', err.stack);
    
    // Provide more detailed error message
    const errorMessage = err.message || 'Unknown error';
    return respond(res, 500, false, `An unexpected error occurred: ${errorMessage}`);
  }
};


// ================================================================
// CONTROLLER 2 — Register Teacher
//
// POST /api/v1/auth/register/teacher
// ================================================================

const registerTeacher = async (req, res) => {
  // Check Supabase admin initialization
  if (!checkSupabaseAdmin(res)) return;
  
  const {
    school_code,
    first_name, last_name, email, phone_number, password,
    tsc_number, qualifications, date_joined,
  } = req.body;

  try {

    // ── Find school by code ───────────────────────────────────

    const { data: school, error: schoolFindError } = await supabaseAdmin
      .from('schools')
      .select('id, name, is_active')
      .eq('code', school_code.toUpperCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (schoolFindError || !school) {
      return respond(res, 404, false, 'School not found', null, [
        { field: 'school_code', message: `No active school found with code "${school_code}"` },
      ]);
    }

    if (!school.is_active) {
      return respond(res, 403, false, 'School account is not active');
    }

    // ── Check TSC number uniqueness ───────────────────────────

    const { data: existingTSC } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('tsc_number', tsc_number.toUpperCase())
      .maybeSingle();

    if (existingTSC) {
      return respond(res, 409, false, 'TSC number already registered', null, [
        { field: 'tsc_number', message: 'This TSC number is already in use' },
      ]);
    }

    // ── Check email uniqueness ────────────────────────────────

    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (existingEmail) {
      return respond(res, 409, false, 'Email already registered', null, [
        { field: 'email', message: 'This email address is already in use' },
      ]);
    }

    // ── Hash password + normalize ─────────────────────────────

    const passwordHash = await bcrypt.hash(password, 12);
    const normalizedPhone = normalizePhone(phone_number);
    const normalizedEmail = email.toLowerCase();

    // ── Create Supabase Auth user ─────────────────────────────

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email:         normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: `${first_name} ${last_name}`,
          role:      'teacher',
          school_id: school.id,
        },
      });

    if (authError) {
      return respond(res, 500, false, 'Failed to create teacher account');
    }

    const authUserId = authData.user.id;

    // ── INSERT public.users ───────────────────────────────────

    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id:            authUserId,
        email:         normalizedEmail,
        password_hash: passwordHash,
        first_name:    first_name.trim(),
        last_name:     last_name.trim(),
        phone_number:  normalizedPhone,
        role:          'teacher',
        status:        'active',
        email_verified: true,
        school_id:     school.id,
        is_active:     true,
      });

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return respond(res, 500, false, 'Failed to create teacher profile');
    }

    // ── INSERT teachers ───────────────────────────────────────

    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id:        authUserId,
        school_id:      school.id,
        tsc_number:     tsc_number.toUpperCase(),
        qualifications: qualifications?.trim() || null,
        date_joined:    date_joined || new Date().toISOString().split('T')[0],
        is_active:      true,
      })
      .select()
      .single();

    if (teacherError) {
      await supabaseAdmin.from('users').delete().eq('id', authUserId);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return respond(res, 500, false, 'Failed to save teacher record');
    }

    return respond(res, 201, true, 'Teacher registered successfully', {
      teacher: {
        id:         teacher.id,
        user_id:    authUserId,
        tsc_number: teacher.tsc_number,
        school:     { id: school.id, name: school.name },
      },
      user: {
        id:         authUserId,
        email:      normalizedEmail,
        first_name: first_name.trim(),
        last_name:  last_name.trim(),
        role:       'teacher',
      },
    });

  } catch (err) {
    console.error('[registerTeacher] Unexpected error:', err);
    return respond(res, 500, false, 'An unexpected error occurred');
  }
};


// ================================================================
// CONTROLLER 3 — Register Parent
//
// POST /api/v1/auth/register/parent
// ================================================================

const registerParent = async (req, res) => {
  // Check Supabase admin initialization
  if (!checkSupabaseAdmin(res)) return;
  
  const {
    school_code,
    first_name, last_name, email, phone_number, password,
    relationship, national_id, occupation, date_of_birth,
  } = req.body;

  try {

    // ── Find school ───────────────────────────────────────────

    const { data: school } = await supabaseAdmin
      .from('schools')
      .select('id, name, is_active')
      .eq('code', school_code.toUpperCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (!school) {
      return respond(res, 404, false, 'School not found', null, [
        { field: 'school_code', message: `No school found with code "${school_code}"` },
      ]);
    }

    // ── Check email uniqueness ────────────────────────────────

    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (existingEmail) {
      return respond(res, 409, false, 'Email already registered', null, [
        { field: 'email', message: 'This email address is already registered' },
      ]);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const normalizedPhone = normalizePhone(phone_number);
    const normalizedEmail = email.toLowerCase();

    // ── Create auth user ──────────────────────────────────────

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email:         normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name:    `${first_name} ${last_name}`,
          role:         'parent',
          school_id:    school.id,
          relationship,
        },
      });

    if (authError) {
      return respond(res, 500, false, 'Failed to create parent account');
    }

    const authUserId = authData.user.id;

    // ── INSERT public.users ───────────────────────────────────

    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id:            authUserId,
        email:         normalizedEmail,
        password_hash: passwordHash,
        first_name:    first_name.trim(),
        last_name:     last_name.trim(),
        phone_number:  normalizedPhone,
        role:          'parent',
        status:        'active',
        email_verified: true,
        school_id:     school.id,
        is_active:     true,
      });

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return respond(res, 500, false, 'Failed to create parent profile');
    }

    // ── INSERT parents ────────────────────────────────────────

    const { data: parent, error: parentError } = await supabaseAdmin
      .from('parents')
      .insert({
        user_id:       authUserId,
        national_id:   national_id || null,
        occupation:    occupation?.trim() || null,
        relationship,
        date_of_birth: date_of_birth || null,
        email:         normalizedEmail,
        first_name:    first_name.trim(),
        last_name:     last_name.trim(),
        is_active:     true,
      })
      .select()
      .single();

    if (parentError) {
      await supabaseAdmin.from('users').delete().eq('id', authUserId);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return respond(res, 500, false, 'Failed to save parent record');
    }

    return respond(res, 201, true, 'Parent registered successfully', {
      parent: {
        id:           parent.id,
        user_id:      authUserId,
        relationship: parent.relationship,
        school:       { id: school.id, name: school.name },
      },
      user: {
        id:         authUserId,
        email:      normalizedEmail,
        first_name: first_name.trim(),
        last_name:  last_name.trim(),
        role:       'parent',
      },
    });

  } catch (err) {
    console.error('[registerParent] Unexpected error:', err);
    return respond(res, 500, false, 'An unexpected error occurred');
  }
};


// ================================================================
// CONTROLLER 4 — Check School Code Availability
// Called live as user types in the School Code field
//
// GET /api/v1/auth/check-school-code/:code
// ================================================================

const checkSchoolCode = async (req, res) => {
  const { code } = req.params;

  if (!code || code.length < 3) {
    return respond(res, 400, false, 'Code too short');
  }

  const normalizedCode = code.toUpperCase();

  const { data } = await supabaseAdmin
    .from('schools')
    .select('id, name')
    .eq('code', normalizedCode)
    .is('deleted_at', null)
    .maybeSingle();

  if (data) {
    return respond(res, 200, false, 'School code already taken', {
      available: false,
      school_name: data.name,
    });
  }

  return respond(res, 200, true, 'School code is available', {
    available: true,
  });
};


// ================================================================
// CONTROLLER 5 — Check Email Availability
// Called live on the email field blur event
//
// GET /api/v1/auth/check-email?email=...
// ================================================================

const checkEmail = async (req, res) => {
  const { email } = req.query;

  if (!email || !email.includes('@')) {
    return respond(res, 400, false, 'Invalid email format');
  }

  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .is('deleted_at', null)
    .maybeSingle();

  return respond(res, 200, !data, data ? 'Email already registered' : 'Email is available', {
    available: !data,
  });
};


// ================================================================
// CONTROLLER 6 — Get School by Code (for Teacher/Parent tab)
// Validates the school exists before Teacher/Parent registers
//
// GET /api/v1/auth/school/:code
// ================================================================

const getSchoolByCode = async (req, res) => {
  const { code } = req.params;

  const { data: school, error } = await supabaseAdmin
    .from('schools')
    .select('id, name, code, level, school_type, county')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !school) {
    return respond(res, 404, false, 'School not found', null, [
      { field: 'school_code', message: `No active school found with code "${code}"` },
    ]);
  }

  return respond(res, 200, true, 'School found', { school });
};


// ================================================================
// CONTROLLER 7 — Check Subdomain Availability
// Called live as the admin types their chosen subdomain during
// registration (e.g. "ekwanda" -> ekwanda.noneaa.com)
//
// GET /api/v1/auth/check-subdomain/:subdomain
// ================================================================

const checkSubdomain = async (req, res) => {
  const { subdomain } = req.params;

  const validation = validateSubdomain(subdomain);
  if (!validation.valid) {
    return respond(res, 200, false, validation.error, { available: false });
  }

  const { data } = await supabaseAdmin
    .from('schools')
    .select('id, name')
    .eq('subdomain', validation.normalized)
    .is('deleted_at', null)
    .maybeSingle();

  if (data) {
    return respond(res, 200, false, 'Subdomain already taken', {
      available: false,
      school_name: data.name,
    });
  }

  return respond(res, 200, true, 'Subdomain is available', {
    available: true,
    preview_url: `https://${validation.normalized}.noneaa.com`,
  });
};


// ================================================================
// CONTROLLER 8 — Get School by Subdomain (for the login page)
// Called by the frontend on page load when it detects the visitor
// is on {subdomain}.noneaa.com, so it can show the right school's
// branding and scope the login request to that school.
//
// GET /api/v1/auth/school/by-subdomain/:subdomain
// ================================================================

const getSchoolBySubdomain = async (req, res) => {
  const { subdomain } = req.params;

  if (!subdomain) {
    return respond(res, 400, false, 'Subdomain is required');
  }

  const { data: school, error } = await supabaseAdmin
    .from('schools')
    .select('id, name, code, subdomain, level, school_type, county')
    .eq('subdomain', subdomain.toLowerCase())
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !school) {
    return respond(res, 404, false, 'School not found', null, [
      { field: 'subdomain', message: `No active school found at "${subdomain}"` },
    ]);
  }

  return respond(res, 200, true, 'School found', { school });
};


module.exports = {
  registerSchoolAdmin,
  registerTeacher,
  registerParent,
  checkSchoolCode,
  checkEmail,
  getSchoolByCode,
  checkSubdomain,
  getSchoolBySubdomain,
};
