/**
 * Authentication Controller — CBC Education System
 *
 * Handles login, logout, 2FA verification, token refresh, and session management.
 *
 * SECURITY NOTES:
 * - Never log credentials, passwords, or tokens
 * - Always return generic error messages to clients
 * - Non-critical operations (audit logs, analytics, login alerts)
 *   are fire-and-forget and never block authentication success
 * - All internal errors are logged server-side only
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { authenticator } = require('otplib');
const { query } = require('../config/database');
const {
  verifyPassword,
  generateTokens,
  incrementLoginAttempts,
  resetLoginAttempts,
  isValidEmail,
  JWT_SECRET,
} = require('../config/auth');
const logger = require('../utils/logger');
const perf = require('../services/performanceMonitor');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// ────────────────────────────────────────────────────────────
// FIRE-AND-FORGET HELPERS (never block login success)
// ────────────────────────────────────────────────────────────

/** Dispatch a login alert email — fire-and-forget */
const dispatchLoginAlert = (user, clientIp, userAgent) => {
  if (!supabaseUrl || !supabaseServiceRoleKey) return;
  if (user.login_alerts_enabled === false) return;

  fetch(`${supabaseUrl}/functions/v1/login-alert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      ip: clientIp,
      userAgent,
    }),
  }).catch((err) => logger.warn('Login alert dispatch failed:', err.message));
};

/** Update login metadata asynchronously — never blocks login */
const updateLoginMetadataAsync = (userId, clientIp) => {
  query(
    `UPDATE users SET last_login = NOW(), last_login_ip = $1, last_activity = NOW() WHERE id = $2`,
    [clientIp, userId]
  ).catch((err) => logger.warn('Login metadata update failed:', err.message));
};

// ────────────────────────────────────────────────────────────
// COMPLETE LOGIN (shared final step)
// ────────────────────────────────────────────────────────────
const completeLogin = async (user, clientIp, userAgent, res) => {
  // Token generation (tracked)
  const tokens = await perf.trackAsync('login.token_generate', () => generateTokens(user));

  // Session creation (tracked)
  await perf.trackAsync('login.session_create', () =>
    query(
      `INSERT INTO user_sessions (session_token, user_id, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')
       ON CONFLICT (session_token)
       DO UPDATE SET ip_address = $3, user_agent = $4, expires_at = NOW() + INTERVAL '30 days'`,
      [tokens.refreshToken, user.id, clientIp, userAgent]
    )
  );

  // Non-blocking: fire-and-forget metadata update and alert
  updateLoginMetadataAsync(user.id, clientIp);
  dispatchLoginAlert(user, clientIp, userAgent);

  return res.json({
    success: true,
    message: 'Login successful.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        schoolId: user.school_id,
        schoolName: user.school_name,
      },
      tokens,
    },
  });
};

// ────────────────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // Fetch user (with timing) — single query for both regular users and admins
    let userResult;
    try {
      userResult = await perf.trackAsync('login.user_lookup', () =>
        query(
          `SELECT u.id, u.email, u.password_hash, u.role, u.status,
                  u.first_name, u.last_name,
                  COALESCE(u.school_id, sa.school_id) as school_id,
                  s.name as school_name,
                  COALESCE(u.login_attempts, 0) as login_attempts,
                  u.locked_until, COALESCE(u.email_verified, false) as email_verified,
                  COALESCE(u.two_factor_enabled, false) as two_factor_enabled,
                  COALESCE(u.login_alerts_enabled, true) as login_alerts_enabled
           FROM users u
           LEFT JOIN school_admins sa ON sa.user_id = u.id
           LEFT JOIN schools s ON s.id = COALESCE(u.school_id, sa.school_id)
           WHERE u.email = $1 AND u.status != 'deleted'
           LIMIT 1`,
          [email]
        )
      );
    } catch (dbError) {
      logger.warn('Login DB query failed, trying Supabase fallback');
      try {
        const supabaseUser = await fetchUserFromSupabase(email);
        userResult = { rows: supabaseUser ? [supabaseUser] : [] };
      } catch {
        return res.status(503).json({
          success: false,
          message: 'Unable to complete the request. Please try again.',
        });
      }
    }

    if (!userResult || userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    // Account lock check
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked.',
      });
    }

    // Account status check
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended.' });
    }

    // Verify password (with timing)
    const passwordValid = user.password_hash && (await perf.trackAsync('login.password_verify', () =>
      verifyPassword(password, user.password_hash)
    ));

    if (!passwordValid) {
      // Increment attempts async — don't block the response
      incrementLoginAttempts(user.id).catch(() => {});
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Reset login attempts async — don't block success
    resetLoginAttempts(user.id).catch(() => {});

    // ── Two-Factor Authentication challenge ──
    if (user.two_factor_enabled) {
      const pendingToken = jwt.sign(
        { userId: user.id, purpose: '2fa_pending' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      return res.json({
        success: true,
        requiresTwoFactor: true,
        message: 'Enter your two-factor authentication code to finish signing in.',
        data: { tempToken: pendingToken },
      });
    }

    // Complete login — session creation, token generation
    return await completeLogin(user, clientIp, userAgent, res);
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to complete the request. Please try again.',
    });
  }
};

// ────────────────────────────────────────────────────────────
// VERIFY 2FA CODE (LOGIN STEP 2)
// ────────────────────────────────────────────────────────────
exports.verifyTwoFactorLogin = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'Verification code is required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Verification session expired. Please log in again.' });
    }

    if (decoded.purpose !== '2fa_pending') {
      return res.status(401).json({ success: false, message: 'Invalid verification session. Please log in again.' });
    }

    const userResult = await query(
      `SELECT u.id, u.email, u.role, u.status, u.first_name, u.last_name,
              COALESCE(u.school_id, sa.school_id) as school_id,
              s.name as school_name,
              u.two_factor_secret, u.two_factor_backup_codes,
              COALESCE(u.login_alerts_enabled, true) as login_alerts_enabled
       FROM users u
       LEFT JOIN school_admins sa ON sa.user_id = u.id
       LEFT JOIN schools s ON s.id = COALESCE(u.school_id, sa.school_id)
       WHERE u.id = $1 AND u.status != 'deleted'
       LIMIT 1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];
    const normalizedCode = String(code).replace(/\s+/g, '');

    // 1) Try TOTP code
    let verified = user.two_factor_secret
      ? authenticator.check(normalizedCode, user.two_factor_secret)
      : false;

    // 2) Fall back to backup codes
    if (!verified) {
      const backupCodes = Array.isArray(user.two_factor_backup_codes) ? user.two_factor_backup_codes : [];
      for (let i = 0; i < backupCodes.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        if (await bcrypt.compare(normalizedCode, backupCodes[i])) {
          verified = true;
          backupCodes.splice(i, 1);
          // eslint-disable-next-line no-await-in-loop
          await query('UPDATE users SET two_factor_backup_codes = $1 WHERE id = $2', [
            JSON.stringify(backupCodes),
            user.id,
          ]);
          break;
        }
      }
    }

    if (!verified) {
      incrementLoginAttempts(user.id).catch(() => {});
      return res.status(401).json({ success: false, message: 'Invalid or expired code.' });
    }

    resetLoginAttempts(user.id).catch(() => {});
    return await completeLogin(user, clientIp, userAgent, res);
  } catch (error) {
    logger.error('2FA verification error:', error);
    return res.status(500).json({ success: false, message: 'Unable to complete the request. Please try again.' });
  }
};

// ────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    let refreshToken = req.body.refreshToken || req.headers.authorization?.replace('Bearer ', '');

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    let sessionResult;
    try {
      sessionResult = await query(
        `SELECT us.user_id AS id, us.expires_at, u.email, u.role, u.status,
                COALESCE(u.school_id, sa.school_id) AS school_id,
                u.first_name, u.last_name, s.name AS school_name
         FROM user_sessions us
         JOIN users u ON us.user_id = u.id
         LEFT JOIN school_admins sa ON sa.user_id = u.id
         LEFT JOIN schools s ON s.id = COALESCE(u.school_id, sa.school_id)
         WHERE us.session_token = $1
           AND us.expires_at > NOW()
           AND u.status != 'deleted'`,
        [refreshToken]
      );
    } catch (dbErr) {
      logger.error('DB error during token refresh:', dbErr.message);
      throw dbErr;
    }

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = sessionResult.rows[0];

    // Token rotation: invalidate old, generate new
    await query('DELETE FROM user_sessions WHERE session_token = $1', [refreshToken]);

    const tokens = await generateTokens(user);

    await query(
      `INSERT INTO user_sessions (session_token, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [tokens.refreshToken, user.id]
    );

    return res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        tokens,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          schoolId: user.school_id,
          schoolName: user.school_name,
        },
      },
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    return res.status(500).json({ success: false, message: 'Unable to complete the request. Please try again.' });
  }
};

// ────────────────────────────────────────────────────────────
// LOGOUT
// ────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await query('DELETE FROM user_sessions WHERE session_token = $1', [token]).catch(() => {});
    }
    return res.json({ success: true, message: 'Logout successful.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

// ────────────────────────────────────────────────────────────
// DEVICE / SESSION HISTORY
// ────────────────────────────────────────────────────────────
exports.getMySessions = async (req, res) => {
  try {
    const currentToken = req.header('x-session-token') || req.query.currentSessionToken || null;

    const result = await query(
      `SELECT id, session_token, ip_address, user_agent, created_at, expires_at
       FROM user_sessions
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const sessions = result.rows.map((row) => ({
      id: row.id,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: row.created_at,
      expires_at: row.expires_at,
      is_current: Boolean(currentToken) && row.session_token === currentToken,
    }));

    return res.json({ success: true, data: { sessions } });
  } catch (error) {
    logger.error('Get sessions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load session history.' });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM user_sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    return res.json({ success: true, message: 'Session signed out.' });
  } catch (error) {
    logger.error('Revoke session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to sign out session.' });
  }
};

// ────────────────────────────────────────────────────────────
// SUPABASE FALLBACK
// ────────────────────────────────────────────────────────────
const fetchUserFromSupabase = async (email) => {
  if (!supabaseAdmin) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(
        'id, email, password_hash, role, status, first_name, last_name, school_id, login_attempts, locked_until, email_verified, login_alerts_enabled'
      )
      .eq('email', email)
      .neq('status', 'deleted')
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    if (data.school_id) {
      const { data: school } = await supabaseAdmin
        .from('schools')
        .select('name')
        .eq('id', data.school_id)
        .maybeSingle();
      data.school_name = school?.name ?? null;
    }

    return data;
  } catch (error) {
    logger.error('Supabase user fetch failed:', error.message);
    return null;
  }
};
