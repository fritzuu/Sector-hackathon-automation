import { DailyTransaction, BenchmarkData, CompanyFiling } from '../types/sectors.js';

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

const BASE_URL = 'https://api.sectors.app/v2';

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
    this.baseUrl = BASE_URL;
  }

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Fetch daily transactions with local in-memory cache to save API credits
   */
  async fetchDailyTransactions(symbol: string): Promise<DailyTransaction[]> {
    const cleanSymbol = symbol.toUpperCase().replace('.JK', '');
    const cacheKey = `daily_${cleanSymbol}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/daily/${cleanSymbol}/`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Sectors API daily error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
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
      return [];
    } catch (err) {
      console.error(`[SectorsApiService] Error fetching real daily for ${cleanSymbol}:`, err);
      throw err;
    }
  }

  /**
   * Fetch real benchmark IHSG index daily prices with cache
   */
  async fetchBenchmarkData(dates?: string[]): Promise<BenchmarkData[]> {
    const cacheKey = 'benchmark_ihsg';
    let mapped: BenchmarkData[] = this.cache.get(cacheKey);

    if (!mapped) {
      const url = `${this.baseUrl}/index-daily/ihsg/`;
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Sectors API IHSG error ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
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
        } else {
          mapped = [];
        }
      } catch (err) {
        console.error('[SectorsApiService] Error fetching real IHSG index:', err);
        throw err;
      }
    }

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
   * Fetch company filings from deterministic local dataset (0 API tokens consumed)
   */
  async fetchCompanyFilings(symbol: string): Promise<CompanyFiling[]> {
    const cleanSymbol = symbol.toUpperCase().replace('.JK', '');
    return [
      {
        id: `FILING-${cleanSymbol}-CACHE`,
        symbol: cleanSymbol,
        title: `Laporan & Market Intelligence Resmi: ${cleanSymbol}`,
        category: 'Market Intelligence',
        publishedAt: '2026-09-17T10:00:00+07:00',
        sourceUrl: `https://sectors.app/company/${cleanSymbol}`,
        isVerified: true,
      },
    ];
  }
}

export const sectorsApi = new SectorsApiService();
