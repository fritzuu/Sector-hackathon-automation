ALTER TABLE public.user_workspaces
  ADD COLUMN IF NOT EXISTS ticker_states JSONB NOT NULL DEFAULT '{}'::jsonb;
