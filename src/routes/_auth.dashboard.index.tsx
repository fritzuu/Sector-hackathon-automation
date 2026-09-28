import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { BeginnerGuideBanner } from '../shared/components/BeginnerGuideBanner';
import { AutomationOverview } from '../modules/dashboard/components/AutomationOverview';
import { QuickWatchlistWidget } from '../modules/dashboard/components/QuickWatchlistWidget';
import { TelegramLogViewer, TelegramLogEntry } from '../modules/dashboard/components/TelegramLogViewer';
import { useAuthStore } from '../modules/auth/stores/auth.store';
import { useWatchlistStore } from '../modules/watchlist/stores/watchlist.store';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';
import { liveMarketService } from '../services/liveMarketService';
import { sectorsApi } from '../services/sectorsApi';
import { claimMarketCloseRun } from '../utils/marketCloseGuard';

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

  const [telegramLogs, setTelegramLogs] = useState<TelegramLogEntry[]>([]);
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
      if (isWeekday && is1630Window && !isRunning && claimMarketCloseRun(currentUser.id, dateStr)) {
        console.log('[AutoScheduler] 16:30 WIB triggered — invalidating caches.');
        liveMarketService.invalidateAll();
        sectorsApi.invalidateAll();
        runWorkflow();
      }
    };

    const id = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
  }, [currentUser?.id, isRunning, runWorkflow]);

  const activeCasesArray = Array.from(activeCases.values());

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="space-y-8 ">
      <BeginnerGuideBanner
        userName={currentUser?.name || ''}
        onOpenTour={() => window.dispatchEvent(new CustomEvent('open-siba-tour'))}
      />

      <div id="tour-overview-content">
        <AutomationOverview
          lastRunTime={lastRunTime}
          activeCasesCount={activeCasesArray.length}
          totalWatchlistCount={watchlist.length}
          lastRunStatus={isRunning ? 'RUNNING' : 'IDLE'}
          totalRunsCount={auditRuns.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <QuickWatchlistWidget watchlist={watchlist} />

        <div id="tour-telegram-logs">
          <TelegramLogViewer
            user={currentUser!}
            logs={telegramLogs}
            onClearLogs={() => setTelegramLogs([])}
          />
        </div>
      </div>
    </motion.div>
  );
}
