-- =============================================================================
-- create_assignments_tables.sql
-- Assignments module: teachers create assignments (with an optional PDF/Word
-- attachment) for a class + subject, students submit online, teachers grade,
-- comment, and return them.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. assignments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id           UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  learning_area_id   UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
  teacher_id         UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title              VARCHAR(200) NOT NULL,
  description        TEXT,
  due_date           TIMESTAMPTZ NOT NULL,
  attachment_url     TEXT,
  attachment_name    TEXT,
  attachment_type    VARCHAR(10) CHECK (attachment_type IN ('pdf', 'word')),
  max_grade          NUMERIC(6,2) NOT NULL DEFAULT 100,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_assignments_school_id   ON assignments (school_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id     ON assignments (class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_learning_area ON assignments (learning_area_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id   ON assignments (teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date     ON assignments (due_date);

CREATE OR REPLACE FUNCTION set_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assignments_updated_at ON assignments;
CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION set_assignments_updated_at();

-- ---------------------------------------------------------------------------
-- 2. assignment_submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id      UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  learner_id         UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  submission_text    TEXT,
  file_url           TEXT,
  file_name          TEXT,
  status             VARCHAR(20) NOT NULL DEFAULT 'submitted'
                       CHECK (status IN ('submitted', 'late', 'graded', 'returned')),
  grade              NUMERIC(6,2),
  teacher_comment    TEXT,
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded_at          TIMESTAMPTZ,
  graded_by          UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT assignment_submissions_unique UNIQUE (assignment_id, learner_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON assignment_submissions (assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_learner_id     ON assignment_submissions (learner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status         ON assignment_submissions (status);

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_assignments_updated_at();
