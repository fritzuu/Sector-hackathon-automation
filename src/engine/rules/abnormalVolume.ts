import { DailyTransaction } from '../../types/sectors.ts';
import { RuleResult, VolumeEvidence } from '../../types/engine.ts';

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

  // A repeated API row is not an additional trading session.
  const sessions = new Map<string, DailyTransaction>();
  const conflictingDates = new Set<string>();
  for (const transaction of transactions || []) {
    const previous = sessions.get(transaction.date);
    if (previous && previous.volume !== transaction.volume) conflictingDates.add(transaction.date);
    sessions.set(transaction.date, transaction);
  }
  const sorted = [...sessions.values()].sort((a, b) => a.date.localeCompare(b.date));
  const targetSession = sorted[sorted.length - 1];
  const preceding20Sessions = sorted.slice(-21, -1);
  const relevantSessions = sorted.slice(-21);
  let missingReason: string | undefined;
  if (sorted.length < 21) {
    missingReason = 'Data historis kurang dari 20 sesi bursa untuk perbandingan volume.';
  } else if (relevantSessions.some((session) => conflictingDates.has(session.date))) {
    missingReason = 'Data volume pada tanggal yang sama saling bertentangan.';
  } else if (relevantSessions.some((session) => !Number.isFinite(session.volume) || session.volume < 0)) {
    missingReason = 'Data volume sesi atau baseline tidak valid.';
  } else if (calculateMedian(preceding20Sessions.map((session) => session.volume)) <= 0) {
    missingReason = 'Median volume baseline nol; rasio tidak dapat dihitung.';
  }
  if (missingReason) {
    return {
      ruleId, name, isTriggered: false,
      summary: missingReason,
      evidence: {
        latestVolume: targetSession?.volume ?? 0,
        medianVolume20Days: 0, multiplier: 0, threshold: thresholdMultiplier,
        tradingDaysEvaluated: Math.min(20, Math.max(0, sorted.length - 1)),
      },
      missingDataReasons: [missingReason],
    };
  }

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
