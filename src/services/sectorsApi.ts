import { DailyTransaction, BenchmarkData, CompanyFiling } from '../types/sectors.ts';
import { useCompanyStore } from "../data/companyStore.ts";

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

export const DAILY_LOOKBACK_DAYS = 60;

export function wibDateOffset(days: number, now = new Date()): string {
  // Get WIB time (UTC+7)
  const utcMs = now.getTime();
  const wibMs = utcMs + (7 * 60 * 60 * 1000);
  const targetWibMs = wibMs - (days * 24 * 60 * 60 * 1000);
  const targetDate = new Date(targetWibMs);
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function filingFingerprint(item: any, symbol: string): string {
  if (item.source && item.source !== '') return item.source;
  if (item.pdf_url && item.pdf_url !== '') return item.pdf_url;
  return `${symbol}|${item.timestamp || item.date}|${item.holder_name || ''}|${item.transaction_type || ''}|${item.amount_transaction || ''}`;
}

export function mapDailyTransactions(raw: any[], symbol: string): DailyTransaction[] {
  if (!Array.isArray(raw)) return [];
  // Sort ascending by date
  return raw
    .map((item: any) => ({
      symbol,
      date: item.date,
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume || 0),
      value: Number(item.close) * Number(item.volume || 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function mapBenchmark(raw: any[]): BenchmarkData[] {
  if (!Array.isArray(raw)) return [];
  // Sort ascending by date first
  const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((item: any, idx: number, arr: any[]) => {
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
}

export function mapFilings(raw: any, symbol: string): CompanyFiling[] {
  const rawArray = Array.isArray(raw) ? raw : (raw.results || raw.reports || raw.filings || raw.data || []);
  if (!Array.isArray(rawArray)) return [];
  
  return rawArray.map((item: any) => ({
    id: item.id || filingFingerprint(item, symbol),
    symbol,
    title: item.title || item.type || 'Laporan Keterbukaan Informasi',
    category: item.category || item.type || item.transaction_type || 'Pengumuman Resmi',
    publishedAt: item.timestamp || item.date || item.published_at || new Date().toISOString(),
    sourceUrl: item.source || item.url || item.pdf_url || '',
    isVerified: true,
    holderName: item.holder_name || undefined,
    transactionType: item.transaction_type || undefined,
    amount: item.amount_transaction || undefined,
    price: item.price || undefined,
    transactionValue: item.transaction_value || undefined,
  }));
}

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

  async fetchDailyTransactions(symbol: string): Promise<DailyTransaction[]> {
    if (!this.apiKey) return [];

    const cleanSymbol = symbol.toUpperCase().replace('.JK', '');
    const startDate = wibDateOffset(DAILY_LOOKBACK_DAYS);
    const cacheKey = `daily_${cleanSymbol}_${startDate}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${getBaseUrl()}/daily/${cleanSymbol}/?start=${startDate}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const mapped = mapDailyTransactions(data, cleanSymbol);
        if (mapped.length > 0) {
          this.cache.set(cacheKey, mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.error(`[SectorsApiService] Sectors API daily failed for ${cleanSymbol}:`, err);
    }

    return [];
  }

  async fetchBenchmarkData(dates?: string[]): Promise<BenchmarkData[]> {
    if (!this.apiKey) return [];

    const startDate = wibDateOffset(DAILY_LOOKBACK_DAYS);
    const cacheKey = `benchmark_ihsg_${startDate}`;
    let mapped: BenchmarkData[] = this.cache.get(cacheKey);

    if (!mapped) {
      const url = `${getBaseUrl()}/index-daily/ihsg/?start=${startDate}`;
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (response.ok) {
          const data = await response.json();
          mapped = mapBenchmark(data);
          if (mapped.length > 0) {
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

  async fetchCompanyFilings(symbol: string): Promise<CompanyFiling[]> {
    if (!this.apiKey) return [];

    const cleanSymbol = symbol.toUpperCase().replace('.JK', '');
    const cacheKey = `filings_${cleanSymbol}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${getBaseUrl()}/filings/?symbol=${cleanSymbol}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        console.warn(`[SectorsApiService] Filings for ${cleanSymbol} returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      const mapped = mapFilings(data, cleanSymbol);

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
    const fallbackList: LiveIdxCompany[] = useCompanyStore.getState().companies.map((item: any, idx: number) => ({
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
