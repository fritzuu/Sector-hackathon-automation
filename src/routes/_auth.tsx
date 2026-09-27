import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { useAuthStore, waitForAuthReady } from '../modules/auth/stores/auth.store';
import { Header } from '../modules/dashboard/components/Header';
import { TelegramConnectModal } from '../modules/auth/components/TelegramConnectModal';
import { TelegramAlertPreview } from '../shared/components/TelegramAlertPreview';
import { MarketCloseToast } from '../modules/dashboard/components/MarketCloseToast';
import { useWatchlistStore } from '../modules/watchlist/stores/watchlist.store';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';
import { useState, useEffect } from 'react';
import { generateSecurePairingToken } from '../utils/token';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    await waitForAuthReady();
    const { currentUser } = useAuthStore.getState();
    if (!currentUser) {
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

  useEffect(() => {
    if (currentUser?.defaultWatchlist && currentUser.defaultWatchlist.length > 0 && watchlist.length === 0) {
      useWatchlistStore.getState().setWatchlist(currentUser.defaultWatchlist);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-400 flex items-center justify-center text-sm">
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
        isRunning={isRunning}
        totalWatchlist={watchlist.length}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Outlet />
      </main>

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

      <footer className="border-t border-slate-800/60 bg-[#090d16] py-4 text-xs font-sans">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-slate-500">SIBA • Sistem Informasi Bursa dan Aset (Track 02 — Automation & Workflows)</span>
          <span className="font-mono text-teal-500/60 text-[11px]">Sectors API v2 • 100% Deterministik Tanpa LLM</span>
        </div>
      </footer>
    </div>
  );
}
