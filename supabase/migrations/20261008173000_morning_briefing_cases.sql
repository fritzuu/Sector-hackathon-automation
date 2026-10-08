begin;
alter table public.global_market_snapshots add column if not exists data_date date;
alter table public.global_market_snapshots add column if not exists ihsg_data_date date;
alter table public.automation_runs drop constraint if exists automation_runs_mode_check;
alter table public.automation_runs add constraint automation_runs_mode_check check (mode in ('workflow', 'preview', 'briefing', 'evaluation'));
-- Reuse the existing authenticated invocation internally. Never return its headers.
do $$
declare original text; briefing text; evaluation text; briefing_id bigint; cases_id bigint;
begin
  select jobid, command into briefing_id, original from cron.job where jobname = 'invoke-siba-workflow';
  if original is null then raise exception 'Existing morning Cron is required'; end if;
  if position('phase=briefing' in original) > 0 then
    briefing := original;
  elsif position('/siba-workflow?trigger_source=cron' in original) > 0 then
    briefing := replace(original, '/siba-workflow?trigger_source=cron', '/siba-workflow?trigger_source=cron&phase=briefing');
  else raise exception 'Unexpected Cron URL; no jobs changed'; end if;
  evaluation := replace(briefing, 'phase=briefing', 'phase=evaluation');
  perform cron.alter_job(job_id := briefing_id, schedule := '0 0 * * 1-5', command := briefing);
  select jobid into cases_id from cron.job where jobname = 'invoke-siba-cases';
  if cases_id is null then perform cron.schedule('invoke-siba-cases', '0 1 * * 1-5', evaluation);
  else perform cron.alter_job(job_id := cases_id, schedule := '0 1 * * 1-5', command := evaluation); end if;
end $$;
create or replace function public.get_automation_status()
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  account_id uuid := auth.uid();
  jobs jsonb := '[]'::jsonb;
  runs jsonb;
  messages jsonb;
  cron_available boolean := to_regclass('cron.job') is not null;
begin
  if account_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if cron_available then
    execute $query$
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', j.jobname, 'active', j.active, 'schedule', j.schedule,
        'timezone', coalesce(nullif(current_setting('cron.timezone', true), ''), 'GMT'),
        'last_started_at', r.start_time, 'last_finished_at', r.end_time, 'last_status', r.status
      ) order by j.jobname), '[]'::jsonb)
      from cron.job j
      left join lateral (
        select start_time, end_time, status from cron.job_run_details where jobid = j.jobid order by runid desc limit 1
      ) r on true
      where j.jobname in ('invoke-siba-workflow', 'invoke-siba-cases', 'invoke-telegram-worker')
    $query$ into jobs;
  end if;

  select coalesce(jsonb_agg(to_jsonb(r) order by r.started_at desc), '[]'::jsonb) into runs from (
    select id::text, source, mode, checkpoint, status, started_at, finished_at,
      tickers_count, active_triggers_count, error_code,
      coalesce((select jsonb_object_agg(d.status, d.total) from (
        select o.status, count(*) as total from public.telegram_outbox o
        where o.automation_run_id = a.id and o.user_id = account_id group by o.status
      ) d), '{}'::jsonb) as delivery_counts
    from public.automation_runs a where user_id = account_id
    union all
    select run_id, 'unknown', 'workflow', null, status,
      case when timestamp ~ '^\d{4}-\d{2}-\d{2}T' then timestamp::timestamptz else created_at end,
      null::timestamptz, tickers_count, active_triggers_count, null, null::jsonb
    from public.audit_runs where user_id = account_id and automation_run_id is null
    order by started_at desc limit 50
  ) r;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at desc), '[]'::jsonb) into messages from (
    select o.id::text, o.status, o.created_at, o.updated_at, o.automation_run_id::text as run_id
    from public.telegram_outbox o
    where o.user_id = account_id or (o.user_id is null and o.chat_id = (
      select telegram_chat_id from public.profiles where id = account_id and is_telegram_linked = true
    ))
    order by o.created_at desc limit 100
  ) m;

  return jsonb_build_object('checked_at', now(), 'cron_available', cron_available, 'jobs', jobs, 'runs', runs, 'messages', messages);
end $$;
revoke all on function public.get_automation_status() from public, anon;
grant execute on function public.get_automation_status() to authenticated;
commit;
