alter table public.telegram_outbox
  add column if not exists user_id uuid references public.profiles (id) on delete cascade,
  add column if not exists checkpoint text,
  add column if not exists digest_date date,
  add column if not exists delivery_keys text[] not null default '{}',
  add column if not exists dedupe_key text;

create unique index if not exists idx_telegram_outbox_dedupe_key
  on public.telegram_outbox (dedupe_key)
  where dedupe_key is not null;

create table if not exists public.telegram_delivery_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  chat_id text not null,
  item_key text not null,
  status text not null check (status in ('pending', 'queued', 'sent', 'unknown')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, chat_id, item_key)
);

alter table public.telegram_delivery_items enable row level security;

create index if not exists idx_telegram_delivery_items_pending
  on public.telegram_delivery_items (status, user_id, chat_id);

grant select, insert, update on public.telegram_delivery_items to service_role;

create or replace function public.enqueue_telegram_digest(
  p_user_id uuid,
  p_chat_id text,
  p_checkpoint text,
  p_digest_date date,
  p_message text,
  p_item_keys text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  digest_id uuid;
  digest_key text;
begin
  if coalesce(cardinality(p_item_keys), 0) = 0 then
    return null;
  end if;

  digest_key := p_user_id::text || ':' || p_checkpoint || ':' || p_digest_date::text;
  perform pg_advisory_xact_lock(hashtextextended(digest_key, 0));

  if exists (
    select 1
    from public.telegram_delivery_items
    where user_id = p_user_id
      and chat_id = p_chat_id
      and item_key = any(p_item_keys)
      and status in ('queued', 'sent', 'unknown')
  ) then
    return null;
  end if;

  insert into public.telegram_outbox (
    user_id,
    chat_id,
    message,
    status,
    checkpoint,
    digest_date,
    delivery_keys,
    dedupe_key
  ) values (
    p_user_id,
    p_chat_id,
    p_message,
    'pending',
    p_checkpoint,
    p_digest_date,
    p_item_keys,
    digest_key
  )
  on conflict (dedupe_key) where dedupe_key is not null do nothing
  returning id into digest_id;

  if digest_id is null then
    return null;
  end if;

  insert into public.telegram_delivery_items (user_id, chat_id, item_key, status)
  select p_user_id, p_chat_id, item_key, 'queued'
  from unnest(p_item_keys) as item_keys(item_key)
  on conflict (user_id, chat_id, item_key) do update
    set status = 'queued', updated_at = timezone('utc'::text, now())
    where public.telegram_delivery_items.status = 'pending';

  return digest_id;
end;
$$;

revoke all on function public.enqueue_telegram_digest(uuid, text, text, date, text, text[]) from public, anon, authenticated;
grant execute on function public.enqueue_telegram_digest(uuid, text, text, date, text, text[]) to service_role;