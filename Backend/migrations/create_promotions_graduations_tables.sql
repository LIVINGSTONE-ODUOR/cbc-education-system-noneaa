-- ================================================================
-- Promotions & Graduations Migration
--
-- Model: a "batch" represents one decision cycle (matches the
-- Frontend PromotionsPage.tsx UI, which was previously demo-only
-- client state). A batch targets one grade_level (+ optional
-- stream_name) for one academic_year, and contains one row per
-- learner considered in promotion_batch_learners.
--
-- kind = 'promotion'  -> learners move from grade_level to to_grade_level
-- kind = 'graduation' -> learners graduate/receive certificate at grade_level
--
-- All deletes are soft (deleted_at), matching curriculum tables.
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. Promotion / Graduation Batches
-- ================================================================
CREATE TABLE IF NOT EXISTS promotion_batches (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id               UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    kind                    VARCHAR(20) NOT NULL CHECK (kind IN ('promotion','graduation')),
    academic_year_id        UUID NOT NULL REFERENCES academic_years(id),
    grade_level             VARCHAR(50) NOT NULL,   -- source grade, e.g. 'Grade 6'
    stream_name             VARCHAR(100),           -- optional, matches classes.stream_name
    to_grade_level          VARCHAR(50),            -- destination grade; NULL for graduation
    criteria                TEXT NOT NULL,
    effective_date          DATE NOT NULL,
    learner_count_target    INT NOT NULL DEFAULT 0,
    learner_count_selected  INT NOT NULL DEFAULT 0,
    learner_count_completed INT NOT NULL DEFAULT 0, -- promoted or graduated count
    status                  VARCHAR(20) NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft','ready','running','completed','locked','cancelled')),
    locked_at               TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at              TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_promotion_batches_school_id ON promotion_batches(school_id);
CREATE INDEX IF NOT EXISTS idx_promotion_batches_year_id ON promotion_batches(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_promotion_batches_status ON promotion_batches(status);
CREATE INDEX IF NOT EXISTS idx_promotion_batches_kind ON promotion_batches(kind);
CREATE INDEX IF NOT EXISTS idx_promotion_batches_deleted_at ON promotion_batches(deleted_at) WHERE deleted_at IS NULL;

-- ================================================================
-- 2. Per-learner results within a batch
-- ================================================================
CREATE TABLE IF NOT EXISTS promotion_batch_learners (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id        UUID NOT NULL REFERENCES promotion_batches(id) ON DELETE CASCADE,
    learner_id      UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
    from_class_id   UUID REFERENCES classes(id),
    to_class_id     UUID REFERENCES classes(id),   -- set on promotion run
    decision        VARCHAR(20) NOT NULL DEFAULT 'selected'
                       CHECK (decision IN ('selected','promoted','retained','graduated','not_graduated','excluded')),
    certificate_no  VARCHAR(50),                   -- graduation only
    notes           TEXT,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (batch_id, learner_id)
);

CREATE INDEX IF NOT EXISTS idx_pbl_batch_id ON promotion_batch_learners(batch_id);
CREATE INDEX IF NOT EXISTS idx_pbl_learner_id ON promotion_batch_learners(learner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_graduations_certificate_no ON promotion_batch_learners(certificate_no) WHERE certificate_no IS NOT NULL;
