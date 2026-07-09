-- ============================================================================
-- add_class_ids_to_learning_areas.sql
-- Lets a Learning Area optionally be scoped to specific registered CLASSES
-- (grade + stream, e.g. "Grade 7 Blue") instead of only a broad grade_levels
-- band.
--
-- class_ids is nullable / can be empty:
--   NULL or '{}'  -> applies to every class in its grade_levels (unchanged
--                    behaviour -- this is the default for existing rows)
--   non-empty     -> restricted to exactly those classes (e.g. an optional
--                    subject offered only to specific streams)
--
-- class_ids references real rows in the `classes` table (id UUID), so the
-- picker in the UI is always fetched live from registered classes -- never
-- a hardcoded list.
-- ============================================================================

ALTER TABLE learning_areas
  ADD COLUMN IF NOT EXISTS class_ids UUID[] DEFAULT NULL;

COMMENT ON COLUMN learning_areas.class_ids IS
  'Optional array of classes.id this learning area is restricted to. NULL/empty = applies to every class matching grade_levels.';

-- GIN index so "which learning areas apply to class X" (class_ids @> ARRAY[...])
-- and "$1 = ANY(class_ids)" lookups stay fast.
CREATE INDEX IF NOT EXISTS idx_learning_areas_class_ids
  ON learning_areas USING GIN (class_ids);
