-- Preserve the source trading session separately from ingestion time.
-- Existing rows stay unknown: updated_at cannot prove the source session date.
ALTER TABLE public.global_market_snapshots
ADD COLUMN IF NOT EXISTS data_date date;

COMMENT ON COLUMN public.global_market_snapshots.data_date IS
'Trading session date from Sectors daily data; NULL when unknown.';
