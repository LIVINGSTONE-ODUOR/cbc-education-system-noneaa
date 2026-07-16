-- =============================================================================
-- 20260716_timetable_day_settings.sql
--
-- Lets the School Timetable admin set how many lessons are taught on each
-- day of the week (e.g. Monday = 8 lessons, Friday = 6 lessons) instead of
-- that number being unlimited. Read by timetable.controller.js to cap how
-- many slots a class can be given on a given day.
-- =============================================================================

CREATE TABLE IF NOT EXISTS timetable_day_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id  UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  day               TEXT NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  lessons_count     INTEGER NOT NULL DEFAULT 8 CHECK (lessons_count > 0 AND lessons_count <= 20),
  updated_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT timetable_day_settings_unique UNIQUE (school_id, academic_year_id, day)
);

CREATE INDEX IF NOT EXISTS idx_timetable_day_settings_school_year
  ON timetable_day_settings (school_id, academic_year_id);
