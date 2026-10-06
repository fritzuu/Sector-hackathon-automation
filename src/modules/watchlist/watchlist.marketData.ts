import { evaluateSnapshotMetrics, isFiniteNumber } from './snapshotMetrics';

export interface WatchlistMarketData {
  lastPrice: number;
  changePercent: number | null;
  todayVolume: number;
  medianVolume20d: number | null;
  volumeMultiplier: number | null;
  asOfDate: string;
}

export interface SupabaseMarketSnapshot {
  lastPrice?: number;
  changePercent?: number;
  todayVolume?: number;
  medianVolume20d?: number;
  volumeMultiplier?: number;
  lastUpdated?: string;
  dataDate?: string | null;
}

export const toWatchlistMarketData = (
  snapshot: SupabaseMarketSnapshot | null | undefined,
): WatchlistMarketData | null => {
  if (!snapshot || !isFiniteNumber(snapshot.lastPrice) || snapshot.lastPrice <= 0) return null;
  const medianVolume20d = isFiniteNumber(snapshot.medianVolume20d) && snapshot.medianVolume20d > 0
    ? snapshot.medianVolume20d
    : null;
  const { volumeMultiplier } = evaluateSnapshotMetrics(snapshot);

  return {
    lastPrice: snapshot.lastPrice,
    changePercent: isFiniteNumber(snapshot.changePercent) ? snapshot.changePercent : null,
    todayVolume: snapshot.todayVolume ?? 0,
    medianVolume20d,
    volumeMultiplier,
    asOfDate: snapshot.dataDate ?? '',
  };
};
