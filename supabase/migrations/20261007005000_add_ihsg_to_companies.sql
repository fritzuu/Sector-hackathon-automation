-- Insert IHSG as a virtual company so it doesn't violate global_market_snapshots_symbol_fkey
INSERT INTO public.companies (symbol, name, sector, sub_sector, market_cap_tier)
VALUES ('IHSG', 'Indeks Harga Saham Gabungan', 'INDEX', 'INDEX', 'N/A')
ON CONFLICT (symbol) DO NOTHING;
