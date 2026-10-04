/**
 * TelegramLogViewer — Log History of Sent Telegram Alerts
 * Displays all messages dispatched to Telegram with search/filter & copy capability.
 */

import React, { useState } from "react";
import {
  Send,
  Copy,
  Check,
  Clock,
  Trash2,
  ShieldCheck,
  Search,
  Bot,
} from "lucide-react";
import { UserProfile } from "../../../data/userProfiles.js";
import { motion } from "framer-motion";

export interface TelegramLogEntry {
  id: string;
  timestamp: string;
  ticker?: string;
  message: string;
  chatId: string;
  username: string;
  status: "SENT" | "PENDING";
}

interface TelegramLogViewerProps {
  user: UserProfile;
  logs: TelegramLogEntry[];
  isLoading?: boolean;
  onClearLogs: () => void;
}

export const TelegramLogViewer: React.FC<TelegramLogViewerProps> = ({
  user,
  logs,
  isLoading = false,
  onClearLogs,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<TelegramLogEntry | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ticker &&
        log.ticker.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const parseStructuredLog = (htmlMessage: string) => {
    const text = htmlMessage.replace(/<br\/>/g, "\n").replace(/<[^>]+>/g, "");

    const extractList = (header: string, nextHeader: string | null) => {
      const start = text.indexOf(header);
      if (start === -1) return [];
      const end = nextHeader ? text.indexOf(nextHeader, start) : text.length;
      const chunk = text.slice(start + header.length, end).trim();
      return chunk
        .split("\n")
        .map((s) => s.trim().replace(/^•\s*/, ""))
        .filter((s) => s.length > 0);
    };

    const facts = extractList(
      "FAKTA (Terverifikasi Data Sectors API):",
      "🔍 INTERPRETASI",
    );
    const interpretations = extractList(
      "INTERPRETASI TERBATAS (Tanpa Prediksi):",
      "❓ BELUM DIKETAHUI",
    );
    const unknowns = extractList("BELUM DIKETAHUI:", "⚠️ DISCLAIMER");

    const discStart = text.indexOf("⚠️ DISCLAIMER:");
    const discEnd = text.indexOf("🔗");
    const disclaimer =
      discStart !== -1
        ? text
            .slice(discStart + 15, discEnd !== -1 ? discEnd : undefined)
            .trim()
        : "";

    return { facts, interpretations, unknowns, disclaimer };
  };

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
        <h3 className="text-xl font-black mb-2 tracking-tight">
          Telegram Belum Terhubung
        </h3>
        <p className="text-sm font-bold opacity-80 mb-6 max-w-sm">
          Dapatkan peringatan anomali saham dan rekap otomatis secara real-time.
          Hubungkan SIBA Bot ke Telegram Anda sekarang.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() =>
            window.dispatchEvent(new CustomEvent("open-telegram-modal"))
          }
          className="px-6 py-3 rounded-xl bg-bg text-accent font-black text-sm uppercase tracking-widest hover:bg-white hover:text-bg transition-colors shadow-lg cursor-pointer"
        >
          Konfigurasi Bot
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl p-6 space-y-4 font-sans bg-secondary/50 border border-border shadow-[0_4px_24px_rgba(0,0,0,0.5)] h-full flex flex-col">
      <style>{`
        .telegram-html-content b { font-weight: 700; color: #fff; }
        .telegram-html-content i { font-style: italic; opacity: 0.8; }
        .telegram-html-content a { color: #00ff88; text-decoration: underline; text-underline-offset: 2px; }
        .telegram-html-content a:hover { color: #fff; }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div>
            <div className="flex flex-col-reverse md:flex-row items-start md:items-center space-x-2">
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                Log Entri Telegram Sent
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-secondary text-primary border border-primary/30">
                {isLoading ? "..." : logs.length} Notifikasi
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Riwayat pesan &amp; alert anomali bursa yang telah dikirim ke bot
              Telegram Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {logs.length > 0 && !isLoading && (
            <button
              onClick={onClearLogs}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer">
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      {logs.length > 0 && !isLoading && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text/50 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari dalam riwayat log Telegram..."
            className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-lg text-xs text-text placeholder:text-text/40 outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Log list */}
      {isLoading ? (
        <div className="space-y-3 mt-2 pt-1 pb-2 px-1 -mx-1 hide-scrollbar">
          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-bg border border-border/40 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <div className="h-4 w-20 bg-secondary/60 rounded" />
                  <div className="h-4 w-16 bg-secondary/60 rounded" />
                </div>
                <div className="h-4 w-24 bg-secondary/60 rounded" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="h-3 w-48 bg-secondary/60 rounded" />
                <div className="h-6 w-20 bg-secondary/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div
          className="py-8 mt-2 text-center border border-dashed rounded-xl space-y-2"
          style={{
            backgroundColor: "var(--color-secondary)",
            borderColor: "var(--color-border)",
          }}
        >
          <Send className="w-8 h-8 text-primary/40 mx-auto" />
          <p className="text-xs font-semibold text-text/70">
            {logs.length === 0
              ? "Belum ada log entri Telegram yang dikirim."
              : "Tidak ada log yang cocok dengan pencarian."}
          </p>
          <p className="text-[11px] text-text/50 font-mono">
            {user.isTelegramLinked
              ? 'Klik "Kirim Rekap ke Telegram" atau jalankan Run Workflow untuk memicu kirim alert.'
              : "Hubungkan akun Telegram Anda untuk mulai menerima log otomatis."}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto px-1 -mx-1 pb-2 pt-1 mt-2 hide-scrollbar">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-bg border border-border/80 hover:border-primary/40 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center space-x-3 flex-wrap">
                {log.ticker && (
                  <span className="font-mono font-bold text-xs text-primary bg-secondary px-2 py-0.5 rounded border border-primary/30 tracking-wider">
                    {log.ticker}
                  </span>
                )}

                <span className="flex items-center space-x-1.5 text-[10px] text-text/50 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(log.timestamp).toLocaleString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </span>
              </div>

              <button
                onClick={() => setSelectedLog(log)}
                className="text-[10px] text-accent hover:text-white transition-colors cursor-pointer font-bold px-3 py-1 rounded bg-secondary border border-border flex-shrink-0"
              >
                Detail →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-bg border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="font-bold text-sm text-text">
                    Detail Alert — {selectedLog.ticker}
                  </h3>
                  <p className="text-[11px] text-text/60 font-mono">
                    Terkirim pada{" "}
                    {new Date(selectedLog.timestamp).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleCopy(selectedLog.id, selectedLog.message)
                  }
                  className="p-2 rounded hover:bg-secondary text-text/70 transition-colors"
                  title="Salin ke Clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-semibold text-text hover:text-white hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-bg">
              {(() => {
                const { facts, interpretations, unknowns, disclaimer } =
                  parseStructuredLog(selectedLog.message);

                // Fallback to raw HTML if parsing fails for some reason
                if (facts.length === 0 && interpretations.length === 0) {
                  return (
                    <div
                      className="bg-[#181124] p-5 rounded-xl border border-secondary/80 text-[13px] text-text/90 leading-relaxed overflow-x-auto telegram-html-content shadow-inner"
                      dangerouslySetInnerHTML={{
                        __html: selectedLog.message.replace(/\n/g, "<br/>"),
                      }}
                    />
                  );
                }

                return (
                  <div className="space-y-8 font-sans">
                    {/* Primary Focus: Facts */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-text/50 mb-3 border-b border-border/50 pb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-sm bg-primary" />
                        <span>Fakta Terverifikasi (Sectors API)</span>
                      </h4>
                      <ul className="space-y-3">
                        {facts.map((f, i) => (
                          <li
                            key={i}
                            className="text-[13px] text-text/90 leading-relaxed flex items-start"
                          >
                            <span className="mr-3 text-primary/50 mt-0.5">
                              ▪
                            </span>
                            <span className="font-medium">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Secondary: Interpretation */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-text/50 mb-3 border-b border-border/50 pb-2 flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-sm bg-blue-500" />
                        <span>Interpretasi (Non-Prediktif)</span>
                      </h4>
                      <ul className="space-y-3">
                        {interpretations.map((interp, i) => (
                          <li
                            key={i}
                            className="text-[13px] text-text/80 leading-relaxed flex items-start"
                          >
                            <span className="mr-3 text-blue-500/50 mt-0.5">
                              ▪
                            </span>
                            <span>{interp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer Row: Unknowns & Disclaimer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/30">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-text/40 mb-3">
                          Belum Diketahui / Batasan
                        </h4>
                        <ul className="space-y-2">
                          {unknowns.map((u, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-text/50 leading-relaxed flex items-start"
                            >
                              <span className="mr-2 opacity-30 mt-0.5">—</span>
                              <span>{u}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-secondary/30 p-4 rounded-lg border border-border/40">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-text/40 mb-2">
                          Disclaimer Risiko
                        </h4>
                        <p className="text-[10px] text-text/50 leading-relaxed italic">
                          {disclaimer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
