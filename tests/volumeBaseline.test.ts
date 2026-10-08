import { describe, expect, it } from 'vitest';
import { evaluateAbnormalVolume } from '../src/engine/rules/abnormalVolume.ts';
import { mapDailyTransactions } from '../src/services/sectorsApi.ts';
import { formatTelegramHtml } from '../src/engine/telegramFormatter.ts';

const sessions = () => Array.from({ length: 21 }, (_, index) => ({
  symbol: 'BBCA', date: `2026-09-${String(index + 1).padStart(2, '0')}`,
  open: 100, high: 100, low: 100, close: 100,
  volume: index === 20 ? 200 : 100, value: 10000,
}));

describe('volume baseline', () => {
  it('excludes the target from the 20 prior sessions and includes the threshold', () => {
    const result = evaluateAbnormalVolume(sessions().reverse());
    expect(result.isTriggered).toBe(true);
    expect(result.evidence).toMatchObject({ medianVolume20Days: 100, multiplier: 2, tradingDaysEvaluated: 20 });
  });
  it('does not count duplicate dates as additional sessions', () => {
    const rows = sessions().slice(1);
    const result = evaluateAbnormalVolume([...rows, rows[0]]);
    expect(result.isTriggered).toBe(false);
    expect(result.missingDataReasons?.length).toBeGreaterThan(0);
    expect(result.evidence).toMatchObject({ tradingDaysEvaluated: 19 });
  });
  it('refuses inconsistent, invalid, or zero-median baselines', () => {
    const conflicting = sessions();
    for (const rows of [
      [...conflicting, { ...conflicting[0], volume: 999 }],
      sessions().map((row, index) => ({ ...row, volume: index === 0 ? NaN : row.volume })),
      sessions().map((row) => ({ ...row, volume: 0 })),
    ]) {
      const result = evaluateAbnormalVolume(rows);
      expect(result.isTriggered).toBe(false);
      expect(result.missingDataReasons?.length).toBeGreaterThan(0);
    }
  });
  it('preserves missing API volume as unavailable instead of fabricating zero', () => {
    const mapped = mapDailyTransactions([{ ...sessions()[0], volume: null }], 'BBCA');
    expect(Number.isNaN(mapped[0].volume)).toBe(true);
  });
  it('renders a real baseline even when a repeated session has no new engine evaluation', () => {
    const message = formatTelegramHtml('BBCA', 'MONITORING', {
      asOfDate: '2026-09-21', facts: [], limitedInterpretations: [],
    }, { prices: sessions(), evalResult: null, includeSections: ['volume'] });
    expect(message).toContain('Rasio terhadap median 20 sesi: 2x');
    expect(message).not.toContain('tidak tersedia');
  });
});
