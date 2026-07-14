-- Migration: add columns needed for real TOTP-based 2FA
-- Run this SQL in your Supabase SQL Editor (or psql) before using the 2FA endpoints.

-- Secret used once 2FA is fully enabled (base32, used to validate login codes)
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

-- Secret generated during setup, before the user confirms with a valid code.
-- Kept separate so an abandoned setup attempt never enables 2FA with an
-- unconfirmed secret.
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_temp_secret TEXT;

-- One-time recovery codes (hashed), shown to the user once when 2FA is enabled.
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_codes JSONB DEFAULT '[]'::jsonb;

-- two_factor_enabled already exists (added in add_security_columns.sql), kept here
-- as a safety net in case that migration was skipped.
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
