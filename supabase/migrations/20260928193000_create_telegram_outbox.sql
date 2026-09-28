create table if not exists public.telegram_outbox (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null,
  message text not null,
  status text not null default 'pending', -- 'pending', 'processing', 'sent', 'failed'
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_telegram_outbox_status on public.telegram_outbox (status);
alter table public.telegram_outbox enable row level security;

create policy "allow service role full access to telegram_outbox"
  on public.telegram_outbox
  using (true)
  with check (true);
