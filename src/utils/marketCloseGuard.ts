type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function claimMarketCloseRun(
  userId: string,
  date: string,
  storage: KeyValueStorage = localStorage,
): boolean {
  const key = `siba_market_close_run_${userId}`;
  if (storage.getItem(key) === date) return false;

  storage.setItem(key, date);
  return true;
}