const { query } = require('../config/database');
const { 
  verifyPassword, 
  generateTokens, 
  incrementLoginAttempts, 
  resetLoginAttempts,
  isValidEmail
} = require('../config/auth');

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

    // Email verification check disabled for development
    // To enable, set REQUIRE_EMAIL_VERIFICATION=true in environment variables
    // if (!user.email_verified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Please verify your email address before logging in.'
    //   });
    // }

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
    console.error('Error stack:', error.stack);
    
    // Determine more specific error message
    let errorMessage = 'An error occurred during login. Please try again.';
    
    if (error.code === '42P01') {
      // Table doesn't exist
      errorMessage = 'Database configuration error. Please contact support.';
      console.error('❌ Table does not exist:', error.message);
    } else if (error.code === '42703') {
      // Column doesn't exist
      errorMessage = 'Database schema error. Please contact support.';
      console.error('❌ Column does not exist:', error.message);
    } else if (error.message && error.message.includes('connection')) {
      errorMessage = 'Database connection error. Please try again later.';
    }
    
    // Ensure we always send a valid JSON response
    return res.status(500).json({
      success: false,
      message: errorMessage
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
