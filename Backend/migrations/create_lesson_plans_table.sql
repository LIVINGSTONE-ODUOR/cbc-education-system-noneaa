-- =============================================================================
-- create_lesson_plans_table.sql
-- Teacher Portal — Lesson Planner.
-- Teachers prepare a plan per (class, subject, week): objectives, activities,
-- resources, homework. Principals (school_admin) can review, approve, or
-- request changes.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS lesson_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id        UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id          UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  learning_area_id  UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
  academic_year_id  UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  term_id           UUID REFERENCES terms(id) ON DELETE SET NULL,
  week_number       SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 20),

  objectives        TEXT NOT NULL,
  activities        TEXT NOT NULL,
  resources         TEXT,
  homework          TEXT,

  status            VARCHAR(20) NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'submitted', 'approved', 'changes_requested')),

  reviewed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  review_comment    TEXT,
  reviewed_at       TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  -- One plan per teacher/class/subject/week/term — re-saving the same week
  -- updates the existing plan instead of creating duplicates.
  UNIQUE (teacher_id, class_id, learning_area_id, term_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher
  ON lesson_plans (teacher_id, week_number);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_school_status
  ON lesson_plans (school_id, status);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_class
  ON lesson_plans (class_id);

COMMIT;
