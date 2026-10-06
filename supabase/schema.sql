-- ─────────────────────────────────────────────────────────────────────────────
-- SIBA Watchtower — schema produksi (isolasi per akun)
-- Jalankan seluruh file di SQL Editor Supabase:
-- https://supabase.com/dashboard/project/tdqwrfcaxxswmrtwcxyd/sql
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- Hapus schema uji (id teks, user dummy, kebijakan anon terbuka)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.link_telegram_account(text, text, text) cascade;
drop function if exists public.get_profile_by_pairing_token(text) cascade;
drop function if exists public.get_profile_by_chat_id(text) cascade;

drop table if exists public.user_workspaces cascade;
drop table if exists public.audit_runs cascade;
drop table if exists public.profiles cascade;

-- 1. Profil = 1:1 dengan auth.users (UUID)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  avatar text not null default '',
  role text not null default 'Investor Ritel',
  pairing_token text unique,
  telegram_chat_id text,
  telegram_username text,
  is_telegram_linked boolean not null default false,
  watchlist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index idx_profiles_email on public.profiles (email);
create index idx_profiles_pairing_token on public.profiles (pairing_token);
create index idx_profiles_telegram_chat_id on public.profiles (telegram_chat_id);

-- 2. Riwayat run milik satu akun
create table public.audit_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  run_id text not null,
  timestamp text not null,
  tickers_count integer not null default 0,
  active_triggers_count integer not null default 0,
  status text not null default 'SUCCESS',
  duration_ms integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, run_id)
);

create index idx_audit_runs_user_id on public.audit_runs (user_id);
create index idx_audit_runs_created_at on public.audit_runs (created_at desc);

-- 3. Kasus / event / template per akun
create table public.user_workspaces (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  active_cases jsonb not null default '{}'::jsonb,
  case_events jsonb not null default '{}'::jsonb,
  case_templates jsonb not null default '{}'::jsonb,
  ticker_states jsonb not null default '{}'::jsonb,
  last_run_time text,
  run_index integer not null default 1,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;
alter table public.audit_runs enable row level security;
alter table public.user_workspaces enable row level security;

create policy "profiles: select own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "audit_runs: select own"
  on public.audit_runs for select to authenticated
  using (auth.uid() = user_id);

create policy "audit_runs: insert own"
  on public.audit_runs for insert to authenticated
  with check (auth.uid() = user_id);

create policy "audit_runs: update own"
  on public.audit_runs for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workspaces: select own"
  on public.user_workspaces for select to authenticated
  using (auth.uid() = user_id);

create policy "workspaces: insert own"
  on public.user_workspaces for insert to authenticated
  with check (auth.uid() = user_id);

create policy "workspaces: update own"
  on public.user_workspaces for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Profil otomatis saat daftar di Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar, pairing_token, watchlist)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'pengguna'), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      ''
    ),
    'siba_live_' || encode(gen_random_bytes(12), 'hex'),
    '[]'::jsonb
  )
  on conflict (id) do nothing;

  insert into public.user_workspaces (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. RPC bot Telegram (tanpa membuka seluruh tabel ke anon)
create or replace function public.link_telegram_account(
  p_token text,
  p_chat_id text,
  p_username text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.profiles;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    return json_build_object('ok', false, 'reason', 'invalid_token');
  end if;

  update public.profiles
  set
    telegram_chat_id = p_chat_id,
    telegram_username = p_username,
    is_telegram_linked = true,
    updated_at = timezone('utc'::text, now())
  where pairing_token = p_token
  returning * into rec;

  if rec.id is null then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  return json_build_object(
    'ok', true,
    'id', rec.id,
    'name', rec.name,
    'watchlist', rec.watchlist,
    'telegram_chat_id', rec.telegram_chat_id,
    'telegram_username', rec.telegram_username
  );
end;
$$;

create or replace function public.get_profile_by_pairing_token(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.profiles;
begin
  select * into rec from public.profiles where pairing_token = p_token limit 1;
  if rec.id is null then
    return json_build_object('ok', false);
  end if;
  return json_build_object(
    'ok', true,
    'id', rec.id,
    'name', rec.name,
    'watchlist', rec.watchlist,
    'is_linked', rec.is_telegram_linked,
    'telegram_chat_id', rec.telegram_chat_id,
    'telegram_username', rec.telegram_username
  );
end;
$$;

create or replace function public.get_profile_by_chat_id(p_chat_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.profiles;
begin
  select * into rec
  from public.profiles
  where telegram_chat_id = p_chat_id
  limit 1;
  if rec.id is null then
    return json_build_object('ok', false);
  end if;
  return json_build_object(
    'ok', true,
    'id', rec.id,
    'name', rec.name,
    'watchlist', rec.watchlist,
    'is_linked', rec.is_telegram_linked,
    'telegram_chat_id', rec.telegram_chat_id,
    'telegram_username', rec.telegram_username,
    'pairing_token', rec.pairing_token
  );
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.audit_runs to authenticated;
grant select, insert, update on public.user_workspaces to authenticated;
grant execute on function public.link_telegram_account(text, text, text) to anon, authenticated;
grant execute on function public.get_profile_by_pairing_token(text) to anon, authenticated;
grant execute on function public.get_profile_by_chat_id(text) to anon, authenticated;
