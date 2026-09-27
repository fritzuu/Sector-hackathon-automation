/**
 * TelegramLogViewer — Log History of Sent Telegram Alerts
 * Displays all messages dispatched to Telegram with search/filter & copy capability.
 */

import React, { useState } from 'react';
import { Send, Copy, Check, Clock, Trash2, ShieldCheck, Search, Bot } from 'lucide-react';
import { UserProfile } from '../../../data/userProfiles.js';
import { motion } from 'framer-motion';

export interface TelegramLogEntry {
  id: string;
  timestamp: string;
  ticker?: string;
  message: string;
  chatId: string;
  username: string;
  status: 'SENT' | 'PENDING';
}

interface TelegramLogViewerProps {
  user: UserProfile;
  logs: TelegramLogEntry[];
  onClearLogs: () => void;
}

export const TelegramLogViewer: React.FC<TelegramLogViewerProps> = ({
  user,
  logs,
  onClearLogs,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.ticker && log.ticker.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!user.isTelegramLinked) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="rounded-xl p-8 bg-accent text-bg shadow-[0_0_30px_rgba(0,255,136,0.15)] flex flex-col items-center justify-center text-center font-sans h-full"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-bg text-accent flex items-center justify-center mb-5 shadow-xl -rotate-12 hover:rotate-0 transition-transform duration-500"
        >
          <Send className="w-8 h-8 -ml-1 mt-1" />
        </motion.div>
        <h3 className="text-xl font-black mb-2 tracking-tight">Telegram Belum Terhubung</h3>
        <p className="text-sm font-bold opacity-80 mb-6 max-w-sm">
          Dapatkan peringatan anomali saham dan rekap otomatis secara real-time. Hubungkan SIBA Bot ke Telegram Anda sekarang.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.dispatchEvent(new CustomEvent('open-telegram-modal'))}
          className="px-6 py-3 rounded-xl bg-bg text-accent font-black text-sm uppercase tracking-widest hover:bg-white hover:text-bg transition-colors shadow-lg cursor-pointer"
        >
          Konfigurasi Bot
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4 font-sans bg-secondary/50 border border-border shadow-[0_4px_24px_rgba(0,0,0,0.5)] h-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-secondary/30 text-accent border border-secondary flex items-center justify-center flex-shrink-0">
            <Send className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-text tracking-wide">
                Log Entri Telegram Sent
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary text-primary border border-primary/30">
                {logs.length} Notifikasi
              </span>
            </div>
            <p className="text-[11px] text-text/70 mt-0.5">
              Riwayat pesan &amp; alert anomali bursa yang telah dikirim ke bot Telegram Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      {logs.length > 0 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text/50 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari dalam riwayat log Telegram..."
            className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-lg text-xs text-text placeholder:text-text/40 outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Log list */}
      {filteredLogs.length === 0 ? (
        <div
          className="py-8 text-center border border-dashed rounded-xl space-y-2"
          style={{
            backgroundColor: 'var(--color-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <Send className="w-8 h-8 text-primary/40 mx-auto" />
          <p className="text-xs font-semibold text-text/70">
            {logs.length === 0
              ? 'Belum ada log entri Telegram yang dikirim.'
              : 'Tidak ada log yang cocok dengan pencarian.'}
          </p>
          <p className="text-[11px] text-text/50 font-mono">
            {user.isTelegramLinked
              ? 'Klik "Kirim Rekap ke Telegram" atau jalankan Run Workflow untuk memicu kirim alert.'
              : 'Hubungkan akun Telegram Anda untuk mulai menerima log otomatis.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {filteredLogs.map(log => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-bg border border-border/80 hover:border-primary/40 transition-all space-y-2.5"
            >
              {/* Top metadata */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30">
                    <ShieldCheck className="w-3 h-3" />
                    <span>TERKIRIM TELEGRAM</span>
                  </span>
                  {log.ticker && (
                    <span className="font-mono font-bold text-xs text-primary bg-secondary px-2 py-0.5 rounded border border-primary/30">
                      {log.ticker}
                    </span>
                  )}
                  <span className="text-[11px] text-text/60 font-mono">
                    Chat ID: {log.chatId} ({log.username})
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1 text-[11px] text-text/50 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                  </span>

                  <button
                    onClick={() => handleCopy(log.id, log.message)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-primary text-[11px] font-semibold border border-primary/30 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId === log.id ? 'Tersalin' : 'Salin Text'}</span>
                  </button>
                </div>
              </div>

              {/* Message body */}
              <div className="bg-[#12081f] p-3 rounded-lg border border-secondary/50 font-mono text-[11px] text-text/90 whitespace-pre-line leading-relaxed overflow-x-auto">
                {log.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
