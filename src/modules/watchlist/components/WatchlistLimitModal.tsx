import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Clock, X, CheckCircle2 } from 'lucide-react';
import { MAX_WATCHLIST_MUTATIONS_PER_DAY } from '../watchlist.rules';

interface WatchlistLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  mutationCount: number;
  currentWatchlist: string[];
}

export const WatchlistLimitModal: React.FC<WatchlistLimitModalProps> = ({
  isOpen,
  onClose,
  mutationCount,
  currentWatchlist,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="limit-modal-title"
        aria-describedby="limit-modal-desc"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-bg/80 backdrop-blur-sm"
        />

        {/* Dialog Card — menggunakan token desain app */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-2xl border border-border bg-secondary p-6 shadow-2xl z-10 flex flex-col text-left"
        >
          {/* Tombol Tutup */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header: Icon + Badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Kuota 20/20 Habis
                </span>
              </div>
              <h2 id="limit-modal-title" className="text-base font-bold text-text mt-0.5">
                Batas Penambahan Saham
              </h2>
            </div>
          </div>

          {/* Pesan Utama */}
          <p id="limit-modal-desc" className="text-xs text-text-muted leading-relaxed mb-5">
            Setiap penambahan saham memicu query Sectors API secara real-time. Demi menjaga keandalan sistem dan efisiensi kuota bursa bersama, penambahan dibatasi <strong className="text-text">{MAX_WATCHLIST_MUTATIONS_PER_DAY} kali per hari</strong>.
          </p>

          {/* Status Bar — health bar style */}
          {(() => {
            const remaining = Math.max(0, MAX_WATCHLIST_MUTATIONS_PER_DAY - mutationCount);
            const ratio = remaining / MAX_WATCHLIST_MUTATIONS_PER_DAY;
            const barColor = ratio > 0.4 ? 'bg-accent' : ratio > 0.15 ? 'bg-amber-400' : 'bg-rose-500';
            return (
              <div className="rounded-xl bg-surface border border-border p-3.5 space-y-2.5 mb-5 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-text-muted">Sisa Penambahan Hari Ini</span>
                  <span className={`font-bold ${
                    ratio > 0.4 ? 'text-accent' : ratio > 0.15 ? 'text-amber-400' : 'text-rose-400'
                  }`}>{remaining} / {MAX_WATCHLIST_MUTATIONS_PER_DAY}</span>
                </div>

                {/* 20-segment health bar */}
                <div className="flex gap-[3px]">
                  {Array.from({ length: MAX_WATCHLIST_MUTATIONS_PER_DAY }).map((_, i) => {
                    const isActive = i < remaining;
                    return (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-sm transition-colors duration-150 ${
                          isActive ? barColor : 'bg-border/40'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-muted pt-0.5">
                  <span className="flex items-center gap-1.5 text-amber-300/80">
                    <Clock className="w-3 h-3" /> Reset: 00:00 WIB
                  </span>
                  <span className="text-text-muted">
                    Hapus saham tetap aktif
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Saham Terpantau */}
          {currentWatchlist.length > 0 && (
            <div className="mb-6">
              <span className="text-[11px] font-medium text-text-muted block mb-2">
                Tetap dipantau otomatis ({currentWatchlist.length} saham):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentWatchlist.map((sym) => (
                  <span
                    key={sym}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface border border-border text-text font-mono text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3 h-3 text-accent" />
                    {sym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA Button — konsisten dengan primary app */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-bg font-bold text-xs hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-lg"
          >
            Mengerti &amp; Lanjutkan
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
