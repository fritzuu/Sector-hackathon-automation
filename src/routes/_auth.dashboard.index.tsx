import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
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
    lastRunTime, isRunning, runWorkflow,
    telegramLogs, isFetchingLogs, fetchTelegramLogs
  } = useWorkflowStore();

  const [lastAutoRunDate, setLastAutoRunDate] = useState<string | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    const handleOpenTour = () => setIsTourOpen(true);
    window.addEventListener('open-siba-tour', handleOpenTour);
    return () => window.removeEventListener('open-siba-tour', handleOpenTour);
  }, []);

  useEffect(() => {
    if (currentUser?.telegramChatId) {
      fetchTelegramLogs(currentUser.telegramChatId);
      
      // Auto-refresh every 5 seconds (Hackathon shortcut for realtime feel)
      const interval = setInterval(() => {
        fetchTelegramLogs(currentUser.telegramChatId!);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchTelegramLogs]);

  // Auto-scheduler has been moved to Supabase Edge Functions (siba-workflow)
  // It is triggered automatically by pg_cron at 16:30 WIB.

  const activeCasesArray = Array.from(activeCases.values());

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="space-y-8 ">
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
          logs={telegramLogs || []}
          isLoading={isFetchingLogs && telegramLogs === null}
          onClearLogs={() => {}} // Disabled for Hackathon: server-side outbox acts as source of truth
        />
      </div>

      <DashboardTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </motion.div>
  );
}
