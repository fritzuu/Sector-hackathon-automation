import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCompanies } from '../data/useCompanies';
import { supabase } from '../lib/supabaseClient';
import { BeginnerGuideBanner } from '../shared/components/BeginnerGuideBanner';
import { AutomationOverview } from '../modules/dashboard/components/AutomationOverview';
import { QuickWatchlistWidget } from '../modules/dashboard/components/QuickWatchlistWidget';
import { MarketActivityWidget } from '../modules/dashboard/components/MarketActivityWidget';
import { TelegramLogViewer } from '../modules/dashboard/components/TelegramLogViewer';
import { useAuthStore } from '../modules/auth/stores/auth.store';
import { useWatchlistStore } from '../modules/watchlist/stores/watchlist.store';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';

export const Route = createFileRoute('/_auth/dashboard/')({
  component: DashboardOverviewPage,
});

function DashboardOverviewPage() {
  const { currentUser } = useAuthStore();
  const { watchlist } = useWatchlistStore();
  const {
    activeCases, auditRuns, lastRunTime, isRunning,
    telegramLogs, isFetchingLogs, fetchTelegramLogs
  } = useWorkflowStore();

  const companiesQuery = useCompanies();
  const [isSystemUnavailable, setIsSystemUnavailable] = useState(false);

  useEffect(() => {
    supabase.functions.invoke('siba-workflow', { method: 'GET' }).then(({ data, error }) => {
      if (error || (data && data.isConfigured === false)) {
        setIsSystemUnavailable(true);
      }
    });
  }, []);

  useEffect(() => {
    if (currentUser?.telegramChatId) {
      fetchTelegramLogs(currentUser.telegramChatId);
      
      // Use Supabase Realtime instead of polling
      const channel = supabase
        .channel(`telegram_outbox_${currentUser.telegramChatId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'telegram_outbox', filter: `chat_id=eq.${currentUser.telegramChatId}` },
          () => fetchTelegramLogs(currentUser.telegramChatId!)
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser, fetchTelegramLogs]);

  // Auto-scheduler has been moved to Supabase Edge Functions (siba-workflow)
  // It is triggered automatically by pg_cron at 16:30 WIB.

  const activeCasesArray = Array.from(activeCases.values()).filter(c => watchlist.includes(c.symbol));

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="min-w-0 space-y-6">
      {isSystemUnavailable && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-500/90 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-medium text-sm">
            Automated monitoring is currently on standby. The system will resume once the Sectors API configuration is complete.
          </p>
        </div>
      )}

      {companiesQuery.isError && (
        <div role="alert" className="rounded-lg border border-border p-3 text-sm text-text-muted">
          Data perusahaan belum dapat dimuat. Nama dan sektor mungkin belum tersedia.
          <button type="button" className="ml-2 text-primary underline" disabled={companiesQuery.isFetching} onClick={() => { void companiesQuery.refetch(); }}>Coba lagi</button>
        </div>
      )}

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

      <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-2 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)_minmax(0,1.2fr)]">
        <QuickWatchlistWidget watchlist={watchlist} />

        <MarketActivityWidget watchlist={watchlist} />

        <div id="tour-telegram-logs" className="min-w-0">
          <TelegramLogViewer
            user={currentUser!}
            logs={telegramLogs || []}
            isLoading={isFetchingLogs && telegramLogs === null}
            onClearLogs={() => {}} // Disabled for Hackathon: server-side outbox acts as source of truth
          />
        </div>
      </div>
    </motion.div>
  );
}
