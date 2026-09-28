export const MAX_WATCHLIST_SIZE = 5;

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