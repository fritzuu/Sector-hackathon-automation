import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../modules/auth/stores/auth.store';
import { Header } from '../modules/dashboard/components/Header';
import { TelegramConnectModal } from '../modules/auth/components/TelegramConnectModal';
import { TelegramAlertPreview } from '../shared/components/TelegramAlertPreview';
import { MarketCloseToast } from '../modules/dashboard/components/MarketCloseToast';
import { useWatchlistStore } from '../modules/watchlist/stores/watchlist.store';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';
import { useState } from 'react';
import { Bot } from 'lucide-react';
import { generateSecurePairingToken } from '../utils/token';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const user = useAuthStore.getState().currentUser;
    if (!user) {
      throw redirect({ to: '/' });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const { currentUser, logout, updateUser } = useAuthStore();
  const watchlist = useWatchlistStore(state => state.watchlist);
  const { isRunning, latestTelegramAlert, clearLatestAlert, runWorkflow, resetReplay } = useWorkflowStore();
  
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [showMarketCloseToast, setShowMarketCloseToast] = useState(false);

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
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white font-sans">
      <Header
        currentUser={currentUser}
        onOpenAuth={() => {}} // Not needed in auth layout
        onLogout={handleLogout}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onRunWorkflow={runWorkflow}
        onResetReplay={resetReplay}
        onOpenTour={() => {
          // Dispatch a custom event or trigger tour
          window.dispatchEvent(new CustomEvent('open-siba-tour'));
        }}
        isRunning={isRunning}
        totalWatchlist={watchlist.length}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Outlet />
      </main>

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

      <footer className="border-t border-[hsl(301,60%,18%)] bg-[hsl(279,100%,3%)] py-4 text-xs font-sans">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-white/40">SIBA • Sistem Informasi Bursa dan Aset (Track 02 Automation &amp; Workflows)</span>
          <span className="font-mono text-[hsl(288,100%,70%)]/50 text-[11px]">Sectors API v2 • 100% Deterministik Tanpa LLM</span>
        </div>
      </footer>

      {/* Floating Telegram Bot CTA Button */}
      <div id="tour-telegram-bot-cta" className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsTelegramModalOpen(true)}
          className="relative flex items-center justify-center w-12 h-12 bg-[hsl(141,100%,50%)] hover:bg-[hsl(141,100%,45%)] text-[hsl(279,100%,3%)] rounded-full shadow-2xl transition-all duration-200 transform hover:scale-110 cursor-pointer border-2 border-[hsl(141,100%,70%)]"
          title={currentUser?.isTelegramLinked ? 'Telegram Bot Terhubung' : 'Hubungkan Telegram Bot SIBA'}
        >
          <Bot className="w-6 h-6 stroke-[2.5]" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
        </button>
      </div>

    </div>
  );
}
