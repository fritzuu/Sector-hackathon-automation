create policy "allow authenticated select"
on public.telegram_outbox
for select
to authenticated
using (true);
