-- =============================================================================
-- create_parent_dashboard_tables.sql
-- Adds the tables backing the 5 Parent Portal dashboard cards that were
-- previously "Coming soon" placeholders:
--   1. messages           -> Unread messages
--   2. announcements      -> Latest announcements
--   3. teacher_comments   -> Teacher comments
--   4. class_timetable    -> Today's timetable
--   5. school_events      -> School events
-- Pattern: matches create_assignments_tables.sql (uuid pk, school_id scoping,
-- timestamptz created_at, FKs to existing schools/classes/teachers/learners).
-- =============================================================================

-- 1. Announcements — posted by staff, visible to a whole school or one class.
CREATE TABLE IF NOT EXISTS announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id    uuid REFERENCES classes(id) ON DELETE CASCADE,        -- NULL = whole school
  title       text NOT NULL,
  body        text NOT NULL,
  created_by  uuid REFERENCES users(id),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_school ON announcements(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_class ON announcements(class_id);

-- 2. Messages — lightweight parent <-> teacher/admin inbox.
CREATE TABLE IF NOT EXISTS messages (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  learner_id         uuid REFERENCES learners(id) ON DELETE SET NULL, -- optional: which child this is about
  sender_user_id     uuid NOT NULL REFERENCES users(id),
  recipient_user_id  uuid NOT NULL REFERENCES users(id),
  subject            text,
  body               text NOT NULL,
  is_read            boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_school ON messages(school_id);

-- 3. Teacher comments — free-text remarks a teacher leaves on a learner,
--    separate from assignment/exam feedback.
CREATE TABLE IF NOT EXISTS teacher_comments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  learner_id         uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  teacher_id         uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  learning_area_id   uuid REFERENCES learning_areas(id) ON DELETE SET NULL,
  comment            text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_comments_learner ON teacher_comments(learner_id, created_at DESC);

-- 4. Class timetable — one row per period per class per weekday.
CREATE TABLE IF NOT EXISTS class_timetable (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id           uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week        smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Monday ... 7 = Sunday
  start_time         time NOT NULL,
  end_time           time NOT NULL,
  learning_area_id   uuid REFERENCES learning_areas(id) ON DELETE SET NULL,
  teacher_id         uuid REFERENCES teachers(id) ON DELETE SET NULL,
  room               text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_timetable_class_day ON class_timetable(class_id, day_of_week, start_time);

-- 5. School events — calendar entries (sports day, holidays, PTA meetings...).
CREATE TABLE IF NOT EXISTS school_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  event_date   date NOT NULL,
  start_time   time,
  location     text,
  audience     text NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'parents', 'staff', 'learners')),
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_events_school_date ON school_events(school_id, event_date);
