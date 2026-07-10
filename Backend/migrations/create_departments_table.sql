-- ================================================================
-- create_departments_table.sql
--
-- The Departments feature (Teachers → Departments) previously had
-- NO backend table at all — the whole page ran on frontend mock
-- data (mockData.ts). This migration creates the real table(s).
--
-- Design notes:
--   • learning_area_ids follows the exact same convention already
--     used by learning_areas.class_ids (see
--     add_class_ids_to_learning_areas.sql): a UUID[] column with a
--     GIN index, instead of a join table, since a department just
--     needs "which learning areas does this department cover" with
--     no extra per-row metadata.
--   • department_teachers IS a join table (not an array) because it
--     carries a per-teacher `role` (HOD / Teacher / Assistant),
--     which an array of ids can't express.
--   • All deletes are soft (deleted_at), matching the rest of the
--     schema (learning_areas, teachers, etc.).
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. Departments table
-- ================================================================
CREATE TABLE IF NOT EXISTS departments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id           UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50),
    description         TEXT,

    hod_id              UUID REFERENCES teachers(id) ON DELETE SET NULL,

    -- Learning areas this department covers. Always populated from
    -- real rows in learning_areas — never a hardcoded/mock list.
    learning_area_ids   UUID[] DEFAULT '{}',

    is_active           BOOLEAN DEFAULT true,

    -- Audit fields (matches learning_areas / curriculum tables)
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at          TIMESTAMP WITH TIME ZONE
);

-- A department code should be unique per school (not globally), and
-- only enforced while the row is "live" (not soft-deleted).
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_school_code
    ON departments(school_id, code)
    WHERE deleted_at IS NULL AND code IS NOT NULL AND code <> '';

CREATE INDEX IF NOT EXISTS idx_departments_school_id     ON departments(school_id);
CREATE INDEX IF NOT EXISTS idx_departments_hod_id         ON departments(hod_id);
CREATE INDEX IF NOT EXISTS idx_departments_deleted_at     ON departments(deleted_at) WHERE deleted_at IS NULL;

-- GIN index so "which departments cover learning area X"
-- ($1 = ANY(learning_area_ids)) lookups stay fast.
CREATE INDEX IF NOT EXISTS idx_departments_learning_area_ids
    ON departments USING GIN (learning_area_ids);

COMMENT ON TABLE departments IS 'School academic departments (e.g. Mathematics & Sciences)';
COMMENT ON COLUMN departments.learning_area_ids IS 'Array of learning_areas.id this department covers. Always fetched/validated against real learning_areas rows.';

-- ================================================================
-- 2. Department ↔ Teacher assignments (per-teacher role)
-- ================================================================
CREATE TABLE IF NOT EXISTS department_teachers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    teacher_id      UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'Teacher'
                        CHECK (role IN ('HOD', 'Teacher', 'Assistant')),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT department_teachers_unique UNIQUE (department_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_department_teachers_department_id ON department_teachers(department_id);
CREATE INDEX IF NOT EXISTS idx_department_teachers_teacher_id    ON department_teachers(teacher_id);

COMMENT ON TABLE department_teachers IS 'Which teachers are assigned to which department, and in what role';

-- ================================================================
-- 3. updated_at auto-touch trigger (reuse existing function if the
--    project already defines one; otherwise create it here).
-- ================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;
CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
