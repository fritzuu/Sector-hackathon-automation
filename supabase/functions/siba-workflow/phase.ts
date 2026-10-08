import { runTickerStep, type TickerStepResult } from '../../../src/engine/tickerStep.ts';

// Briefing reads market context but cannot consume the case evaluation watermark.
export function runPhaseTicker(phase: 'briefing' | 'evaluation' | 'workflow', input: Parameters<typeof runTickerStep>[0]): TickerStepResult {
  if (phase !== 'briefing') return runTickerStep(input);
  return {
    outcome: 'SKIPPED_STALE', nextCase: input.currentCase, event: null,
    shouldNotify: false, evalResult: null,
    nextTickerState: input.tickerState || { lastProcessedDataDate: null, seenFilingIds: null, consecutiveIncompleteRuns: 0 },
  };
}

export function completedSessions<T extends { date: string }>(rows: T[], todayWib: string): T[] {
  return rows.filter(row => row.date < todayWib).sort((a, b) => a.date.localeCompare(b.date));
}
