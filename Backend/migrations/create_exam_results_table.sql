-- =============================================================================
-- create_exam_results_table.sql
-- Final Results: stores marks a learner scored in one subject (learning_area)
-- for one exam. Powers "Final Results" -> view results, compare results,
-- and search a learner's results.
--
-- One row = one learner + one exam + one subject.
-- Grade (CBC performance level) is auto-computed from the percentage via a
-- trigger, so the frontend never has to duplicate that grading logic.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS exam_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  exam_id           UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  learner_id        UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  learning_area_id  UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
  class_id          UUID REFERENCES classes(id) ON DELETE SET NULL,
  term_id           UUID REFERENCES academic_years(id) ON DELETE SET NULL,

  marks_obtained    NUMERIC(6,2) NOT NULL CHECK (marks_obtained >= 0),
  max_marks         NUMERIC(6,2) NOT NULL DEFAULT 100 CHECK (max_marks > 0),
  percentage        NUMERIC(5,2) GENERATED ALWAYS AS (
                       ROUND((marks_obtained / max_marks) * 100, 2)
                     ) STORED,
  performance_level VARCHAR(4),  -- EE / ME / AE / BE, auto-set by trigger
  remarks           TEXT,
  is_absent         BOOLEAN NOT NULL DEFAULT false,

  created_by        UUID,
  updated_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT exam_results_marks_within_max CHECK (marks_obtained <= max_marks),
  CONSTRAINT exam_results_unique_entry UNIQUE (exam_id, learner_id, learning_area_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_results_school_id     ON exam_results (school_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id       ON exam_results (exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_learner_id    ON exam_results (learner_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_class_id      ON exam_results (class_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_learning_area ON exam_results (learning_area_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_learner_exam  ON exam_results (learner_id, exam_id);

-- ---------------------------------------------------------------------------
-- CBC performance level, derived from percentage:
--   EE  Exceeding Expectation   80 - 100%
--   ME  Meeting Expectation     50 - 79%
--   AE  Approaching Expectation 30 - 49%
--   BE  Below Expectation        0 - 29%
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_exam_results_grade()
RETURNS TRIGGER AS $$
DECLARE
  pct NUMERIC;
BEGIN
  IF NEW.is_absent THEN
    NEW.performance_level := NULL;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  pct := ROUND((NEW.marks_obtained / NEW.max_marks) * 100, 2);

  NEW.performance_level := CASE
    WHEN pct >= 80 THEN 'EE'
    WHEN pct >= 50 THEN 'ME'
    WHEN pct >= 30 THEN 'AE'
    ELSE 'BE'
  END;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exam_results_grade ON exam_results;
CREATE TRIGGER trg_exam_results_grade
  BEFORE INSERT OR UPDATE ON exam_results
  FOR EACH ROW
  EXECUTE FUNCTION set_exam_results_grade();
