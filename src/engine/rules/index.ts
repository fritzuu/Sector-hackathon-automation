import { TickerDataset } from '../../types/sectors.js';
import { EvaluationResult, RuleResult } from '../../types/engine.js';
import { evaluateAbnormalVolume } from './abnormalVolume.js';
import { evaluateRelativeMovement } from './relativeMovement.js';
import { evaluateNewFiling } from './newFiling.js';

export * from './abnormalVolume.js';
export * from './relativeMovement.js';
export * from './newFiling.js';

export function evaluateDataset(dataset: TickerDataset): EvaluationResult {
  const missingDataReasons: string[] = [];
  const ruleResults: RuleResult[] = [];

  // 1. Evaluate Abnormal Volume
  const volumeResult = evaluateAbnormalVolume(dataset.historicalPrices);
  ruleResults.push(volumeResult);
  if (volumeResult.missingDataReasons) {
    missingDataReasons.push(...volumeResult.missingDataReasons);
  }

  // 2. Evaluate Relative Movement
  const movementResult = evaluateRelativeMovement(dataset.historicalPrices, dataset.benchmarkPrices);
  ruleResults.push(movementResult);
  if (movementResult.missingDataReasons) {
    missingDataReasons.push(...movementResult.missingDataReasons);
  }

  // 3. Evaluate New Filings
  const filingResult = evaluateNewFiling(dataset.filings, dataset.lastEvaluatedFilingId);
  ruleResults.push(filingResult);
  if (filingResult.missingDataReasons) {
    missingDataReasons.push(...filingResult.missingDataReasons);
  }

  const activeTriggerCount = ruleResults.filter((r) => r.isTriggered).length;
  const hasIncompleteData = missingDataReasons.length > 0;

  return {
    symbol: dataset.symbol,
    evaluationDate: dataset.asOfDate,
    ruleResults,
    activeTriggerCount,
    hasIncompleteData,
    missingDataReasons,
  };
}
