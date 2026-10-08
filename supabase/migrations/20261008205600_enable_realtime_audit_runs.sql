-- Enable Realtime for audit_runs
begin;
  -- Remove it first if it already exists to prevent errors, though typically we just add
  -- But standard way is to just add it. If it's already there it might error, so we can do a safe add.
  do $$
  begin
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = 'audit_runs'
    ) then
      alter publication supabase_realtime add table public.audit_runs;
    end if;
  end
  $$;
commit;
