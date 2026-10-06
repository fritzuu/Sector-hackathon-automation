import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '../src/data/userProfiles';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  saveWorkspace: vi.fn().mockResolvedValue(true),
  fetchProfile: vi.fn(),
  fetchSnapshots: vi.fn().mockResolvedValue([]),
  syncWatchlist: vi.fn().mockResolvedValue({ ok: true }),
  invoke: vi.fn(),
  authCallback: null as null | ((event: string, session: any) => void),
}));

vi.mock('../src/lib/supabaseClient', () => ({
  supabase: { functions: { invoke: mocks.invoke }, auth: {
    getSession: mocks.getSession,
    signOut: mocks.signOut,
    onAuthStateChange: vi.fn(callback => { mocks.authCallback = callback; }),
  } },
}));
vi.mock('../src/services/supabaseStorage', () => ({
  saveUserWorkspaceToSupabase: mocks.saveWorkspace,
  fetchUserProfileFromSupabase: mocks.fetchProfile,
  saveUserProfileToSupabase: vi.fn(async (profile) => profile),
  fetchAuditRunsFromSupabase: vi.fn().mockResolvedValue([]),
  fetchUserWorkspaceFromSupabase: vi.fn().mockResolvedValue(null),
  fetchGlobalMarketSnapshots: mocks.fetchSnapshots,
  syncWatchlistToSupabase: mocks.syncWatchlist,
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
    mocks.fetchSnapshots.mockResolvedValue([]);
    mocks.syncWatchlist.mockResolvedValue({ ok: true });
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

  it('hydrates concurrent recovery requests once', async () => {
    mocks.fetchProfile.mockResolvedValue(profile('account-a'));
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'account-a', email: 'account-a@example.test', user_metadata: {} } } } });
    await Promise.all([useAuthStore.getState().syncFromSession(), useAuthStore.getState().syncFromSession()]);
    expect(mocks.fetchProfile).toHaveBeenCalledTimes(1);
    expect(mocks.fetchSnapshots).toHaveBeenCalledTimes(1);
  });

  it('ignores a profile response that finishes after logout', async () => {
    let resolve!: (value: UserProfile) => void;
    mocks.fetchProfile.mockImplementationOnce(() => new Promise<UserProfile>(done => { resolve = done; }));
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'account-a', email: 'account-a@example.test', user_metadata: {} } } } });
    const sync = useAuthStore.getState().syncFromSession();
    await vi.waitFor(() => expect(mocks.fetchProfile).toHaveBeenCalled());
    useAuthStore.getState().logout();
    resolve(profile('account-a'));
    await sync;
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(mocks.fetchSnapshots).not.toHaveBeenCalled();
  });

  it('does not hydrate again for INITIAL_SESSION after completed recovery', async () => {
    const user = { id: 'account-a', email: 'account-a@example.test', user_metadata: {} };
    mocks.fetchProfile.mockResolvedValue(profile('account-a'));
    mocks.getSession.mockResolvedValue({ data: { session: { user } } });
    await useAuthStore.getState().syncFromSession();
    mocks.authCallback!('INITIAL_SESSION', { user });
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mocks.fetchProfile).toHaveBeenCalledOnce();
    expect(mocks.fetchSnapshots).toHaveBeenCalledOnce();
  });

  it('ignores the old account when its response arrives after a newer session', async () => {
    let resolve!: (value: UserProfile) => void;
    mocks.fetchProfile.mockImplementationOnce(() => new Promise<UserProfile>(done => { resolve = done; }));
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'account-a', email: 'account-a@example.test', user_metadata: {} } } } });
    const oldSync = useAuthStore.getState().syncFromSession();
    await vi.waitFor(() => expect(mocks.fetchProfile).toHaveBeenCalled());
    mocks.fetchProfile.mockResolvedValue(profile('account-b'));
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'account-b', email: 'account-b@example.test', user_metadata: {} } } } });
    await useAuthStore.getState().syncFromSession();
    resolve(profile('account-a'));
    await oldSync;
    expect(useAuthStore.getState().currentUser?.id).toBe('account-b');
  });

  it('loads only newly accepted preset tickers and reuses stored snapshots', async () => {
    mocks.fetchSnapshots.mockImplementation(async (symbols: string[]) => symbols.map(symbol => ({ symbol, lastPrice: 9000, dataDate: '2026-10-06' })));
    await useWatchlistStore.getState().addPresets(['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'UNVR']);
    expect(useWatchlistStore.getState().watchlist).toEqual(['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII']);
    expect(mocks.fetchSnapshots).toHaveBeenCalledTimes(4);
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(useWorkflowStore.getState().marketSnapshots.has('BBRI')).toBe(true);
  });

  it('loads missing snapshots via proxy using the same path for single additions', async () => {
    mocks.invoke.mockResolvedValue({ data: { symbol: 'BBRI', last_price: 9000, data_date: '2026-10-06' }, error: null });
    await useWatchlistStore.getState().addTicker('BBRI');
    expect(mocks.invoke).toHaveBeenCalledOnce();
    expect(useWorkflowStore.getState().marketSnapshots.get('BBRI')).toMatchObject({ lastPrice: 9000, dataDate: '2026-10-06' });
    await useWatchlistStore.getState().addTicker('BBRI');
    expect(mocks.invoke).toHaveBeenCalledOnce();
  });

  it('does not load snapshots when watchlist persistence fails', async () => {
    vi.stubGlobal('alert', vi.fn());
    mocks.syncWatchlist.mockResolvedValueOnce({ ok: false, error: 'Save failed' });
    await useWatchlistStore.getState().addPresets(['BBRI']);
    expect(useWatchlistStore.getState().watchlist).toEqual(['BBCA']);
    expect(mocks.fetchSnapshots).not.toHaveBeenCalled();
    expect(mocks.invoke).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('ignores snapshot responses after an account switch', async () => {
    let resolve!: (value: any[]) => void;
    mocks.fetchSnapshots.mockImplementationOnce(() => new Promise<any[]>(done => { resolve = done; }));
    const addition = useWatchlistStore.getState().addPresets(['BBRI']);
    await vi.waitFor(() => expect(mocks.fetchSnapshots).toHaveBeenCalled());
    useWatchlistStore.getState().reset();
    useAuthStore.setState({ currentUser: profile('account-b') });
    resolve([{ symbol: 'BBRI', lastPrice: 9000 }]);
    await addition;
    expect(useWorkflowStore.getState().marketSnapshots.has('BBRI')).toBe(false);
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
});
