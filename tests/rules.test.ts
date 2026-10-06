import { describe, it, expect } from 'vitest';
import {
  evaluateAbnormalVolume,
  calculateMedian,
  evaluateRelativeMovement,
  evaluateNewFiling,
  evaluateDataset,
} from '../src/engine/rules/index.js';
import {
  normalDataset,
  abnormalVolumeDataset,
  relativeMovementDataset,
  newFilingDataset,
  incompleteDataDataset,
  mockFiling,
} from '../src/fixtures/mockSectorsData.js';

describe('Deterministic Rules Engine', () => {
  describe('Utility: calculateMedian', () => {
    it('should correctly compute median for odd number of items', () => {
      expect(calculateMedian([10, 20, 30, 40, 50])).toBe(30);
      expect(calculateMedian([50, 10, 30])).toBe(30);
    });

    it('should correctly compute median for even number of items', () => {
      expect(calculateMedian([10, 20, 30, 40])).toBe(25);
    });

    it('should return 0 for empty array', () => {
      expect(calculateMedian([])).toBe(0);
    });
  });

  describe('Rule: Abnormal Volume (>= 2.0x 20-day median)', () => {
    it('should not trigger on normal volume', () => {
      const result = evaluateAbnormalVolume(normalDataset.historicalPrices);
      expect(result.isTriggered).toBe(false);
      expect(result.ruleId).toBe('ABNORMAL_VOLUME');
      expect((result.evidence as any).multiplier).toBeLessThan(2.0);
    });

    it('should trigger when volume is >= 2.0x median', () => {
      const result = evaluateAbnormalVolume(abnormalVolumeDataset.historicalPrices);
      expect(result.isTriggered).toBe(true);
      expect((result.evidence as any).multiplier).toBeGreaterThanOrEqual(2.0);
    });

    it('should report missing data when fewer than 21 days are available', () => {
      const result = evaluateAbnormalVolume(incompleteDataDataset.historicalPrices);
      expect(result.isTriggered).toBe(false);
      expect(result.missingDataReasons).toBeDefined();
      expect(result.missingDataReasons!.length).toBeGreaterThan(0);
    });
  });

  describe('Rule: Relative Movement (|Δ| >= 2.0% vs IHSG)', () => {
    it('should not trigger when price movement aligns with IHSG', () => {
      const result = evaluateRelativeMovement(
        normalDataset.historicalPrices,
        normalDataset.benchmarkPrices
      );
      expect(result.isTriggered).toBe(false);
      expect((result.evidence as any).spreadPercentagePoints).toBeLessThan(2.0);
    });

    it('should trigger when stock return deviates >= 2.0 percentage points from IHSG', () => {
      const result = evaluateRelativeMovement(
        relativeMovementDataset.historicalPrices,
        relativeMovementDataset.benchmarkPrices
      );
      expect(result.isTriggered).toBe(true);
      expect((result.evidence as any).spreadPercentagePoints).toBeGreaterThanOrEqual(2.0);
    });

    it('should handle missing benchmark data gracefully', () => {
      const result = evaluateRelativeMovement(normalDataset.historicalPrices, []);
      expect(result.isTriggered).toBe(false);
      expect(result.missingDataReasons).toBeDefined();
    });
  });

  describe('Rule: New Filing', () => {
    it('should silently establish baseline on first sight (null)', () => {
      const result = evaluateNewFiling([mockFiling], null);
      expect(result.isTriggered).toBe(false);
      expect((result.evidence as any).count).toBe(0);
      expect((result.evidence as any).knownFilingIds).toContain(mockFiling.id);
    });

    it('should trigger when new verified filing is present (not in seen array)', () => {
      const result = evaluateNewFiling([mockFiling], []);
      expect(result.isTriggered).toBe(true);
      expect((result.evidence as any).count).toBe(1);
    });

    it('should not trigger when latest filing is already seen', () => {
      const result = evaluateNewFiling([mockFiling], [mockFiling.id]);
      expect(result.isTriggered).toBe(false);
      expect((result.evidence as any).count).toBe(0);
    });
  });

  describe('Full Dataset Evaluation', () => {
    it('should aggregate rule results correctly', () => {
      const evalNormal = evaluateDataset(normalDataset);
      expect(evalNormal.activeTriggerCount).toBe(0);
      expect(evalNormal.hasIncompleteData).toBe(false);

      const evalVolume = evaluateDataset(abnormalVolumeDataset);
      expect(evalVolume.activeTriggerCount).toBe(1);

      const evalIncomplete = evaluateDataset(incompleteDataDataset);
      expect(evalIncomplete.hasIncompleteData).toBe(true);
      expect(evalIncomplete.missingDataReasons.length).toBeGreaterThan(0);
    });
  });
});
