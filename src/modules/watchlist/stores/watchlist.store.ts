import { create } from 'zustand';
import { useAuthStore } from '../../auth/stores/auth.store';
import { mapSnapshotRow } from '../../../data/snapshotMapping';
import { fetchGlobalMarketSnapshots, syncWatchlistToSupabase } from '../../../services/supabaseStorage';
import { addWatchlistTicker, addWatchlistTickers, limitWatchlist } from '../watchlist.rules';

interface WatchlistState {
  watchlist: string[];
  setWatchlist: (watchlist: string[]) => void;
  addTicker: (ticker: string) => Promise<void>;
  removeTicker: (ticker: string) => void;
  addPresets: (tickers: string[]) => Promise<void>;
  reset: () => void;
}

let accountGeneration = 0;
const pendingSnapshots = new Map<string, Promise<void>>();

async function loadSnapshots(tickers: string[]) {
  const userId = useAuthStore.getState().currentUser?.id;
  const generation = accountGeneration;
  if (!userId) return;
  const { useWorkflowStore } = await import('../../cases/stores/workflow.store');
  const isCurrent = (ticker: string) => accountGeneration === generation
    && useAuthStore.getState().currentUser?.id === userId
    && useWatchlistStore.getState().watchlist.includes(ticker);
  await Promise.all(tickers.map(ticker => {
    const key = `${generation}:${userId}:${ticker}`;
    if (!isCurrent(ticker) || useWorkflowStore.getState().marketSnapshots.has(ticker)) return;
    const existing = pendingSnapshots.get(key);
    if (existing) return existing;
    const task = (async () => {
      try {
        const cached = await fetchGlobalMarketSnapshots([ticker]);
        let snapshot = cached.find(item => item.symbol === ticker);
        if (!isCurrent(ticker)) return;
        if (!snapshot) {
          const { supabase } = await import('../../../lib/supabaseClient');
          const { data, error } = await supabase.functions.invoke('siba-snapshot-proxy', { body: { symbol: ticker } });
          if (error || !data || data.error || data.symbol !== ticker) throw new Error('Snapshot unavailable');
          snapshot = mapSnapshotRow(data);
        }
        if (!isCurrent(ticker)) return;
        const snapshots = new Map(useWorkflowStore.getState().marketSnapshots);
        snapshots.set(ticker, snapshot);
        useWorkflowStore.setState({ marketSnapshots: snapshots });
      } catch {
        if (isCurrent(ticker)) alert(`Gagal memuat snapshot ${ticker}. Data belum tersedia.`);
      }
    })().finally(() => { pendingSnapshots.delete(key); });
    pendingSnapshots.set(key, task);
    return task;
  }));
}

async function syncToDb(updatedList: string[], prevList: string[]) {
  const user = useAuthStore.getState().currentUser;
  const generation = accountGeneration;
  if (!user?.id) return false;
  useAuthStore.setState({ currentUser: { ...user, defaultWatchlist: updatedList } });
  const res = await syncWatchlistToSupabase(user.id, updatedList);
  if (generation !== accountGeneration || useAuthStore.getState().currentUser?.id !== user.id) return false;
  if (!res.ok) {
    alert(`Gagal menyimpan watchlist: ${res.error}`);
    // Do not roll back a newer edit when an older request fails.
    if (useWatchlistStore.getState().watchlist === updatedList) {
      useAuthStore.setState({ currentUser: { ...useAuthStore.getState().currentUser!, defaultWatchlist: prevList } });
      useWatchlistStore.setState({ watchlist: prevList });
    }
    return false;
  }
  return true;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlist: [],
  setWatchlist: (watchlist) => {
    const prev = get().watchlist;
    const next = limitWatchlist(watchlist);
    set({ watchlist: next });
    void syncToDb(next, prev).then(ok => { if (ok) void loadSnapshots(next); });
  },
  addTicker: async (ticker) => {
    const prev = get().watchlist;
    const next = addWatchlistTicker(prev, ticker);
    if (next === prev) return;
    set({ watchlist: next });
    if (await syncToDb(next, prev)) await loadSnapshots([ticker]);
  },
  removeTicker: (ticker) => {
    const prev = get().watchlist;
    const next = prev.filter(t => t !== ticker);
    set({ watchlist: next });
    void syncToDb(next, prev);
  },
  addPresets: async (tickers) => {
    const prev = get().watchlist;
    const next = addWatchlistTickers(prev, tickers);
    const additions = next.filter(ticker => !prev.includes(ticker));
    if (additions.length === 0) return;
    set({ watchlist: next });
    if (await syncToDb(next, prev)) await loadSnapshots(additions);
  },
  reset: () => {
    accountGeneration++;
    set({ watchlist: [] });
  },
}));
