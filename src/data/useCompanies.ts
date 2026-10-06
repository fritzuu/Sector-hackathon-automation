import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { DbCompany } from './companyStore';
import { useCompanyStore } from './companyStore';
import type { LiveIdxCompany } from '../services/sectorsApi';
import { mapCompanyRow } from './companyMapping';

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
      const companies = (data ?? []).map(mapCompanyRow).filter(company => company.symbol);
      useCompanyStore.getState().setCompanies(companies);
      return companies;
    },
  });
}
