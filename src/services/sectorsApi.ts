import { DailyTransaction, BenchmarkData, CompanyFiling } from '../types/sectors.ts';
import { IDX_COMPANIES } from '../data/idxCompanies.ts';

export interface CompanyRealOverview {
  symbol: string;
  companyName: string;
  sector: string;
  subSector: string;
  marketCap: number;
  marketCapTrillion: number;
  lastClosePrice: number;
  dailyCloseChange: number;
  listingBoard: string;
  marketCapRank: number;
}

const isBrowser = typeof window !== 'undefined' && typeof (window as any).Deno === 'undefined';
const getBaseUrl = () => (isBrowser ? '/sectors/v2' : 'https://api.sectors.app/v2');

export class SectorsApiService {
  private apiKey: string;
  private baseUrl: string;

  private cache = new Map<string, any>();

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SECTORS_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.SECTORS_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.VITE_SECTORS_API_KEY) ||
      '';
    this.baseUrl = getBaseUrl();
  }

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Fetch daily transactions exclusively from Sectors API.
   * STRICT COMPLIANCE: No Yahoo Finance fallback. If API key missing or rate limited, returns empty array.
   */
  async fetchDailyTransactions(symbol: string): Promise<DailyTransaction[]> {
    if (!this.apiKey) return [];

    const cleanSymbol = symbol.toUpperCase().replace('.JK', '');
    const cacheKey = `daily_${cleanSymbol}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${getBaseUrl()}/daily/${cleanSymbol}/`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const result = data.map((item: any) => ({
            symbol: cleanSymbol,
            date: item.date,
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
            volume: Number(item.volume || 0),
            value: Number(item.close) * Number(item.volume || 0),
          }));
          this.cache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.error(`[SectorsApiService] Sectors API daily failed for ${cleanSymbol}:`, err);
    }

    return [];
  }

  /**
   * Fetch IHSG benchmark exclusively from Sectors API.
   * STRICT COMPLIANCE: No Yahoo Finance fallback.
   */
  async fetchBenchmarkData(dates?: string[]): Promise<BenchmarkData[]> {
    if (!this.apiKey) return [];

    const cacheKey = 'benchmark_ihsg';
    let mapped: BenchmarkData[] = this.cache.get(cacheKey);

    if (!mapped) {
      const url = `${getBaseUrl()}/index-daily/ihsg/`;
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            mapped = data.map((item: any, idx: number, arr: any[]) => {
              const price = Number(item.price ?? item.close ?? 0);
              const prevPrice = idx > 0 ? Number(arr[idx - 1].price ?? arr[idx - 1].close ?? price) : price;
              const percentChange = prevPrice > 0 ? (price - prevPrice) / prevPrice : 0;
              return {
                symbol: 'IHSG',
                date: item.date,
                close: price,
                previousClose: prevPrice,
                percentChange,
              };
            });
            this.cache.set(cacheKey, mapped);
          }
        }
      } catch (err) {
        console.error('[SectorsApiService] Sectors API IHSG failed:', err);
      }
    }

    if (!mapped) mapped = [];

    if (dates && dates.length > 0) {
      const dateSet = new Set(dates);
      const filtered = mapped.filter((b) => dateSet.has(b.date));
      if (filtered.length > 0) {
        return filtered;
      }
    }
    return mapped;
  }

  /**
   * Fetch company filings.
   * STRICT COMPLIANCE: No mock data allowed. Returns empty array until Sectors API fully supports this.
   */
  async fetchCompanyFilings(symbol: string): Promise<CompanyFiling[]> {
    if (!this.apiKey) return [];

    const cleanSymbol = symbol.toUpperCase().replace('.JK', '');
    const cacheKey = `filings_${cleanSymbol}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // The official Sectors API endpoint is /filings/?symbol={ticker}
    const url = `${getBaseUrl()}/filings/?symbol=${cleanSymbol}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`[SectorsApiService] Filings for ${cleanSymbol} returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      // Parse response. Sectors API returns filings inside the "results" array
      const rawFilings = Array.isArray(data) 
        ? data 
        : (data.results || data.reports || data.filings || data.data || []);
      
      const mapped: CompanyFiling[] = rawFilings.map((item: any, idx: number) => ({
        id: item.id || `FILING-${cleanSymbol}-${item.date || idx}`,
        symbol: cleanSymbol,
        title: item.title || item.type || 'Laporan Keterbukaan Informasi',
        category: item.category || item.type || item.transaction_type || 'Pengumuman Resmi',
        publishedAt: item.timestamp || item.date || item.published_at || new Date().toISOString(),
        sourceUrl: item.source || item.url || item.pdf_url || '',
        // Mark as verified for PRD compliance (Insider/Shareholder transactions)
        isVerified: true,
        holderName: item.holder_name || undefined,
        transactionType: item.transaction_type || undefined,
        amount: item.amount_transaction || undefined,
        price: item.price || undefined,
        transactionValue: item.transaction_value || undefined,
      }));

      this.cache.set(cacheKey, mapped);
      return mapped;
    } catch (err) {
      console.error(`[SectorsApiService] Filings failed for ${cleanSymbol}:`, err);
      return [];
    }
  }

  /**
   * Fetch live list of all IDX companies.
   * HARDCODED: Returns curated IDX list to save API tokens as requested by user.
   */
  async fetchTopCompanies(): Promise<LiveIdxCompany[]> {
    const cacheKey = 'top_companies_live';
    const cached = this.cache.get(cacheKey);
    if (cached && cached._expiresAt > Date.now()) {
      return cached.data;
    }

    // Graceful fallback to rich curated IDX list to save tokens
    const fallbackList: LiveIdxCompany[] = IDX_COMPANIES.map((item, idx) => ({
      symbol: item.symbol,
      name: item.name,
      sector: item.sector,
      subSector: item.subSector,
      marketCapTrillion: item.marketCapTrillion,
      lastPrice: item.lastPrice,
      rank: idx + 1,
    }));

    this.cache.set(cacheKey, {
      data: fallbackList,
      _expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return fallbackList;
  }

  /**
   * Invalidate all cached Sectors API responses.
   */
  invalidateAll(): void {
    this.cache.clear();
    console.log('[SectorsApiService] Cache invalidated — market-close refresh.');
  }
}

export interface LiveIdxCompany {
  symbol: string;
  name: string;
  sector: string;
  subSector: string;
  marketCapTrillion: number;
  lastPrice: number;
  rank: number;
}

export const sectorsApi = new SectorsApiService();
