-- Website owner accounts: a single login used for two things on the
-- public marketing site (not the school platform):
--   1. The Blog Manager (/owner/blog-admin) — previously a hardcoded
--      frontend-only password, now a real DB-backed account.
--   2. The Support Inbox (/owner/support-inbox) — lets the owner see and
--      reply to conversations escalated by Anna, the AI assistant widget.
--
-- Deliberately kept separate from `users` (school platform accounts) so a
-- website-owner credential can never gain school-admin/platform access,
-- and vice versa.

CREATE TABLE IF NOT EXISTS website_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_owners_email ON website_owners (email);
