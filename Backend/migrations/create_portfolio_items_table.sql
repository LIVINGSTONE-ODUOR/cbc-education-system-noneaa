-- =============================================================================
-- create_portfolio_items_table.sql
-- Student Portfolio — projects, certificates, and achievements a student
-- collects across multiple academic years. Private to the learner who owns it.
--
-- Table: portfolio_items
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS portfolio_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  learner_id     UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  category       VARCHAR(20) NOT NULL CHECK (category IN ('project', 'certificate', 'achievement')),
  title          VARCHAR(150) NOT NULL,
  description    TEXT,
  organization   VARCHAR(150), -- issuer for certificates, e.g. "Kenya Science Fair"
  academic_year  VARCHAR(20),  -- e.g. "2024/2025"
  date_achieved  DATE,
  external_link  VARCHAR(500), -- optional link to the project repo, drive file, cert image, etc.
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_learner_id    ON portfolio_items (learner_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_school_id     ON portfolio_items (school_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_academic_year ON portfolio_items (academic_year);

CREATE OR REPLACE FUNCTION set_portfolio_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_portfolio_items_updated_at ON portfolio_items;
CREATE TRIGGER trg_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION set_portfolio_items_updated_at();

COMMIT;
