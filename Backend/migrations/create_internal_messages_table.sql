-- Internal direct messaging between platform users (students, parents,
-- teachers, school admins). One row per message; conversations are
-- derived on the fly from the (sender, recipient) pair rather than a
-- separate conversation table, since threads here are always 1:1.
--
-- Allowed pairs (enforced in the application layer, see
-- message.controller.js -> canMessage()):
--   student <-> teacher
--   parent  <-> teacher
--   student <-> school_admin
--   parent  <-> school_admin
--   teacher <-> school_admin
--
-- Both users must belong to the same school.

CREATE TABLE IF NOT EXISTS internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT internal_messages_not_self CHECK (sender_id != recipient_id)
);

-- Fast lookup of a single thread between two users, newest last.
CREATE INDEX IF NOT EXISTS idx_internal_messages_thread
  ON internal_messages (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at);

-- Fast "list my conversations" / unread badge queries.
CREATE INDEX IF NOT EXISTS idx_internal_messages_recipient
  ON internal_messages (recipient_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_messages_sender
  ON internal_messages (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_messages_school
  ON internal_messages (school_id);
