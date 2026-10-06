import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { WatchlistManager } from '../modules/watchlist/components/WatchlistManager';
import { WatchlistNewsFeed } from '../modules/watchlist/components/WatchlistNewsFeed';
import { useWatchlistStore } from '../modules/watchlist/stores/watchlist.store';
import { useAuthStore } from '../modules/auth/stores/auth.store';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';
import { showCustomAlert } from '../shared/stores/alert.store';

export const Route = createFileRoute('/_auth/dashboard/watchlist')({
  component: WatchlistPage,
});

function WatchlistPage() {
  const { currentUser } = useAuthStore();
  const { watchlist, addTicker, removeTicker, addPresets } = useWatchlistStore();
  const { setLatestTelegramAlert } = useWorkflowStore();

  const handleSendTelegramSummary = () => {
    if (!currentUser?.isTelegramLinked) {
      showCustomAlert({
        type: 'warning',
        title: 'Telegram Belum Terhubung',
        message: 'Silakan hubungkan bot Telegram Anda terlebih dahulu untuk menerima ringkasan otomatis.',
        actionLabel: 'Hubungkan Bot',
        onAction: () => window.dispatchEvent(new CustomEvent('open-telegram-modal')),
      });
      return;
    }
    const summaryMsg = `📊 [SIBA: Rekap Watchlist Pribadi]\nPengguna: ${currentUser.name}\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n\nSaham yang Dipantau (${watchlist.length}):\n${watchlist.map((t) => `• ${t}`).join('\n')}\n\nJadwal evaluasi otomatis berikutnya: 16:30 WIB.`;
    setLatestTelegramAlert(summaryMsg);
    showCustomAlert({
      type: 'success',
      title: 'Rekap Terkirim ke Pratinjau',
      message: `Ringkasan ${watchlist.length} saham siap dikirim ke bot Telegram Anda.`,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.15, ease: "easeOut" }} 
      className="min-w-0 space-y-6"
    >
      <header>
        <h1 className="text-2xl font-bold text-text-main sm:text-3xl">Watchlist</h1>
        <p className="mt-1 text-sm text-text-muted">Kelola saham dan ikuti aktivitas emiten.</p>
      </header>

      <div id="tour-watchlist-content">
        <WatchlistManager
          watchlist={watchlist}
          onAddTicker={addTicker}
          onRemoveTicker={removeTicker}
          onAddPreset={addPresets}
          isTelegramLinked={currentUser?.isTelegramLinked || false}
          onOpenTelegramModal={() => window.dispatchEvent(new CustomEvent('open-telegram-modal'))}
          onSendTelegramSummary={handleSendTelegramSummary}
        />
      </div>

      <WatchlistNewsFeed watchlist={watchlist} />
    </motion.div>
  );
}
