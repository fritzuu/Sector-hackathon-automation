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

async function syncToDb(updatedList: string[], prevList: string[]) {
  const user = useAuthStore.getState().currentUser;
  if (user?.id) {
    useAuthStore.setState({
      currentUser: { ...user, defaultWatchlist: updatedList },
    });
    const res = await syncWatchlistToSupabase(user.id, updatedList);
    if (!res.ok) {
      alert(`Gagal menyimpan watchlist: ${res.error}`);
      // Revert locally
      useAuthStore.setState({
        currentUser: { ...user, defaultWatchlist: prevList },
      });
      useWatchlistStore.setState({ watchlist: prevList });
    }
  }
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlist: [],
  setWatchlist: (watchlist) => {
    const prev = get().watchlist;
    const limited = limitWatchlist(watchlist);
    set({ watchlist: limited });
    syncToDb(limited, prev);
  },
  addTicker: async (ticker) => {
    const prev = get().watchlist;
    const next = addWatchlistTicker(prev, ticker);
    syncToDb(next, prev);
    set({ watchlist: next });
    
    // Check if snapshot is missing
    const { useWorkflowStore } = await import('../../cases/stores/workflow.store');
    const wfStore = useWorkflowStore.getState();
    if (!wfStore.marketSnapshots.has(ticker)) {
      // Invoke proxy
      import('../../../lib/supabaseClient').then(({ supabase }) => {
        supabase.functions.invoke('siba-snapshot-proxy', { body: { symbol: ticker } })
          .then(({ data, error }) => {
            console.log(`[Proxy] Invoked for ${ticker}`, { data, error });
            if (error) {
              console.error("[Proxy] Function error:", error);
              return;
            }
            if (data && !data.error) {
              const currentSnaps = useWorkflowStore.getState().marketSnapshots;
              const newSnaps = new Map(currentSnaps);
              // Map to legacy format
              newSnaps.set(ticker, {
                symbol: data.symbol,
                lastPrice: data.last_price,
                changeAmount: data.change_amount,
                changePercent: data.change_percent,
                todayVolume: data.today_volume,
                medianVolume20d: data.median_volume_20d,
                ihsgPrice: data.ihsg_price,
                ihsgChangePercent: data.ihsg_change_percent,
                latestFilings: data.latest_filings || [],
                lastUpdated: data.updated_at
              });
              useWorkflowStore.setState({ marketSnapshots: newSnaps });
            } else {
              console.error("[Proxy] Returned error:", data);
            }
          })
          .catch(err => console.error("[Proxy] Network/Invoke error:", err));
      });
    }
  },
  removeTicker: (ticker) => set((state) => {
    const prev = state.watchlist;
    const next = prev.filter(t => t !== ticker);
    syncToDb(next, prev);
    return { watchlist: next };
  }),
  addPresets: (tickers) => set((state) => {
    const prev = state.watchlist;
    const next = addWatchlistTickers(prev, tickers);
    syncToDb(next, prev);
    return { watchlist: next };
  }),
  reset: () => set({ watchlist: [] })
}));
