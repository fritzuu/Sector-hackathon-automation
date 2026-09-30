-- Add a CHECK constraint to enforce a maximum of 5 tickers in the watchlist array
ALTER TABLE public.profiles 
ADD CONSTRAINT watchlist_max_size_limit 
CHECK (jsonb_array_length(watchlist) <= 5);
