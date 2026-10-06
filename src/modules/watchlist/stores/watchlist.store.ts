import { create } from 'zustand';
import { useAuthStore } from '../../auth/stores/auth.store';
import { syncWatchlistToSupabase } from '../../../services/supabaseStorage';
import { showCustomAlert } from '../../../shared/stores/alert.store';
import {
  addWatchlistTicker,
  addWatchlistTickers,
  limitWatchlist,
  MAX_WATCHLIST_MUTATIONS_PER_DAY,
  canPerformWatchlistMutation,
} from '../watchlist.rules';

interface WatchlistState {
  watchlist: string[];
  mutationCount: number;
  isLimitModalOpen: boolean;
  setLimitModalOpen: (open: boolean) => void;
  setWatchlist: (watchlist: string[]) => void;
  addTicker: (ticker: string) => Promise<boolean>;
  removeTicker: (ticker: string) => boolean;
  addPresets: (tickers: string[]) => boolean;
  resetMutationCountForTesting: () => void;
  reset: () => void;
}

function getStorageKey(userId?: string): string {
  return `siba_watchlist_mutations_${userId || 'default'}`;
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadDailyMutationCount(userId?: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (parsed.date === getTodayString()) {
      return typeof parsed.count === 'number' ? parsed.count : 0;
    }
  } catch {
    // fallback safely
  }
  return 0;
}

export function saveDailyMutationCount(count: number, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify({ date: getTodayString(), count })
    );
  } catch {
    // fallback safely
  }
}

async function syncToDb(updatedList: string[], prevList: string[]) {
  const user = useAuthStore.getState().currentUser;
  if (user?.id) {
    useAuthStore.setState({
      currentUser: { ...user, defaultWatchlist: updatedList },
    });
    const res = await syncWatchlistToSupabase(user.id, updatedList);
    if (!res.ok) {
      showCustomAlert({
        type: 'error',
        title: 'Gagal Menyimpan Watchlist',
        message: `Terjadi kendala saat menyimpan perubahan: ${res.error}`,
      });
      // Revert locally
      useAuthStore.setState({
        currentUser: { ...user, defaultWatchlist: prevList },
      });
      useWatchlistStore.setState({ watchlist: prevList });
    }
  }
}

export const useWatchlistStore = create<WatchlistState>((set, get) => {
  const initialUserId = useAuthStore.getState().currentUser?.id;
  const initialCount = loadDailyMutationCount(initialUserId);

  return {
    watchlist: [],
    mutationCount: initialCount,
    isLimitModalOpen: false,

    setLimitModalOpen: (open: boolean) => set({ isLimitModalOpen: open }),

    setWatchlist: (watchlist) => {
      const prev = get().watchlist;
      const limited = limitWatchlist(watchlist);
      set({ watchlist: limited });
      syncToDb(limited, prev);
    },

    addTicker: async (ticker: string) => {
      const currentCount = get().mutationCount;
      if (!canPerformWatchlistMutation(currentCount)) {
        set({ isLimitModalOpen: true });
        return false;
      }

      const prev = get().watchlist;
      if (prev.includes(ticker) || prev.length >= 5) {
        return false;
      }

      const next = addWatchlistTicker(prev, ticker);
      const newCount = currentCount + 1;
      const userId = useAuthStore.getState().currentUser?.id;
      saveDailyMutationCount(newCount, userId);

      set({ watchlist: next, mutationCount: newCount });
      syncToDb(next, prev);

      // Check if snapshot is missing
      const { useWorkflowStore } = await import('../../cases/stores/workflow.store');
      const wfStore = useWorkflowStore.getState();
      if (!wfStore.marketSnapshots.has(ticker)) {
        // Invoke proxy
        import('../../../lib/supabaseClient').then(({ supabase }) => {
          supabase.functions.invoke('siba-snapshot-proxy', { body: { symbol: ticker } })
            .then(({ data, error }) => {
              if (error) {
                console.error("[Proxy] Function error:", error);
                return;
              }
              if (data && !data.error) {
                const currentSnaps = useWorkflowStore.getState().marketSnapshots;
                const newSnaps = new Map(currentSnaps);
                newSnaps.set(ticker, {
                  symbol: data.symbol,
                  lastPrice: data.last_price,
                  changeAmount: data.change_amount,
                  changePercent: data.change_percent,
                  todayVolume: data.today_volume,
                  medianVolume20d: data.median_volume_20d,
                  ihsgPrice: data.ihsg_price,
                  ihsgChangePercent: data.ihsg_change_percent,
                  lastUpdated: data.updated_at
                });
                useWorkflowStore.setState({ marketSnapshots: newSnaps });
              }
            })
            .catch(err => console.error("[Proxy] Network/Invoke error:", err));
        });
      }

      return true;
    },

    removeTicker: (ticker: string) => {
      // Menghapus saham tidak dihitung sebagai penambahan kuota dan tidak diblokir
      const prev = get().watchlist;
      if (!prev.includes(ticker)) return false;

      const next = prev.filter(t => t !== ticker);
      set({ watchlist: next });
      syncToDb(next, prev);
      return true;
    },

    addPresets: (tickers: string[]) => {
      const currentCount = get().mutationCount;
      if (!canPerformWatchlistMutation(currentCount)) {
        set({ isLimitModalOpen: true });
        return false;
      }

      const prev = get().watchlist;
      const next = addWatchlistTickers(prev, tickers);
      const addedCount = next.length - prev.length;
      if (addedCount <= 0) return false;

      const newCount = currentCount + addedCount;
      const userId = useAuthStore.getState().currentUser?.id;
      saveDailyMutationCount(newCount, userId);

      set({ watchlist: next, mutationCount: newCount });
      syncToDb(next, prev);
      return true;
    },

    resetMutationCountForTesting: () => {
      const userId = useAuthStore.getState().currentUser?.id;
      saveDailyMutationCount(0, userId);
      set({ mutationCount: 0, isLimitModalOpen: false });
    },

    reset: () => set({ watchlist: [] })
  };
});
