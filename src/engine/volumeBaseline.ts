// The latest session must never contribute to its own baseline.
export function precedingVolumeMedian(rows: Array<{ date: string; volume?: number }>): number {
  const sessions = [...new Map(rows.map(row => [row.date, row])).values()]
    .sort((a, b) => b.date.localeCompare(a.date));
  if (sessions.length < 21) return 0;
  const volumes = sessions.slice(1, 21).map(row => row.volume);
  if (!volumes.every((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0)) return 0;
  volumes.sort((a, b) => a - b);
  return (volumes[9] + volumes[10]) / 2;
}
