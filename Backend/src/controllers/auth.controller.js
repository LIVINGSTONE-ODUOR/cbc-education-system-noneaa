const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const { 
  hashPassword, 
  verifyPassword, 
  generateTokens, 
  isAccountLocked, 
  incrementLoginAttempts, 
  resetLoginAttempts,
  isValidEmail,
  validatePassword,
  isEmailTaken,
  isTscNumberTaken,
  isAdmissionNumberTaken
} = require('../config/auth');

// Helper function to send verification email (placeholder for email service)
const sendVerificationEmail = async (email, token) => {
  // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
  console.log(`📧 Verification email sent to ${email} with token: ${token}`);
  return true;
};

// Helper function to send password reset email (placeholder for email service)
const sendPasswordResetEmail = async (email, token) => {
  // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
  console.log(`📧 Password reset email sent to ${email} with token: ${token}`);
  return true;
};

// Register school admin
exports.registerSchoolAdmin = async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, phoneNumber,
      schoolName, schoolCode, schoolLevel, county, subCounty, ward,
      physicalAddress, postalAddress, schoolPhoneNumber, schoolEmail,
      fullName, tscNo, role, administratorRole, administratorPhoneNumber,
      administratorEmail, administratorNationalId, administratorUsername,
      administratorPassword, twoFactorAuth
    } = req.body;

    // Validate inputs
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format for administrator.'
      });
    }

    if (!isValidEmail(administratorEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format for school administrator.'
      });
    }

    if (!isValidEmail(schoolEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid school email format.'
      });
    }

    const passwordErrors = validatePassword(administratorPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed.',
        errors: passwordErrors
      });
    }

    // Check if emails are already taken
    const emailTaken = await isEmailTaken(administratorEmail);
    if (emailTaken) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already in use.'
      });
    }

    // Hash passwords
    const passwordHash = await hashPassword(administratorPassword);
    const userPasswordHash = await hashPassword(password);

    const result = await transaction(async (client) => {
      // Create school
      const schoolResult = await client.query(
        `INSERT INTO schools (name, code, level, county, sub_county, ward, 
                              physical_address, postal_address, phone_number, email, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
         RETURNING id`,
        [schoolName, schoolCode, schoolLevel, county, subCounty, ward,
         physicalAddress, postalAddress, schoolPhoneNumber, schoolEmail]
      );

      const schoolId = schoolResult.rows[0].id;

      // Create administrator user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, two_factor_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [administratorEmail, passwordHash, fullName, lastName, administratorPhoneNumber, 
         'school_admin', 'active', false, twoFactorAuth || false]
      );

      const userId = userResult.rows[0].id;

      // Create school admin record
      await client.query(
        `INSERT INTO school_admins (user_id, school_id, tsc_number, appointment_date, is_principal)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, schoolId, tscNo, new Date(), role === 'principal']
      );

      // Create the main user account (if different from administrator)
      if (email !== administratorEmail) {
        await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, two_factor_enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [email, userPasswordHash, firstName, lastName, phoneNumber, 'school_admin', 'active', false, false]
        );
      }

      return { schoolId, userId };
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [result.userId, crypto.createHash('sha256').update(verificationToken).digest('hex'), 
       new Date(Date.now() + 24 * 60 * 60 * 1000)] // 24 hours
    );

    // Send verification email
    await sendVerificationEmail(administratorEmail, verificationToken);

    res.status(201).json({
      success: true,
      message: 'School administrator account created successfully. Please verify your email address.',
      data: {
        schoolId: result.schoolId,
        userId: result.userId
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
};

// Register teacher
exports.registerTeacher = async (req, res) => {
  try {
    const { email, firstName, lastName, phoneNumber, tscNumber, subjectsTaught, qualifications, dateJoined } = req.body;
    const schoolId = req.user.schoolId;

    // Validate inputs
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    const passwordErrors = validatePassword(req.body.password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed.',
        errors: passwordErrors
      });
    }

    // Check if email is already taken
    const emailTaken = await isEmailTaken(email);
    if (emailTaken) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already in use.'
      });
    }

    // Check if TSC number is already taken in this school
    const tscTaken = await isTscNumberTaken(tscNumber, schoolId);
    if (tscTaken) {
      return res.status(409).json({
        success: false,
        message: 'TSC number is already in use in this school.'
      });
    }

    const passwordHash = await hashPassword(req.body.password);

    const result = await transaction(async (client) => {
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, two_factor_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [email, passwordHash, firstName, lastName, phoneNumber, 'teacher', 'pending', false, false]
      );

      const userId = userResult.rows[0].id;

      // Create teacher record
      await client.query(
        `INSERT INTO teachers (user_id, school_id, tsc_number, subjects_taught, qualifications, date_joined, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [userId, schoolId, tscNumber, subjectsTaught, qualifications, dateJoined]
      );

      return userId;
    });

    res.status(201).json({
      success: true,
      message: 'Teacher account created successfully. Awaiting approval from school administrator.',
      data: { userId: result }
    });

  } catch (error) {
    console.error('❌ Teacher registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during teacher registration.'
    });
  }
};

// Register parent
exports.registerParent = async (req, res) => {
  try {
    const { email, firstName, lastName, phoneNumber, nationalId, passportNumber, occupation, relationship } = req.body;

    // Validate inputs
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    const passwordErrors = validatePassword(req.body.password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed.',
        errors: passwordErrors
      });
    }

    // Check if email is already taken
    const emailTaken = await isEmailTaken(email);
    if (emailTaken) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already in use.'
      });
    }

    const passwordHash = await hashPassword(req.body.password);

    const result = await transaction(async (client) => {
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, two_factor_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [email, passwordHash, firstName, lastName, phoneNumber, 'parent', 'pending', false, false]
      );

      const userId = userResult.rows[0].id;

      // Create parent record
      await client.query(
        `INSERT INTO parents (user_id, national_id, passport_number, occupation, relationship, date_of_birth)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, nationalId, passportNumber, occupation, relationship, req.body.dateOfBirth]
      );

      return userId;
    });

    res.status(201).json({
      success: true,
      message: 'Parent account created successfully. Awaiting approval from school administrator.',
      data: { userId: result }
    });

  } catch (error) {
    console.error('❌ Parent registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during parent registration.'
    });
  }
};

// Register learner
exports.registerLearner = async (req, res) => {
  try {
    const {
      admissionNumber, firstName, lastName, middleName, dateOfBirth, gender, gradeLevel, streamName, specialNeeds,
      parentEmail, parentFirstName, parentLastName, parentPhoneNumber, parentNationalId, parentOccupation, parentRelationship
    } = req.body;
    const schoolId = req.user.schoolId;

    // Validate inputs
    if (!isValidEmail(parentEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent email format.'
      });
    }

    // Check if admission number is already taken in this school
    const admissionTaken = await isAdmissionNumberTaken(admissionNumber, schoolId);
    if (admissionTaken) {
      return res.status(409).json({
        success: false,
        message: 'Admission number is already in use in this school.'
      });
    }

    const result = await transaction(async (client) => {
      // Check if parent already exists
      let parentResult = await client.query('SELECT id FROM parents WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [parentEmail]);
      let parentId;

      if (parentResult.rows.length === 0) {
        // Create parent user
        const parentPassword = crypto.randomBytes(8).toString('hex'); // Generate temporary password
        const passwordHash = await hashPassword(parentPassword);

        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role, status, email_verified, two_factor_enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [parentEmail, passwordHash, parentFirstName, parentLastName, parentPhoneNumber, 'parent', 'pending', false, false]
        );

        const userId = userResult.rows[0].id;

        // Create parent record
        const parentRecord = await client.query(
          `INSERT INTO parents (user_id, national_id, occupation, relationship, date_of_birth)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [userId, parentNationalId, parentOccupation, parentRelationship, null]
        );

        parentId = parentRecord.rows[0].id;

        // Send welcome email to parent (placeholder)
        console.log(`📧 Welcome email sent to parent ${parentEmail} with temporary password: ${parentPassword}`);
      } else {
        parentId = parentResult.rows[0].id;
      }

      // Create learner
      const learnerResult = await client.query(
        `INSERT INTO learners (school_id, admission_number, first_name, last_name, middle_name, date_of_birth, gender, grade_level, stream_name, special_needs, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
         RETURNING id`,
        [schoolId, admissionNumber, firstName, lastName, middleName, dateOfBirth, gender, gradeLevel, streamName, specialNeeds]
      );

      const learnerId = learnerResult.rows[0].id;

      // Link parent to learner
      await client.query(
        `INSERT INTO learner_parents (learner_id, parent_id, is_primary, relationship)
         VALUES ($1, $2, true, $3)`,
        [learnerId, parentId, parentRelationship]
      );

      return { learnerId, parentId };
    });

    res.status(201).json({
      success: true,
      message: 'Learner registered successfully and linked to parent.',
      data: result
    });

  } catch (error) {
    console.error('❌ Learner registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during learner registration.'
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    // Get user from database with optimized query
    const userResult = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.status, u.school_id, u.login_attempts, u.locked_until, u.email_verified
       FROM users u
       WHERE u.email = $1 AND u.status != 'deleted'
       LIMIT 1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if user exists or not
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const user = userResult.rows[0];

    // Check if account is locked (optimized check)
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if account is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      // Increment login attempts
      await incrementLoginAttempts(user.id).catch(err => console.error('Failed to increment login attempts:', err));
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Check if email is verified (optional based on requirements)
    if (!user.email_verified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.'
      });
    }

    // Reset login attempts on successful login
    await resetLoginAttempts(user.id).catch(err => console.error('Failed to reset login attempts:', err));

    // Generate tokens
    const tokens = await generateTokens(user);

    // Update session with IP and user agent (optimized) - ignore errors for this optional update
    await query(
      `UPDATE user_sessions 
       SET ip_address = $1, user_agent = $2 
       WHERE session_token = $3`,
      [clientIp, userAgent, tokens.refreshToken]
    ).catch(err => console.error('Failed to update session:', err));

    // Send successful response
    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          schoolId: user.school_id
        },
        tokens: tokens
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    // Ensure we always send a valid JSON response
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    
    if (token) {
      // Remove session from database
      await query('DELETE FROM user_sessions WHERE session_token = $1', [token]);
    }

    res.json({
      success: true,
      message: 'Logout successful.'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout.'
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    // Check if refresh token exists and is valid
    const sessionResult = await query(
      `SELECT us.user_id, us.expires_at, u.email, u.role, u.status, u.school_id
       FROM user_sessions us
       JOIN users u ON us.user_id = u.id
       WHERE us.session_token = $1 AND us.expires_at > NOW() AND u.status != 'deleted'`,
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    const user = sessionResult.rows[0];

    // Generate new tokens
    const tokens = await generateTokens(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: { tokens }
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh.'
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await query(
      `UPDATE users u
       SET email_verified = true, status = 'active'
       WHERE u.id IN (
         SELECT user_id FROM email_verification_tokens 
         WHERE token_hash = $1 AND expires_at > NOW() AND verified_at IS NULL
       )
       RETURNING u.id, u.email, u.role`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.'
      });
    }

    // Mark token as used
    await query(
      'UPDATE email_verification_tokens SET verified_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    );

    res.json({
      success: true,
      message: 'Email verified successfully. Your account is now active.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification.'
    });
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    const userResult = await query('SELECT id, email FROM users WHERE email = $1 AND status != \'deleted\'', [email]);

    if (userResult.rows.length === 0) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If this email exists in our system, a password reset link has been sent.'
      });
    }

    const user = userResult.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store reset token
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = $3, used_at = NULL`,
      [user.id, crypto.createHash('sha256').update(resetToken).digest('hex'), 
       new Date(Date.now() + 60 * 60 * 1000)] // 1 hour
    );

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'If this email exists in our system, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('❌ Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset request.'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed.',
        errors: passwordErrors
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const userResult = await query(
      `SELECT u.id FROM users u
       JOIN password_reset_tokens prt ON u.id = prt.user_id
       WHERE prt.token_hash = $1 AND prt.expires_at > NOW() AND prt.used_at IS NULL`,
      [tokenHash]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    const userId = userResult.rows[0].id;
    const passwordHash = await hashPassword(password);

    await query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, userId]
    );

    // Mark token as used
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1', [tokenHash]);

    res.json({
      success: true,
      message: 'Password reset successfully.'
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset.'
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed.',
        errors: passwordErrors
      });
    }

    // Get current password hash
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const isValidPassword = await verifyPassword(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password change.'
    });
  }
};