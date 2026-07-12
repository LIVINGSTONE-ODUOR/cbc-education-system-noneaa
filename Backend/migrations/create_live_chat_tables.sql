-- Live chat: AI assistant conversations that can be escalated to a human agent.
-- Public visitors are unauthenticated, so conversations are identified by an
-- unguessable UUID (acts like a capability token) rather than a user id.

CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'ai' CHECK (status IN ('ai', 'escalated', 'closed')),
  visitor_label TEXT,
  page_url TEXT,
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_agent_name TEXT,
  school_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'ai', 'agent', 'system')),
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_conversation
  ON support_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_support_conversations_status
  ON support_conversations (status, updated_at DESC);
