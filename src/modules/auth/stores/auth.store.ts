import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { UserProfile } from '../../../data/userProfiles';
import {
  saveUserProfileToSupabase,
  fetchUserProfileFromSupabase,
  fetchAuditRunsFromSupabase,
  fetchUserWorkspaceFromSupabase,
} from '../../../services/supabaseStorage';
import { supabase } from '../../../lib/supabaseClient';
import { generateSecurePairingToken } from '../../../utils/token';

interface AuthState {
  currentUser: UserProfile | null;
  authReady: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
  syncFromSession: () => Promise<void>;
}

async function clearAccountStores() {
  try {
    const [workflowMod, watchlistMod] = await Promise.all([
      import('../../../modules/cases/stores/workflow.store'),
      import('../../../modules/watchlist/stores/watchlist.store'),
    ]);
    workflowMod.useWorkflowStore.getState().resetReplay();
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

async function hydrateUserData(profile: UserProfile) {
  try {
    const [history, workspace, workflowMod, watchlistMod] = await Promise.all([
      fetchAuditRunsFromSupabase(profile.id),
      fetchUserWorkspaceFromSupabase(profile.id),
      import('../../../modules/cases/stores/workflow.store'),
      import('../../../modules/watchlist/stores/watchlist.store'),
    ]);

    if (useAuthStore.getState().currentUser?.id !== profile.id) return;

    watchlistMod.useWatchlistStore.getState().setWatchlist(profile.defaultWatchlist || []);

    workflowMod.useWorkflowStore.setState({
      auditRuns: history,
      activeCases: workspace?.activeCases ?? new Map(),
      caseEvents: workspace?.caseEvents ?? new Map(),
      caseTemplates: workspace?.caseTemplates ?? new Map(),
      lastRunTime: workspace?.lastRunTime ?? null,
      runIndex: workspace?.runIndex ?? 1,
      latestTelegramAlert: null,
    });
  } catch (err) {
    console.warn('[AuthStore] Gagal menghidrasi data user:', err);
  }
}

async function syncAuthUser(authUser: User) {
  const prevUser = useAuthStore.getState().currentUser;
  if (prevUser && prevUser.id !== authUser.id && prevUser.email !== authUser.email) {
    await clearAccountStores();
  }

  let profile = await fetchUserProfileFromSupabase(authUser.id);
  if (!profile && authUser.email) {
    const byEmail = await fetchUserProfileFromSupabase(authUser.email);
    if (byEmail) {
      profile = byEmail;
    }
  }

  if (!profile) {
    profile = await saveUserProfileToSupabase(profileFromAuthUser(authUser));
  } else {
    const fresh = profileFromAuthUser(authUser, profile);
    profile = await saveUserProfileToSupabase({
      ...profile,
      name: fresh.name || profile.name,
      avatar: fresh.avatar || profile.avatar,
      email: authUser.email || profile.email,
    });
  }

  // Set auth state immediately so route guards don't kick user out
  useAuthStore.setState({ currentUser: profile, authReady: true });
  await hydrateUserData(profile);
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  authReady: false,
  login: (user) => {
    set({ currentUser: user, authReady: true });
    saveUserProfileToSupabase(user).then((saved) => {
      set({ currentUser: saved });
      hydrateUserData(saved);
    });
  },
  logout: () => {
    set({ currentUser: null });
    clearAccountStores();
    supabase.auth.signOut().catch((err) => {
      console.warn('[AuthStore] Supabase signOut error:', err);
    });
  },
  updateUser: (user) => {
    set({ currentUser: user });
    saveUserProfileToSupabase(user).catch((err) => {
      console.warn('[AuthStore] Gagal sync ke Supabase:', err);
    });
  },
  syncFromSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await syncAuthUser(session.user);
    } else {
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

  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) throw error;
    if (session?.user) {
      return syncAuthUser(session.user);
    } else if (!hasAuthCallbackInUrl) {
      useAuthStore.setState({ currentUser: null, authReady: true });
    }
  }).catch((err) => {
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
      setTimeout(() => {
        syncAuthUser(session.user).catch((err) => {
          console.warn('[AuthStore] Gagal sinkronisasi akun:', err);
          useAuthStore.setState({ authReady: true });
        });
      }, 0);
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ currentUser: null, authReady: true });
      clearAccountStores();
    }
  });
} catch (err) {
  console.warn('[AuthStore] Supabase auth listener init error:', err);
  useAuthStore.setState({ authReady: true });
}
