import { create } from 'zustand';

interface WatchlistState {
  watchlist: string[];
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;
  addPresets: (tickers: string[]) => void;
  reset: () => void;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  watchlist: [],
  addTicker: (ticker) => set((state) => ({
    watchlist: state.watchlist.includes(ticker) ? state.watchlist : [...state.watchlist, ticker]
  })),
  removeTicker: (ticker) => set((state) => ({
    watchlist: state.watchlist.filter(t => t !== ticker)
  })),
  addPresets: (tickers) => set((state) => ({
    watchlist: Array.from(new Set([...state.watchlist, ...tickers]))
  })),
  reset: () => set({ watchlist: [] })
}));
