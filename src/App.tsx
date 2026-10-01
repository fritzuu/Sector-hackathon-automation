import React, { useState, useEffect } from 'react';
import { Header } from './modules/dashboard/components/Header.js';
import { LandingPage } from './modules/dashboard/components/LandingPage.js';
import { AuthModal } from './modules/auth/components/AuthModal.js';
import { BeginnerGuideBanner } from './shared/components/BeginnerGuideBanner.js';
import { AutomationOverview } from './modules/dashboard/components/AutomationOverview.js';
import { WatchlistManager } from './modules/watchlist/components/WatchlistManager.js';
import { WatchlistNewsFeed } from './modules/watchlist/components/WatchlistNewsFeed.js';
import { ActiveCasesList } from './modules/cases/components/ActiveCasesList.js';
import { CaseDetailModal } from './modules/cases/components/CaseDetailModal.js';
import { RunAuditHistory, AuditRunItem } from './modules/cases/components/RunAuditHistory.js';
import { TelegramConnectModal } from './modules/auth/components/TelegramConnectModal.js';
import { TelegramAlertPreview } from './shared/components/TelegramAlertPreview.js';
import { SectorsApiBadge } from './shared/components/SectorsApiBadge.js';
import { MarketCloseToast } from './modules/dashboard/components/MarketCloseToast.js';
import { UserProfile } from './data/userProfiles.js';
import { CaseState, CaseEvent, RenderedTemplate } from './types/engine.js';
import { evaluateDataset } from './engine/rules/index.js';
import { processCaseTransition } from './engine/caseEngine.js';
import { renderCaseTemplate } from './engine/templateRenderer.js';
import { generateSecurePairingToken } from './utils/token.js';
import { sectorsApi } from './services/sectorsApi.js';

import { dispatchCaseAlert } from './services/telegramService.js';
import {
  fetchUserProfileFromSupabase,
  saveUserProfileToSupabase,
} from './services/supabaseStorage.js';
import { supabase } from './lib/supabaseClient.js';
import { TickerDataset } from './types/sectors.js';
import {
  addWatchlistTicker,
  addWatchlistTickers,
  limitWatchlist,
} from './modules/watchlist/watchlist.rules.js';

export function App() {
  // Auth state - default to null so landing page is ALWAYS the entry point
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
  }>({
    isOpen: false,
    mode: 'login',
  });

  // User Watchlist & Cases State
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [activeCases, setActiveCases] = useState<Map<string, CaseState>>(new Map());
  const [caseEvents, setCaseEvents] = useState<Map<string, CaseEvent[]>>(new Map());
  const [caseTemplates, setCaseTemplates] = useState<Map<string, RenderedTemplate>>(new Map());
  const [auditRuns, setAuditRuns] = useState<AuditRunItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [runIndex, setRunIndex] = useState(1);

  // Modals & Notifications
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [latestTelegramAlert, setLatestTelegramAlert] = useState<string | null>(null);

  // Auto-run scheduler state — prevents double-fire on the same day
  const [lastAutoRunDate, setLastAutoRunDate] = useState<string | null>(null);

  // 16:30 market-close refresh state
  const [newsForceRefresh, setNewsForceRefresh] = useState<number | undefined>(undefined);
  const [showMarketCloseToast, setShowMarketCloseToast] = useState(false);

  // Save user session & persistent cache (Supabase + local cache)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('siba_user', JSON.stringify(currentUser));
      saveUserProfileToSupabase(currentUser).catch((err) => {
        console.warn('[App] Gagal simpan profil ke Supabase:', err);
      });
    }
  }, [currentUser]);

  /**
   * Auto-scheduler: fires at 16:30 WIB (UTC+7) on weekdays (Mon–Fri).
   * Checks every 30 seconds. Busts ALL caches (price + IHSG + news + Sectors historical)
   * so watchlist cards and news feed get fully fresh data.
   * Triggers MarketCloseToast UI notification + Telegram alert preview.
   * Guards against double-fire: only runs once per calendar day.
   * Only active when user is logged in and app is open in browser.
   */
  useEffect(() => {
    if (!currentUser) return; // guest — no scheduler

    const tick = () => {
      // Current time in WIB (UTC+7)
      const nowUtc    = new Date();
      const wibMs     = nowUtc.getTime() + 7 * 60 * 60 * 1000;
      const wib       = new Date(wibMs);
      const hh        = wib.getUTCHours();
      const mm        = wib.getUTCMinutes();
      const dayOfWeek = wib.getUTCDay(); // 0=Sun, 6=Sat
      const dateStr   = wib.toISOString().slice(0, 10); // YYYY-MM-DD

      const isWeekday    = dayOfWeek >= 1 && dayOfWeek <= 5;
      const is1630Window = hh === 16 && mm >= 30 && mm <= 31; // 2-min fire window
      const notYetRun    = lastAutoRunDate !== dateStr;

      if (isWeekday && is1630Window && notYetRun && !isRunning) {
        console.log('[AutoScheduler] 16:30 WIB triggered — invalidating all caches and refreshing data.');
        setLastAutoRunDate(dateStr);

        // 1. Bust historical prices (Sectors API)
        sectorsApi.invalidateAll();

        // 2. Force-refresh the news feed immediately (WatchlistNewsFeed reacts to this)
        setNewsForceRefresh(Date.now());

        // 3. Show the market-close toast in the UI
        setShowMarketCloseToast(true);

        // 4. Run the full Sectors API workflow (fetches fresh prices + evaluates rules)
        handleRunWorkflow();
      }
    };

    const id = setInterval(tick, 30_000); // check every 30 seconds
    tick(); // also check immediately on login
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, lastAutoRunDate, isRunning]);

  // Auth Handlers
  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalState({ isOpen: true, mode });
  };

  const handleAuthSuccess = async (userData: { name: string; email: string; avatar?: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const authUser = session?.user;
    if (!authUser) {
      return;
    }

    let profile = await fetchUserProfileFromSupabase(authUser.id);
    if (!profile) {
      const newUser: UserProfile = {
        id: authUser.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar || authUser.user_metadata?.avatar_url || '',
        role: 'Investor Ritel',
        telegramChatId: null,
        telegramUsername: null,
        isTelegramLinked: false,
        pairingToken: generateSecurePairingToken(),
        defaultWatchlist: [],
      };
      profile = await saveUserProfileToSupabase(newUser);
    }

    setCurrentUser(profile);
    setWatchlist(limitWatchlist(profile.defaultWatchlist || []));
    setAuthModalState({ isOpen: false, mode: 'login' });
  };

  const handleLogout = () => {
    // Switch to guest landing page view, but preserve localStorage cache
    setCurrentUser(null);
    setSelectedCase(null);
    setLatestTelegramAlert(null);
  };

  // Watchlist Handlers
  const handleAddTicker = (ticker: string) => {
    setWatchlist((prev) => addWatchlistTicker(prev, ticker));
  };

  const handleRemoveTicker = (ticker: string) => {
    setWatchlist((prev) => prev.filter((t) => t !== ticker));
  };

  const handleAddPreset = (tickers: string[]) => {
    setWatchlist((prev) => addWatchlistTickers(prev, tickers));
  };

  // Link / Unlink Telegram
  const handleLinkTelegram = (chatId: string, username: string) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      telegramChatId: chatId,
      telegramUsername: username,
      isTelegramLinked: true,
    };
    setCurrentUser(updated);
    setIsTelegramModalOpen(false);
  };

  const handleUnlinkTelegram = () => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      telegramChatId: null,
      telegramUsername: null,
      isTelegramLinked: false,
      pairingToken: generateSecurePairingToken(),
    };
    setCurrentUser(updated);
  };

  // Reset Data
  const handleReset = () => {
    setActiveCases(new Map());
    setCaseEvents(new Map());
    setCaseTemplates(new Map());
    setAuditRuns([]);
    setSelectedCase(null);
    setLastRunTime(null);
    setLatestTelegramAlert(null);
    setRunIndex(1);
  };

  // 1-Click Send Watchlist Summary to Telegram
  const handleSendTelegramSummary = () => {
    if (!currentUser?.isTelegramLinked) {
      setIsTelegramModalOpen(true);
      return;
    }
    const summaryMsg = `📊 [SIBA — Rekap Watchlist Pribadi]\nPengguna: ${currentUser.name}\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n\nSaham yang Dipantau (${watchlist.length}):\n${watchlist.map((t) => `• ${t}`).join('\n')}\n\nJadwal evaluasi otomatis berikutnya: 16:30 WIB.`;
    setLatestTelegramAlert(summaryMsg);
  };

  // Execute Unattended Workflow Run (Powered by Sectors API Service)
  const handleRunWorkflow = async () => {
    setIsRunning(true);
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    let totalTriggersFound = 0;
    let sampleDispatchedAlert: string | null = null;

    const updatedCases = new Map(activeCases);
    const updatedEvents = new Map(caseEvents);
    const updatedTemplates = new Map(caseTemplates);

    try {
      for (const ticker of watchlist) {
        // Fetch real market transactions & filings from Sectors API
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

        // Record Timeline Event
        const existingEvents = updatedEvents.get(ticker) || [];
        updatedEvents.set(ticker, [transition.event, ...existingEvents]);

        // Render Template
        const template = renderCaseTemplate(evalResult, transition.event.newStatus);
        updatedTemplates.set(ticker, template);

        // Telegram: dispatch alert nyata via Vite proxy → Telegram Bot API
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

    setActiveCases(updatedCases);
    setCaseEvents(updatedEvents);
    setCaseTemplates(updatedTemplates);
    setAuditRuns((prev) => [newAudit, ...prev]);
    setLastRunTime(timestamp);
    setRunIndex((prev) => prev + 1);
    setIsRunning(false);

    if (sampleDispatchedAlert) {
      setLatestTelegramAlert(sampleDispatchedAlert);
    }
  };

  const activeCasesArray = Array.from(activeCases.values());

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white font-sans">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onResetReplay={handleReset}
        isRunning={isRunning}
        totalWatchlist={watchlist.length}
      />

      {/* Main Container */}
      <main className={`flex-1 w-full ${currentUser ? 'max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6' : 'w-full'}`}>
        {currentUser ? (
          /* Authenticated Dashboard */
          <div className="space-y-5">
            {/* Welcoming Guide Banner */}
            <BeginnerGuideBanner userName={currentUser.name} />

            {/* Sectors API Compliance Badge */}
            <SectorsApiBadge />

            {/* Automation Overview KPIs */}
            <AutomationOverview
              lastRunTime={lastRunTime}
              activeCasesCount={activeCasesArray.length}
              totalWatchlistCount={watchlist.length}
              lastRunStatus={isRunning ? 'RUNNING' : 'IDLE'}
              totalRunsCount={auditRuns.length}
            />

            {/* Watchlist Manager with Full Company Lookup & Presets */}
            <WatchlistManager
              watchlist={watchlist}
              onAddTicker={handleAddTicker}
              onRemoveTicker={handleRemoveTicker}
              onAddPreset={handleAddPreset}
              isTelegramLinked={currentUser.isTelegramLinked}
              onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
              onSendTelegramSummary={handleSendTelegramSummary}
            />

            {/* Watchlist News Feed (Exclusively For User's Watchlist) */}
            <WatchlistNewsFeed watchlist={watchlist} forceRefreshAt={newsForceRefresh} />

            {/* Active Cases Grid */}
            <ActiveCasesList
              cases={activeCasesArray}
              onSelectCase={(c: CaseState) => setSelectedCase(c)}
            />

            {/* Unattended Run Audit Trail */}
            <RunAuditHistory runs={auditRuns} />
          </div>
        ) : (
          /* Guest Landing Page */
          <LandingPage onOpenAuth={handleOpenAuth} onAuthSuccess={handleAuthSuccess} />
        )}
      </main>

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState({ isOpen: false, mode: 'login' })}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Case Deep-dive Modal */}
      <CaseDetailModal
        caseItem={selectedCase}
        events={selectedCase ? caseEvents.get(selectedCase.symbol) || [] : []}
        template={selectedCase ? caseTemplates.get(selectedCase.symbol) || null : null}
        onClose={() => setSelectedCase(null)}
      />

      {/* Telegram Connect Modal */}
      {currentUser && (
        <TelegramConnectModal
          user={currentUser}
          watchlist={watchlist}
          isOpen={isTelegramModalOpen}
          onClose={() => setIsTelegramModalOpen(false)}
          onLinkSuccess={handleLinkTelegram}
          onUnlink={handleUnlinkTelegram}
        />
      )}

      {/* Telegram Alert Toast Preview */}
      {currentUser && (
        <TelegramAlertPreview
          user={currentUser}
          message={latestTelegramAlert}
          onClose={() => setLatestTelegramAlert(null)}
        />
      )}

      {/* Market Close 16:30 WIB Notification Toast */}
      {currentUser && (
        <MarketCloseToast
          isVisible={showMarketCloseToast}
          watchlistCount={watchlist.length}
          onClose={() => setShowMarketCloseToast(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-[#090d16] py-4 text-xs font-sans">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-slate-500">SIBA • Sistem Informasi Bursa dan Aset (Track 02 — Automation & Workflows)</span>
          <span className="font-mono text-teal-500/60 text-[11px]">Sectors API v2 • 100% Deterministik Tanpa LLM</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
