import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = vi.hoisted(() => ({
  result: vi.fn(),
  user: { id: 'account-a' },
}));

vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: mocks.result,
      };
      return query;
    },
  },
}));
vi.mock('../src/modules/auth/stores/auth.store', () => ({
  useAuthStore: { getState: () => ({ currentUser: mocks.user }) },
}));

import { fetchAuditRunsFromSupabase } from '../src/services/supabaseStorage';
import { useWorkflowStore } from '../src/modules/cases/stores/workflow.store';
import { RunAuditHistory } from '../src/modules/cases/components/RunAuditHistory';
import { TelegramLogViewer } from '../src/modules/dashboard/components/TelegramLogViewer';

describe('history loading failures and recovery', () => {
  beforeEach(() => {
    mocks.user.id = 'account-a';
    mocks.result.mockReset();
    useWorkflowStore.getState().clearAccountState();
  });

  it('rejects audit database errors instead of returning an empty history', async () => {
    mocks.result.mockResolvedValue({ data: null, error: new Error('offline') });
    await expect(fetchAuditRunsFromSupabase('account-a')).rejects.toThrow('offline');
  });

  it('shows audit failure, stops loading, and clears the error after retry succeeds', async () => {
    mocks.result.mockResolvedValueOnce({ data: null, error: new Error('offline') });
    await useWorkflowStore.getState().fetchAuditRuns('account-a');
    expect(useWorkflowStore.getState()).toMatchObject({
      isFetchingAudit: false,
      auditRunsError: expect.any(String),
    });
    const html = renderToStaticMarkup(React.createElement(RunAuditHistory, {
      runs: [], error: useWorkflowStore.getState().auditRunsError, onRetry: () => {},
    }));
    expect(html).toContain('Coba lagi');
    expect(html).not.toContain('Belum ada riwayat evaluasi.');

    mocks.result.mockResolvedValueOnce({ data: [], error: null });
    await useWorkflowStore.getState().fetchAuditRuns('account-a');
    expect(useWorkflowStore.getState()).toMatchObject({
      auditRuns: [], auditRunsError: null, isFetchingAudit: false,
    });
  });

  it('stops Telegram loading on database errors and preserves cached logs', async () => {
    const logs = [{
      id: 'existing', message: 'Existing message', timestamp: '2026-10-07T00:00:00Z',
      chatId: 'chat-a', username: 'User', status: 'SENT' as const,
    }];
    useWorkflowStore.setState({ telegramLogs: logs });
    mocks.result.mockResolvedValueOnce({ data: null, error: new Error('offline') });
    await useWorkflowStore.getState().fetchTelegramLogs('chat-a');
    expect(useWorkflowStore.getState()).toMatchObject({
      telegramLogs: logs, isFetchingLogs: false, telegramLogsError: expect.any(String),
    });

    mocks.result.mockResolvedValueOnce({ data: [], error: null });
    await useWorkflowStore.getState().fetchTelegramLogs('chat-a');
    expect(useWorkflowStore.getState()).toMatchObject({
      telegramLogs: [], isFetchingLogs: false, telegramLogsError: null,
    });
  });

  it('stops Telegram loading when the request throws', async () => {
    mocks.result.mockRejectedValueOnce(new Error('network failure'));
    await useWorkflowStore.getState().fetchTelegramLogs('chat-a');
    expect(useWorkflowStore.getState()).toMatchObject({
      telegramLogs: null, isFetchingLogs: false, telegramLogsError: expect.any(String),
    });
    const html = renderToStaticMarkup(React.createElement(TelegramLogViewer, {
      user: {
        id: 'account-a', name: 'User', email: 'user@example.test', avatar: '',
        role: 'Investor Ritel', isTelegramLinked: true, telegramChatId: 'chat-a',
        telegramUsername: 'user', pairingToken: 'test-token', defaultWatchlist: [],
      },
      logs: [], error: useWorkflowStore.getState().telegramLogsError,
      onClearLogs: () => {}, onRetry: () => {},
    }));
    expect(html).toContain('Coba lagi');
    expect(html).not.toContain('Belum ada log entri Telegram yang dikirim.');
  });

  it('does not restore old account results after session cleanup', async () => {
    let resolve!: (value: { data: never[]; error: null }) => void;
    mocks.result.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const pending = useWorkflowStore.getState().fetchAuditRuns('account-a');
    useWorkflowStore.getState().clearAccountState();
    mocks.user.id = 'account-b';
    resolve({ data: [], error: null });
    await pending;
    expect(useWorkflowStore.getState()).toMatchObject({
      auditRuns: [], auditRunsError: null, isFetchingAudit: false,
    });
  });
});
