import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { BeginnerGuideBanner } from '../shared/components/BeginnerGuideBanner';
import { SectorsApiBadge } from '../shared/components/SectorsApiBadge';
import { AutomationOverview } from '../modules/dashboard/components/AutomationOverview';
import { WatchlistManager } from '../modules/watchlist/components/WatchlistManager';
import { WatchlistNewsFeed } from '../modules/watchlist/components/WatchlistNewsFeed';
import { ActiveCasesList } from '../modules/cases/components/ActiveCasesList';
import { RunAuditHistory } from '../modules/cases/components/RunAuditHistory';
import { CaseDetailModal } from '../modules/cases/components/CaseDetailModal';
import { DashboardTourModal } from '../modules/dashboard/components/DashboardTourModal';
import { TelegramLogViewer, TelegramLogEntry } from '../modules/dashboard/components/TelegramLogViewer';
import { useAuthStore } from '../modules/auth/stores/auth.store';
import { useWatchlistStore } from '../modules/watchlist/stores/watchlist.store';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';
import { CaseState } from '../types/engine';
import { liveMarketService } from '../services/liveMarketService';
import { sectorsApi } from '../services/sectorsApi';

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { currentUser } = useAuthStore();
  const { watchlist, addTicker, removeTicker, addPresets } = useWatchlistStore();
  const { 
    activeCases, caseEvents, caseTemplates, auditRuns, 
    lastRunTime, isRunning, runWorkflow, setLatestTelegramAlert 
  } = useWorkflowStore();

  const [selectedCase, setSelectedCase] = useState<CaseState | null>(null);
  const [newsForceRefresh, setNewsForceRefresh] = useState<number | undefined>(undefined);
  const [lastAutoRunDate, setLastAutoRunDate] = useState<string | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [telegramLogs, setTelegramLogs] = useState<TelegramLogEntry[]>([]);

  useEffect(() => {
    const handleOpenTour = () => setIsTourOpen(true);
    window.addEventListener('open-siba-tour', handleOpenTour);
    return () => window.removeEventListener('open-siba-tour', handleOpenTour);
  }, []);

  // Auto-scheduler
  useEffect(() => {
    if (!currentUser) return;

    const tick = () => {
      const nowUtc = new Date();
      const wibMs = nowUtc.getTime() + 7 * 60 * 60 * 1000;
      const wib = new Date(wibMs);
      const hh = wib.getUTCHours();
      const mm = wib.getUTCMinutes();
      const dayOfWeek = wib.getUTCDay();
      const dateStr = wib.toISOString().slice(0, 10);

      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const is1630Window = hh === 16 && mm >= 30 && mm <= 31;
      const notYetRun = lastAutoRunDate !== dateStr;

      if (isWeekday && is1630Window && notYetRun && !isRunning) {
        console.log('[AutoScheduler] 16:30 WIB triggered — invalidating caches.');
        setLastAutoRunDate(dateStr);
        liveMarketService.invalidateAll();
        sectorsApi.invalidateAll();
        setNewsForceRefresh(Date.now());
        runWorkflow();
      }
    };

    const id = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
  }, [currentUser?.id, lastAutoRunDate, isRunning, runWorkflow]);

  const handleSendTelegramSummary = () => {
    if (!currentUser?.isTelegramLinked) {
      alert("Please link Telegram first from the header."); // Fallback
      return;
    }
    const summaryMsg = `📊 [SIBA — Rekap Watchlist Pribadi]\nPengguna: ${currentUser.name}\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n\nSaham yang Dipantau (${watchlist.length}):\n${watchlist.map((t) => `• ${t}`).join('\n')}\n\nJadwal evaluasi otomatis berikutnya: 16:30 WIB.`;
    setLatestTelegramAlert(summaryMsg);
  };

  const activeCasesArray = Array.from(activeCases.values());

  return (
    <div className="space-y-5">
      <BeginnerGuideBanner userName={currentUser?.name || ''} onOpenTour={() => setIsTourOpen(true)} />
      <SectorsApiBadge />

      <div id="tour-automation-kpis" className="scroll-mt-20">
        <AutomationOverview
          lastRunTime={lastRunTime}
          activeCasesCount={activeCasesArray.length}
          totalWatchlistCount={watchlist.length}
          lastRunStatus={isRunning ? 'RUNNING' : 'IDLE'}
          totalRunsCount={auditRuns.length}
        />
      </div>

      <div id="tour-watchlist-manager" className="scroll-mt-20">
        <WatchlistManager
          watchlist={watchlist}
          onAddTicker={addTicker}
          onRemoveTicker={removeTicker}
          onAddPreset={addPresets}
          isTelegramLinked={currentUser?.isTelegramLinked || false}
          onOpenTelegramModal={() => alert("Open modal from header")} // Simplification
          onSendTelegramSummary={handleSendTelegramSummary}
        />
      </div>

      <div id="tour-telegram-logs" className="scroll-mt-20">
        <TelegramLogViewer
          user={currentUser!}
          logs={telegramLogs}
          onClearLogs={() => setTelegramLogs([])}
        />
      </div>

      <WatchlistNewsFeed watchlist={watchlist} forceRefreshAt={newsForceRefresh} />

      <div id="tour-active-cases" className="scroll-mt-20">
        <ActiveCasesList
          cases={activeCasesArray}
          onSelectCase={(c) => setSelectedCase(c)}
        />
      </div>

      <RunAuditHistory runs={auditRuns} />

      <CaseDetailModal
        caseItem={selectedCase}
        events={selectedCase ? caseEvents.get(selectedCase.symbol) || [] : []}
        template={selectedCase ? caseTemplates.get(selectedCase.symbol) || null : null}
        onClose={() => setSelectedCase(null)}
      />

      <DashboardTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
