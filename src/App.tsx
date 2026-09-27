import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { LandingPage } from './components/LandingPage.js';
import { AuthModal } from './components/AuthModal.js';
import { BeginnerGuideBanner } from './components/BeginnerGuideBanner.js';
import { AutomationOverview } from './components/AutomationOverview.js';
import { WatchlistManager } from './components/WatchlistManager.js';
import { ActiveCasesList } from './components/ActiveCasesList.js';
import { CaseDetailModal } from './components/CaseDetailModal.js';
import { RunAuditHistory, AuditRunItem } from './components/RunAuditHistory.js';
import { SectorsApiBadge } from './components/SectorsApiBadge.js';
import { TelegramConnectModal } from './components/TelegramConnectModal.js';
import { TelegramAlertPreview } from './components/TelegramAlertPreview.js';
import { TelegramLogViewer, TelegramLogEntry } from './components/TelegramLogViewer.js';
import { DashboardTourModal } from './components/DashboardTourModal.js';
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
import { Send, Bot } from 'lucide-react';

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

  // Telegram sent logs state
  const [telegramLogs, setTelegramLogs] = useState<TelegramLogEntry[]>([]);

  // Modals & Notifications
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [latestTelegramAlert, setLatestTelegramAlert] = useState<string | null>(null);

  // Onboarding tour modal state (triggers only on first register/login per user)
  const [isTourOpen, setIsTourOpen] = useState(false);

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
   */
  useEffect(() => {
    if (!currentUser) return; // guest — no scheduler

    const tick = () => {
      const nowUtc    = new Date();
      const wibMs     = nowUtc.getTime() + 7 * 60 * 60 * 1000;
      const wib       = new Date(wibMs);
      const hh        = wib.getUTCHours();
      const mm        = wib.getUTCMinutes();
      const dayOfWeek = wib.getUTCDay();
      const dateStr   = wib.toISOString().slice(0, 10);

      const isWeekday    = dayOfWeek >= 1 && dayOfWeek <= 5;
      const is1630Window = hh === 16 && mm >= 30 && mm <= 31;
      const notYetRun    = lastAutoRunDate !== dateStr;

      if (isWeekday && is1630Window && notYetRun && !isRunning) {
        console.log('[AutoScheduler] 16:30 WIB triggered — invalidating all caches and refreshing data.');
        setLastAutoRunDate(dateStr);
        liveMarketService.invalidateAll();
        sectorsApi.invalidateAll();
        setNewsForceRefresh(Date.now());
        setShowMarketCloseToast(true);
        handleRunWorkflow();
      }
    };

    const id = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, lastAutoRunDate, isRunning]);

  // Auth Handlers
  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalState({ isOpen: true, mode });
  };

  const handleAuthSuccess = (userData: { name: string; email: string }) => {
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

    // Trigger onboarding tour if user hasn't seen it yet
    const tourKey = `siba_tour_done_${newUser.id}`;
    if (!localStorage.getItem(tourKey)) {
      setIsTourOpen(true);
      localStorage.setItem(tourKey, 'true');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedCase(null);
    setLatestTelegramAlert(null);
    setIsTourOpen(false);
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
    setTelegramLogs([]);
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

    // Record into Telegram Log Entries
    const newLog: TelegramLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      message: summaryMsg,
      chatId: currentUser.telegramChatId || 'N/A',
      username: currentUser.telegramUsername || '@user',
      status: 'SENT',
    };
    setTelegramLogs(prev => [newLog, ...prev]);
  };

  // Execute Unattended Workflow Run (Powered by Sectors API Service)
  const handleRunWorkflow = async () => {
    setIsRunning(true);
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    let totalTriggersFound = 0;
    let sampleDispatchedAlert: string | null = null;
    let alertTicker: string | undefined = undefined;

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

        if (currentUser?.isTelegramLinked && evalResult.activeTriggerCount > 0 && !sampleDispatchedAlert) {
          alertTicker = ticker;
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

    if (sampleDispatchedAlert && currentUser) {
      setLatestTelegramAlert(sampleDispatchedAlert);

      const newLog: TelegramLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        ticker: alertTicker,
        message: sampleDispatchedAlert,
        chatId: currentUser.telegramChatId || 'N/A',
        username: currentUser.telegramUsername || '@user',
        status: 'SENT',
      };
      setTelegramLogs(prev => [newLog, ...prev]);
    }
  };

  const activeCasesArray = Array.from(activeCases.values());

  return (
    <div className="min-h-screen bg-background text-text flex flex-col selection:bg-primary selection:text-background font-sans">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onRunWorkflow={handleRunWorkflow}
        onResetReplay={handleReset}
        onOpenTour={() => setIsTourOpen(true)}
        isRunning={isRunning}
        totalWatchlist={watchlist.length}
      />

      {/* Main Container */}
      <main className={`flex-1 w-full ${currentUser ? 'max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6' : 'w-full'}`}>
        {currentUser ? (
          /* Authenticated Dashboard */
          <div className="space-y-6">
            {/* Welcoming Guide Banner */}
            <BeginnerGuideBanner userName={currentUser.name} onOpenTour={() => setIsTourOpen(true)} />

            {/* Automation Overview KPIs */}
            <div id="tour-automation-kpis" className="scroll-mt-20">
              <AutomationOverview
                lastRunTime={lastRunTime}
                activeCasesCount={activeCasesArray.length}
                totalWatchlistCount={watchlist.length}
                lastRunStatus={isRunning ? 'RUNNING' : 'IDLE'}
                totalRunsCount={auditRuns.length}
              />
            </div>

            {/* Watchlist Manager with Search (No hardcoded sector presets) */}
            <div id="tour-watchlist-manager" className="scroll-mt-20">
              <WatchlistManager
                watchlist={watchlist}
                onAddTicker={handleAddTicker}
                onRemoveTicker={handleRemoveTicker}
                onAddPreset={handleAddPreset}
                isTelegramLinked={currentUser.isTelegramLinked}
                onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
                onSendTelegramSummary={handleSendTelegramSummary}
              />
            </div>

            {/* Log Entri Telegram Sent */}
            <div id="tour-telegram-logs" className="scroll-mt-20">
              <TelegramLogViewer
                user={currentUser}
                logs={telegramLogs}
                onClearLogs={() => setTelegramLogs([])}
              />
            </div>

            {/* Active Cases Grid */}
            <div id="tour-active-cases" className="scroll-mt-20">
              <ActiveCasesList
                cases={activeCasesArray}
                onSelectCase={(c) => setSelectedCase(c)}
              />
            </div>

            {/* Unattended Run Audit Trail */}
            <RunAuditHistory runs={auditRuns} />
          </div>
        ) : (
          /* Guest Landing Page */
          <LandingPage onOpenAuth={handleOpenAuth} />
        )}
      </main>

      {/* Floating Telegram Bot CTA Button (Icon Only) */}
      <div id="tour-telegram-bot-cta" className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            if (currentUser) {
              setIsTelegramModalOpen(true);
            } else {
              handleOpenAuth('register');
            }
          }}
          className="group relative flex items-center justify-center w-12 h-12 bg-[hsl(141,100%,50%)] hover:bg-[hsl(141,100%,45%)] text-[hsl(279,100%,3%)] rounded-full shadow-2xl transition-all duration-200 transform hover:scale-110 cursor-pointer border-2 border-[hsl(141,100%,70%)] glow-blue opacity-100"
          title={currentUser?.isTelegramLinked ? 'Telegram Bot Terhubung' : 'Hubungkan Telegram Bot SIBA'}
        >
          <Bot className="w-6 h-6 text-[hsl(279,100%,3%)] stroke-[2.5]" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
        </button>
      </div>

      {/* Interactive Dashboard Tour Modal */}
      <DashboardTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

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
      <footer className="relative z-20 border-t border-[hsl(301,60%,25%)] bg-[hsl(279,100%,3%)] py-6 mb-16 sm:mb-0 text-xs font-sans shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-text/70">SIBA • Sistem Informasi Bursa dan Aset (Track 02 — Automation &amp; Workflows)</span>
          <span className="font-mono text-primary text-[11px] font-bold">Sectors API v2 • 100% Deterministik Tanpa LLM</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

