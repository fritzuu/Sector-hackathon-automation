import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useAuthStore, waitForAuthReady } from "../modules/auth/stores/auth.store";
import { Header } from "../modules/dashboard/components/Header";
import { Sidebar } from "../modules/dashboard/components/Sidebar";
import { TelegramConnectModal } from "../modules/auth/components/TelegramConnectModal";
import { TelegramAlertPreview } from "../shared/components/TelegramAlertPreview";
import { MarketCloseToast } from "../modules/dashboard/components/MarketCloseToast";
import { CustomAlertToast } from "../shared/components/CustomAlertToast";
import { DashboardTourModal, DashboardPath } from "../modules/dashboard/components/DashboardTourModal";
import { useWatchlistStore } from "../modules/watchlist/stores/watchlist.store";
import { useWorkflowStore } from "../modules/cases/stores/workflow.store";
import { useState, useEffect, useCallback } from "react";
import { fetchUserWorkspaceFromSupabase, fetchGlobalMarketSnapshots } from "../services/supabaseStorage";
import { generateSecurePairingToken } from "../utils/token";
import { supabase } from "../lib/supabaseClient";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    await waitForAuthReady();
    const { currentUser } = useAuthStore.getState();
    if (!currentUser) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const { currentUser, logout, updateUser } = useAuthStore();
  const watchlist = useWatchlistStore((state) => state.watchlist);
  const {
    isRunning,
    latestTelegramAlert,
    clearLatestAlert,
    resetReplay,
  } = useWorkflowStore();

  // Server Cron updates are read-only; polling never saves or clears a workspace.
  useEffect(() => {
    if (!currentUser?.id) return;
    const accountId = currentUser.id;
    let cancelled = false;
    let busy = false;
    const refresh = async () => {
      if (busy || document.visibilityState === 'hidden' || useWorkflowStore.getState().isRunning) return;
      busy = true;
      try {
        const symbols = useWatchlistStore.getState().watchlist;
        const [workspace, snapshots] = await Promise.all([
          fetchUserWorkspaceFromSupabase(accountId), fetchGlobalMarketSnapshots([...symbols, 'IHSG']),
        ]);
        if (cancelled || useAuthStore.getState().currentUser?.id !== accountId || useWorkflowStore.getState().isRunning) return;
        if (workspace) useWorkflowStore.setState({
          activeCases: workspace.activeCases, caseEvents: workspace.caseEvents,
          caseTemplates: workspace.caseTemplates, lastRunTime: workspace.lastRunTime, runIndex: workspace.runIndex,
        });
        if (snapshots.length) useWorkflowStore.setState({ marketSnapshots: new Map(snapshots.map(item => [item.symbol, item])) });
        await useWorkflowStore.getState().fetchAuditRuns(accountId);
        const user = useAuthStore.getState().currentUser;
        if (!cancelled && user?.id === accountId && user.telegramChatId) await useWorkflowStore.getState().fetchTelegramLogs(user.telegramChatId);
      } catch { /* Preserve the last readable state during transient network errors. */ } finally { busy = false; }
    };

    const channel = supabase
      .channel(`audit_runs_${accountId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_runs', filter: `user_id=eq.${accountId}` },
        () => { void refresh(); }
      )
      .subscribe();

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    
    return () => { 
      cancelled = true; 
      void supabase.removeChannel(channel);
      window.removeEventListener('focus', refresh); 
      document.removeEventListener('visibilitychange', refresh); 
    };
  }, [currentUser?.id]);

  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [showMarketCloseToast, setShowMarketCloseToast] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourTargetId, setTourTargetId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsTelegramModalOpen(true);
    window.addEventListener('open-telegram-modal', handleOpen);
    return () => window.removeEventListener('open-telegram-modal', handleOpen);
  }, []);

  useEffect(() => {
    const handleOpenTour = () => setIsTourOpen(true);
    window.addEventListener('open-siba-tour', handleOpenTour);
    return () => window.removeEventListener('open-siba-tour', handleOpenTour);
  }, []);

  const navigateTourStep = useCallback((path: DashboardPath) => {
    navigate({ to: path });
  }, [navigate]);

  const handleTourStepChange = useCallback((targetId: string) => {
    setTourTargetId(targetId);
    const isSidebarTarget = targetId.startsWith('tour-sidebar') || targetId === 'tour-user-info';
    if (!isSidebarTarget) setIsMobileMenuOpen(false);
  }, []);



  if (!currentUser) {
    return (
      <div className="min-h-screen bg-bg text-text-muted flex items-center justify-center text-sm font-mono">
        Memuat akun...
      </div>
    );
  }

  const handleLinkTelegram = (chatId: string, username: string) => {
    updateUser({
      ...currentUser,
      telegramChatId: chatId,
      telegramUsername: username,
      isTelegramLinked: true,
    });
    setIsTelegramModalOpen(false);
  };

  const handleUnlinkTelegram = () => {
    updateUser({
      ...currentUser,
      telegramChatId: null,
      telegramUsername: null,
      isTelegramLinked: false,
      pairingToken: generateSecurePairingToken(),
    });
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="h-screen w-full bg-bg text-text-main flex font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        isTouring={isTourOpen}
        tourTargetId={tourTargetId}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
        onOpenTour={() => window.dispatchEvent(new CustomEvent("open-siba-tour"))}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          currentUser={currentUser}
          onOpenAuth={() => {}} // Not needed in auth layout
          onLogout={handleLogout}
          onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
          onResetReplay={resetReplay}
          onOpenTour={() => {
            window.dispatchEvent(new CustomEvent("open-siba-tour"));
          }}
          isRunning={isRunning}
          totalWatchlist={watchlist.length}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 overflow-y-auto w-full">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-20 md:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      <TelegramConnectModal
        user={currentUser}
        watchlist={watchlist}
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        onLinkSuccess={handleLinkTelegram}
        onUnlink={handleUnlinkTelegram}
      />

      <TelegramAlertPreview
        user={currentUser}
        message={latestTelegramAlert}
        onClose={clearLatestAlert}
      />

      <MarketCloseToast
        isVisible={showMarketCloseToast}
        watchlistCount={watchlist.length}
        onClose={() => setShowMarketCloseToast(false)}
      />

      <CustomAlertToast />

      <DashboardTourModal
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          setTourTargetId(null);
        }}
        onNavigate={navigateTourStep}
        onStepChange={handleTourStepChange}
      />

    </div>
  );
}
