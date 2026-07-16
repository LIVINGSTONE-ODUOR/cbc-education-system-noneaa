const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const {
  hashPassword,
  verifyPassword,
  isValidEmail,
  JWT_SECRET,
  JWT_EXPIRES_IN,
} = require('../config/auth');

const respond = (res, statusCode, success, message, data = null) => {
  const payload = { success, message };
  if (data) payload.data = data;
  return res.status(statusCode).json(payload);
};

// Owner tokens carry `type: 'website_owner'` so the auth middleware can
// tell them apart from school-platform `users` tokens, which carry no
// `type` field. This is what lets the two credential stores share the
// support-inbox routes without either one gaining the other's access.
const signOwnerToken = (owner) =>
  jwt.sign(
    { ownerId: owner.id, email: owner.email, type: 'website_owner' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

// ==================== LOGIN ====================
// POST /api/v1/website-owner/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return respond(res, 400, false, 'Email and password are required.');
    }
    if (!isValidEmail(email)) {
      return respond(res, 400, false, 'Invalid email format.');
    }

    const result = await query(
      `SELECT id, name, email, password_hash, status
       FROM website_owners
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return respond(res, 401, false, 'Invalid credentials.');
    }

    const owner = result.rows[0];

    if (owner.status === 'suspended') {
      return respond(res, 403, false, 'This account has been suspended.');
    }

    const passwordMatches = await verifyPassword(password, owner.password_hash);
    if (!passwordMatches) {
      return respond(res, 401, false, 'Invalid credentials.');
    }

    await query(
      `UPDATE website_owners SET last_login_at = NOW() WHERE id = $1`,
      [owner.id]
    );

    const token = signOwnerToken(owner);

    return respond(res, 200, true, 'Login successful', {
      token,
      owner: { id: owner.id, name: owner.name, email: owner.email },
    });
  } catch (error) {
    logger.error('websiteOwner.login error:', error);
    return respond(res, 500, false, 'Login failed. Please try again.');
  }
};

// ==================== CURRENT OWNER ====================
// GET /api/v1/website-owner/me  (requires authenticateOwner middleware)
exports.me = async (req, res) => {
  return respond(res, 200, true, 'Owner fetched', { owner: req.owner });
};

// ==================== CHANGE PASSWORD ====================
// POST /api/v1/website-owner/change-password  (requires authenticateOwner middleware)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return respond(res, 400, false, 'Current and new password are required.');
    }

    const result = await query(
      `SELECT id, password_hash FROM website_owners WHERE id = $1 LIMIT 1`,
      [req.owner.id]
    );
    if (result.rows.length === 0) {
      return respond(res, 404, false, 'Owner account not found.');
    }

    const matches = await verifyPassword(currentPassword, result.rows[0].password_hash);
    if (!matches) {
      return respond(res, 401, false, 'Current password is incorrect.');
    }

    const newHash = await hashPassword(newPassword);
    await query(
      `UPDATE website_owners SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
      [req.owner.id, newHash]
    );

    return respond(res, 200, true, 'Password updated successfully.');
  } catch (error) {
    logger.error('websiteOwner.changePassword error:', error);
    return respond(res, 500, false, 'Could not update password.');
  }
};
