-- ─────────────────────────────────────────────────────────────────────────────
-- SIBA Watchtower - Supabase Database Schema
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

-- 2. Create audit_runs table
create table if not exists public.audit_runs (
  id text primary key,
  user_id text references public.profiles(id) on delete set null,
  timestamp text not null,
  tickers_count integer default 0,
  active_triggers_count integer default 0,
  status text default 'SUCCESS',
  duration_ms integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_audit_runs_user_id on public.audit_runs (user_id);
create index if not exists idx_audit_runs_created_at on public.audit_runs (created_at desc);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.audit_runs enable row level security;

-- 4. Policies for Anonymous / Authenticated Access
create policy "Allow all access to profiles"
  on public.profiles
  for all
  using (true)
  with check (true);

create policy "Allow all access to audit_runs"
  on public.audit_runs
  for all
  using (true)
  with check (true);

-- 5. Seed default demo profiles
insert into public.profiles (id, email, name, role, pairing_token, telegram_chat_id, telegram_username, is_telegram_linked, watchlist)
values
  (
    'usr-budi-01',
    'budi.santoso@gmail.com',
    'Budi Santoso',
    'Investor Ritel',
    'PAIR_BUDI_891',
    '829104821',
    '@budisantoso_idx',
    true,
    '["BBCA", "TLKM", "UNTR"]'::jsonb
  ),
  (
    'usr-sarah-02',
    'sarah.wijaya@outlook.com',
    'Sarah Wijaya',
    'Swing Trader',
    'PAIR_SARAH_412',
    null,
    null,
    false,
    '["ASII", "ANTM", "ADRO", "GOTO"]'::jsonb
  )
on conflict (id) do nothing;
