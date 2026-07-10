-- ================================================================
-- add_subdomain_to_schools.sql
--
-- Adds a URL-safe subdomain to each school so admins can log in at
-- https://{subdomain}.noneaa.com/login instead of a generic URL.
--
-- The admin chooses this at registration time (see
-- schoolRegistration.controller.js -> registerSchoolAdmin).
-- ================================================================

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS subdomain VARCHAR(63);

-- Enforce valid DNS-label format at the DB level as a safety net,
-- in addition to the app-level validation in the controller:
--   - lowercase letters, digits, hyphens only
--   - must start and end with a letter or digit
--   - 2-63 characters
-- (Postgres has no "ADD CONSTRAINT IF NOT EXISTS", so guard manually.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_subdomain_format_check'
  ) THEN
    ALTER TABLE schools
      ADD CONSTRAINT schools_subdomain_format_check
      CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$');
  END IF;
END $$;

-- One subdomain per active school. Partial index (ignores soft-deleted
-- rows) so a deleted school's old subdomain can be reused.
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_subdomain_unique
  ON schools (subdomain)
  WHERE deleted_at IS NULL AND subdomain IS NOT NULL;
