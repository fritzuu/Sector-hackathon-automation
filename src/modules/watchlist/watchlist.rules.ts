export const MAX_WATCHLIST_SIZE = 5;
export const MAX_WATCHLIST_ADDITIONS_PER_DAY = 20;
export const MAX_WATCHLIST_MUTATIONS_PER_DAY = MAX_WATCHLIST_ADDITIONS_PER_DAY; // alias

export function canPerformWatchlistAddition(currentAdditionCount: number): boolean {
  return currentAdditionCount < MAX_WATCHLIST_ADDITIONS_PER_DAY;
}

export function getRemainingAdditions(currentAdditionCount: number): number {
  return Math.max(0, MAX_WATCHLIST_ADDITIONS_PER_DAY - currentAdditionCount);
}

// Backward compatibility aliases
export const canPerformWatchlistMutation = canPerformWatchlistAddition;
export const getRemainingMutations = getRemainingAdditions;

export function limitWatchlist(tickers: string[]): string[] {
  return Array.from(new Set(tickers)).slice(0, MAX_WATCHLIST_SIZE);
}

export function addWatchlistTicker(tickers: string[], ticker: string): string[] {
  if (tickers.includes(ticker) || tickers.length >= MAX_WATCHLIST_SIZE) {
    return tickers;
  }
  return [...tickers, ticker];
}

export function addWatchlistTickers(tickers: string[], additions: string[]): string[] {
  const next = [...tickers];
  for (const ticker of additions) {
    if (!next.includes(ticker) && next.length < MAX_WATCHLIST_SIZE) {
      next.push(ticker);
    }
  }
  return next;
}