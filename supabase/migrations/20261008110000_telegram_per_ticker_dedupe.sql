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
  checkpoint_key text;
begin
  if coalesce(cardinality(p_item_keys), 0) = 0 then
    return null;
  end if;

  checkpoint_key := p_user_id::text || ':' || p_checkpoint || ':' || p_digest_date::text;
  digest_key := checkpoint_key || ':' || md5(p_item_keys::text);
  perform pg_advisory_xact_lock(hashtextextended(checkpoint_key, 0));

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