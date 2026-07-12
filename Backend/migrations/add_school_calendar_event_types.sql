-- =============================================================================
-- add_school_calendar_event_types.sql
-- Parent Portal — "School Calendar" section (opening dates, closing dates,
-- holidays, exams, sports events, school activities).
--
-- Reuses the existing school_events table (see create_parent_dashboard_tables.sql
-- and add_category_to_announcements_and_events.sql) instead of a new table.
-- Adds four new event_type values on top of the existing
-- 'event' | 'holiday' | 'pta_meeting':
--   - term_start -> "Opening dates"
--   - term_end   -> "Closing dates"
--   - sports     -> "Sports events"
--   - activity   -> "School activities"
-- "Exams" is intentionally NOT added here — it is already served by the
-- dedicated exam timetable (GET /api/v1/exams/learner/:learnerId/upcoming),
-- which the School Calendar frontend section reuses instead of duplicating
-- exam data into school_events.
-- =============================================================================

BEGIN;

ALTER TABLE school_events
  DROP CONSTRAINT IF EXISTS school_events_event_type_check;

ALTER TABLE school_events
  ADD CONSTRAINT school_events_event_type_check
    CHECK (event_type IN ('event', 'holiday', 'pta_meeting', 'term_start', 'term_end', 'sports', 'activity'));

COMMIT;
