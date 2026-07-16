-- =============================================================================
-- ensure_announcements_category_column.sql
-- parentDashboard.controller.js has always read/written an `announcements.category`
-- column ('general' | 'fee_reminder' | ...), but create_parent_dashboard_tables.sql
-- never actually created it. Adds it idempotently so GET/POST /announcements stop
-- failing against a live database.
-- =============================================================================

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';

CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
