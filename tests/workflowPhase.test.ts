import { describe, expect, it } from 'vitest';
import { runPhaseTicker, completedSessions } from '../supabase/functions/siba-workflow/phase';
import { formatTelegramTickerDigest } from '../src/engine/telegramFormatter';
import { nextScheduledRun } from '../src/modules/automation/lib/automationStatus';

describe('morning phases', () => {
  it('briefing preserves evaluation watermark and incomplete count without events', () => {
    const state = { lastProcessedDataDate: '2026-10-06', seenFilingIds: ['filing'], consecutiveIncompleteRuns: 1 };
    const result = runPhaseTicker('briefing', { symbol: 'BBCA', prices: [], benchmark: [], filings: [], currentCase: null, tickerState: state, runTimestamp: '2026-10-08T00:00:00Z' });
    expect(result.nextTickerState).toBe(state);
    expect(result.event).toBeNull();
    expect(result.shouldNotify).toBe(false);
    expect(result.evalResult).toBeNull();
  });
  it('combined workflow evaluates cases instead of taking the briefing-only path', () => {
    expect(runPhaseTicker('workflow', { symbol: 'BBCA', prices: [], benchmark: [], filings: [], currentCase: null, tickerState: null, runTimestamp: '2026-10-08T00:00:00Z' }).outcome).toBe('DATA_INCOMPLETE');
  });
  it('evaluation still runs the missing-data guard', () => {
    expect(runPhaseTicker('evaluation', { symbol: 'BBCA', prices: [], benchmark: [], filings: [], currentCase: null, tickerState: null, runTimestamp: '2026-10-08T01:00:00Z' }).outcome).toBe('DATA_INCOMPLETE');
  });
  it('uses last completed session, excluding current-day data and weekends without inventing rows', () => {
    expect(completedSessions([{ date: '2026-10-12' }, { date: '2026-10-09' }, { date: '2026-10-08' }], '2026-10-12').map(row => row.date)).toEqual(['2026-10-08', '2026-10-09']);
  });
  it('labels the recap and case update separately with actual session date', () => {
    const recap = formatTelegramTickerDigest('morning', '2026-10-08', 'BBCA', 'Harga', '07.00', undefined, { purpose: 'briefing', sessionDate: '2026-10-07' });
    expect(recap).toContain('☀️ Rekap Pagi — BBCA');
    expect(recap).toContain('Sesi perdagangan: 7 Oktober 2026');
    expect(recap).not.toContain('🌙');
    expect(formatTelegramTickerDigest('morning', '2026-10-08', 'BBCA', 'Kasus', '08.00', undefined, { purpose: 'evaluation' })).toContain('☀️ Pembaruan Kasus');
  });
  it('calculates case evaluation at 08 WIB and skips weekends', () => {
    const job = { name: 'invoke-siba-cases', active: true, schedule: '0 1 * * 1-5', timezone: 'GMT', last_started_at: null, last_finished_at: null, last_status: null };
    expect(nextScheduledRun(job, new Date('2026-10-08T00:30:00Z'))).toBe('2026-10-08T01:00:00.000Z');
    expect(nextScheduledRun(job, new Date('2026-10-09T01:00:00Z'))).toBe('2026-10-12T01:00:00.000Z');
  });
});
