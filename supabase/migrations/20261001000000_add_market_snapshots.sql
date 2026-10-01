ALTER TABLE user_workspaces ADD COLUMN IF NOT EXISTS market_snapshots JSONB DEFAULT '{}'::jsonb;
