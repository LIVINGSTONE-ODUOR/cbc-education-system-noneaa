-- ============================================================================
-- create_class_learning_areas.sql
--
-- Explicit "this class takes these subjects" assignment, set from the
-- Class Management screen (at class creation or later editing).
--
-- Why this exists alongside learning_areas.grade_levels / class_ids:
--   That mechanism scopes a SUBJECT to classes ("which classes take French").
--   This table scopes a CLASS to subjects ("which subjects does 7 Blue take"),
--   which is the direction the Class creation screen needs.
--
-- Resolution order (see class.controller.js -> getClassLearningAreas):
--   1. If a class has any rows here, those rows ARE its subject list.
--   2. If a class has zero rows here, it falls back to the pre-existing
--      grade_levels / class_ids resolution on learning_areas, so classes
--      created before this feature (or schools that never touch it) keep
--      working exactly as before.
--
-- Learners never need their own subject rows: a learner's subjects are
-- always "whatever their current class's subjects resolve to". Joining a
-- class is enough to pick up that class's subjects automatically.
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_learning_areas (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id          UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    learning_area_id  UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
    school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(class_id, learning_area_id)
);

CREATE INDEX IF NOT EXISTS idx_class_learning_areas_class_id
  ON class_learning_areas(class_id);

CREATE INDEX IF NOT EXISTS idx_class_learning_areas_learning_area_id
  ON class_learning_areas(learning_area_id);

CREATE INDEX IF NOT EXISTS idx_class_learning_areas_school_id
  ON class_learning_areas(school_id);

COMMENT ON TABLE class_learning_areas IS
  'Explicit subject list per class. Empty for a class = fall back to learning_areas.grade_levels/class_ids resolution.';
