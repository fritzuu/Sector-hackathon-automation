import { describe, expect, it } from 'vitest';
import { buildMarketActivityRows, filterMarketActivityRows } from '../src/modules/dashboard/marketActivity';
import type { DbCompany } from '../src/data/companyStore';

describe('market activity with database companies', () => {
  const company: DbCompany = {
    symbol: 'BBCA', name: 'Bank Central Asia', sector: 'Financials',
    subSector: 'Banks', marketCapTier: 'large', market_cap: 100_000_000_000_000,
  };

  it('uses database metadata and excludes missing snapshots', () => {
    const rows = buildMarketActivityRows(['BBCA', 'BBRI'], new Map([
      ['BBCA', { lastPrice: 9000, todayVolume: 100, changePercent: 2, lastUpdated: '2026-10-06T09:30:00Z' }],
    ]), [company]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: company.name, subsector: 'Banks', estimatedValue: 900000, date: '2026-10-06' });
  });

  it('keeps real snapshot rows usable while metadata is unavailable', () => {
    const rows = buildMarketActivityRows(['BBCA'], new Map([
      ['BBCA', { lastPrice: 9000, todayVolume: 100, changePercent: 2, lastUpdated: '2026-10-06T09:30:00Z' }],
    ]), []);
    expect(rows[0]).toMatchObject({ name: 'BBCA', subsector: 'Lainnya' });
  });

  it('orders the down tab by the largest decline and filters subsectors', () => {
    const rows = [-1, -7, 2].map((changePercent, i) => ({
      symbol: String(i), name: String(i), subsector: 'Banks', close: 100,
      volume: 100, estimatedValue: 10000, changePercent, date: '2026-10-06',
    }));
    expect(filterMarketActivityRows(rows, 'down', 'Banks').map(row => row.changePercent)).toEqual([-7, -1]);
    expect(filterMarketActivityRows(rows, 'up', 'Energy')).toEqual([]);
  });
});
