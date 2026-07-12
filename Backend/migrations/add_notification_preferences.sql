-- =============================================================================
-- add_notification_preferences.sql
-- Parent Portal — "Settings" section (change password, update phone number,
-- update email, notification preferences).
--
-- Change password / update phone / update email all reuse the existing
-- generic PUT /api/users/me/contact-info and POST /api/users/me/change-password
-- endpoints (users.routes.js) — no schema change needed for those.
--
-- Notification preferences is new: one JSONB column on `users`, generic
-- across all roles (parent, teacher, school_admin, ...) so it can be reused
-- outside the Parent Portal later without another migration.
-- =============================================================================

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{
    "email": true,
    "sms": true,
    "announcements": true,
    "attendance": true,
    "grades": true,
    "fees": true
  }'::jsonb;

COMMIT;
