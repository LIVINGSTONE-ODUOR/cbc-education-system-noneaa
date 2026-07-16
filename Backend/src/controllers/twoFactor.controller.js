const crypto = require('crypto');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const { authenticator } = require('otplib');
const db = require('../config/database');
const { verifyPassword } = require('../config/auth');
const logger = require('../utils/logger');

const ISSUER = 'CBC Education System';

// Generate a batch of human-friendly, single-use backup codes (e.g. "4F2A-9K3D")
const generateBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 hex chars
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  return codes;
};

// POST /api/users/me/2fa/setup
// Starts (or restarts) 2FA setup: generates a new secret + QR code.
// Does NOT enable 2FA yet — that only happens after /2fa/verify succeeds.
exports.setupTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await db.query(
      'SELECT email, two_factor_enabled FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userResult.rows[0].two_factor_enabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is already enabled. Disable it first to re-configure.'
      });
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(userResult.rows[0].email, ISSUER, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    await db.query(
      'UPDATE users SET two_factor_temp_secret = $1, updated_at = NOW() WHERE id = $2',
      [secret, userId]
    );

    return res.json({
      success: true,
      data: {
        secret,          // shown as manual-entry fallback if the QR can't be scanned
        qrCode: qrCodeDataUrl,
        otpauthUrl
      }
    });
  } catch (error) {
    logger.error('2FA setup error:', error);
    return res.status(500).json({ success: false, message: 'Failed to start two-factor authentication setup' });
  }
};

// POST /api/users/me/2fa/verify
// Confirms setup: user submits the 6-digit code from their authenticator app.
// On success, 2FA becomes enabled and one-time backup codes are issued.
exports.verifyTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const userResult = await db.query(
      'SELECT two_factor_temp_secret FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    const tempSecret = userResult.rows[0]?.two_factor_temp_secret;
    if (!tempSecret) {
      return res.status(400).json({
        success: false,
        message: 'No pending 2FA setup found. Please start setup again.'
      });
    }

    const isValid = authenticator.check(String(code).replace(/\s+/g, ''), tempSecret);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid code. Please try again.' });
    }

    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, 10))
    );

    await db.query(
      `UPDATE users
       SET two_factor_enabled = TRUE,
           two_factor_secret = $1,
           two_factor_temp_secret = NULL,
           two_factor_backup_codes = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [tempSecret, JSON.stringify(hashedBackupCodes), userId]
    );

    return res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      data: {
        backupCodes // shown to the user exactly once — they cannot be retrieved again
      }
    });
  } catch (error) {
    logger.error('2FA verify error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify two-factor authentication code' });
  }
};

// POST /api/users/me/2fa/disable
// Requires the account password as confirmation before turning 2FA off.
exports.disableTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to disable two-factor authentication' });
    }

    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const passwordValid = await verifyPassword(password, userResult.rows[0].password_hash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    await db.query(
      `UPDATE users
       SET two_factor_enabled = FALSE,
           two_factor_secret = NULL,
           two_factor_temp_secret = NULL,
           two_factor_backup_codes = '[]'::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    return res.json({ success: true, message: 'Two-factor authentication disabled' });
  } catch (error) {
    logger.error('2FA disable error:', error);
    return res.status(500).json({ success: false, message: 'Failed to disable two-factor authentication' });
  }
};
