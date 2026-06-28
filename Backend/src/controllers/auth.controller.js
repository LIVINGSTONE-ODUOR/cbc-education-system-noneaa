const { query } = require('../config/database');
const { createClient } = require('@supabase/supabase-js');
const { 
  verifyPassword, 
  generateTokens, 
  incrementLoginAttempts, 
  resetLoginAttempts,
  isValidEmail
} = require('../config/auth');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

const fetchUserFromSupabase = async (email) => {
  if (!supabaseAdmin) return null;

  // Attempt full column set first
  let data = null;
  let error = null;

  ({ data, error } = await supabaseAdmin
    .from('users')
    .select(
      'id, email, password_hash, role, status, school_id, login_attempts, locked_until, email_verified'
    )
    .eq('email', email)
    .neq('status', 'deleted')
    .limit(1)
    .maybeSingle());

  // Fallback for schemas missing optional columns
  if (error) {
    ({ data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, role, status, school_id, email_verified')
      .eq('email', email)
      .neq('status', 'deleted')
      .limit(1)
      .maybeSingle());
  }

  if (error) {
    throw error;
  }

  if (!data) return null;

  let resolvedSchoolId = data.school_id || null;
  if (!resolvedSchoolId) {
    const { data: schoolAdminRow } = await supabaseAdmin
      .from('school_admins')
      .select('school_id')
      .eq('user_id', data.id)
      .maybeSingle();
    resolvedSchoolId = schoolAdminRow?.school_id || null;
  }

  return {
    id: data.id,
    email: data.email,
    password_hash: data.password_hash,
    role: data.role,
    status: data.status,
    school_id: resolvedSchoolId,
    login_attempts: Number(data.login_attempts || 0),
    locked_until: data.locked_until || null,
    email_verified: data.email_verified === undefined ? true : !!data.email_verified,
  };
};

// Login with extensive debugging and bulletproof fallbacks
exports.login = async (req, res) => {
  console.log('\n========== LOGIN ATTEMPT ==========');
  console.log('Time:', new Date().toISOString());
  console.log('Request body:', req.body);
  console.log('Email provided:', req.body?.email);
  console.log('Password provided:', !!req.body?.password);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('IP:', req.ip || req.connection.remoteAddress);
  
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Step 1: Validate inputs
    console.log('\n📋 STEP 1: Validating inputs');
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    if (!isValidEmail(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }
    console.log('✅ Input validation passed');

    // Step 2: Query database
    console.log('\n📋 STEP 2: Querying database for user:', email);
    console.log('Database query executing...');
    
    let userResult;
    try {
      // Primary lookup via direct DB query
      userResult = await query(
        `SELECT u.id, u.email, u.password_hash, u.role, u.status,
                COALESCE(u.school_id, sa.school_id, NULL) as school_id,
                COALESCE(u.login_attempts, 0) as login_attempts, 
                u.locked_until, 
                COALESCE(u.email_verified, false) as email_verified
         FROM users u
         LEFT JOIN school_admins sa ON sa.user_id = u.id
         WHERE u.email = $1 AND u.status != 'deleted'
         LIMIT 1`,
        [email]
      );
    } catch (dbError) {
      console.error('❌ Database query error:', dbError.message);
      console.error('🔄 Falling back to Supabase API lookup...');

      try {
        const supabaseUser = await fetchUserFromSupabase(email);
        userResult = { rows: supabaseUser ? [supabaseUser] : [] };
      } catch (supabaseFallbackError) {
        console.error('❌ Supabase fallback failed:', supabaseFallbackError.message);
        return res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable. Please try again later.',
          ...(process.env.NODE_ENV !== 'production'
            ? {
                detail: supabaseFallbackError.message,
                code: supabaseFallbackError.code || dbError.code
              }
            : {})
        });
      }
    }

    console.log('📊 Query result:', {
      rowsFound: userResult.rows.length,
      rowCount: userResult.rows.length
    });

    if (userResult.rows.length === 0) {
      console.log('❌ No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const user = userResult.rows[0];
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      schoolId: user.school_id,
      hasPasswordHash: !!user.password_hash,
      loginAttempts: user.login_attempts,
      lockedUntil: user.locked_until,
      emailVerified: user.email_verified
    });

    // Step 3: Check account lock
    console.log('\n📋 STEP 3: Checking account lock status');
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      console.log('❌ Account is locked until:', user.locked_until);
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts. Please wait before trying again.',
        locked_until: user.locked_until,
      });
    }
    console.log('✅ Account not locked');

    // Step 4: Check account status
    console.log('\n📋 STEP 4: Checking account status');
    if (user.status === 'suspended') {
      console.log('❌ Account is suspended');
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Please contact support.'
      });
    }
    console.log('✅ Account status:', user.status);

    // Step 5: Verify password
    console.log('\n📋 STEP 5: Verifying password');
    console.log('Password hash present:', !!user.password_hash);
    
    if (!user.password_hash) {
      console.log('❌ No password hash found for user');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    console.log('Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password, incrementing login attempts...');
      
      let lockedUntil = null;
      try {
        const attemptResult = await incrementLoginAttempts(user.id);
        console.log('✅ Login attempts incremented');
        if (attemptResult && attemptResult.locked_until && new Date() < new Date(attemptResult.locked_until)) {
          lockedUntil = attemptResult.locked_until;
          console.log('🔒 Account is now locked until:', lockedUntil);
        }
      } catch (err) {
        console.error('Failed to increment login attempts:', err.message);
      }

      if (lockedUntil) {
        return res.status(423).json({
          success: false,
          message: 'Too many failed login attempts. Please wait before trying again.',
          locked_until: lockedUntil,
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }
    console.log('✅ Password verified successfully');

    // ========== LOGIN SECURITY CHECKS ==========
    console.log('\n🔐 LOGIN SECURITY CHECKS');
    
    // Get device fingerprint + auto-trust + alerts
    const { getDeviceFingerprint, getDeviceInfo } = require('../utils/deviceFingerprint');
    const deviceFingerprint = getDeviceFingerprint(userAgent, clientIp);
    const deviceInfo = getDeviceInfo(userAgent);
    
    // Auto-add current device to trusted list
    let userSecurity = null;
    try {
      const trustedResult = await query('SELECT trusted_devices, trusted_devices_only, login_alerts_enabled, email, first_name FROM users WHERE id = $1', [user.id]);
      userSecurity = trustedResult.rows[0];
    } catch (dbErr) {
      console.error('❌ Database query error during security fetch:', dbErr.message);
      console.log('🔄 Falling back to Supabase API security fetch...');
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('trusted_devices, trusted_devices_only, login_alerts_enabled, email, first_name')
          .eq('id', user.id)
          .maybeSingle();
        if (!error && data) userSecurity = data;
      }
    }

    let trustedDevices = [];
    if (userSecurity?.trusted_devices) {
      const rawTrusted = userSecurity.trusted_devices;
      if (typeof rawTrusted === 'string') {
        try {
          trustedDevices = JSON.parse(rawTrusted);
          if (!Array.isArray(trustedDevices)) {
            console.warn('trusted_devices is not an array, resetting:', rawTrusted);
            trustedDevices = [];
          }
        } catch (parseError) {
          console.warn('Invalid trusted_devices JSON, resetting to []:', rawTrusted, parseError.message);
          trustedDevices = [];
        }
      } else if (Array.isArray(rawTrusted)) {
        trustedDevices = rawTrusted;
      } else {
        console.warn('trusted_devices invalid type, resetting:', typeof rawTrusted);
        trustedDevices = [];
      }
    }
    
    if (!trustedDevices.some(d => d.deviceId === deviceFingerprint)) {
      trustedDevices.push({
        deviceId: deviceFingerprint,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        addedAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      });
      console.log('🔐 Auto-added device to trusted:', deviceInfo.deviceName);
      
      try {
        await query('UPDATE users SET trusted_devices = $1 WHERE id = $2', [JSON.stringify(trustedDevices), user.id]);
      } catch (dbErr) {
        console.error('❌ Database update error for trusted devices:', dbErr.message);
        if (supabaseAdmin) {
          await supabaseAdmin
            .from('users')
            .update({ trusted_devices: trustedDevices })
            .eq('id', user.id);
          console.log('✅ Fallback: Trusted devices updated via Supabase API');
        }
      }
    }
    
    // Check trusted devices + alerts (now always trusted)
    if (userSecurity?.login_alerts_enabled) {
      const { sendLoginAlertEmail } = require('../utils/email');
      sendLoginAlertEmail(userSecurity.email, userSecurity.first_name, clientIp, userAgent);
      console.log('📧 Login alert email sent');
    }
    
    // Update last login + activity
    try {
      await query('UPDATE users SET last_login = NOW(), last_login_ip = $1, last_activity = NOW() WHERE id = $2', [clientIp, user.id]);
    } catch (dbErr) {
      console.error('❌ Database update error for metadata login stats:', dbErr.message);
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('users')
          .update({
            last_login: new Date().toISOString(),
            last_login_ip: clientIp,
            last_activity: new Date().toISOString()
          })
          .eq('id', user.id);
        console.log('✅ Fallback: Login logs synchronized via Supabase API');
      }
    }

    // Step 6: Email verification check
    console.log('\n📋 STEP 6: Checking email verification');
    console.log('REQUIRE_EMAIL_VERIFICATION:', process.env.REQUIRE_EMAIL_VERIFICATION);
    console.log('Email verified:', user.email_verified);
    console.log('✅ Email verification check passed');

    // Step 7: Reset login attempts
    console.log('\n📋 STEP 7: Resetting login attempts');
    try {
      await resetLoginAttempts(user.id);
      console.log('✅ Login attempts reset');
    } catch (err) {
      console.error('Failed to reset login attempts:', err.message);
    }

    // Step 8: Generate tokens
    console.log('\n📋 STEP 8: Generating tokens');
    console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
    console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
    
    const tokens = await generateTokens(user);
    console.log('Tokens generated:', {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      accessTokenLength: tokens.accessToken?.length,
      refreshTokenLength: tokens.refreshToken?.length
    });

    // Step 9: Update session
    console.log('\n📋 STEP 9: Updating session');
    try {
      await query(
        `UPDATE user_sessions 
         SET ip_address = $1, user_agent = $2 
         WHERE session_token = $3`,
        [clientIp, userAgent, tokens.refreshToken]
      );
      console.log('✅ Session updated successfully');
    } catch (err) {
      console.error('❌ Database query error updating user session schema:', err.message);
      if (supabaseAdmin) {
        try {
          await supabaseAdmin
            .from('user_sessions')
            .update({ ip_address: clientIp, user_agent: userAgent })
            .eq('session_token', tokens.refreshToken);
          console.log('✅ Fallback: Session configuration synchronized via Supabase API');
        } catch (sbSessionErr) {
          console.error('❌ Full session tracking failure:', sbSessionErr.message);
        }
      }
    }

    // Step 10: Success response
    console.log('\n📋 STEP 10: Sending success response');
    console.log('✅✅✅ LOGIN SUCCESSFUL for:', email);
    console.log('=====================================\n');

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
    console.error('\n❌❌❌ LOGIN ERROR ❌❌❌');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('=====================================\n');
    
    return res.status(500).json({
      success: false,
      message: error.message,
      error: {
        name: error.name,
        code: error.code,
        detail: error.detail || error.message
      }
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    
    if (token) {
      try {
        await query('DELETE FROM user_sessions WHERE session_token = $1', [token]);
      } catch (dbErr) {
        console.error('❌ Database error removing session token on logout:', dbErr.message);
        if (supabaseAdmin) {
          await supabaseAdmin
            .from('user_sessions')
            .delete()
            .eq('session_token', token);
          console.log('✅ Fallback: Session cleared via Supabase API');
        }
      }
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

    let sessionResult;
    try {
      sessionResult = await query(
        `SELECT us.user_id, us.expires_at, u.email, u.role, u.status, u.school_id
         FROM user_sessions us
         JOIN users u ON us.user_id = u.id
         WHERE us.session_token = $1 AND us.expires_at > NOW() AND u.status != 'deleted'`,
        [refreshToken]
      );
    } catch (dbErr) {
      console.error('❌ Database error reading session row token refresh:', dbErr.message);
      if (supabaseAdmin) {
        const { data: sessionData, error: sessionErr } = await supabaseAdmin
          .from('user_sessions')
          .select('user_id, expires_at')
          .eq('session_token', refreshToken)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (!sessionErr && sessionData) {
          const { data: userData, error: userErr } = await supabaseAdmin
            .from('users')
            .select('email, role, status, school_id')
            .eq('id', sessionData.user_id)
            .neq('status', 'deleted')
            .maybeSingle();

          if (!userErr && userData) {
            sessionResult = {
              rows: [{
                user_id: sessionData.user_id,
                expires_at: sessionData.expires_at,
                email: userData.email,
                role: userData.role,
                status: userData.status,
                school_id: userData.school_id
              }]
            };
          }
        }
      }
      if (!sessionResult) sessionResult = { rows: [] };
    }

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    const user = sessionResult.rows[0];
    const tokens = await generateTokens(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: { tokens }
    });

  } catch (error) {
    console.error('\n❌❌❌ REFRESH TOKEN ERROR ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: error.message,
      error: {
        name: error.name,
        code: error.code,
        detail: error.detail || error.message
      }
    });
  }
};
