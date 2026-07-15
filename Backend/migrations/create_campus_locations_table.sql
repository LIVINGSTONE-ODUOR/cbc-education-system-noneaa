-- =============================================================================
-- create_campus_locations_table.sql
-- Campus Map / directory: classrooms, labs, library, offices, and other rooms
-- on campus, so students can look up where something is.
--
-- Table: campus_locations
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS campus_locations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name           VARCHAR(150) NOT NULL,
  category       VARCHAR(20) NOT NULL CHECK (category IN ('classroom', 'lab', 'library', 'office', 'other')),
  building       VARCHAR(100),
  floor          VARCHAR(50),
  room_number    VARCHAR(50),
  description    TEXT,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campus_locations_school_id ON campus_locations (school_id);
CREATE INDEX IF NOT EXISTS idx_campus_locations_category  ON campus_locations (category);
CREATE INDEX IF NOT EXISTS idx_campus_locations_building   ON campus_locations (building);

CREATE OR REPLACE FUNCTION set_campus_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campus_locations_updated_at ON campus_locations;
CREATE TRIGGER trg_campus_locations_updated_at
  BEFORE UPDATE ON campus_locations
  FOR EACH ROW
  EXECUTE FUNCTION set_campus_locations_updated_at();

COMMIT;
