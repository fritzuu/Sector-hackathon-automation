begin;
-- Preserve authenticated command and stop the superseded second evaluation.
do $$
declare job record; updated_command text;
begin
  select jobid, command into job from cron.job where jobname = 'invoke-siba-workflow';
  if job.jobid is null then raise exception 'Morning workflow Cron is required'; end if;
  updated_command := replace(replace(job.command, 'phase=briefing', 'phase=workflow'), 'phase=evaluation', 'phase=workflow');
  if position('/siba-workflow' in updated_command) = 0 then raise exception 'Unexpected workflow URL'; end if;
  perform cron.alter_job(job_id := job.jobid, schedule := '0 0 * * 1-5', command := updated_command);
  for job in select jobid from cron.job where jobname = 'invoke-siba-cases' loop
    perform cron.alter_job(job_id := job.jobid, active := false);
  end loop;
end $$;
commit;
