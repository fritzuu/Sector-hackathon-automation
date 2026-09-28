import { create } from 'zustand';
import { CaseState, CaseEvent, RenderedTemplate } from '../../../types/engine';
import { AuditRunItem } from '../components/RunAuditHistory';
import { evaluateDataset } from '../../../engine/rules/index';
import { processCaseTransition } from '../../../engine/caseEngine';
import { renderCaseTemplate } from '../../../engine/templateRenderer';
import { sectorsApi } from '../../../services/sectorsApi';
import { dispatchCaseAlert } from '../../../services/telegramService';
import {
  saveAuditRunToSupabase,
  saveUserWorkspaceToSupabase,
} from '../../../services/supabaseStorage';
import { TickerDataset } from '../../../types/sectors';
import { useWatchlistStore } from '../../watchlist/stores/watchlist.store';
import { useAuthStore } from '../../auth/stores/auth.store';

interface WorkflowState {
  activeCases: Map<string, CaseState>;
  caseEvents: Map<string, CaseEvent[]>;
  caseTemplates: Map<string, RenderedTemplate>;
  auditRuns: AuditRunItem[];
  isRunning: boolean;
  lastRunTime: string | null;
  runIndex: number;
  latestTelegramAlert: string | null;
  runWorkflow: () => Promise<void>;
  resetReplay: () => void;
  clearLatestAlert: () => void;
  setLatestTelegramAlert: (msg: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  activeCases: new Map(),
  caseEvents: new Map(),
  caseTemplates: new Map(),
  auditRuns: [],
  isRunning: false,
  lastRunTime: null,
  runIndex: 1,
  latestTelegramAlert: null,

  clearLatestAlert: () => set({ latestTelegramAlert: null }),
  setLatestTelegramAlert: (msg) => set({ latestTelegramAlert: msg }),

  resetReplay: () => {
    const emptyWorkspace = {
      activeCases: new Map<string, CaseState>(),
      caseEvents: new Map<string, CaseEvent[]>(),
      caseTemplates: new Map<string, RenderedTemplate>(),
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
  },

  runWorkflow: async () => {
    const { activeCases, caseEvents, caseTemplates, runIndex } = get();
    const watchlist = useWatchlistStore.getState().watchlist;
    const currentUser = useAuthStore.getState().currentUser;

    set({ isRunning: true });
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    let totalTriggersFound = 0;
    let sampleDispatchedAlert: string | null = null;

    const updatedCases = new Map(activeCases);
    const updatedEvents = new Map(caseEvents);
    const updatedTemplates = new Map(caseTemplates);

    try {
      for (const ticker of watchlist) {
        const prices = await sectorsApi.fetchDailyTransactions(ticker);
        const benchmark = await sectorsApi.fetchBenchmarkData(prices.map((p) => p.date));
        const filings = await sectorsApi.fetchCompanyFilings(ticker);

        const dataset: TickerDataset = {
          symbol: ticker,
          asOfDate: prices.length > 0 ? prices[prices.length - 1].date : timestamp.split('T')[0],
          historicalPrices: prices,
          benchmarkPrices: benchmark,
          filings,
          lastEvaluatedFilingId: null,
        };

        const evalResult = evaluateDataset(dataset);
        totalTriggersFound += evalResult.activeTriggerCount;

        const currentCase = updatedCases.get(ticker) || null;
        const transition = processCaseTransition(currentCase, evalResult, timestamp);

        if (transition.nextCaseState) {
          updatedCases.set(ticker, transition.nextCaseState);
        } else if (currentCase && transition.event.newStatus === 'CLOSED') {
          updatedCases.delete(ticker);
        }

        const existingEvents = updatedEvents.get(ticker) || [];
        updatedEvents.set(ticker, [transition.event, ...existingEvents]);

        const template = renderCaseTemplate(evalResult, transition.event.newStatus);
        updatedTemplates.set(ticker, template);

        // Telegram: dispatch alert nyata via Vite proxy -> Telegram Bot API
        // Hanya untuk event material (PRD §6.4 — MONITORING tidak dikirim)
        const isMaterialEvent = ['OPEN', 'UPDATED', 'CLOSED', 'DATA_INCOMPLETE'].includes(
          transition.event.newStatus
        );
        if (currentUser?.isTelegramLinked && currentUser.telegramChatId && isMaterialEvent) {
          // fire-and-forget: kegagalan delivery tidak menghentikan workflow (PRD §6.5)
          dispatchCaseAlert({
            symbol:          ticker,
            status:          transition.event.newStatus as any,
            evaluation_date: evalResult.evaluationDate,
            facts:           template.facts,
            interpretations: template.limitedInterpretations,
            unknowns:        template.unknowns,
            target_chat_id:  currentUser.telegramChatId,
            is_replay:       false,
          }).then((res) => {
            if (!res.success) console.warn(`[Telegram] Dispatch gagal untuk ${ticker}:`, res.result);
          });

          // Simpan preview untuk toast UI (hanya satu alert pertama)
          if (!sampleDispatchedAlert) {
            const dateLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
            sampleDispatchedAlert = [
              `🔔 [SIBA ALERT — ${ticker}]`,
              `📅 ${dateLabel} · Penutupan Market 16:30 WIB`,
              `Status Case: ${transition.event.newStatus}`,
              ``,
              `📌 Temuan Utama:`,
              `${template.facts[0]}`,
              ``,
              `🔍 Interpretasi:`,
              `${template.limitedInterpretations[0]}`,
              ``,
              `📰 Cek berita terbaru: sectors.app/idx/${ticker}`,
              ``,
              `Lihat selengkapnya di Dashboard SIBA.`,
            ].join('\n');
          }
        }
      }
    } catch (err) {
      console.error('[Workflow Execution Error]:', err);
    }

    const durationMs = Date.now() - startTime;
    const newAudit: AuditRunItem = {
      runId: `RUN-${timestamp.slice(0, 10).replace(/-/g, '')}-${runIndex.toString().padStart(3, '0')}`,
      timestamp,
      tickersCount: watchlist.length,
      activeTriggersCount: totalTriggersFound,
      status: 'SUCCESS',
      durationMs,
    };

    const nextRunIndex = runIndex + 1;
    const nextAuditRuns = [newAudit, ...get().auditRuns];

    set({
      activeCases: updatedCases,
      caseEvents: updatedEvents,
      caseTemplates: updatedTemplates,
      auditRuns: nextAuditRuns,
      lastRunTime: timestamp,
      runIndex: nextRunIndex,
      isRunning: false,
      latestTelegramAlert: sampleDispatchedAlert || get().latestTelegramAlert
    });

    if (currentUser?.id) {
      saveAuditRunToSupabase(newAudit, currentUser.id);
      void saveUserWorkspaceToSupabase(currentUser.id, {
        activeCases: updatedCases,
        caseEvents: updatedEvents,
        caseTemplates: updatedTemplates,
        lastRunTime: timestamp,
        runIndex: nextRunIndex,
      });
    }
  }
}));

