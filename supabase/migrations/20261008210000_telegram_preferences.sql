-- Separate account settings from profile/workspace upserts.
create table public.telegram_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  sections text[] not null default array['price','benchmark','volume','engine','filings','news'],
  updated_at timestamptz not null default now(),
  constraint telegram_preferences_sections_valid check (
    cardinality(sections) between 1 and 6
    and sections <@ array['price','benchmark','volume','engine','filings','news']::text[]
    and array_position(sections, null) is null
  )
);
alter table public.telegram_preferences enable row level security;
revoke all on public.telegram_preferences from anon, authenticated;
grant select, insert, update on public.telegram_preferences to authenticated;
grant all on public.telegram_preferences to service_role;
create policy "telegram_preferences: select own" on public.telegram_preferences
  for select to authenticated using (user_id = auth.uid());
create policy "telegram_preferences: insert own" on public.telegram_preferences
  for insert to authenticated with check (user_id = auth.uid());
create policy "telegram_preferences: update own" on public.telegram_preferences
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
