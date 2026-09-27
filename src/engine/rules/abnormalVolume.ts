import { DailyTransaction } from '../../types/sectors.js';
import { RuleResult, VolumeEvidence } from '../../types/engine.js';

export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function evaluateAbnormalVolume(
  transactions: DailyTransaction[],
  thresholdMultiplier: number = 2.0
): RuleResult {
  const ruleId = 'ABNORMAL_VOLUME';
  const name = 'Volume Transaksi Abnormal (>= 2.0x Median 20 Hari)';

  if (!transactions || transactions.length < 21) {
    return {
      ruleId,
      name,
      isTriggered: false,
      summary: 'Data historis tidak mencukupi untuk menghitung median 20 sesi bursa.',
      evidence: {
        latestVolume: transactions?.[transactions.length - 1]?.volume || 0,
        medianVolume20Days: 0,
        multiplier: 0,
        threshold: thresholdMultiplier,
        tradingDaysEvaluated: transactions ? Math.max(0, transactions.length - 1) : 0,
      },
      missingDataReasons: ['Data historis kurang dari 20 sesi bursa untuk perbandingan volume.'],
    };
  }

  // Sort ascending by date
  const sorted = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1));
  const targetSession = sorted[sorted.length - 1];
  const preceding20Sessions = sorted.slice(sorted.length - 21, sorted.length - 1);

  const baselineVolumes = preceding20Sessions.map((t) => t.volume);
  const medianVolume = calculateMedian(baselineVolumes);
  const latestVolume = targetSession.volume;
  const multiplier = medianVolume > 0 ? latestVolume / medianVolume : 0;

  const isTriggered = multiplier >= thresholdMultiplier;

  const summary = isTriggered
    ? `Volume sesi (${latestVolume.toLocaleString('id-ID')}) mencapai ${multiplier.toFixed(2)}x dari median 20 hari (${medianVolume.toLocaleString('id-ID')}).`
    : `Volume sesi (${latestVolume.toLocaleString('id-ID')}) normal (${multiplier.toFixed(2)}x dari median 20 hari).`;

  const evidence: VolumeEvidence = {
    latestVolume,
    medianVolume20Days: medianVolume,
    multiplier: parseFloat(multiplier.toFixed(4)),
    threshold: thresholdMultiplier,
    tradingDaysEvaluated: 20,
  };

  return {
    ruleId,
    name,
    isTriggered,
    summary,
    evidence,
  };
}
