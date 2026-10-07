-- Enable replication for Realtime on profiles and telegram_outbox
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.telegram_outbox;
