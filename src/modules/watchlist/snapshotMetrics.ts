export const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function evaluateSnapshotMetrics(snapshot: {
  todayVolume?: number; medianVolume20d?: number;
  changePercent?: number; ihsgChangePercent?: number; ihsgPrice?: number;
}) {
  const median = snapshot.medianVolume20d;
  const volume = snapshot.todayVolume;
  const volumeMultiplier = isFiniteNumber(median) && median > 0 && isFiniteNumber(volume) && volume >= 0
    ? volume / median : null;
  const spreadVsIhsg = isFiniteNumber(snapshot.changePercent) && isFiniteNumber(snapshot.ihsgChangePercent)
    && isFiniteNumber(snapshot.ihsgPrice) && snapshot.ihsgPrice > 0
    ? Math.abs(snapshot.changePercent - snapshot.ihsgChangePercent) : null;
  return {
    volumeMultiplier, spreadVsIhsg,
    isVolumeAnomaly: volumeMultiplier === null ? null : volumeMultiplier >= 2,
    isSpreadAnomaly: spreadVsIhsg === null ? null : spreadVsIhsg >= 2,
  };
}
