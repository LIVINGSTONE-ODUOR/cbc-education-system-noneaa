-- =============================================================================
-- create_lost_found_tables.sql
-- Lost & Found board: students report items they've lost or found on campus.
-- School-wide visibility (all roles can view); reporter manages their own post.
--
-- Table: lost_found_items
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS lost_found_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  reported_by    UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  item_type      VARCHAR(10) NOT NULL CHECK (item_type IN ('lost', 'found')),
  title          VARCHAR(150) NOT NULL,
  description    TEXT,
  location       VARCHAR(150),
  contact_info   VARCHAR(150),
  status         VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ,
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lost_found_school_id   ON lost_found_items (school_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_status       ON lost_found_items (status);
CREATE INDEX IF NOT EXISTS idx_lost_found_reported_by  ON lost_found_items (reported_by);

CREATE OR REPLACE FUNCTION set_lost_found_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lost_found_updated_at ON lost_found_items;
CREATE TRIGGER trg_lost_found_updated_at
  BEFORE UPDATE ON lost_found_items
  FOR EACH ROW
  EXECUTE FUNCTION set_lost_found_updated_at();

COMMIT;
