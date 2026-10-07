import { create } from 'zustand';
import { CaseState, CaseEvent, RenderedTemplate } from '../../../types/engine';
import { AuditRunItem } from '../components/RunAuditHistory';
import {
  saveUserWorkspaceToSupabase,
  fetchAuditRunsFromSupabase,
} from '../../../services/supabaseStorage';
import { useAuthStore } from '../../auth/stores/auth.store';

import { TelegramLogEntry } from '../../dashboard/components/TelegramLogViewer';

interface WorkflowState {
  activeCases: Map<string, CaseState>;
  caseEvents: Map<string, CaseEvent[]>;
  caseTemplates: Map<string, RenderedTemplate>;
  marketSnapshots: Map<string, any>;
  auditRuns: AuditRunItem[];
  auditRunsError: string | null;
  isFetchingAudit: boolean;
  fetchAuditRuns: (userId: string) => Promise<void>;
  isRunning: boolean;
  lastRunTime: string | null;
  runIndex: number;
  latestTelegramAlert: string | null;
  
  // Telegram Logs Cache
  telegramLogs: TelegramLogEntry[] | null;
  isFetchingLogs: boolean;
  telegramLogsError: string | null;
  
  clearAccountState: () => void;
  resetReplay: () => void;
  clearLatestAlert: () => void;
  setLatestTelegramAlert: (msg: string) => void;
  fetchTelegramLogs: (chatId: string) => Promise<void>;
}

let auditRequest = 0;
let logsRequest = 0;

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  activeCases: new Map(),
  caseEvents: new Map(),
  caseTemplates: new Map(),
  marketSnapshots: new Map(),
  auditRuns: [],
  auditRunsError: null,
  isFetchingAudit: false,
  isRunning: false,
  lastRunTime: null,
  runIndex: 1,
  latestTelegramAlert: null,
  telegramLogs: null,
  isFetchingLogs: false,
  telegramLogsError: null,

  clearLatestAlert: () => set({ latestTelegramAlert: null }),
  setLatestTelegramAlert: (msg) => set({ latestTelegramAlert: msg }),
  
  fetchAuditRuns: async (userId) => {
    const request = ++auditRequest;
    set({ isFetchingAudit: true });
    const isCurrent = () => request === auditRequest && useAuthStore.getState().currentUser?.id === userId;
    try {
      const runs = await fetchAuditRunsFromSupabase(userId);
      if (isCurrent()) set({ auditRuns: runs, auditRunsError: null });
    } catch {
      if (isCurrent()) set({ auditRunsError: 'Riwayat evaluasi belum dapat dimuat. Coba lagi.' });
    } finally {
      if (isCurrent()) set({ isFetchingAudit: false });
    }
  },

  fetchTelegramLogs: async (chatId) => {
    if (get().isFetchingLogs) return;
    const request = ++logsRequest;
    const userId = useAuthStore.getState().currentUser?.id;
    const isCurrent = () => request === logsRequest && useAuthStore.getState().currentUser?.id === userId;
    set({ isFetchingLogs: true });
    try {
      const { supabase } = await import('../../../lib/supabaseClient');
      const { data, error } = await supabase
        .from('telegram_outbox')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      if (!data) throw new Error('Log Telegram tidak dapat dimuat.');

      const parsedLogs = data.map((row: any) => {
        const tickerMatch = row.message.match(/\[SIBA(?: \u2014 |: )([A-Z0-9]+)\]/);
        return {
          id: row.id,
          timestamp: row.created_at,
          message: row.message,
          ticker: tickerMatch ? tickerMatch[1] : undefined,
          chatId: row.chat_id,
          username: 'User',
          status: row.status.toUpperCase(),
        };
      });
      if (isCurrent()) set({ telegramLogs: parsedLogs, telegramLogsError: null });
    } catch {
      if (isCurrent()) set({ telegramLogsError: 'Log Telegram belum dapat dimuat. Coba lagi.' });
    } finally {
      if (isCurrent()) set({ isFetchingLogs: false });
    }
  },

  // Session cleanup must never persist an empty workspace.
  clearAccountState: () => {
    auditRequest++;
    logsRequest++;
    set({
      activeCases: new Map(),
      caseEvents: new Map(),
      caseTemplates: new Map(),
      marketSnapshots: new Map(),
      auditRuns: [],
      auditRunsError: null,
      isFetchingAudit: false,
      isRunning: false,
      lastRunTime: null,
      runIndex: 1,
      latestTelegramAlert: null,
      telegramLogs: null,
      isFetchingLogs: false,
      telegramLogsError: null,
    });
  },

  resetReplay: () => {
    const emptyWorkspace = {
      activeCases: new Map<string, CaseState>(),
      caseEvents: new Map<string, CaseEvent[]>(),
      caseTemplates: new Map<string, RenderedTemplate>(),
      marketSnapshots: new Map<string, any>(),
      lastRunTime: null,
      runIndex: 1,
    };
    set({
      ...emptyWorkspace,
      auditRuns: [],
      latestTelegramAlert: null,
    });
    const userId = useAuthStore.getState().currentUser?.id;
    if (userId) void saveUserWorkspaceToSupabase(userId, emptyWorkspace);
  }
}));
