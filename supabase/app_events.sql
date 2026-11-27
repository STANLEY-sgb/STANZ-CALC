-- Optional backend for cross-device analytics aggregation (see README "Analytics
-- & admin dashboard"). Run this in the Supabase SQL editor for your project, then
-- set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (and optionally
-- VITE_SUPABASE_EVENTS_TABLE if you rename the table) in your build environment.
--
-- SECURITY NOTE: this is a purely static client with no server component, so both
-- inserting and reading events happen directly from the browser using the public
-- anon key. The policies below necessarily allow the anon role to INSERT and
-- SELECT from this table — meaning anyone who has your anon key (it ships inside
-- your public JS bundle) can read every row via Supabase's REST API directly,
-- not just through the passcode-gated /admin page. That passcode only gates the
-- dashboard UI; it does not and cannot protect the underlying table. Do not store
-- anything sensitive in `props`, and treat this table as public data. If you need
-- real access control, put a server (or a Supabase Edge Function using the
-- service-role key, never exposed to the client) between the browser and the
-- database instead of writing/reading the table directly from anon.

create table if not exists public.app_events (
  id uuid primary key,
  event text not null check (
    event in (
      'app_first_install',
      'app_session_start',
      'apk_download_clicked',
      'ios_install_prompt_shown',
      'ios_pwa_installed',
      'feature_used'
    )
  ),
  device_id text not null,
  platform text not null check (platform in ('android-apk', 'ios-pwa', 'ios-safari', 'web-desktop')),
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_events_device_id_idx on public.app_events (device_id);
create index if not exists app_events_event_idx on public.app_events (event);
create index if not exists app_events_created_at_idx on public.app_events (created_at desc);

alter table public.app_events enable row level security;

create policy "anon can insert events"
  on public.app_events for insert
  to anon
  with check (true);

create policy "anon can read events"
  on public.app_events for select
  to anon
  using (true);
