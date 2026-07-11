-- =============================================================================
-- create_learner_discipline_and_notes_tables.sql
-- Adds the two pieces of the Teacher Portal "Student Profile" screen that
-- don't exist yet: discipline records and notes (comments / teacher notes).
--
-- Everything else the Student Profile screen needs already exists:
--   - photo, admission_number, medical_conditions, allergies -> learners table
--   - parents                                                -> learner_parents
--   - attendance history                                     -> attendance_records
--   - academic history                                       -> exam_results
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Discipline records
-- One row per incident (or commendation — category covers both so the same
-- profile section can show a full behavioural history, not just infractions).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learner_discipline_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  learner_id      UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  class_id        UUID REFERENCES classes(id) ON DELETE SET NULL,
  recorded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  incident_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  category        VARCHAR(20) NOT NULL DEFAULT 'minor'
                     CHECK (category IN ('minor', 'major', 'commendation')),
  description     TEXT NOT NULL,
  action_taken    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_discipline_learner
  ON learner_discipline_records (learner_id, incident_date DESC);

CREATE INDEX IF NOT EXISTS idx_discipline_school
  ON learner_discipline_records (school_id);

-- ---------------------------------------------------------------------------
-- Notes: covers both "Comments" (e.g. general remarks, often shareable) and
-- "Teacher notes" (private, staff-only) from the same table, distinguished
-- by note_type + is_private so the frontend/API can filter appropriately.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learner_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  learner_id      UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  class_id        UUID REFERENCES classes(id) ON DELETE SET NULL,
  author_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  note_type       VARCHAR(20) NOT NULL DEFAULT 'teacher_note'
                     CHECK (note_type IN ('comment', 'teacher_note')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_learner_notes_learner
  ON learner_notes (learner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learner_notes_school
  ON learner_notes (school_id);

COMMIT;
