import { describe, expect, it } from 'vitest';
import { mapCompanyRow } from '../src/data/companyMapping';
import { mapSnapshotRow } from '../src/data/snapshotMapping';
import { normalizeTaxonomyValue } from '../src/modules/watchlist/subsectorTaxonomy';
import { evaluateSnapshotMetrics } from '../src/modules/watchlist/snapshotMetrics';
import { toWatchlistMarketData } from '../src/modules/watchlist/watchlist.marketData';
import { precedingVolumeMedian } from '../src/engine/volumeBaseline';
import { buildMarketActivityRows } from '../src/modules/dashboard/marketActivity';

describe('snapshot quality', () => {
  it('normalizes nullable company metadata for search and taxonomy', () => {
    const company = mapCompanyRow({ symbol: 'BBCA', name: null, sector: null, sub_sector: null, market_cap: null });
    expect(company.name).toBe('BBCA');
    expect(company.sector.toLowerCase()).toBe('unknown');
    expect(normalizeTaxonomyValue(company.subSector)).toBe('unknown');
    expect(company.market_cap).toBeNull();
  });

  it.each([0, undefined, NaN, -10])('keeps missing/invalid baseline %s unevaluated in card and modal', medianVolume20d => {
    const snapshot = { lastPrice: 9000, todayVolume: 100, medianVolume20d, volumeMultiplier: 99 };
    expect(evaluateSnapshotMetrics(snapshot).isVolumeAnomaly).toBeNull();
    expect(toWatchlistMarketData(snapshot)?.volumeMultiplier).toBeNull();
  });

  it('uses the unrounded ratio for threshold equality in card and modal', () => {
    const snapshot = { lastPrice: 9000, todayVolume: 1999, medianVolume20d: 1000 };
    expect(evaluateSnapshotMetrics(snapshot).isVolumeAnomaly).toBe(false);
    expect(toWatchlistMarketData(snapshot)?.volumeMultiplier).toBe(1.999);
    expect(evaluateSnapshotMetrics({ ...snapshot, todayVolume: 2000 }).isVolumeAnomaly).toBe(true);
  });

  it('does not evaluate spread against a missing benchmark', () => {
    expect(evaluateSnapshotMetrics({ changePercent: 5, ihsgChangePercent: 0, ihsgPrice: 0 }).isSpreadAnomaly).toBeNull();
  });

  it('requires 20 previous sessions, excludes current volume, and retains zero volumes', () => {
    const rows = Array.from({ length: 21 }, (_, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, volume: i === 20 ? 99999 : 100 }));
    expect(precedingVolumeMedian(rows)).toBe(100);
    expect(precedingVolumeMedian(rows.slice(1))).toBe(0);
    expect(precedingVolumeMedian([...rows, rows[20]])).toBe(100);
    expect(precedingVolumeMedian(rows.map((row, i) => ({ ...row, volume: i < 11 ? 0 : row.volume })))).toBe(0);
  });

  it('preserves source date and never invents it from update time', () => {
    const snapshot = mapSnapshotRow({ symbol: 'BBCA', last_price: 9000, today_volume: 100, change_percent: 1, updated_at: '2026-10-07T01:00:00Z', data_date: '2026-10-06' });
    expect(buildMarketActivityRows(['BBCA'], new Map([['BBCA', snapshot]]), [])[0].date).toBe('2026-10-06');
    expect(buildMarketActivityRows(['BBCA'], new Map([['BBCA', { ...snapshot, dataDate: null }]]), [])[0].date).toBe('');
    expect(buildMarketActivityRows(['BBCA'], new Map([['BBCA', { ...snapshot, dataDate: '2026-02-30' }]]), [])[0].date).toBe('');
  });
});
