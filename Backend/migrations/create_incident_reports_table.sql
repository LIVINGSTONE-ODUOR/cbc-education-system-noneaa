-- Creates the incident_reports table referenced by ReportIncidentPage.tsx
-- and SystemStatusPage.tsx, which currently doesn't exist in the database
-- ("Could not find the table 'public.incident_reports' in the schema cache").
--
-- Run this in the Supabase SQL editor (or via your migration pipeline).

create extension if not exists pgcrypto; -- for gen_random_uuid()

create table if not exists public.incident_reports (
  id                 uuid primary key default gen_random_uuid(),
  reporter_name      text,
  reporter_email     text,
  incident_type      text not null,
  affected_service   text,
  severity           text not null,
  title              text not null,
  description        text not null,
  steps_to_reproduce text,
  status             text not null default 'open'
                       check (status in ('open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Keep updated_at current on every edit (e.g. when your team changes status).
create or replace function public.set_incident_reports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_incident_reports_updated_at on public.incident_reports;
create trigger trg_incident_reports_updated_at
  before update on public.incident_reports
  for each row execute function public.set_incident_reports_updated_at();

-- ─── Row-level security ─────────────────────────────────────────────────────
-- Anyone (anon key, from ReportIncidentPage.tsx) can submit a report.
-- Nobody can SELECT the base table directly, so reporter_name/reporter_email
-- are never exposed to the public status page or anyone else querying with
-- the anon key.

alter table public.incident_reports enable row level security;

drop policy if exists "Anyone can submit an incident report" on public.incident_reports;
create policy "Anyone can submit an incident report"
  on public.incident_reports
  for insert
  to anon, authenticated
  with check (true);

-- No select/update/delete policies for anon/authenticated on the base table
-- — only your service role (used server-side, e.g. an admin panel) can read
-- or triage full rows, since it bypasses RLS by default.

-- ─── Public-safe view for the status page ──────────────────────────────────
-- Exposes only what's safe to show publicly. Owned by the migration role,
-- so it can read the RLS-protected base table while only ever surfacing
-- these columns — reporter PII is structurally excluded, not just left out
-- of the frontend query.

create or replace view public.public_incident_reports as
  select id, title, description, severity, affected_service, status, created_at, updated_at
  from public.incident_reports;

grant select on public.public_incident_reports to anon, authenticated;
