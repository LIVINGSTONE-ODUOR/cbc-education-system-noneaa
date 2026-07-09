-- =============================================================================
-- create_attendance_table.sql
-- Daily learner attendance records, one row per (class, learner, date)
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS attendance_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id          UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  learner_id        UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  attendance_date   DATE NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'present'
                       CHECK (status IN ('present', 'absent', 'late', 'excused')),
  arrival_time      TIME,
  remarks           TEXT,
  marked_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One attendance record per learner, per class, per day
  UNIQUE (class_id, learner_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_class_date
  ON attendance_records (class_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_school_date
  ON attendance_records (school_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_learner
  ON attendance_records (learner_id);

COMMIT;
