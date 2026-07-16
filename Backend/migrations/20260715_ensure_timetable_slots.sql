-- =============================================================================
-- 20260715_ensure_timetable_slots.sql
--
-- School Timetable — one row per scheduled lesson (a class, on a given day,
-- taught by one teacher in one learning area, for a time range). Referenced
-- by Backend/src/controllers/timetable.controller.js for every timetable
-- endpoint (get grid, create/update/delete slot, copy, school-wide print,
-- teacher load report, teacher's own "me/timetable" view).
--
-- Uses "IF NOT EXISTS" throughout so it's safe to run even if part of this
-- was already applied by hand.
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
  CONSTRAINT timetable_slots_time_order CHECK (start_time < end_time)
);

-- Every list/lookup in the controller filters by school + year + day
-- (and usually class or teacher), so this is the main lookup index.
CREATE INDEX IF NOT EXISTS idx_timetable_slots_school_year_day
  ON timetable_slots (school_id, academic_year_id, day)
  WHERE deleted_at IS NULL;

-- Conflict checks (class double-booked, teacher double-booked) and the
-- per-class weekly grid both filter on these directly.
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class
  ON timetable_slots (class_id, day)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_timetable_slots_teacher
  ON timetable_slots (teacher_id, day)
  WHERE deleted_at IS NULL;

-- The lessons-per-day cap check (createSlot) counts active slots for a
-- class/day/year — index covers that count directly.
CREATE INDEX IF NOT EXISTS idx_timetable_slots_active_count
  ON timetable_slots (school_id, class_id, academic_year_id, day)
  WHERE is_active = true AND deleted_at IS NULL;
