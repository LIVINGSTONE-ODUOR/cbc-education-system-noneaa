const crypto = require('crypto');
const { query } = require('../config/database');
const { 
  hashPassword, 
  verifyPassword, 
  isValidEmail,
  validatePassword
} = require('../config/auth');
const logger = require('../utils/logger');

// Helper function to send password reset email (placeholder for email service)
const sendPasswordResetEmail = async (email) => {
  logger.info(`Password reset email sent to ${email}`);
  return true;
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
    logger.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process request. Please try again.'
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
    logger.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process request. Please try again.'
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
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process request. Please try again.'
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
    logger.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process request. Please try again.'
    });
  }
};
