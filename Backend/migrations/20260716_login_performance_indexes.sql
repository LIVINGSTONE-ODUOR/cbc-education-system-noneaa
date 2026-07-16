-- =============================================================================
-- Login Performance Indexes
-- =============================================================================
-- These indexes optimize the authentication flow which is the most
-- performance-critical path in the system.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Users table: login lookup by email (the most frequent query)
-- ─────────────────────────────────────────────────────────────────────────────
-- The login query filters: WHERE email = $1 AND status != 'deleted'
-- A composite index on (email, status) covers this perfectly.
-- Supabase creates a default index on the email column; this covers the
-- status filter without an additional lookup.
CREATE INDEX IF NOT EXISTS idx_users_email_status 
  ON users(email, status);

-- Index for checking account lock status during login
CREATE INDEX IF NOT EXISTS idx_users_locked_until 
  ON users(locked_until) 
  WHERE locked_until IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. School admins: join with users table during login
-- ─────────────────────────────────────────────────────────────────────────────
-- The login query LEFT JOINs school_admins to resolve school_id for admins
CREATE INDEX IF NOT EXISTS idx_school_admins_user 
  ON school_admins(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Schools: lookup by ID (frequently joined)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_schools_id_active 
  ON schools(id) WHERE is_active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. User sessions: token refresh and session management
-- ─────────────────────────────────────────────────────────────────────────────
-- Lookup by session_token with expiration check
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_expires 
  ON user_sessions(session_token, expires_at);

-- Cleanup expired sessions query
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires 
  ON user_sessions(expires_at) 
  WHERE expires_at < NOW();

-- Session listing for user
CREATE INDEX IF NOT EXISTS idx_user_sessions_user 
  ON user_sessions(user_id, expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Login attempts / lockout optimization
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_login_attempts 
  ON users(login_attempts) 
  WHERE login_attempts > 0;
