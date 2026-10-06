import { create } from 'zustand';
import { CaseState, CaseEvent, RenderedTemplate } from '../../../types/engine';
import { AuditRunItem } from '../components/RunAuditHistory';
import {
  saveUserWorkspaceToSupabase,
} from '../../../services/supabaseStorage';
import { useAuthStore } from '../../auth/stores/auth.store';

import { TelegramLogEntry } from '../../dashboard/components/TelegramLogViewer';

interface WorkflowState {
  activeCases: Map<string, CaseState>;
  caseEvents: Map<string, CaseEvent[]>;
  caseTemplates: Map<string, RenderedTemplate>;
  marketSnapshots: Map<string, any>;
  auditRuns: AuditRunItem[];
  isRunning: boolean;
  lastRunTime: string | null;
  runIndex: number;
  latestTelegramAlert: string | null;
  
  // Telegram Logs Cache
  telegramLogs: TelegramLogEntry[] | null;
  isFetchingLogs: boolean;
  
  resetReplay: () => void;
  clearLatestAlert: () => void;
  setLatestTelegramAlert: (msg: string) => void;
  fetchTelegramLogs: (chatId: string) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  activeCases: new Map(),
  caseEvents: new Map(),
  caseTemplates: new Map(),
  marketSnapshots: new Map(),
  auditRuns: [],
  isRunning: false,
  lastRunTime: null,
  runIndex: 1,
  latestTelegramAlert: null,
  telegramLogs: null,
  isFetchingLogs: false,

  clearLatestAlert: () => set({ latestTelegramAlert: null }),
  setLatestTelegramAlert: (msg) => set({ latestTelegramAlert: msg }),
  
  fetchTelegramLogs: async (chatId: string) => {
    // If we already have logs, we don't necessarily block UI (cache hit), but we can still fetch in background
    if (!get().telegramLogs) set({ isFetchingLogs: true });
    
    try {
      const { supabase } = await import('../../../lib/supabaseClient');
      const { data } = await supabase
        .from('telegram_outbox')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        const parsedLogs = data.map((row: any) => {
          const tickerMatch = row.message.match(/\[SIBA — ([A-Z0-9]+)\]/);
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
        set({ telegramLogs: parsedLogs, isFetchingLogs: false });
      }
    } catch (err) {
      console.error('Failed to fetch telegram logs', err);
      set({ isFetchingLogs: false });
    }
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

