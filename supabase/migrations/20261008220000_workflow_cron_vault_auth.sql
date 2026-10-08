begin;
-- Bootstrap siba_workflow_service_key in Vault with the active backend credential first.
-- Keep credentials out of Cron commands and the repository.
do $$
declare target_job bigint;
begin
  if not exists (select 1 from vault.secrets where name = 'siba_workflow_service_key') then
    raise exception 'Active workflow credential must be provisioned in Vault first';
  end if;
  select jobid into target_job from cron.job where jobname = 'invoke-siba-workflow';
  if target_job is null then raise exception 'Morning workflow Cron is required'; end if;
  perform cron.alter_job(job_id := target_job, command := $command$
    select net.http_post(
      url := 'https://tdqwrfcaxxswmrtwcxyd.supabase.co/functions/v1/siba-workflow?phase=workflow',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'siba_workflow_service_key' limit 1
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
  $command$);
end $$;
commit;
