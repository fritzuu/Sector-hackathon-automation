// Pure TypeScript interfaces for cross-compatibility between Vite and Deno Edge Functions
export interface DailyTransaction {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value?: number;
}

export interface BenchmarkData {
  symbol: string;
  date: string;
  close: number;
  previousClose?: number;
  percentChange: number;
}

export interface CompanyFiling {
  id: string;
  symbol: string;
  title: string;
  category: string;
  publishedAt: string;
  sourceUrl?: string;
  isVerified: boolean;
  // Rich data fields from Insider Transactions
  holderName?: string;
  transactionType?: 'buy' | 'sell' | string;
  amount?: number;
  price?: number;
  transactionValue?: number;
}

export interface SectorsNewsArticle {
  title: string;
  body?: string;
  source: string;
  publishedAt: string;
  symbols: string[];
  sector?: string;
  subSector?: string[];
}

export interface SectorsNewsPage {
  articles: SectorsNewsArticle[];
  hasNext: boolean;
  nextOffset: number | null;
}

export interface TickerDataset {
  symbol: string;
  asOfDate: string;
  historicalPrices: DailyTransaction[];
  benchmarkPrices: BenchmarkData[];
  filings: CompanyFiling[];
  seenFilingIds?: string[] | null;
}
