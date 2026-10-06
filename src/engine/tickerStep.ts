import { DailyTransaction, BenchmarkData, CompanyFiling } from '../types/sectors.ts';
import { CaseState, CaseEvent, EvaluationResult, TickerState } from '../types/engine.ts';
import { evaluateDataset } from './rules/index.ts';
import { processCaseTransition } from './caseEngine.ts';

export type TickerOutcome = 'SKIPPED_STALE' | 'EVALUATED' | 'DATA_INCOMPLETE';

export interface TickerStepResult {
  outcome: TickerOutcome;
  nextCase: CaseState | null;
  event: CaseEvent | null;
  shouldNotify: boolean;
  nextTickerState: TickerState;
  evalResult: EvaluationResult | null;
}

export function runTickerStep(input: {
  symbol: string;
  prices: DailyTransaction[];
  benchmark: BenchmarkData[];
  filings: CompanyFiling[];
  currentCase: CaseState | null;
  tickerState: TickerState | null;
  runTimestamp: string;
}): TickerStepResult {
  const { symbol, prices, benchmark, filings, currentCase, tickerState, runTimestamp } = input;

  const state: TickerState = tickerState || {
    lastProcessedDataDate: null,
    seenFilingIds: null,
    consecutiveIncompleteRuns: 0,
  };

  if (!prices || prices.length === 0) {
    // Cannot proceed at all without prices
    return {
      outcome: 'DATA_INCOMPLETE',
      nextCase: currentCase,
      event: null,
      shouldNotify: false,
      nextTickerState: state,
      evalResult: null,
    };
  }

  // prices are sorted ascending by date
  const latestDate = prices[prices.length - 1].date;

  // 1. Freshness guard (Bug #5)
  if (state.lastProcessedDataDate && latestDate <= state.lastProcessedDataDate) {
    return {
      outcome: 'SKIPPED_STALE',
      nextCase: currentCase, // No change
      event: null,
      shouldNotify: false,
      nextTickerState: state,
      evalResult: null,
    };
  }

  // 2. Evaluate rules
  const evalResult = evaluateDataset({
    symbol,
    asOfDate: latestDate,
    historicalPrices: prices,
    benchmarkPrices: benchmark,
    filings: filings,
    seenFilingIds: state.seenFilingIds,
  });

  // 3. Handle incomplete data (Bug #4)
  if (evalResult.hasIncompleteData) {
    const nextRuns = state.consecutiveIncompleteRuns + 1;
    const nextState = { ...state, consecutiveIncompleteRuns: nextRuns }; // Do not advance date/filings

    const transition = processCaseTransition(currentCase, evalResult, runTimestamp);

    return {
      outcome: 'DATA_INCOMPLETE',
      nextCase: transition.nextCaseState,
      event: (nextRuns === 1 || nextRuns === 2) ? transition.event : null, // Record event for history and notification
      shouldNotify: nextRuns === 2,                    // Notify only on 2nd consecutive failure
      nextTickerState: nextState,
      evalResult,
    };
  }

  // 4. Data is good, process case transition
  const transition = processCaseTransition(currentCase, evalResult, runTimestamp);
  
  const nextCase = transition.nextCaseState;
  const isClosed = nextCase?.status === 'CLOSED';
  
  // Bug #1 / Bug #2: if CLOSED, it returns null for persistence
  const finalCase = isClosed ? null : nextCase;

  // 5. Determine if we should notify
  // We notify if it's OPEN, UPDATED, or CLOSED. We do NOT notify on MONITORING.
  const shouldNotify = ['OPEN', 'UPDATED', 'CLOSED'].includes(transition.event.newStatus);

  // 6. Advance the ticker state baseline
  const filingRule = evalResult.ruleResults.find(r => r.ruleId === 'NEW_FILING');
  const knownFilingIds = filingRule ? (filingRule.evidence as any).knownFilingIds : state.seenFilingIds;

  return {
    outcome: 'EVALUATED',
    nextCase: finalCase,
    event: transition.event,
    shouldNotify,
    nextTickerState: {
      lastProcessedDataDate: latestDate,
      seenFilingIds: knownFilingIds,
      consecutiveIncompleteRuns: 0,
    },
    evalResult,
  };
}
