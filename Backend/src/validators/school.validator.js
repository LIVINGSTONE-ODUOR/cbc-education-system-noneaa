// ================================================================
// validators/school.validator.js
// Validates all incoming school registration payloads before
// they reach the controller. Uses Joi for schema validation.
//
// Install: npm install joi
// ================================================================

const Joi = require('joi');

// ----------------------------------------------------------------
// Reusable field definitions
// ----------------------------------------------------------------

// Relaxed phone validation for Kenyan numbers - accepts various formats
const kenyanPhone = Joi.string()
  .min(7)
  .max(25)
  .message('Phone number must be 7-25 characters');

// Relaxed password validation
const strongPassword = Joi.string()
  .min(6)
  .message('Password must be at least 6 characters');

// ----------------------------------------------------------------
// School Admin Registration Schema
// Maps exactly to your form fields
// ----------------------------------------------------------------

const schoolAdminRegistrationSchema = Joi.object({

  // ── School fields ──────────────────────────────────────────
  school_name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'School name must be at least 3 characters',
      'any.required': 'School name is required',
    }),

  school_code: Joi.string()
    .uppercase()
    .min(2)
    .max(20)
    .required()
    .messages({
      'string.min': 'School code must be at least 2 characters',
      'any.required': 'School code is required',
    }),

  school_type: Joi.string()
    .valid('public', 'private')
    .required()
    .messages({
      'any.only': 'School type must be either public or private',
      'any.required': 'School type is required',
    }),

  subdomain: Joi.string()
    .min(3)
    .max(63)
    .lowercase()
    .pattern(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/)
    .required()
    .messages({
      'any.required': 'Subdomain is required',
      'string.min': 'Subdomain must be at least 3 characters',
      'string.pattern.base': 'Subdomain can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen',
    }),

  // Maps to schools.level CHECK constraint values
  level: Joi.string()
    .valid('ecde', 'primary', 'junior_secondary', 'senior_secondary')
    .required()
    .messages({
      'any.only': 'Level must be one of: ecde, primary, junior_secondary, senior_secondary',
      'any.required': 'School level is required',
    }),

  phone_number: kenyanPhone.required(),

  county: Joi.string().min(2).max(50).required(),
  sub_county: Joi.string().min(2).max(50).required(),
  ward: Joi.string().min(2).max(50).optional().allow('', null),

  // New columns added in frontend_gap_fix.sql
  year_established: Joi.number()
    .integer()
    .min(1800)
    .max(new Date().getFullYear())
    .optional()
    .allow(null),

  student_capacity: Joi.number()
    .integer()
    .min(1)
    .max(100000)
    .optional()
    .allow(null),

  // Optional school details
  physical_address: Joi.string().max(255).optional().allow('', null),
  postal_address: Joi.string().max(100).optional().allow('', null),
  website: Joi.string().optional().allow('', null),

  // ── Admin (user) fields ────────────────────────────────────
  admin_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'any.required': 'Admin name is required',
      'string.min': 'Admin name must be at least 2 characters',
    }),

  admin_email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Admin email is required',
    }),

  // password can be required or optional (API might handle it differently)
  password: strongPassword.required(),

  // confirm_password - make optional for API calls, frontend handles validation
  confirm_password: Joi.string()
    .optional()
    .allow('', null),

  // ── TSC and Admin details ─────────────────────────────────
  tsc_number: Joi.string()
    .optional()
    .allow('', null),

  appointment_date: Joi.date().optional().allow(null),

  // ── New fields from frontend ──────────────────────────────
  // school_email: Alternative field name for school contact email
  school_email: Joi.string()
    .email({ tlds: { allow: false } })
    .optional()
    .allow('', null),

  // Role field (optional - defaults to school_admin)
  // This is just an informational job title picked in the "Admin Details"
  // step of the registration form (AdministratorRole enum on the
  // frontend) — it is never persisted to the DB; every school admin gets
  // users.role = 'school_admin' regardless (see registerSchoolAdmin).
  // The list here must match AdministratorRole's actual values exactly
  // (case included) or a valid pick gets rejected with a 422 before it
  // ever reaches the controller.
  role: Joi.string()
    .valid(
      'school_admin', 'admin', 'principal', 'headteacher', // legacy/API values
      'Headteacher', 'Principal', 'Director', 'Administrator', // AdministratorRole enum
    )
    .optional()
    .allow('', null),

  // National ID and Passport
  national_id: Joi.string()
    .optional()
    .allow('', null),

  passport_number: Joi.string()
    .optional()
    .allow('', null),

  // Username field
  username: Joi.string()
    .min(3)
    .max(50)
    .optional()
    .allow('', null),

}).options({ abortEarly: false });


// ----------------------------------------------------------------
// Teacher / Parent Registration Schema (second tab)
// ----------------------------------------------------------------
const teacherRegistrationSchema = Joi.object({
  school_code: Joi.string().uppercase().required(),

  first_name: Joi.string().min(2).max(50).required(),
  last_name:  Joi.string().min(2).max(50).required(),
  email:      Joi.string().email({ tlds: { allow: false } }).required(),
  phone_number: kenyanPhone.optional().allow('', null),
  password:   strongPassword.required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),

  tsc_number: Joi.string()
    .optional()
    .allow('', null),

  qualifications: Joi.string().max(500).optional().allow('', null),
  date_joined: Joi.date().optional().default(() => new Date()),

}).options({ abortEarly: false });


const parentRegistrationSchema = Joi.object({
  school_code: Joi.string().uppercase().required(),

  first_name:  Joi.string().min(2).max(50).required(),
  last_name:   Joi.string().min(2).max(50).required(),
  email:       Joi.string().email({ tlds: { allow: false } }).required(),
  phone_number: kenyanPhone.optional().allow('', null),
  password:    strongPassword.required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),

  relationship: Joi.string()
    .valid('father', 'mother', 'guardian')
    .required()
    .messages({ 'any.only': 'Relationship must be father, mother, or guardian' }),

  national_id: Joi.string()
    .optional()
    .allow('', null),

  occupation: Joi.string().max(100).optional().allow('', null),
  date_of_birth: Joi.date().optional().allow(null),

}).options({ abortEarly: false });


// ----------------------------------------------------------------
// Middleware factory — wraps any Joi schema into Express middleware
// ----------------------------------------------------------------

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);

  if (error) {
    require('../utils/logger').debug('[Validator] Full error:', JSON.stringify(error.details, null, 2));
    const errors = error.details.map((d) => ({
      field:   d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Replace req.body with the cleaned/coerced Joi output
  req.body = value;
  next();
};


module.exports = {
  validateSchoolAdminRegistration: validate(schoolAdminRegistrationSchema),
  validateTeacherRegistration:     validate(teacherRegistrationSchema),
  validateParentRegistration:      validate(parentRegistrationSchema),

  // Export raw schemas for unit testing
  schoolAdminRegistrationSchema,
  teacherRegistrationSchema,
  parentRegistrationSchema,
};
