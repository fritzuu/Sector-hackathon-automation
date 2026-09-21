import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { LandingPage } from './components/LandingPage.js';
import { AuthModal } from './components/AuthModal.js';
import { BeginnerGuideBanner } from './components/BeginnerGuideBanner.js';
import { AutomationOverview } from './components/AutomationOverview.js';
import { WatchlistManager } from './components/WatchlistManager.js';
import { WatchlistNewsFeed } from './components/WatchlistNewsFeed.js';
import { ActiveCasesList } from './components/ActiveCasesList.js';
import { CaseDetailModal } from './components/CaseDetailModal.js';
import { RunAuditHistory, AuditRunItem } from './components/RunAuditHistory.js';
import { TelegramConnectModal } from './components/TelegramConnectModal.js';
import { TelegramAlertPreview } from './components/TelegramAlertPreview.js';
import { SectorsApiBadge } from './components/SectorsApiBadge.js';
import { MarketCloseToast } from './components/MarketCloseToast.js';
import { UserProfile } from './data/userProfiles.js';
import { CaseState, CaseEvent, RenderedTemplate } from './types/engine.js';
import { evaluateDataset } from './engine/rules/index.js';
import { processCaseTransition } from './engine/caseEngine.js';
import { renderCaseTemplate } from './engine/templateRenderer.js';
import { generateSecurePairingToken } from './utils/token.js';
import { sectorsApi } from './services/sectorsApi.js';
import { liveMarketService } from './services/liveMarketService.js';
import { TickerDataset } from './types/sectors.js';

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

  // Save user session & persistent cache
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('siba_user', JSON.stringify(currentUser));
      localStorage.setItem('siba_saved_session', JSON.stringify(currentUser));
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

        // 1. Bust ALL caches — price, IHSG, news (Yahoo Finance), historical prices (Sectors)
        liveMarketService.invalidateAll();
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

  const handleAuthSuccess = (userData: { name: string; email: string }) => {
    // Check if there is a saved profile for this user
    const saved = localStorage.getItem('siba_saved_session');
    let previousProfile: UserProfile | null = null;
    if (saved) {
      try {
        previousProfile = JSON.parse(saved);
      } catch (e) {}
    }

    const newUser: UserProfile = {
      id: previousProfile?.id || `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      avatar: previousProfile?.avatar || '',
      role: previousProfile?.role || 'Investor Ritel',
      telegramChatId: previousProfile?.telegramChatId || null,
      telegramUsername: previousProfile?.telegramUsername || null,
      isTelegramLinked: previousProfile?.isTelegramLinked || false,
      pairingToken: previousProfile?.pairingToken || generateSecurePairingToken(),
      defaultWatchlist: previousProfile?.defaultWatchlist || [],
    };
    setCurrentUser(newUser);
  };

  const handleLogout = () => {
    // Switch to guest landing page view, but preserve localStorage cache
    setCurrentUser(null);
    setSelectedCase(null);
    setLatestTelegramAlert(null);
  };

  // Watchlist Handlers
  const handleAddTicker = (ticker: string) => {
    setWatchlist((prev) => (prev.includes(ticker) ? prev : [...prev, ticker]));
  };

  const handleRemoveTicker = (ticker: string) => {
    setWatchlist((prev) => prev.filter((t) => t !== ticker));
  };

  const handleAddPreset = (tickers: string[]) => {
    setWatchlist((prev) => Array.from(new Set([...prev, ...tickers])));
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

        // Telegram alert preview — rich version with harga + news hint
        if (currentUser?.isTelegramLinked && evalResult.activeTriggerCount > 0 && !sampleDispatchedAlert) {
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
        onRunWorkflow={handleRunWorkflow}
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
              onSelectCase={(c) => setSelectedCase(c)}
            />

            {/* Unattended Run Audit Trail */}
            <RunAuditHistory runs={auditRuns} />
          </div>
        ) : (
          /* Guest Landing Page */
          <LandingPage onOpenAuth={handleOpenAuth} />
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
