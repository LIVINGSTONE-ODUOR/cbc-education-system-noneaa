-- =============================================================================
-- create_study_groups_tables.sql
-- Peer collaboration groups: students form study groups / group-project teams
-- scoped to their own class, optionally tied to a subject, with a simple
-- shared message feed for coordinating.
--
-- Tables: study_groups, study_group_members, study_group_messages
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. study_groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_groups (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id           UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  learning_area_id   UUID REFERENCES learning_areas(id) ON DELETE SET NULL,
  name               VARCHAR(150) NOT NULL,
  description        TEXT,
  created_by         UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  max_members        INTEGER NOT NULL DEFAULT 10 CHECK (max_members BETWEEN 2 AND 50),
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_study_groups_school_id ON study_groups (school_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_class_id   ON study_groups (class_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups (created_by);

CREATE OR REPLACE FUNCTION set_study_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_study_groups_updated_at ON study_groups;
CREATE TRIGGER trg_study_groups_updated_at
  BEFORE UPDATE ON study_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_study_groups_updated_at();

-- ---------------------------------------------------------------------------
-- 2. study_group_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_group_members (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id           UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  learner_id         UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  role               VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT study_group_members_unique UNIQUE (group_id, learner_id)
);

CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id   ON study_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_learner_id ON study_group_members (learner_id);

-- ---------------------------------------------------------------------------
-- 3. study_group_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_group_messages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id           UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  learner_id         UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  message            TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_group_messages_group_id ON study_group_messages (group_id, created_at);

COMMIT;
