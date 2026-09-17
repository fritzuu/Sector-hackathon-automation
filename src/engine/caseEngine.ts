import { CaseState, CaseStatus, CaseEvent, EvaluationResult, RuleId } from '../types/engine.js';

export interface StateTransitionResult {
  nextCaseState: CaseState | null;
  event: CaseEvent;
}

export function processCaseTransition(
  currentCase: CaseState | null,
  evalResult: EvaluationResult,
  runTimestamp: string
): StateTransitionResult {
  const { symbol, activeTriggerCount, ruleResults, hasIncompleteData, missingDataReasons } = evalResult;
  const triggeredRules = ruleResults.filter((r) => r.isTriggered);
  const activeRuleIds = triggeredRules.map((r) => r.ruleId);

  // Extract latest filing ID if filing rule triggered
  const filingRule = ruleResults.find((r) => r.ruleId === 'NEW_FILING');
  const latestSeenFilingId = (filingRule?.evidence as any)?.latestFilingId || currentCase?.lastSeenFilingId || null;

  // Handle incomplete data
  if (hasIncompleteData) {
    const event: CaseEvent = {
      eventId: `EVT-${symbol}-${Date.now()}`,
      caseId: currentCase ? currentCase.caseId : `CASE-${symbol}-PENDING`,
      symbol,
      timestamp: runTimestamp,
      previousStatus: currentCase ? currentCase.status : null,
      newStatus: 'DATA_INCOMPLETE',
      triggeredRules: [],
      renderedSummary: `Data tidak lengkap pada evaluasi ${evalResult.evaluationDate}. Alasan: ${missingDataReasons.join('; ')}`,
      dataQualityIssues: missingDataReasons,
    };

    // If there was an active case, preserve it but do not increment inactive runs count
    const nextCaseState: CaseState | null = currentCase
      ? {
          ...currentCase,
          lastUpdatedAt: runTimestamp,
        }
      : null;

    return { nextCaseState, event };
  }

  // Case 1: No active case
  if (!currentCase || currentCase.status === 'CLOSED') {
    if (activeTriggerCount > 0) {
      // Transition to OPEN
      const newCaseId = `CASE-${symbol}-${evalResult.evaluationDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
      const nextCaseState: CaseState = {
        caseId: newCaseId,
        symbol,
        status: 'OPEN',
        openedAt: runTimestamp,
        lastUpdatedAt: runTimestamp,
        consecutiveInactiveRuns: 0,
        activeRuleIds,
        lastSeenFilingId: latestSeenFilingId,
        eventsCount: 1,
      };

      const event: CaseEvent = {
        eventId: `EVT-${symbol}-${Date.now()}`,
        caseId: newCaseId,
        symbol,
        timestamp: runTimestamp,
        previousStatus: null,
        newStatus: 'OPEN',
        triggeredRules,
        renderedSummary: `Kasus baru dibuka untuk ${symbol}. Terdeteksi ${activeTriggerCount} pemicu aktif.`,
      };

      return { nextCaseState, event };
    }

    // No active case and no triggers -> remain null / unmonitored
    const event: CaseEvent = {
      eventId: `EVT-${symbol}-${Date.now()}`,
      caseId: `NO-CASE-${symbol}`,
      symbol,
      timestamp: runTimestamp,
      previousStatus: null,
      newStatus: 'MONITORING',
      triggeredRules: [],
      renderedSummary: `Tidak ada kondisi anomali untuk ${symbol}. Tidak ada kasus baru dibuka.`,
    };

    return { nextCaseState: null, event };
  }

  // Case 2: Existing active case
  if (activeTriggerCount > 0) {
    // There are active triggers -> status is UPDATED
    const nextCaseState: CaseState = {
      ...currentCase,
      status: 'UPDATED',
      lastUpdatedAt: runTimestamp,
      consecutiveInactiveRuns: 0,
      activeRuleIds,
      lastSeenFilingId: latestSeenFilingId,
      eventsCount: currentCase.eventsCount + 1,
    };

    const event: CaseEvent = {
      eventId: `EVT-${symbol}-${Date.now()}`,
      caseId: currentCase.caseId,
      symbol,
      timestamp: runTimestamp,
      previousStatus: currentCase.status,
      newStatus: 'UPDATED',
      triggeredRules,
      renderedSummary: `Perkembangan baru pada kasus ${symbol}: ${activeTriggerCount} aturan terpenuhi.`,
    };

    return { nextCaseState, event };
  }

  // Case 3: Existing active case, but 0 triggers active in this run
  const newInactiveCount = currentCase.consecutiveInactiveRuns + 1;

  if (newInactiveCount >= 2) {
    // 2 consecutive runs without triggers -> transition to CLOSED
    const nextCaseState: CaseState = {
      ...currentCase,
      status: 'CLOSED',
      lastUpdatedAt: runTimestamp,
      consecutiveInactiveRuns: newInactiveCount,
      activeRuleIds: [],
      lastSeenFilingId: latestSeenFilingId,
      eventsCount: currentCase.eventsCount + 1,
    };

    const event: CaseEvent = {
      eventId: `EVT-${symbol}-${Date.now()}`,
      caseId: currentCase.caseId,
      symbol,
      timestamp: runTimestamp,
      previousStatus: currentCase.status,
      newStatus: 'CLOSED',
      triggeredRules: [],
      renderedSummary: `Kasus ${symbol} ditutup setelah 2 sesi berturut-turut tanpa pemicu aktif.`,
    };

    return { nextCaseState, event };
  }

  // Only 1 inactive run -> remain in MONITORING
  const nextCaseState: CaseState = {
    ...currentCase,
    status: 'MONITORING',
    lastUpdatedAt: runTimestamp,
    consecutiveInactiveRuns: newInactiveCount,
    activeRuleIds: [],
    lastSeenFilingId: latestSeenFilingId,
    eventsCount: currentCase.eventsCount + 1,
  };

  const event: CaseEvent = {
    eventId: `EVT-${symbol}-${Date.now()}`,
    caseId: currentCase.caseId,
    symbol,
    timestamp: runTimestamp,
    previousStatus: currentCase.status,
    newStatus: 'MONITORING',
    triggeredRules: [],
    renderedSummary: `Kasus ${symbol} tetap dalam status MONITORING (sesi ke-1 tanpa anomali).`,
  };

  return { nextCaseState, event };
}
