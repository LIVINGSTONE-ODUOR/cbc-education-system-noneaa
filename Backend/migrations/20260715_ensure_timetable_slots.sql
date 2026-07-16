-- =============================================================================
-- 20260715_ensure_timetable_slots.sql
--
-- The `timetable_slots` table is already referenced by class.controller.js
-- and teacher.controller.js (read-only endpoints), but no migration for it
-- ships in this repo. This migration creates it if missing and makes sure
-- every column the School Timetable admin builder needs is present, so the
-- feature works on a fresh database too.
--
-- Columns match the shape already used in teacher.controller.js:
--   day (not day_of_week), learning_area_id (not subject_id), room,
--   is_active, deleted_at, school_id.
-- =============================================================================

CREATE TABLE IF NOT EXISTS timetable_slots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id  UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  term_id           UUID REFERENCES academic_terms(id) ON DELETE SET NULL,
  class_id          UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  learning_area_id  UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
  teacher_id        UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day               TEXT NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  period_number     INTEGER,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  room              TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT timetable_slots_time_order CHECK (end_time > start_time)
);

-- Add any columns that might be missing if the table already existed
-- out-of-band (e.g. created directly in Supabase before this migration).
ALTER TABLE timetable_slots ADD COLUMN IF NOT EXISTS school_id        UUID;
ALTER TABLE timetable_slots ADD COLUMN IF NOT EXISTS room             TEXT;
ALTER TABLE timetable_slots ADD COLUMN IF NOT EXISTS is_active        BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE timetable_slots ADD COLUMN IF NOT EXISTS created_by       UUID;
ALTER TABLE timetable_slots ADD COLUMN IF NOT EXISTS deleted_at       TIMESTAMPTZ;
ALTER TABLE timetable_slots ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now();

-- Indexes that back the three conflict checks the admin timetable builder
-- relies on: class double-booking, teacher double-booking, and general
-- lookups by school/day. Partial (deleted_at IS NULL / is_active) so soft
-- deleted / deactivated rows never block a new slot.
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class_day
  ON timetable_slots (class_id, day, academic_year_id)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_timetable_slots_teacher_day
  ON timetable_slots (teacher_id, day, academic_year_id)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_timetable_slots_school_year
  ON timetable_slots (school_id, academic_year_id)
  WHERE deleted_at IS NULL AND is_active = true;
