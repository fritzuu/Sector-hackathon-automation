import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { UserProfile } from '../../../data/userProfiles';
import {
  saveUserProfileToSupabase,
  fetchUserProfileFromSupabase,
  fetchAuditRunsFromSupabase,
  fetchUserWorkspaceFromSupabase,
  fetchGlobalMarketSnapshots,
} from '../../../services/supabaseStorage';
import { supabase } from '../../../lib/supabaseClient';
import { generateSecurePairingToken } from '../../../utils/token';

interface AuthState {
  currentUser: UserProfile | null;
  authReady: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => Promise<void>;
  syncFromSession: () => Promise<void>;
}

let sessionGeneration = 0;
let authEventVersion = 0;
let activeSync: { key: string; generation: number; promise: Promise<void> } | null = null;
let hydratedKey: string | null = null;

function invalidateSessionWork() {
  authEventVersion++;
  sessionGeneration++;
  activeSync = null;
  hydratedKey = null;
}

async function clearAccountStores(generation = sessionGeneration) {
  try {
    const [workflowMod, watchlistMod] = await Promise.all([
      import('../../../modules/cases/stores/workflow.store'),
      import('../../../modules/watchlist/stores/watchlist.store'),
    ]);
    if (generation !== sessionGeneration) return;
    workflowMod.useWorkflowStore.getState().clearAccountState();
    watchlistMod.useWatchlistStore.getState().reset();
  } catch (err) {
    console.warn('[AuthStore] Gagal mereset store akun:', err);
  }
}

function profileFromAuthUser(authUser: User, existing?: UserProfile | null): UserProfile {
  const meta = authUser.user_metadata || {};
  const email = authUser.email || existing?.email || '';
  return {
    id: authUser.id,
    name: meta.full_name || meta.name || existing?.name || email.split('@')[0] || 'Pengguna',
    email,
    avatar: meta.avatar_url || meta.picture || existing?.avatar || '',
    role: existing?.role || 'Investor Ritel',
    telegramChatId: existing?.telegramChatId ?? null,
    telegramUsername: existing?.telegramUsername ?? null,
    isTelegramLinked: existing?.isTelegramLinked ?? false,
    pairingToken: existing?.pairingToken || generateSecurePairingToken(),
    defaultWatchlist: existing?.defaultWatchlist || [],
  };
}

async function hydrateUserData(profile: UserProfile, generation = sessionGeneration) {
  try {
    const [history, workspace, globalSnapshots, workflowMod, watchlistMod] = await Promise.all([
      fetchAuditRunsFromSupabase(profile.id),
      fetchUserWorkspaceFromSupabase(profile.id),
      fetchGlobalMarketSnapshots(profile.defaultWatchlist || []),
      import('../../../modules/cases/stores/workflow.store'),
      import('../../../modules/watchlist/stores/watchlist.store'),
    ]);

    if (generation !== sessionGeneration || useAuthStore.getState().currentUser?.id !== profile.id) return false;

    const currentProfile = useAuthStore.getState().currentUser!;
    // A user can edit the list while hydration is in flight.
    const watchlist = currentProfile.defaultWatchlist === profile.defaultWatchlist
      ? profile.defaultWatchlist || [] : watchlistMod.useWatchlistStore.getState().watchlist;
    watchlistMod.useWatchlistStore.setState({ watchlist });
    const snapshotMap = new Map<string, any>(workflowMod.useWorkflowStore.getState().marketSnapshots);
    globalSnapshots.forEach(snapshot => {
      if (watchlist.includes(snapshot.symbol)) snapshotMap.set(snapshot.symbol, snapshot);
    });
    for (const symbol of snapshotMap.keys()) if (!watchlist.includes(symbol)) snapshotMap.delete(symbol);

    workflowMod.useWorkflowStore.setState({
      auditRuns: history,
      activeCases: workspace?.activeCases ?? new Map(),
      caseEvents: workspace?.caseEvents ?? new Map(),
      caseTemplates: workspace?.caseTemplates ?? new Map(),
      marketSnapshots: snapshotMap,
      lastRunTime: workspace?.lastRunTime ?? null,
      runIndex: workspace?.runIndex ?? 1,
      latestTelegramAlert: null,
    });
    return true;
  } catch (err) {
    console.warn('[AuthStore] Gagal menghidrasi data user:', err);
    return false;
  }
}

function syncAuthUser(authUser: User, force = false): Promise<void> {
  const key = JSON.stringify([authUser.id, authUser.email, authUser.user_metadata]);
  if (activeSync?.key === key && activeSync.generation === sessionGeneration) return activeSync.promise;
  if (!force && hydratedKey === key && useAuthStore.getState().currentUser?.id === authUser.id) return Promise.resolve();
  const generation = ++sessionGeneration;
  const promise = performSyncAuthUser(authUser, generation).then(hydrated => {
    if (hydrated && generation === sessionGeneration && useAuthStore.getState().currentUser?.id === authUser.id) hydratedKey = key;
  }).finally(() => {
    if (activeSync?.generation === generation) activeSync = null;
  });
  activeSync = { key, generation, promise };
  return promise;
}

async function performSyncAuthUser(authUser: User, generation: number) {
  const prevUser = useAuthStore.getState().currentUser;
  if (prevUser && prevUser.id !== authUser.id) {
    await clearAccountStores(generation);
  }
  if (generation !== sessionGeneration) return;

  let profile = await fetchUserProfileFromSupabase(authUser.id);
  if (!profile && authUser.email) {
    const byEmail = await fetchUserProfileFromSupabase(authUser.email);
    if (byEmail?.id === authUser.id) {
      profile = byEmail;
    }
  }

  if (generation !== sessionGeneration) return;
  if (!profile) {
    profile = await saveUserProfileToSupabase(profileFromAuthUser(authUser));
  } else {
    const fresh = profileFromAuthUser(authUser, profile);
    const hasChanges =
      profile.name !== (fresh.name || profile.name) ||
      profile.avatar !== (fresh.avatar || profile.avatar) ||
      profile.email !== (authUser.email || profile.email);

    if (hasChanges) {
      profile = await saveUserProfileToSupabase({
        ...profile,
        name: fresh.name || profile.name,
        avatar: fresh.avatar || profile.avatar,
        email: authUser.email || profile.email,
      });
    }
  }

  if (generation !== sessionGeneration) return;
  // Set auth state immediately so route guards don't kick user out
  useAuthStore.setState({ currentUser: profile, authReady: true });
  return hydrateUserData(profile, generation);
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  authReady: false,
  login: (user) => {
    invalidateSessionWork();
    const generation = sessionGeneration;
    set({ currentUser: user, authReady: true });
    saveUserProfileToSupabase(user).then((saved) => {
      if (generation !== sessionGeneration) return;
      set({ currentUser: saved });
      hydrateUserData(saved, generation);
    });
  },
  logout: () => {
    invalidateSessionWork();
    set({ currentUser: null });
    clearAccountStores();
    supabase.auth.signOut().catch((err) => {
      console.warn('[AuthStore] Supabase signOut error:', err);
    });
  },
  updateUser: async (user) => {
    set({ currentUser: user });
    try {
      await saveUserProfileToSupabase(user);
    } catch (err) {
      console.warn('[AuthStore] Gagal sync ke Supabase:', err);
    }
  },
  syncFromSession: async () => {
    const generation = sessionGeneration;
    const { data: { session } } = await supabase.auth.getSession();
    if (generation !== sessionGeneration) {
      const key = session?.user && JSON.stringify([session.user.id, session.user.email, session.user.user_metadata]);
      if (key && activeSync?.key === key && activeSync.generation === sessionGeneration) await activeSync.promise;
      return;
    }
    if (session?.user) {
      await syncAuthUser(session.user, true);
    } else {
      invalidateSessionWork();
      set({ currentUser: null, authReady: true });
      await clearAccountStores();
    }
  },
}));

/** Route guards wait for Supabase to process a returning OAuth URL. */
export function waitForAuthReady(): Promise<void> {
  if (useAuthStore.getState().authReady) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.authReady) {
        unsubscribe();
        resolve();
      }
    });
  });
}

try {
  const hasAuthCallbackInUrl =
    typeof window !== 'undefined' &&
    (window.location.hash.includes('access_token') ||
      window.location.hash.includes('error') ||
      window.location.search.includes('code=') ||
      window.location.search.includes('error='));

  const initialGeneration = sessionGeneration;
  let recoveryGeneration = initialGeneration;
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (initialGeneration !== sessionGeneration) return;
    if (error) throw error;
    if (session?.user) {
      const sync = syncAuthUser(session.user);
      recoveryGeneration = sessionGeneration;
      return sync;
    } else if (!hasAuthCallbackInUrl) {
      useAuthStore.setState({ currentUser: null, authReady: true });
    }
  }).catch((err) => {
    if (recoveryGeneration !== sessionGeneration) return;
    console.warn('[AuthStore] Gagal memulihkan sesi:', err);
    if (!hasAuthCallbackInUrl) {
      useAuthStore.setState({ currentUser: null, authReady: true });
    }
  });

  if (hasAuthCallbackInUrl) {
    // Safety fallback: if Supabase onAuthStateChange takes > 3.5s, unblock
    setTimeout(() => {
      if (!useAuthStore.getState().authReady) {
        useAuthStore.setState({ authReady: true });
      }
    }, 3500);
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (
      (event === 'SIGNED_IN' ||
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION' ||
        event === 'TOKEN_REFRESHED') &&
      session?.user
    ) {
      const eventVersion = ++authEventVersion;
      setTimeout(() => {
        if (eventVersion !== authEventVersion) return;
        const sync = syncAuthUser(session.user, event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED');
        const generation = sessionGeneration;
        sync.catch((err) => {
          if (generation !== sessionGeneration) return;
          console.warn('[AuthStore] Gagal sinkronisasi akun:', err);
          useAuthStore.setState({ authReady: true });
        });
      }, 0);
    } else if (event === 'SIGNED_OUT') {
      invalidateSessionWork();
      useAuthStore.setState({ currentUser: null, authReady: true });
      clearAccountStores();
    }
  });
} catch (err) {
  console.warn('[AuthStore] Supabase auth listener init error:', err);
  useAuthStore.setState({ authReady: true });
}
