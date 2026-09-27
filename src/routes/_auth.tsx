import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useAuthStore } from "../modules/auth/stores/auth.store";
import { Header } from "../modules/dashboard/components/Header";
import { Sidebar } from "../modules/dashboard/components/Sidebar";
import { TelegramConnectModal } from "../modules/auth/components/TelegramConnectModal";
import { TelegramAlertPreview } from "../shared/components/TelegramAlertPreview";
import { MarketCloseToast } from "../modules/dashboard/components/MarketCloseToast";
import { useWatchlistStore } from "../modules/watchlist/stores/watchlist.store";
import { useWorkflowStore } from "../modules/cases/stores/workflow.store";
import { useState, useEffect } from "react";
import { Bot } from "lucide-react";
import { generateSecurePairingToken } from "../utils/token";

export const Route = createFileRoute("/_auth")({
  beforeLoad: () => {
    const user = useAuthStore.getState().currentUser;
    if (!user) {
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
    runWorkflow,
    resetReplay,
  } = useWorkflowStore();

  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [showMarketCloseToast, setShowMarketCloseToast] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsTelegramModalOpen(true);
    window.addEventListener('open-telegram-modal', handleOpen);
    return () => window.removeEventListener('open-telegram-modal', handleOpen);
  }, []);

  if (!currentUser) return null;

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
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          currentUser={currentUser}
          onOpenAuth={() => {}} // Not needed in auth layout
          onLogout={handleLogout}
          onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
          onRunWorkflow={runWorkflow}
          onResetReplay={resetReplay}
          onOpenTour={() => {
            window.dispatchEvent(new CustomEvent("open-siba-tour"));
          }}
          isRunning={isRunning}
          totalWatchlist={watchlist.length}
        />

        <main className="flex-1 overflow-y-auto w-full">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-border/50 bg-bg/50 py-3 text-xs font-sans mt-auto">
          <div className="px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-text-muted/40">
              SIBA • Sistem Informasi Bursa dan Aset (Track 02 Automation)
            </span>
            <span className="font-mono text-primary/50 text-[11px]">
              Sectors API v2 • 100% Deterministik
            </span>
          </div>
        </footer>
      </div>

      <TelegramConnectModal
        user={currentUser}
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

      {/* Floating Telegram Bot CTA Button */}
      <div id="tour-telegram-bot-cta" className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsTelegramModalOpen(true)}
          className="relative flex items-center justify-center w-12 h-12 bg-accent hover:bg-accent text-bg rounded-full shadow-2xl transition-all duration-200 transform hover:scale-110 cursor-pointer border-2 border-accent"
          title={
            currentUser?.isTelegramLinked
              ? "Telegram Bot Terhubung"
              : "Hubungkan Telegram Bot SIBA"
          }
        >
          <Bot className="w-6 h-6 stroke-[2.5]" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
        </button>
      </div>
    </div>
  );
}
