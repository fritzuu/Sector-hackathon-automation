export function mapSnapshotRow(row: Record<string, any>) {
  return {
    symbol: row.symbol, lastPrice: row.last_price,
    changeAmount: row.change_amount, changePercent: row.change_percent,
    todayVolume: row.today_volume, medianVolume20d: row.median_volume_20d,
    ihsgPrice: row.ihsg_price, ihsgChangePercent: row.ihsg_change_percent,
    lastUpdated: row.updated_at, dataDate: row.data_date ?? null,
  };
}
