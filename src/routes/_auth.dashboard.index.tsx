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
    telegramLogs, telegramLogsError, isFetchingLogs, fetchTelegramLogs
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

  // Server Cron evaluates cases and sends the morning recap in one 07:00 WIB run.

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
        <div className="mb-5 rounded-xl border border-border bg-surface p-4 text-sm text-text-muted"><strong className="text-text-main">Rekap dan evaluasi kasus 07.00 WIB</strong> · Senin–Jumat. Menggunakan sesi perdagangan terakhir; dashboard diperbarui otomatis setiap 30 detik saat terbuka.</div>
        <AutomationOverview
          lastRunTime={lastRunTime}
          activeCasesCount={activeCasesArray.length}
          totalWatchlistCount={watchlist.length}
          lastRunStatus={isRunning ? 'RUNNING' : 'IDLE'}
          totalRunsCount={auditRuns.length}
        />
      </div>

      <QuickWatchlistWidget watchlist={watchlist} />

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <MarketActivityWidget watchlist={watchlist} />

        <div id="tour-telegram-logs" className="min-w-0">
          <TelegramLogViewer
            user={currentUser!}
            logs={telegramLogs || []}
            isLoading={isFetchingLogs}
            error={telegramLogsError}
            onRetry={() => { if (currentUser?.telegramChatId) void fetchTelegramLogs(currentUser.telegramChatId); }}
            onClearLogs={() => {}} // Disabled for Hackathon: server-side outbox acts as source of truth
          />
        </div>
      </div>
    </motion.div>
  );
}
