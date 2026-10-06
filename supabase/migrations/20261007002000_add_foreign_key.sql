ALTER TABLE public.global_market_snapshots
ADD CONSTRAINT global_market_snapshots_symbol_fkey 
FOREIGN KEY (symbol) REFERENCES public.companies(symbol) ON DELETE CASCADE;
