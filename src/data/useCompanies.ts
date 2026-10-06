import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { DbCompany } from './companyStore';
import { useCompanyStore } from './companyStore';
import type { LiveIdxCompany } from '../services/sectorsApi';

// Shared by overview and watchlist so opening the overview first also loads metadata.
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Array<LiveIdxCompany & DbCompany>> => {
      const { data, error } = await supabase
        .from('companies')
        .select('*, global_market_snapshots(*)');
      if (error) throw error;
      const companies: Array<LiveIdxCompany & DbCompany> = (data ?? [])
        .filter(d => d.symbol !== 'IHSG')
        .map(d => ({
        symbol: d.symbol,
        name: d.name,
        sector: d.sector,
        subSector: d.sub_sector,
        marketCapTier: d.market_cap_tier,
        market_cap: d.market_cap,
        marketCapTrillion: d.market_cap ? d.market_cap / 1_000_000_000_000 : 0,
        lastPrice: Array.isArray(d.global_market_snapshots)
          ? (d.global_market_snapshots[0]?.last_price ?? 0)
          : (d.global_market_snapshots?.last_price ?? 0),
        indexMembership: [],
        description: '',
        rank: 0,
      }));
      useCompanyStore.getState().setCompanies(companies);
      return companies;
    },
  });
}
