import type { DbCompany } from './companyStore';
import type { LiveIdxCompany } from '../services/sectorsApi';

export function mapCompanyRow(row: Record<string, any>): LiveIdxCompany & DbCompany {
  const snapshot = Array.isArray(row.global_market_snapshots)
    ? row.global_market_snapshots[0] : row.global_market_snapshots;
  const text = (value: unknown, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
  const marketCap = typeof row.market_cap === 'number' && Number.isFinite(row.market_cap) && row.market_cap >= 0 ? row.market_cap : null;
  return {
    symbol: text(row.symbol), name: text(row.name, text(row.symbol)),
    sector: text(row.sector, 'Unknown'), subSector: text(row.sub_sector, 'Unknown'),
    marketCapTier: text(row.market_cap_tier, 'Unknown'), market_cap: marketCap,
    marketCapTrillion: marketCap === null ? 0 : marketCap / 1_000_000_000_000,
    lastPrice: typeof snapshot?.last_price === 'number' && Number.isFinite(snapshot.last_price) ? snapshot.last_price : 0,
    rank: 0,
  };
}
