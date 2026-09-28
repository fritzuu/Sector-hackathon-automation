import { create } from 'zustand';
import { useAuthStore } from '../../auth/stores/auth.store';
import { syncWatchlistToSupabase } from '../../../services/supabaseStorage';
import {
  addWatchlistTicker,
  addWatchlistTickers,
  limitWatchlist,
} from '../watchlist.rules';

interface WatchlistState {
  watchlist: string[];
  setWatchlist: (watchlist: string[]) => void;
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;
  addPresets: (tickers: string[]) => void;
  reset: () => void;
}

function syncToDb(updatedList: string[]) {
  const user = useAuthStore.getState().currentUser;
  if (user?.id) {
    useAuthStore.setState({
      currentUser: { ...user, defaultWatchlist: updatedList },
    });
    syncWatchlistToSupabase(user.id, updatedList);
  }
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  watchlist: [],
  setWatchlist: (watchlist) => {
    const limited = limitWatchlist(watchlist);
    set({ watchlist: limited });
    syncToDb(limited);
  },
  addTicker: (ticker) => set((state) => {
    const next = addWatchlistTicker(state.watchlist, ticker);
    syncToDb(next);
    return { watchlist: next };
  }),
  removeTicker: (ticker) => set((state) => {
    const next = state.watchlist.filter(t => t !== ticker);
    syncToDb(next);
    return { watchlist: next };
  }),
  addPresets: (tickers) => set((state) => {
    const next = addWatchlistTickers(state.watchlist, tickers);
    syncToDb(next);
    return { watchlist: next };
  }),
  reset: () => set({ watchlist: [] })
}));
