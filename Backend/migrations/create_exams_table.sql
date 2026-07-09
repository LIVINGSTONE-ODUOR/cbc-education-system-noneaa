-- =============================================================================
-- create_exams_table.sql
-- Exam Setup: administrators create/manage examinations scoped to a school
-- and a term (row in academic_years — see academicTermsController.js, which
-- uses "academic_years" as the physical table backing the "Term Management"
-- UI). class_id is OPTIONAL — most exams (Mid-Term, End-Term, Mock, Final)
-- are whole-school exams and are not tied to a single grade/class; class_id
-- is only set when an exam is deliberately scoped to one grade & stream.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS exams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  term_id          UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id         UUID REFERENCES classes(id) ON DELETE CASCADE,
  exam_name        VARCHAR(160) NOT NULL,
  exam_type        VARCHAR(30) NOT NULL CHECK (exam_type IN ('CAT', 'Mid-Term', 'End-Term', 'Mock', 'Final')),
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  description      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_by       UUID,
  updated_by       UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT exams_date_range_chk CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_exams_school_id     ON exams (school_id);
CREATE INDEX IF NOT EXISTS idx_exams_term_id        ON exams (term_id);
CREATE INDEX IF NOT EXISTS idx_exams_class_id        ON exams (class_id);
CREATE INDEX IF NOT EXISTS idx_exams_exam_type       ON exams (exam_type);
CREATE INDEX IF NOT EXISTS idx_exams_school_term     ON exams (school_id, term_id);
CREATE INDEX IF NOT EXISTS idx_exams_start_date      ON exams (start_date);

-- Keep updated_at fresh on every UPDATE
CREATE OR REPLACE FUNCTION set_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exams_updated_at ON exams;
CREATE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION set_exams_updated_at();
