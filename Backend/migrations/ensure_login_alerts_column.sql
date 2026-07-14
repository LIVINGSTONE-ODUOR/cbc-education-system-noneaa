-- Ensures the login-security columns already used by
-- /api/users/me/security-settings and the login-alert edge function exist.
-- Safe to run multiple times.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS login_alerts_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trusted_devices_only BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER NOT NULL DEFAULT 43200; -- 30 days

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trusted_devices JSONB NOT NULL DEFAULT '[]'::jsonb;
