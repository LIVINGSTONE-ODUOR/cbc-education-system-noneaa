-- =============================================================================
-- Dashboard Support Tables & Views — CBC Education System
-- =============================================================================
-- Creates the tables and views needed for the school admin dashboard,
-- performance analytics, and school statistics widgets.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SCHOOL STATS (Materialized dashboard statistics per school)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID REFERENCES schools(id) ON DELETE CASCADE UNIQUE,

  -- Learner statistics
  total_learners          INT DEFAULT 0,
  active_learners         INT DEFAULT 0,
  new_learners_this_term  INT DEFAULT 0,

  -- Teacher statistics
  total_teachers          INT DEFAULT 0,
  active_teachers         INT DEFAULT 0,

  -- Class statistics
  total_classes           INT DEFAULT 0,
  total_streams           INT DEFAULT 0,

  -- Performance metrics
  average_score           NUMERIC(5,2) DEFAULT 0,
  pass_rate               NUMERIC(5,2) DEFAULT 0,
  top_performer_count     INT DEFAULT 0,

  -- Attendance
  attendance_rate         NUMERIC(5,2) DEFAULT 0,

  -- Academic context
  active_term_id          UUID REFERENCES academic_terms(id) ON DELETE SET NULL,
  active_academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,

  -- Timestamps
  calculated_at           TIMESTAMPTZ DEFAULT NOW(),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SCHOOL ACTIVITIES (Activity feed for dashboards)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID REFERENCES schools(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type   VARCHAR(50) NOT NULL,       -- e.g. learner_added, assessment_saved, report_finalized
  description     TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DASHBOARD WIDGET CONFIGURATION (Per-user widget layout)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  widget_key      VARCHAR(100) NOT NULL,      -- e.g. attendance_summary, grade_distribution
  title           VARCHAR(255),
  widget_type     VARCHAR(50) DEFAULT 'card',  -- card, chart, table, list
  position        INT DEFAULT 0,
  config          JSONB DEFAULT '{}',          -- widget-specific configuration
  is_visible      BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, widget_key)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DASHBOARD VIEWS
-- ─────────────────────────────────────────────────────────────────────────────

-- School dashboard summary (aggregates key metrics)
CREATE OR REPLACE VIEW v_school_dashboard_summary AS
SELECT
  s.id AS school_id,
  s.name AS school_name,
  s.code AS school_code,
  COALESCE(ss.total_learners, 0) AS total_learners,
  COALESCE(ss.active_learners, 0) AS active_learners,
  COALESCE(ss.total_teachers, 0) AS total_teachers,
  COALESCE(ss.active_teachers, 0) AS active_teachers,
  COALESCE(ss.total_classes, 0) AS total_classes,
  COALESCE(ss.average_score, 0) AS average_score,
  COALESCE(ss.pass_rate, 0) AS pass_rate,
  COALESCE(ss.attendance_rate, 0) AS attendance_rate,
  ss.calculated_at AS stats_updated_at,
  t.name AS active_term_name,
  ay.name AS active_academic_year_name
FROM schools s
LEFT JOIN school_stats ss ON ss.school_id = s.id
LEFT JOIN academic_terms t ON t.id = ss.active_term_id
LEFT JOIN academic_years ay ON ay.id = ss.active_academic_year_id
WHERE s.is_active = true;

-- Learner performance summary (per learner per term)
CREATE OR REPLACE VIEW v_learner_performance_summary AS
SELECT
  l.id AS learner_id,
  l.first_name,
  l.last_name,
  l.admission_number,
  l.class_id,
  c.name AS class_name,
  rc.academic_term_id,
  rc.academic_year_id,
  rc.average_score,
  rc.overall_grade,
  rc.subject_count,
  rc.is_finalized,
  DENSE_RANK() OVER (PARTITION BY rc.class_id, rc.academic_term_id ORDER BY rc.average_score DESC) AS class_rank
FROM learners l
JOIN report_cards rc ON rc.learner_id = l.id
LEFT JOIN classes c ON c.id = l.class_id
WHERE rc.average_score IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_school_stats_school ON school_stats(school_id);
CREATE INDEX IF NOT EXISTS idx_school_activities_school ON school_activities(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_school_activities_type ON school_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user ON dashboard_widgets(user_id, position);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE school_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- School admins can see their own school's stats
CREATE POLICY school_stats_school_access ON school_stats
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM school_admins WHERE user_id = auth.uid()
    )
  );

-- Users can see activities for their school
CREATE POLICY school_activities_school_access ON school_activities
  FOR SELECT USING (
    school_id IN (
      SELECT COALESCE(school_id, (SELECT school_id FROM users WHERE id = auth.uid()))
    )
  );

-- Users can manage their own dashboard widgets
CREATE POLICY dashboard_widgets_owner ON dashboard_widgets
  FOR ALL USING (user_id = auth.uid());
