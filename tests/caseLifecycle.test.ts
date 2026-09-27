import { describe, it, expect } from 'vitest';
import { processCaseTransition } from '../src/engine/caseEngine.js';
import { evaluateDataset } from '../src/engine/rules/index.js';
import {
  normalDataset,
  abnormalVolumeDataset,
  relativeMovementDataset,
  incompleteDataDataset,
} from '../src/fixtures/mockSectorsData.js';

describe('Case Lifecycle State Machine', () => {
  it('should transition from null to OPEN when trigger occurs', () => {
    const evalVolume = evaluateDataset(abnormalVolumeDataset);
    const result = processCaseTransition(null, evalVolume, '2026-08-22T16:00:00Z');

    expect(result.nextCaseState).not.toBeNull();
    expect(result.nextCaseState?.status).toBe('OPEN');
    expect(result.nextCaseState?.symbol).toBe('TLKM');
    expect(result.nextCaseState?.consecutiveInactiveRuns).toBe(0);
    expect(result.event.newStatus).toBe('OPEN');
    expect(result.event.triggeredRules.length).toBe(1);
  });

  it('should stay in null/MONITORING when no triggers and no active case', () => {
    const evalNormal = evaluateDataset(normalDataset);
    const result = processCaseTransition(null, evalNormal, '2026-08-22T16:00:00Z');

    expect(result.nextCaseState).toBeNull();
    expect(result.event.newStatus).toBe('MONITORING');
    expect(result.event.triggeredRules.length).toBe(0);
  });

  it('should transition from OPEN to UPDATED when another trigger occurs on next run', () => {
    const eval1 = evaluateDataset(abnormalVolumeDataset);
    const run1 = processCaseTransition(null, eval1, '2026-08-22T16:00:00Z');
    const openCase = run1.nextCaseState;

    const eval2 = evaluateDataset(relativeMovementDataset);
    const run2 = processCaseTransition(openCase, eval2, '2026-08-23T16:00:00Z');

    expect(run2.nextCaseState?.status).toBe('UPDATED');
    expect(run2.nextCaseState?.consecutiveInactiveRuns).toBe(0);
    expect(run2.nextCaseState?.eventsCount).toBe(2);
    expect(run2.event.previousStatus).toBe('OPEN');
    expect(run2.event.newStatus).toBe('UPDATED');
  });

  it('should transition to MONITORING on 1st inactive session, then CLOSED on 2nd consecutive inactive session', () => {
    // 1. Initial OPEN
    const evalTrigger = evaluateDataset(abnormalVolumeDataset);
    const run1 = processCaseTransition(null, evalTrigger, '2026-08-22T16:00:00Z');
    let currentCase = run1.nextCaseState;
    expect(currentCase?.status).toBe('OPEN');

    // 2. Next session: Normal (0 triggers) -> Transition to MONITORING (inactive = 1)
    const evalNormal = evaluateDataset(normalDataset);
    const run2 = processCaseTransition(currentCase, evalNormal, '2026-08-23T16:00:00Z');
    currentCase = run2.nextCaseState;
    expect(currentCase?.status).toBe('MONITORING');
    expect(currentCase?.consecutiveInactiveRuns).toBe(1);
    expect(run2.event.newStatus).toBe('MONITORING');

    // 3. Next session: Normal (0 triggers) -> Transition to CLOSED (inactive = 2)
    const run3 = processCaseTransition(currentCase, evalNormal, '2026-08-24T16:00:00Z');
    currentCase = run3.nextCaseState;
    expect(currentCase?.status).toBe('CLOSED');
    expect(currentCase?.consecutiveInactiveRuns).toBe(2);
    expect(run3.event.newStatus).toBe('CLOSED');
  });

  it('should handle DATA_INCOMPLETE without corrupting active case lifecycle', () => {
    const evalTrigger = evaluateDataset(abnormalVolumeDataset);
    const run1 = processCaseTransition(null, evalTrigger, '2026-08-22T16:00:00Z');
    const openCase = run1.nextCaseState;

    const evalIncomplete = evaluateDataset(incompleteDataDataset);
    const run2 = processCaseTransition(openCase, evalIncomplete, '2026-08-23T16:00:00Z');

    expect(run2.event.newStatus).toBe('DATA_INCOMPLETE');
    expect(run2.nextCaseState?.status).toBe('OPEN'); // preserved status
    expect(run2.nextCaseState?.consecutiveInactiveRuns).toBe(0); // not counted as inactive
  });
});
