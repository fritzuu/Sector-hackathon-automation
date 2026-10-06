import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '../src/data/userProfiles';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  saveWorkspace: vi.fn().mockResolvedValue(true),
  fetchProfile: vi.fn(),
}));

vi.mock('../src/lib/supabaseClient', () => ({
  supabase: { auth: {
    getSession: mocks.getSession,
    signOut: mocks.signOut,
    onAuthStateChange: vi.fn(),
  } },
}));
vi.mock('../src/services/supabaseStorage', () => ({
  saveUserWorkspaceToSupabase: mocks.saveWorkspace,
  fetchUserProfileFromSupabase: mocks.fetchProfile,
  saveUserProfileToSupabase: vi.fn(async (profile) => profile),
  fetchAuditRunsFromSupabase: vi.fn().mockResolvedValue([]),
  fetchUserWorkspaceFromSupabase: vi.fn().mockResolvedValue(null),
  fetchGlobalMarketSnapshots: vi.fn().mockResolvedValue([]),
  syncWatchlistToSupabase: vi.fn().mockResolvedValue({ ok: true }),
}));

import { useAuthStore } from '../src/modules/auth/stores/auth.store';
import { useWorkflowStore } from '../src/modules/cases/stores/workflow.store';
import { useWatchlistStore } from '../src/modules/watchlist/stores/watchlist.store';

const profile = (id: string): UserProfile => ({
  id, name: id, email: `${id}@example.test`, avatar: '', role: 'Investor Ritel',
  telegramChatId: null, telegramUsername: null, isTelegramLinked: false,
  pairingToken: 'test-token', defaultWatchlist: [],
});

describe('account cleanup does not erase persisted workspaces', () => {
  beforeEach(async () => {
    await vi.waitFor(() => expect(useAuthStore.getState().authReady).toBe(true));
    vi.clearAllMocks();
    useAuthStore.setState({ currentUser: profile('account-a') });
    useWorkflowStore.setState({
      marketSnapshots: new Map([['BBCA', { lastPrice: 9000 }]]),
      lastRunTime: '2026-10-07T09:30:00Z', runIndex: 4,
      latestTelegramAlert: 'Old account alert', telegramLogs: [],
      isFetchingLogs: true, isRunning: true,
    });
    useWatchlistStore.setState({ watchlist: ['BBCA'] });
  });

  it('clears memory even with an active account without saving an empty workspace', () => {
    useWorkflowStore.getState().clearAccountState();
    expect(useWorkflowStore.getState()).toMatchObject({
      lastRunTime: null, runIndex: 1, latestTelegramAlert: null,
      telegramLogs: null, isFetchingLogs: false, isRunning: false,
    });
    expect(useWorkflowStore.getState().marketSnapshots.size).toBe(0);
    expect(mocks.saveWorkspace).not.toHaveBeenCalled();
  });

  it('switches to another account without persisting a reset for either account', async () => {
    const next = profile('account-b');
    mocks.fetchProfile.mockResolvedValue(next);
    mocks.getSession.mockResolvedValue({ data: { session: { user: {
      id: next.id, email: next.email, user_metadata: {},
    } } }, error: null });
    await useAuthStore.getState().syncFromSession();
    expect(useAuthStore.getState().currentUser?.id).toBe(next.id);
    expect(useWorkflowStore.getState().marketSnapshots.size).toBe(0);
    expect(useWorkflowStore.getState().telegramLogs).toBeNull();
    expect(useWatchlistStore.getState().watchlist).toEqual([]);
    expect(mocks.saveWorkspace).not.toHaveBeenCalled();
  });

  it('logs out without persisting a workspace reset', async () => {
    useAuthStore.getState().logout();
    await vi.waitFor(() => expect(useWorkflowStore.getState().marketSnapshots.size).toBe(0));
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useWatchlistStore.getState().watchlist).toEqual([]);
    expect(mocks.saveWorkspace).not.toHaveBeenCalled();
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });

  it('preserves the explicit replay reset behavior', () => {
    useWorkflowStore.getState().resetReplay();
    expect(mocks.saveWorkspace).toHaveBeenCalledWith('account-a', expect.objectContaining({
      activeCases: new Map(), marketSnapshots: new Map(), lastRunTime: null,
    }));
  });
});
