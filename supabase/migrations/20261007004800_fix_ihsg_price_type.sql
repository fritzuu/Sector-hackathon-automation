ALTER TABLE public.global_market_snapshots
ALTER COLUMN ihsg_price TYPE numeric USING ihsg_price::numeric;
