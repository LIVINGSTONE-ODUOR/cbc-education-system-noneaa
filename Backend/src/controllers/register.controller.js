const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const { 
  hashPassword, 
  isValidEmail,
  validatePassword,
  isEmailTaken,
  isTscNumberTaken,
  isAdmissionNumberTaken
} = require('../config/auth');

// Helper function to send verification email (placeholder for email service)
const sendVerificationEmail = async (email, token) => {
  console.log(`📧 Verification email sent to ${email} with token: ${token}`);
  return true;
};

// Allowed school levels (must match database constraint)
const ALLOWED_SCHOOL_LEVELS = ['ecde', 'primary', 'junior_secondary', 'senior_secondary'];

// Map frontend/form values to allowed database values
const normalizeSchoolLevel = (level) => {
  if (!level) return null;
  
  // Convert to lowercase for comparison
  const normalized = level.toLowerCase().trim();
  
  // Map common variations to allowed values
  const levelMap = {
    'ecde': 'ecde',
    'pre-primary': 'ecde',
    'preprimary': 'ecde',
    'nursery': 'ecde',
    'primary': 'primary',
    'grade 1': 'primary',
    'grade 2': 'primary',
    'grade 3': 'primary',
    'grade 4': 'primary',
    'grade 5': 'primary',
    'grade 6': 'primary',
    'grade 7': 'primary',
    'grade 8': 'primary',
    'junior secondary': 'junior_secondary',
    'junior_secondary': 'junior_secondary',
    'jss': 'junior_secondary',
    'grade 9': 'junior_secondary',
    'secondary': 'senior_secondary',
    'senior secondary': 'senior_secondary',
    'senior_secondary': 'senior_secondary',
    'senior_secondary': 'senior_secondary',
    'high school': 'senior_secondary',
    'grade 10': 'senior_secondary',
    'grade 11': 'senior_secondary',
    'grade 12': 'senior_secondary',
    'both': 'primary', // For combined schools, default to primary
    'primary and secondary': 'primary',
    'pre-primary & primary': 'primary',
  };
  
  return levelMap[normalized] || normalized;
};

// Validate school level
const validateSchoolLevel = (level) => {
  const normalized = normalizeSchoolLevel(level);
  if (!normalized) {
    return { valid: false, error: 'School level is required' };
  }
  if (!ALLOWED_SCHOOL_LEVELS.includes(normalized)) {
    return { 
      valid: false, 
      error: `Invalid school level. Allowed values: ${ALLOWED_SCHOOL_LEVELS.join(', ')}` 
    };
  }
  return { valid: true, normalized };
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
        message: 'Invalid email format for school email format.'
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

    // Validate school level
    const levelValidation = validateSchoolLevel(schoolLevel);
    if (!levelValidation.valid) {
      return res.status(400).json({
        success: false,
        message: levelValidation.error
      });
    }

    // Hash passwords
    const passwordHash = await hashPassword(administratorPassword);
    const userPasswordHash = await hashPassword(password);

    const result = await transaction(async (client) => {
      // Create school with normalized level
      const schoolResult = await client.query(
        `INSERT INTO schools (name, code, level, county, sub_county, ward, 
                              physical_address, postal_address, phone_number, email, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
         RETURNING id`,
        [schoolName, schoolCode, levelValidation.normalized, county, subCounty, ward,
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
