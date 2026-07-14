const { query } = require('../config/database');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { authenticator } = require('otplib');
const {
  verifyPassword,
  generateTokens,
  incrementLoginAttempts,
  resetLoginAttempts,
  isValidEmail,
  JWT_SECRET
} = require('../config/auth');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// Fires the login-alert Supabase Edge Function. Deliberately fire-and-forget:
// a slow/failed email provider must never delay or fail a login.
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
  }).catch((err) => console.error('Login alert dispatch failed:', err.message));
};

// Shared final step for a successful login (password-only, or password + 2FA code).
// Issues tokens, records the session, and sends the standard login response shape.
const completeLogin = async (user, clientIp, userAgent, res) => {
  const tokens = await generateTokens(user);

  await query(`
    INSERT INTO user_sessions (session_token, user_id, ip_address, user_agent, expires_at)
    VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')
    ON CONFLICT (session_token) 
    DO UPDATE SET ip_address = $3, user_agent = $4, expires_at = NOW() + INTERVAL '30 days'`,
    [tokens.refreshToken, user.id, clientIp, userAgent]
  );

  await query('UPDATE users SET last_login = NOW(), last_login_ip = $1, last_activity = NOW() WHERE id = $2',
    [clientIp, user.id]);

  dispatchLoginAlert(user, clientIp, userAgent);

  console.log('✅ LOGIN SUCCESSFUL for:', user.email);

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
        schoolName: user.school_name
      },
      tokens
    }
  });
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  console.log('\n========== LOGIN ATTEMPT ==========');
  console.log('Time:', new Date().toISOString());
  console.log('Email:', req.body?.email);

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

    // Fetch user (with fallback)
    let userResult;
    let dbUnavailable = false;
    try {
      userResult = await query(`
        SELECT u.id, u.email, u.password_hash, u.role, u.status,
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
        LIMIT 1`, [email]);
    } catch (dbError) {
      console.error('Direct DB query failed, trying Supabase...', dbError.message);
      try {
        const supabaseUser = await fetchUserFromSupabase(email);
        userResult = { rows: supabaseUser ? [supabaseUser] : [] };
      } catch (supabaseError) {
        console.error('Supabase fallback also failed:', supabaseError.message);
        dbUnavailable = true;
        userResult = { rows: [] };
      }
    }

    if (dbUnavailable) {
      return res.status(503).json({
        success: false,
        message: 'Database unavailable. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    if (userResult.rows.length === 0) {
      console.log('❌ USER NOT FOUND:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];
    console.log('========== USER FOUND ==========');
    console.log({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      school_id: user.school_id,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash
        ? user.password_hash.length
        : 0
    });

    // Account checks
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked.',
        locked_until: user.locked_until
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended.' });
    }

    // Verify password
    const passwordValid =
      user.password_hash &&
      await verifyPassword(password, user.password_hash);
    console.log('========== PASSWORD CHECK ==========');
    console.log({
      email,
      hasPasswordHash: !!user.password_hash,
      passwordValid
    });
    if (!passwordValid) {
      console.log('❌ PASSWORD VERIFICATION FAILED');
      await incrementLoginAttempts(user.id);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }
    console.log('✅ PASSWORD VERIFIED');

    await resetLoginAttempts(user.id);

    // ---- Two-Factor Authentication challenge ----
    // Password is correct, but if the user has 2FA enabled we must not issue
    // real session tokens yet. Instead issue a short-lived, single-purpose
    // token that only proves "this person just entered the right password",
    // and require a valid TOTP/backup code before completing login.
    if (user.two_factor_enabled) {
      const pendingToken = jwt.sign(
        { userId: user.id, purpose: '2fa_pending' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      console.log('🔐 2FA required for:', email);

      return res.json({
        success: true,
        requiresTwoFactor: true,
        message: 'Enter your two-factor authentication code to finish signing in.',
        data: { tempToken: pendingToken }
      });
    }

    // Generate tokens + create session
    return await completeLogin(user, clientIp, userAgent, res);

  } catch (error) {
    // Surface the real underlying error for easier debugging.
    // (Frontend still receives a safe generic message.)
    console.error('Login error:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      stack: error?.stack,
    });

    const isDbError = error?.code === 'ECONNREFUSED' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ENOTFOUND' ||
      error?.message?.includes('database') ||
      error?.message?.includes('connection') ||
      error?.message?.includes('timeout');

    if (isDbError) {
      return res.status(503).json({
        success: false,
        message: 'Database unavailable. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// ==================== VERIFY 2FA CODE (LOGIN STEP 2) ====================
exports.verifyTwoFactorLogin = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'tempToken and code are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'This code has expired. Please log in again.' });
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

    // 1) Try it as a 6-digit TOTP code from the authenticator app
    let verified = user.two_factor_secret
      ? authenticator.check(normalizedCode, user.two_factor_secret)
      : false;

    // 2) Fall back to one-time backup codes
    if (!verified) {
      const backupCodes = Array.isArray(user.two_factor_backup_codes) ? user.two_factor_backup_codes : [];
      for (let i = 0; i < backupCodes.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        if (await bcrypt.compare(normalizedCode, backupCodes[i])) {
          verified = true;
          backupCodes.splice(i, 1); // backup codes are single-use
          // eslint-disable-next-line no-await-in-loop
          await query('UPDATE users SET two_factor_backup_codes = $1 WHERE id = $2', [JSON.stringify(backupCodes), user.id]);
          break;
        }
      }
    }

    if (!verified) {
      await incrementLoginAttempts(user.id);
      return res.status(401).json({ success: false, message: 'Invalid or expired code.' });
    }

    await resetLoginAttempts(user.id);

    return await completeLogin(user, clientIp, userAgent, res);
  } catch (error) {
    console.error('2FA verification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ==================== REFRESH TOKEN ====================
exports.refreshToken = async (req, res) => {
  try {
    // Support both common patterns
    let refreshToken = req.body.refreshToken || 
                      req.headers.authorization?.replace('Bearer ', '');

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    console.log('[refreshToken] incoming refreshToken:', {
      hasRefreshToken: !!refreshToken,
      length: typeof refreshToken === 'string' ? refreshToken.length : null,
      first10: typeof refreshToken === 'string' ? refreshToken.slice(0, 10) : null
    });

    // Find valid session
    // NOTE: COALESCE school_id from school_admins here too — school_admin
    // accounts often only have their school_id set on school_admins.school_id,
    // not on users.school_id. login()/authenticate() already do this
    // COALESCE; this endpoint didn't, so a refreshed token could silently
    // lose schoolId. Also alias us.user_id AS id, since generateTokens()
    // below reads `user.id` — with the old SELECT that field was
    // `user_id`, so `user.id` was undefined and every refreshed JWT was
    // signed with `userId: undefined`.
    let sessionResult;
    try {
      sessionResult = await query(`
        SELECT us.user_id AS id, us.expires_at, u.email, u.role, u.status,
               COALESCE(u.school_id, sa.school_id) AS school_id,
               u.first_name, u.last_name, s.name AS school_name
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        LEFT JOIN school_admins sa ON sa.user_id = u.id
        LEFT JOIN schools s ON s.id = COALESCE(u.school_id, sa.school_id)
        WHERE us.session_token = $1 
          AND us.expires_at > NOW() 
          AND u.status != 'deleted'`,
        [refreshToken]);
    } catch (dbErr) {
      // Let the main query wrapper handle REST fallback.
      console.error('DB error during refresh (will retry via query wrapper):', dbErr.message);
      throw dbErr;
    }

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    const user = sessionResult.rows[0];

    // Token Rotation: Invalidate old token and generate new ones
    await query('DELETE FROM user_sessions WHERE session_token = $1', [refreshToken]);

    const tokens = await generateTokens(user);

    // Create new session record
    await query(`
      INSERT INTO user_sessions (session_token, user_id, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [tokens.refreshToken, user.id]
    );

    // Return the live user/role alongside the new tokens so the frontend
    // can re-sync its cached session (see AuthContext.tsx / lib/auth.ts).
    // Previously only { tokens } came back, so if a user's role changed
    // after their original login (e.g. an admin's account got demoted,
    // or they were re-invited under a different role), the UI kept
    // showing the stale cached role from localStorage indefinitely —
    // even though every API call correctly used the *current* DB role
    // and got 403'd for actions the stale UI still displayed.
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
          schoolName: user.school_name
        }
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ==================== LOGOUT ====================
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

// Keep your existing fetchUserFromSupabase function
const fetchUserFromSupabase = async (email) => {
  if (!supabaseAdmin) return null;

  let { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, password_hash, role, status, first_name, last_name, school_id, login_attempts, locked_until, email_verified, login_alerts_enabled')
    .eq('email', email)
    .neq('status', 'deleted')
    .limit(1)
    .maybeSingle();

  if (error) {
    ({ data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, role, status, first_name, last_name, school_id, email_verified')
      .eq('email', email)
      .neq('status', 'deleted')
      .limit(1)
      .maybeSingle());
  }

  if (error || !data) return null;

  if (data.school_id) {
    const { data: school } = await supabaseAdmin
      .from('schools')
      .select('name')
      .eq('id', data.school_id)
      .maybeSingle();
    data.school_name = school?.name ?? null;
  }

  // ... rest of your original fetchUserFromSupabase logic
  return data; // simplified
};
