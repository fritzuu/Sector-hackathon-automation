import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { BeginnerGuideBanner } from '../shared/components/BeginnerGuideBanner';
import { AutomationOverview } from '../modules/dashboard/components/AutomationOverview';
import { QuickWatchlistWidget } from '../modules/dashboard/components/QuickWatchlistWidget';
import { TelegramLogViewer, TelegramLogEntry } from '../modules/dashboard/components/TelegramLogViewer';
import { DashboardTourModal } from '../modules/dashboard/components/DashboardTourModal';
import { useAuthStore } from '../modules/auth/stores/auth.store';
import { useWatchlistStore } from '../modules/watchlist/stores/watchlist.store';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';
import { liveMarketService } from '../services/liveMarketService';
import { sectorsApi } from '../services/sectorsApi';

export const Route = createFileRoute('/_auth/dashboard/')({
  component: DashboardOverviewPage,
});

function DashboardOverviewPage() {
  const { currentUser } = useAuthStore();
  const { watchlist } = useWatchlistStore();
  const { 
    activeCases, auditRuns, 
    lastRunTime, isRunning, runWorkflow 
  } = useWorkflowStore();

  const [lastAutoRunDate, setLastAutoRunDate] = useState<string | null>(null);
  const [telegramLogs, setTelegramLogs] = useState<TelegramLogEntry[]>([]);
  const [isTourOpen, setIsTourOpen] = useState(false);

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
        runWorkflow();
      }
    };

    const id = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
  }, [currentUser?.id, lastAutoRunDate, isRunning, runWorkflow]);

  const activeCasesArray = Array.from(activeCases.values());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <BeginnerGuideBanner userName={currentUser?.name || ''} onOpenTour={() => setIsTourOpen(true)} />

      <AutomationOverview
        lastRunTime={lastRunTime}
        activeCasesCount={activeCasesArray.length}
        totalWatchlistCount={watchlist.length}
        lastRunStatus={isRunning ? 'RUNNING' : 'IDLE'}
        totalRunsCount={auditRuns.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <QuickWatchlistWidget watchlist={watchlist} />

        <TelegramLogViewer
          user={currentUser!}
          logs={telegramLogs}
          onClearLogs={() => setTelegramLogs([])}
        />
      </div>

      <DashboardTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
