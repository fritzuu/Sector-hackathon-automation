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

function getWorkflowStore() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../../../modules/cases/stores/workflow.store').useWorkflowStore;
}

function getWatchlistStore() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../../../modules/watchlist/stores/watchlist.store').useWatchlistStore;
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
  const [history, workspace] = await Promise.all([
    fetchAuditRunsFromSupabase(profile.id),
    fetchUserWorkspaceFromSupabase(profile.id),
  ]);

  getWatchlistStore().getState().setWatchlist(profile.defaultWatchlist || []);

  const workflow = getWorkflowStore();
  workflow.setState({
    auditRuns: history,
    activeCases: workspace?.activeCases ?? new Map(),
    caseEvents: workspace?.caseEvents ?? new Map(),
    caseTemplates: workspace?.caseTemplates ?? new Map(),
    lastRunTime: workspace?.lastRunTime ?? null,
    runIndex: workspace?.runIndex ?? 1,
    latestTelegramAlert: null,
  });
}

function clearAccountStores() {
  getWorkflowStore().getState().resetReplay();
  getWatchlistStore().getState().reset();
}

async function syncAuthUser(authUser: User) {
  let profile = await fetchUserProfileFromSupabase(authUser.id);
  if (!profile && authUser.email) {
    const byEmail = await fetchUserProfileFromSupabase(authUser.email);
    if (byEmail && byEmail.id === authUser.id) {
      profile = byEmail;
    }
  }

  if (!profile) {
    profile = await saveUserProfileToSupabase(profileFromAuthUser(authUser));
  } else {
    const merged = profileFromAuthUser(authUser, profile);
    if (
      merged.name !== profile.name ||
      merged.avatar !== profile.avatar ||
      merged.email !== profile.email
    ) {
      profile = await saveUserProfileToSupabase({ ...profile, ...merged, pairingToken: profile.pairingToken });
    }
  }

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
      clearAccountStores();
    }
  },
}));

try {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      syncAuthUser(session.user);
    } else {
      useAuthStore.setState({ currentUser: null, authReady: true });
    }
  });

  supabase.auth.onAuthStateChange(async (event, session) => {
    if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
      await syncAuthUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ currentUser: null, authReady: true });
      clearAccountStores();
    }
  });
} catch (err) {
  console.warn('[AuthStore] Supabase auth listener init error:', err);
  useAuthStore.setState({ authReady: true });
}
