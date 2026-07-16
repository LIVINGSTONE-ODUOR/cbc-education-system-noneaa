-- =============================================================================
-- CBC Grading System - Full Migration
-- =============================================================================
-- Supports: grading schemes, grading levels, competency assessments,
--           report cards, teacher/principal comments, and transcript generation
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. GRADING SCHEMES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grading_schemes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID REFERENCES schools(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  is_default    BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. GRADING LEVELS (e.g. BE=0-24, ME=25-49, AE=50-74, EE=75-100)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grading_levels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id       UUID REFERENCES grading_schemes(id) ON DELETE CASCADE,
  code            VARCHAR(10) NOT NULL,        -- e.g. BE, ME, AE, EE
  name            VARCHAR(100) NOT NULL,        -- e.g. Below Expectation
  description     TEXT,
  min_score       NUMERIC(5,2) NOT NULL,        -- inclusive
  max_score       NUMERIC(5,2) NOT NULL,        -- inclusive
  color           VARCHAR(20) DEFAULT '#6B7280', -- display color
  sort_order      INT DEFAULT 0,
  is_pass         BOOLEAN DEFAULT true,         -- does this level count as passing?
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CBE LEARNING AREAS (Subjects/Strands mapped to grading schemes)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subject_grading_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID REFERENCES schools(id) ON DELETE CASCADE,
  learning_area_id UUID REFERENCES learning_areas(id) ON DELETE CASCADE,
  scheme_id       UUID REFERENCES grading_schemes(id) ON DELETE SET NULL,
  class_id        UUID REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  term_id         INTEGER REFERENCES academic_terms(id) ON DELETE CASCADE,
  max_score       NUMERIC(5,2) DEFAULT 100,
  pass_score      NUMERIC(5,2) DEFAULT 25,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(learning_area_id, class_id, academic_year_id, term_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. COMPETENCY AREAS (Strands/Sub-strands per subject)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competency_areas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID REFERENCES schools(id) ON DELETE CASCADE,
  learning_area_id UUID REFERENCES learning_areas(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,        -- e.g. "Reading and Writing"
  code            VARCHAR(50),                  -- e.g. ENG-STRAND-01
  description     TEXT,
  type            VARCHAR(20) DEFAULT 'strand',  -- strand, sub_strand, competency
  parent_id       UUID REFERENCES competency_areas(id) ON DELETE SET NULL,
  sort_order      INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. STUDENT COMPETENCY ASSESSMENTS (Per strand/sub-strand scores)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competency_assessments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID REFERENCES schools(id) ON DELETE CASCADE,
  learner_id        UUID REFERENCES learners(id) ON DELETE CASCADE,
  class_id          UUID REFERENCES classes(id) ON DELETE CASCADE,
  learning_area_id  UUID REFERENCES learning_areas(id) ON DELETE CASCADE,
  competency_area_id UUID REFERENCES competency_areas(id) ON DELETE CASCADE,
  academic_term_id  INTEGER REFERENCES academic_terms(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  score             NUMERIC(5,2) NOT NULL,
  max_score         NUMERIC(5,2) DEFAULT 100,
  grade_code        VARCHAR(10),                -- e.g. BE, ME, AE, EE
  competency_level  VARCHAR(50),                -- e.g. "Beginning", "Developing", "Proficient", "Advanced"
  teacher_remarks   TEXT,
  assessed_by       UUID REFERENCES users(id),
  assessment_date   DATE DEFAULT CURRENT_DATE,
  is_approved       BOOLEAN DEFAULT false,
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(learner_id, learning_area_id, competency_area_id, academic_term_id, academic_year_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SUBJECT ASSESSMENTS (Overall subject scores per term)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subject_assessments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID REFERENCES schools(id) ON DELETE CASCADE,
  learner_id        UUID REFERENCES learners(id) ON DELETE CASCADE,
  class_id          UUID REFERENCES classes(id) ON DELETE CASCADE,
  learning_area_id  UUID REFERENCES learning_areas(id) ON DELETE CASCADE,
  academic_term_id  INTEGER REFERENCES academic_terms(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  total_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_score         NUMERIC(5,2) DEFAULT 100,
  grade_code        VARCHAR(10),
  competency_level  VARCHAR(50),
  teacher_remarks   TEXT,
  assessed_by       UUID REFERENCES users(id),
  assessment_date   DATE DEFAULT CURRENT_DATE,
  is_approved       BOOLEAN DEFAULT false,
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(learner_id, learning_area_id, academic_term_id, academic_year_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. REPORT CARDS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_cards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID REFERENCES schools(id) ON DELETE CASCADE,
  learner_id        UUID REFERENCES learners(id) ON DELETE CASCADE,
  class_id          UUID REFERENCES classes(id) ON DELETE CASCADE,
  academic_term_id  INTEGER REFERENCES academic_terms(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  total_score       NUMERIC(6,2) DEFAULT 0,
  average_score     NUMERIC(5,2) DEFAULT 0,
  overall_grade     VARCHAR(10),
  subject_count     INT DEFAULT 0,
  subject_remarks   TEXT,
  teacher_comments  TEXT,
  principal_comments TEXT,
  attendance_summary JSONB DEFAULT '{}',
  promotion_decision VARCHAR(50),              -- promoted, retained, probation
  promotion_notes   TEXT,
  is_finalized      BOOLEAN DEFAULT false,
  finalized_by      UUID REFERENCES users(id),
  finalized_at      TIMESTAMPTZ,
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(learner_id, class_id, academic_term_id, academic_year_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. TRANSCRIPTS (Cumulative academic record)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transcripts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID REFERENCES schools(id) ON DELETE CASCADE,
  learner_id        UUID REFERENCES learners(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  term_summary      JSONB DEFAULT '{}',        -- per-term performance summary
  cumulative_score  NUMERIC(6,2) DEFAULT 0,
  cumulative_average NUMERIC(5,2) DEFAULT 0,
  total_subjects    INT DEFAULT 0,
  overall_grade     VARCHAR(10),
  class_teacher_comment TEXT,
  principal_comment TEXT,
  is_finalized      BOOLEAN DEFAULT false,
  finalized_at      TIMESTAMPTZ,
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(learner_id, academic_year_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. PROMOTION DECISIONS (per term/year)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotion_decisions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID REFERENCES schools(id) ON DELETE CASCADE,
  learner_id        UUID REFERENCES learners(id) ON DELETE CASCADE,
  from_class_id     UUID REFERENCES classes(id) ON DELETE SET NULL,
  to_class_id       UUID REFERENCES classes(id) ON DELETE SET NULL,
  academic_term_id  INTEGER REFERENCES academic_terms(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  decision          VARCHAR(50) NOT NULL,       -- promoted, retained, transferred, graduated
  remarks           TEXT,
  decided_by        UUID REFERENCES users(id),
  decided_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_comp_assess_learner ON competency_assessments(learner_id);
CREATE INDEX IF NOT EXISTS idx_comp_assess_subject ON competency_assessments(learning_area_id);
CREATE INDEX IF NOT EXISTS idx_comp_assess_term ON competency_assessments(academic_term_id);
CREATE INDEX IF NOT EXISTS idx_subject_assess_learner ON subject_assessments(learner_id);
CREATE INDEX IF NOT EXISTS idx_subject_assess_term ON subject_assessments(academic_term_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_learner ON report_cards(learner_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_term ON report_cards(academic_term_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_learner ON transcripts(learner_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_year ON transcripts(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_grading_levels_scheme ON grading_levels(scheme_id);
CREATE INDEX IF NOT EXISTS idx_promotion_decisions_learner ON promotion_decisions(learner_id);

-- =============================================================================
-- DEFAULT CBC GRADING SCHEME (inserted per school)
-- =============================================================================
-- Seeded explicitly in schoolRegistration.controller.js (registerSchoolAdmin,
-- Step 9c) right after the school is created, using the same BE/ME/AE/EE
-- scale as the gradingCache.js lazy-create fallback. school_admins can then
-- rename/edit it or add additional schemes via the grading scheme endpoints
-- (POST/PUT /api/v1/grading/schemes).

-- =============================================================================
-- PERMISSIONS
-- =============================================================================
ALTER TABLE grading_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_decisions ENABLE ROW LEVEL SECURITY;
