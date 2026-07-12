-- =============================================================================
-- add_category_to_announcements_and_events.sql
-- Parent Portal — Announcements section (school notices, PTA meetings,
-- holidays, events, fee reminders).
--
-- Rather than a new table, this reuses the two tables that already power
-- the dashboard's "Latest announcements" and "School events" cards:
--   - message-style items (school notices, fee reminders) -> announcements.category
--   - date-based items (events, PTA meetings, holidays)    -> school_events.event_type
-- =============================================================================

BEGIN;

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS category VARCHAR(20) NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'fee_reminder'));

ALTER TABLE school_events
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(20) NOT NULL DEFAULT 'event'
    CHECK (event_type IN ('event', 'holiday', 'pta_meeting'));

CREATE INDEX IF NOT EXISTS idx_announcements_category
  ON announcements (school_id, category);

CREATE INDEX IF NOT EXISTS idx_school_events_type
  ON school_events (school_id, event_type);

COMMIT;
