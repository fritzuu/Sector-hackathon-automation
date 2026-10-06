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
}

export const toWatchlistMarketData = (
  snapshot: SupabaseMarketSnapshot | null | undefined,
): WatchlistMarketData | null => {
  if (!snapshot || !snapshot.lastPrice) return null;
  const medianVolume20d = snapshot.medianVolume20d && snapshot.medianVolume20d > 0
    ? snapshot.medianVolume20d
    : null;
  const volumeMultiplier = snapshot.volumeMultiplier ?? (
    medianVolume20d && snapshot.todayVolume !== undefined
      ? Number((snapshot.todayVolume / medianVolume20d).toFixed(2))
      : null
  );

  return {
    lastPrice: snapshot.lastPrice,
    changePercent: typeof snapshot.changePercent === 'number' ? snapshot.changePercent : null,
    todayVolume: snapshot.todayVolume ?? 0,
    medianVolume20d,
    volumeMultiplier,
    asOfDate: snapshot.lastUpdated ?? '',
  };
};