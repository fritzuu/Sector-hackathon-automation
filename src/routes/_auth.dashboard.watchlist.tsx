import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { WatchlistManager } from '../modules/watchlist/components/WatchlistManager';
import { PopularStocksWidget } from '../modules/watchlist/components/PopularStocksWidget';
import { useWatchlistStore } from '../modules/watchlist/stores/watchlist.store';
import { useAuthStore } from '../modules/auth/stores/auth.store';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';

export const Route = createFileRoute('/_auth/dashboard/watchlist')({
  component: WatchlistPage,
});

function WatchlistPage() {
  const { currentUser } = useAuthStore();
  const { watchlist, addTicker, removeTicker, addPresets } = useWatchlistStore();
  const { setLatestTelegramAlert } = useWorkflowStore();

  const handleSendTelegramSummary = () => {
    if (!currentUser?.isTelegramLinked) {
      alert("Silakan hubungkan Telegram Bot terlebih dahulu.");
      return;
    }
    const summaryMsg = `📊 [SIBA: Rekap Watchlist Pribadi]\nPengguna: ${currentUser.name}\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n\nSaham yang Dipantau (${watchlist.length}):\n${watchlist.map((t) => `• ${t}`).join('\n')}\n\nJadwal evaluasi otomatis berikutnya: 16:30 WIB.`;
    setLatestTelegramAlert(summaryMsg);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.15, ease: "easeOut" }} 
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
    >
      <div className="lg:col-span-2 space-y-6">
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
      
      <div className="lg:col-span-1 sticky top-0">
        <PopularStocksWidget 
          watchlist={watchlist} 
          onAddTicker={addTicker} 
        />
      </div>
    </motion.div>
  );
}
