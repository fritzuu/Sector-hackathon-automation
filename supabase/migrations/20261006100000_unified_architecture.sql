-- 1. Create global_market_snapshots
CREATE TABLE public.global_market_snapshots (
  symbol text primary key,
  last_price bigint not null,
  change_amount bigint not null,
  change_percent numeric not null,
  today_volume bigint not null,
  median_volume_20d bigint not null,
  ihsg_price bigint not null,
  ihsg_change_percent numeric not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

ALTER TABLE public.global_market_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "global_market_snapshots_select_all" ON public.global_market_snapshots FOR SELECT TO authenticated USING (true);

-- 2. Create companies
CREATE TABLE public.companies (
  symbol text primary key,
  name text not null,
  sector text,
  sub_sector text,
  market_cap_tier text,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_select_all" ON public.companies FOR SELECT TO authenticated USING (true);

-- 3. Add limit tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN daily_watchlist_additions integer not null default 0,
ADD COLUMN last_addition_date date not null default current_date;

-- 4. Create trigger to enforce 20 additions per day limit
CREATE OR REPLACE FUNCTION public.check_daily_watchlist_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_elements_count integer;
BEGIN
  -- If watchlist didn't change, allow it
  IF NEW.watchlist = OLD.watchlist THEN
    RETURN NEW;
  END IF;

  -- Reset counter if it's a new day
  IF OLD.last_addition_date < CURRENT_DATE THEN
    NEW.daily_watchlist_additions := 0;
    NEW.last_addition_date := CURRENT_DATE;
  ELSE
    NEW.daily_watchlist_additions := OLD.daily_watchlist_additions;
    NEW.last_addition_date := OLD.last_addition_date;
  END IF;

  -- Calculate how many new elements are in NEW.watchlist that aren't in OLD.watchlist
  SELECT COUNT(*)
  INTO new_elements_count
  FROM (
    SELECT jsonb_array_elements_text(NEW.watchlist)
    EXCEPT
    SELECT jsonb_array_elements_text(OLD.watchlist)
  ) AS new_items;

  -- Add the new elements to the daily counter
  IF new_elements_count > 0 THEN
    NEW.daily_watchlist_additions := NEW.daily_watchlist_additions + new_elements_count;
    
    -- Check if it exceeds the limit
    IF NEW.daily_watchlist_additions > 20 THEN
      RAISE EXCEPTION 'Daily watchlist addition limit (20) exceeded.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_watchlist_daily_limit
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_daily_watchlist_limit();
