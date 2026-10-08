begin;

create table if not exists public.automation_runs (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('cron', 'manual')),
  mode text not null check (mode in ('workflow', 'preview')),
  checkpoint text not null check (checkpoint in ('morning', 'evening')),
  status text not null default 'RUNNING' check (status in ('RUNNING', 'SUCCESS', 'PARTIAL', 'INCOMPLETE', 'FAILED')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  tickers_count integer not null default 0,
  active_triggers_count integer not null default 0,
  error_code text
);
create index if not exists automation_runs_user_started on public.automation_runs(user_id, started_at desc);
alter table public.automation_runs enable row level security;
revoke all on public.automation_runs from anon, authenticated;
grant select on public.automation_runs to authenticated;
grant all on public.automation_runs to service_role;
drop policy if exists automation_runs_select_own on public.automation_runs;
create policy automation_runs_select_own on public.automation_runs for select to authenticated using (user_id = auth.uid());
alter table public.audit_runs add column if not exists automation_run_id uuid references public.automation_runs(id) on delete set null;
alter table public.telegram_outbox add column if not exists automation_run_id uuid references public.automation_runs(id) on delete set null;
create index if not exists telegram_outbox_automation_run on public.telegram_outbox(automation_run_id);

-- Mark only the existing workflow job. Preserve schedule, headers and credentials.
-- The old handler ignores this query parameter until the monitoring build is deployed.
do $$
declare job record; updated_command text;
begin
  if to_regclass('cron.job') is not null then
    for job in execute 'select jobid, command from cron.job where jobname = ''invoke-siba-workflow''' loop
      if position('trigger_source=cron' in job.command) > 0 then continue; end if;
      if position('/functions/v1/siba-workflow?' in job.command) > 0 then
        raise exception 'Existing workflow query parameters require an explicit migration';
      end if;
      updated_command := replace(job.command, '/functions/v1/siba-workflow', '/functions/v1/siba-workflow?trigger_source=cron');
      if updated_command = job.command then
        raise exception 'Workflow URL was not found; Cron was left unchanged';
      end if;
      perform cron.alter_job(job_id := job.jobid, command := updated_command);
    end loop;
  end if;
end $$;

-- Return metadata only: never expose job commands, headers, return messages or other users' data.
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
      where j.jobname in ('invoke-siba-workflow', 'invoke-telegram-worker')
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
