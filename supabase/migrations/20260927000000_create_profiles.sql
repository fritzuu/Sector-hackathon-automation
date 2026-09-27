-- ─────────────────────────────────────────────────────────────────────────────
-- SIBA Watchtower - Migration: Create Profiles & Audit Runs with Per-User RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create profiles table
create table if not exists public.profiles (
  id text primary key,
  email text not null,
  name text not null,
  avatar text default '',
  role text default 'Investor Ritel',
  pairing_token text unique,
  telegram_chat_id text,
  telegram_username text,
  is_telegram_linked boolean default false,
  watchlist jsonb default '["BBCA", "TLKM", "UNTR"]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for quick lookups
create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_pairing_token on public.profiles (pairing_token);
create index if not exists idx_profiles_telegram_chat_id on public.profiles (telegram_chat_id);

-- 2. Create audit_runs table (user_id references profiles with cascade delete)
create table if not exists public.audit_runs (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  timestamp text not null,
  tickers_count integer default 0,
  active_triggers_count integer default 0,
  status text default 'SUCCESS',
  duration_ms integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_audit_runs_user_id on public.audit_runs (user_id);
create index if not exists idx_audit_runs_created_at on public.audit_runs (created_at desc);

-- 3. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.audit_runs enable row level security;

-- 4. Per-user RLS: profiles
--    Authenticated users can only read/write their own profile (id = auth.uid()).
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid()::text = id or auth.role() = 'service_role');

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid()::text = id or auth.role() = 'service_role');

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid()::text = id or auth.role() = 'service_role');

-- 5. Per-user RLS: audit_runs
--    Authenticated users can only read/insert their own audit runs.
create policy "audit_runs: select own"
  on public.audit_runs for select
  using (auth.uid()::text = user_id or auth.role() = 'service_role');

create policy "audit_runs: insert own"
  on public.audit_runs for insert
  with check (auth.uid()::text = user_id or auth.role() = 'service_role');

-- 6. Bot (anon role) can upsert profiles and insert audit_runs
--    The bot uses the anon/publishable key; it needs to write pairing data.
create policy "profiles: anon upsert for bot"
  on public.profiles for all to anon
  using (true) with check (true);

create policy "audit_runs: anon insert for bot"
  on public.audit_runs for insert to anon
  with check (true);
