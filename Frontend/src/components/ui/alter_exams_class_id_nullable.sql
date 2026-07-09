-- =============================================================================
-- alter_exams_class_id_nullable.sql
-- Exam Setup: allow exams to be created WITHOUT a grade/stream (class_id),
-- so schools can schedule whole-school examinations (e.g. Mid-Term, Mock,
-- Final) that are not tied to a single grade/class.
--
-- Run this once against the existing `exams` table.
-- =============================================================================

ALTER TABLE exams
  ALTER COLUMN class_id DROP NOT NULL;

-- class_id already references classes(id) ON DELETE CASCADE — leaving the FK
-- as-is is fine: NULL values are simply not checked by the FK constraint.
