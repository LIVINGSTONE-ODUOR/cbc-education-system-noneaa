const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendSchoolAdminWelcomeEmail } = require('../utils/email');

const respond = (res, statusCode, success, message, data = null, errors = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  if (errors !== null) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const parseNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sanitizeText = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

// Generates a readable temp password, e.g. "Kj4-Xp92-Qw"
const generateTempPassword = () => {
  const raw = crypto.randomBytes(9).toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10);
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}${raw.slice(8, 10)}`;
};

const splitFullName = (fullName) => {
  const trimmed = (fullName || '').trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (!trimmed) return { firstName: 'Admin', lastName: '' };
  if (spaceIndex === -1) return { firstName: trimmed, lastName: '' };
  return {
    firstName: trimmed.slice(0, spaceIndex).trim(),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
  };
};

const calculateExpiryDate = (billingCycle) => {
  const expiry = new Date();
  if (billingCycle === 'annually') {
    expiry.setMonth(expiry.getMonth() + 12);
  } else if (billingCycle === 'termly') {
    expiry.setMonth(expiry.getMonth() + 4);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }
  return expiry.toISOString();
};

const schoolAccessDenied = (req, res, schoolId) => {
  if (req.user.role === 'super_admin') {
    return false;
  }

  if (req.user.role === 'school_admin' && String(req.user.schoolId) === String(schoolId)) {
    return false;
  }

  respond(res, 403, false, 'Access denied. You do not have permission to access this school.');
  return true;
};

const dbFailure = (res, error, fallbackMessage) => {
  console.error('[school.controller] Error:', error);

  if (error?.code === '42P01' || error?.code === '42703') {
    return respond(
      res,
      500,
      false,
      'Database schema mismatch for school module. Ensure the latest migrations have been run.'
    );
  }

  if (error?.code === '22P02') {
    return respond(res, 400, false, 'Invalid identifier format supplied.');
  }

  if (error?.code === '23505') {
    return respond(res, 409, false, 'Duplicate record conflict detected.');
  }

  return respond(res, 500, false, fallbackMessage || 'Unexpected server error.');
};

// =============================================================================
// PLAN PRICING (Public endpoint)
// =============================================================================
const getPlans = async (req, res) => {
  try {
    const PLAN_PRICING = {
      basic: {
        monthly: 2500,
        termly: 6500,
        annually: 24000,
        features: {
          max_students: 200,
          max_teachers: 20,
          sms_alerts: false,
          api_access: false,
          support: 'email',
        },
      },
      standard: {
        monthly: 5000,
        termly: 13000,
        annually: 48000,
        features: {
          max_students: 600,
          max_teachers: 60,
          sms_alerts: true,
          api_access: false,
          support: 'priority',
        },
      },
      premium: {
        monthly: 9500,
        termly: 25000,
        annually: 90000,
        features: {
          max_students: 9999,
          max_teachers: 999,
          sms_alerts: true,
          api_access: true,
          support: '24/7',
        },
      },
    };

    const plans = Object.entries(PLAN_PRICING).map(([plan, config]) => ({
      plan,
      label: plan.charAt(0).toUpperCase() + plan.slice(1),
      pricing: {
        monthly: config.monthly,
        termly: config.termly,
        annually: config.annually,
      },
      features: config.features,
      savings: {
        termly: Math.round(((config.monthly * 4) - config.termly) / (config.monthly * 4) * 100),
        annually: Math.round(((config.monthly * 12) - config.annually) / (config.monthly * 12) * 100),
      },
    }));

    return respond(res, 200, true, 'Plans fetched successfully.', {
      plans,
      currency: 'KES',
      grace_period_days: 7,
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to fetch plans.');
  }
};

// =============================================================================
// SCHOOL MANAGEMENT
// =============================================================================
const getSchools = async (req, res) => {
  try {
    const { role, schoolId } = req.user;
    const isSuperAdmin = role === 'super_admin';

    // school_admin only ever gets their own school back, never the full
    // directory of every school on the platform.
    if (!isSuperAdmin && !schoolId) {
      return respond(res, 403, false, 'Access denied. No school assigned to your account.');
    }

    const result = isSuperAdmin
      ? await query(
          `SELECT id, name, code, email, phone_number, physical_address, postal_address, 
                  county, sub_county, ward, level, school_type, is_active, 
                  subscription_plan, subscription_status, subscription_expires_at,
                  created_at, updated_at
           FROM schools
           WHERE deleted_at IS NULL
           ORDER BY name ASC`
        )
      : await query(
          `SELECT id, name, code, email, phone_number, physical_address, postal_address, 
                  county, sub_county, ward, level, school_type, is_active, 
                  subscription_plan, subscription_status, subscription_expires_at,
                  created_at, updated_at
           FROM schools
           WHERE deleted_at IS NULL AND id = $1
           ORDER BY name ASC`,
          [schoolId]
        );

    // Add summary statistics
    const summary = {
      total: result.rows.length,
      active: result.rows.filter(s => s.subscription_status === 'active').length,
      no_subscription: result.rows.filter(s => s.subscription_status === 'no_subscription').length,
      expired: result.rows.filter(s => s.subscription_status === 'expired').length,
      grace: result.rows.filter(s => s.subscription_status === 'grace').length,
    };

    return respond(res, 200, true, 'Schools fetched successfully.', {
      schools: result.rows,
      summary,
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to fetch schools.');
  }
};

const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;

    if (schoolAccessDenied(req, res, id)) return;

    const result = await query(
      `SELECT id, name, code, email, phone_number, physical_address, postal_address, 
              county, sub_county, ward, level, school_type, admin_email, website, 
              year_established, student_capacity, motto, is_active, 
              subscription_plan, subscription_status, subscription_expires_at,
              payment_due, created_at, updated_at
       FROM schools
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return respond(res, 404, false, 'School not found.');
    }

    // Get current subscription if exists
    let subscription = null;
    try {
      const subResult = await query(
        `SELECT id, plan, billing_cycle, amount_paid, status, started_at, expires_at, 
                receipt_number, payment_method, created_at
         FROM school_subscriptions
         WHERE school_id = $1 AND status IN ('active', 'grace')
         ORDER BY created_at DESC
         LIMIT 1`,
        [id]
      );
      if (subResult.rows.length > 0) {
        subscription = subResult.rows[0];
      }
    } catch (subError) {
      // Table might not exist yet
      console.log('Subscription table not yet available');
    }

    return respond(res, 200, true, 'School loaded successfully.', {
      ...result.rows[0],
      current_subscription: subscription,
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to fetch school.');
  }
};

const createSchool = async (req, res) => {
  try {
    const {
      name,
      code,
      level,
      school_type,
      county,
      sub_county,
      ward,
      physical_address,
      postal_address,
      phone_number,
      email,
      admin_email,
      admin_name,
      website,
      year_established,
      student_capacity,
      motto,
    } = req.body;

    if (!sanitizeText(name) || !sanitizeText(code) || !sanitizeText(email)) {
      return respond(res, 400, false, 'Name, code, and email are required.');
    }

    const result = await query(
      `INSERT INTO schools (name, code, level, school_type, county, sub_county, ward, 
              physical_address, postal_address, phone_number, email, admin_email, website, 
              year_established, student_capacity, motto, subscription_plan, subscription_status,
              is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, 'none', 'no_subscription', 
               TRUE, NOW(), NOW())
       RETURNING *`,
      [
        name,
        code,
        level || 'primary',
        school_type || 'public',
        county || null,
        sub_county || null,
        ward || null,
        physical_address || null,
        postal_address || null,
        phone_number || null,
        email,
        admin_email || null,
        website || null,
        year_established || null,
        student_capacity ? parseInt(student_capacity, 10) : null,
        motto || null,
      ]
    );

    const school = result.rows[0];

    // ── Create a login-capable admin account for this school ──────────
    // (createSchool is the owner-driven onboarding path — after a demo or
    // registration, the platform owner creates the school and its first
    // admin account here, rather than the school self-registering.)
    let adminAccountCreated = false;
    let adminEmailSent = false;

    if (sanitizeText(admin_email)) {
      const normalizedAdminEmail = admin_email.trim().toLowerCase();
      const { firstName, lastName } = splitFullName(admin_name);
      const tempPassword = generateTempPassword();

      try {
        const existingAdmin = await query(
          `SELECT id FROM users WHERE email = $1 AND status != 'deleted' LIMIT 1`,
          [normalizedAdminEmail]
        );

        if (existingAdmin.rows.length === 0) {
          const passwordHash = await bcrypt.hash(tempPassword, 12);

          const adminUserResult = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, status,
                    email_verified, school_id, is_active)
             VALUES ($1,$2,$3,$4,'school_admin','active', TRUE, $5, TRUE)
             RETURNING id`,
            [normalizedAdminEmail, passwordHash, firstName, lastName, school.id]
          );

          const adminUserId = adminUserResult.rows[0].id;

          await query(
            `INSERT INTO school_admins (user_id, school_id, appointment_date)
             VALUES ($1, $2, CURRENT_DATE)`,
            [adminUserId, school.id]
          );

          adminAccountCreated = true;

          adminEmailSent = await sendSchoolAdminWelcomeEmail(
            normalizedAdminEmail,
            firstName,
            school.name,
            tempPassword
          );
        }
      } catch (adminSetupError) {
        // Don't fail the whole request if admin account creation has an
        // issue — the school record still exists and can be retried/fixed
        // from the School Management screen.
        console.error('[createSchool] Failed to create admin account:', adminSetupError);
      }
    }

    return respond(res, 201, true, 'School created successfully.', {
      ...school,
      admin_account_created: adminAccountCreated,
      admin_email_sent: adminEmailSent,
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to create school.');
  }
};

const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'name',
      'code',
      'level',
      'school_type',
      'county',
      'sub_county',
      'ward',
      'physical_address',
      'postal_address',
      'phone_number',
      'email',
      'admin_email',
      'website',
      'year_established',
      'student_capacity',
      'motto',
      'subscription_plan',
      'subscription_status',
      'payment_due',
      'is_active',
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates.push(`${field} = $${updates.length + 1}`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      return respond(res, 400, false, 'No valid fields were provided to update.');
    }

    values.push(id);
    const updateSQL = `UPDATE schools SET ${updates.join(', ')}, updated_at = NOW() 
                       WHERE id = $${values.length} AND deleted_at IS NULL RETURNING *`;
    const result = await query(updateSQL, values);

    if (result.rows.length === 0) {
      return respond(res, 404, false, 'School not found or already deleted.');
    }

    return respond(res, 200, true, 'School updated successfully.', result.rows[0]);
  } catch (error) {
    return dbFailure(res, error, 'Failed to update school.');
  }
};

const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE schools SET deleted_at = NOW(), updated_at = NOW(), is_active = FALSE 
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return respond(res, 404, false, 'School not found or already deleted.');
    }

    return respond(res, 200, true, 'School deleted successfully.', { id: result.rows[0].id });
  } catch (error) {
    return dbFailure(res, error, 'Failed to delete school.');
  }
};

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================
const createSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plan,
      billing_cycle,
      payment_method,
      amount_paid,
      transaction_id,
      payment_reference,
    } = req.body;

    if (!plan || !billing_cycle || !payment_method || !amount_paid) {
      return respond(res, 400, false, 'plan, billing_cycle, payment_method, and amount_paid are required.');
    }

    const expiryDate = calculateExpiryDate(billing_cycle);
    const receiptNumber = `REC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const result = await transaction(async (client) => {
      // Update school subscription info
      const updateSchool = await client.query(
        `UPDATE schools
         SET subscription_plan = $1,
             subscription_status = 'active',
             subscription_expires_at = $2,
             payment_due = CASE WHEN $3 > 0 THEN payment_due ELSE 0 END,
             is_active = TRUE,
             updated_at = NOW()
         WHERE id = $4 AND deleted_at IS NULL
         RETURNING *`,
        [plan, expiryDate, amount_paid, id]
      );

      if (updateSchool.rows.length === 0) {
        throw new Error('School not found.');
      }

      // Insert subscription record
      try {
        await client.query(
          `INSERT INTO school_subscriptions 
           (school_id, plan, billing_cycle, amount_paid, payment_method, 
            transaction_id, payment_reference, receipt_number, status, started_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), $9)`,
          [id, plan, billing_cycle, amount_paid, payment_method, transaction_id || null, 
           payment_reference || null, receiptNumber, expiryDate]
        );
      } catch (insertError) {
        console.log('Subscription table insert warning:', insertError.message);
      }

      return updateSchool.rows[0];
    });

    return respond(res, 201, true, 'Subscription created successfully.', {
      school: result,
      subscription: {
        plan,
        billing_cycle,
        amount_paid,
        receipt_number: receiptNumber,
        expires_at: expiryDate,
      },
    });
  } catch (error) {
    if (error.message === 'School not found.') {
      return respond(res, 404, false, error.message);
    }
    return dbFailure(res, error, 'Failed to create subscription.');
  }
};

const getCurrentSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (schoolAccessDenied(req, res, id)) return;

    const result = await query(
      `SELECT id, subscription_plan, subscription_status, subscription_expires_at, payment_due, is_active
       FROM schools
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return respond(res, 404, false, 'School not found.');
    }

    const school = result.rows[0];
    
    // Get subscription history
    let subscriptionHistory = [];
    try {
      const historyResult = await query(
        `SELECT id, plan, billing_cycle, amount_paid, status, started_at, expires_at, 
                receipt_number, payment_method, created_at
         FROM school_subscriptions
         WHERE school_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [id]
      );
      subscriptionHistory = historyResult.rows;
    } catch (subError) {
      console.log('Subscription table not yet available');
    }

    return respond(res, 200, true, 'Subscription loaded successfully.', {
      ...school,
      has_subscription: school.subscription_plan !== 'none',
      subscription_history: subscriptionHistory,
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to fetch subscription.');
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (schoolAccessDenied(req, res, id)) return;

    let payments = [];
    
    try {
      const result = await query(
        `SELECT id, plan, billing_cycle, amount_paid, payment_method, 
                transaction_id, payment_reference, receipt_number, status, created_at
         FROM school_subscriptions
         WHERE school_id = $1
         ORDER BY created_at DESC`,
        [id]
      );
      payments = result.rows;
    } catch (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet
        return respond(res, 200, true, 'No payment history available.', []);
      }
      throw error;
    }

    const totals = payments.reduce((acc, p) => {
      acc.total_paid += parseFloat(p.amount_paid) || 0;
      return acc;
    }, { total_paid: 0 });

    return respond(res, 200, true, 'Payment history loaded successfully.', {
      payments,
      totals,
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to fetch payment history.');
  }
};

const updateSchoolStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, status } = req.body;

    if (is_active === undefined && status === undefined) {
      return respond(res, 400, false, 'Either is_active or status must be provided.');
    }

    const updates = [];
    const values = [];

    if (is_active !== undefined) {
      updates.push(`is_active = $${updates.length + 1}`);
      values.push(Boolean(is_active));
    }

    if (status !== undefined) {
      updates.push(`subscription_status = $${updates.length + 1}`);
      values.push(status);
    }

    values.push(id);

    const result = await query(
      `UPDATE schools SET ${updates.join(', ')}, updated_at = NOW() 
       WHERE id = $${values.length} AND deleted_at IS NULL RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return respond(res, 404, false, 'School not found or already deleted.');
    }

    return respond(res, 200, true, 'School status updated successfully.', result.rows[0]);
  } catch (error) {
    return dbFailure(res, error, 'Failed to update school status.');
  }
};

const checkExpiry = async (req, res) => {
  try {
    const secret = req.headers['x-cron-secret'] || req.body.secret;
    if (!secret || secret !== process.env.CRON_SECRET) {
      return respond(res, 403, false, 'Invalid cron secret.');
    }

    const result = await query(
      `UPDATE schools
       SET subscription_status = 'expired',
           is_active = FALSE,
           updated_at = NOW()
       WHERE subscription_expires_at IS NOT NULL
         AND subscription_expires_at < NOW()
         AND subscription_status = 'active'
         AND deleted_at IS NULL
       RETURNING id, name, subscription_expires_at`
    );

    return respond(res, 200, true, 'School expiry check complete.', {
      expired_count: result.rowCount,
      expired_schools: result.rows,
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to run expiry check.');
  }
};

const getBranches = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { role, schoolId: userSchoolId } = req.user;

    if (role !== 'super_admin' && String(schoolId) !== String(userSchoolId)) {
      return respond(res, 403, false, 'Access denied.');
    }

    const result = await query(
      `SELECT id, school_id, name, code, physical_address, phone_number, email, 
              is_main_campus, is_active, created_at, updated_at
       FROM branches
       WHERE school_id = $1 AND (deleted_at IS NULL OR deleted_at > NOW())
       ORDER BY is_main_campus DESC, name ASC`,
      [schoolId]
    );

    return respond(res, 200, true, 'Branches loaded successfully.', result.rows);
  } catch (error) {
    return dbFailure(res, error, 'Failed to fetch branches.');
  }
};

// =============================================================================
// LEARNERS (Helper endpoint for School Management UI)
// GET /api/v1/schools/:id/learners
// =============================================================================
const getLearnersForSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, schoolId: userSchoolId } = req.user;

    // Use same access model as other school endpoints in this controller
    if (role !== 'super_admin' && String(userSchoolId) !== String(id)) {
      return respond(res, 403, false, 'Access denied. You do not have permission to access this school.');
    }

    // Light payload for performance: total + basic learner rows
    // Uses schools module DB access pattern (not Supabase) to match this controller style.
    const learnersCountResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM learners
       WHERE school_id = $1 AND deleted_at IS NULL`,
      [id]
    );

    const total = learnersCountResult?.rows?.[0]?.total || 0;

    const learnersResult = await query(
      `SELECT id,
              admission_number,
              first_name,
              last_name,
              gender,
              is_active
       FROM learners
       WHERE school_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 500`,
      [id]
    );

    return respond(res, 200, true, 'Learners loaded successfully.', {
      total,
      learners: learnersResult.rows,
    });
  } catch (error) {
    return dbFailure(res, error, 'Failed to fetch learners for school.');
  }
};

module.exports = {
  getPlans,        // NEW: Public plans endpoint
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  createSubscription,
  getCurrentSubscription,
  getPaymentHistory,
  updateSchoolStatus,
  checkExpiry,
  getBranches,
  getLearnersForSchool,
};
