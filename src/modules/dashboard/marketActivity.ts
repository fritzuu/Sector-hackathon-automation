import type { DbCompany } from '../../data/companyStore.js';

export interface MarketSnapshot {
  lastPrice: number;
  changePercent: number;
  todayVolume: number;
  lastUpdated: string;
}

export interface MarketActivityRow {
  symbol: string;
  name: string;
  subsector: string;
  close: number;
  volume: number;
  estimatedValue: number;
  changePercent: number | null;
  date: string;
}

export type MarketActivityTab = 'active' | 'up' | 'down';

export const buildMarketActivityRows = (
  watchlist: string[],
  snapshotsByTicker: Map<string, MarketSnapshot>,
  companies: DbCompany[],
): MarketActivityRow[] => watchlist.flatMap(symbol => {
  const snapshot = snapshotsByTicker.get(symbol);
  if (!snapshot || snapshot.lastPrice <= 0) return [];
  const company = companies.find(item => item.symbol === symbol);
  const updatedAt = new Date(snapshot.lastUpdated);
  const date = Number.isNaN(updatedAt.getTime())
    ? ''
    : updatedAt.toISOString().slice(0, 10);

  return [{
    symbol,
    name: company?.name ?? symbol,
    subsector: company?.subSector ?? 'Lainnya',
    close: snapshot.lastPrice,
    volume: snapshot.todayVolume,
    estimatedValue: snapshot.lastPrice * snapshot.todayVolume,
    changePercent: Number.isFinite(snapshot.changePercent) ? snapshot.changePercent : null,
    date,
  }];
});

export const filterMarketActivityRows = (
  rows: MarketActivityRow[],
  tab: MarketActivityTab,
  subsector: string,
): MarketActivityRow[] => rows
  .filter(row => !subsector || row.subsector === subsector)
  .filter(row => tab === 'active'
    ? true
    : tab === 'up'
      ? row.changePercent !== null && row.changePercent > 0
      : row.changePercent !== null && row.changePercent < 0)
  .sort((a, b) => tab === 'active'
    ? b.estimatedValue - a.estimatedValue
    : tab === 'up'
      ? (b.changePercent ?? 0) - (a.changePercent ?? 0)
      : (a.changePercent ?? 0) - (b.changePercent ?? 0));