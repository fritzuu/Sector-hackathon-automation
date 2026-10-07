/**
 * MarketCloseToast — muncul otomatis jam 07:00 WIB untuk evaluasi pagi.
 * Memberitahu user bahwa harga + news terbaru sudah di-refresh.
 * Auto-dismiss dalam 8 detik. Slide-in dari bawah.
 */

import React, { useEffect, useState } from 'react';
import { Bell, X, TrendingUp, Newspaper, RefreshCw } from 'lucide-react';

interface MarketCloseToastProps {
  isVisible: boolean;
  watchlistCount: number;
  onClose: () => void;
}

const AUTO_DISMISS_MS = 8_000;

export const MarketCloseToast: React.FC<MarketCloseToastProps> = ({
  isVisible,
  watchlistCount,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setMounted(false);
      setProgress(100);
      return;
    }

    // Small delay so CSS transition plays
    const mountTimer = setTimeout(() => setMounted(true), 16);

    // Progress bar countdown
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => {
      clearTimeout(mountTimer);
      clearInterval(interval);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] w-full max-w-sm pointer-events-auto"
      style={{
        transform: mounted ? 'translateY(0)' : 'translateY(calc(100% + 24px))',
        opacity: mounted ? 1 : 0,
        transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      }}
    >
      {/* Card */}
      <div
        className="relative overflow-hidden rounded-xl border border-teal-700/50 shadow-2xl bg-[#0D1424]"
        style={{
          boxShadow: '0 0 40px rgba(20,184,166,0.15), 0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top glow accent */}
        <div
          className="absolute inset-x-0 top-0 h-px bg-teal-500/80"
        />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 bg-teal-500/20 border border-teal-500/40"
              style={{
                boxShadow: '0 0 12px rgba(20,184,166,0.3)',
              }}
            >
              <Bell className="w-4 h-4 text-teal-300" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold font-mono uppercase tracking-widest"
                  style={{ color: 'rgba(20,184,166,0.9)' }}
                >
                  Evaluasi Pagi 07:00 WIB
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5 leading-snug">
                Data pasar sudah diperbarui
              </p>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                Harga penutupan &amp; berita terbaru untuk{' '}
                <span className="text-teal-300 font-bold font-mono">{watchlistCount} saham</span>{' '}
                di watchlist Anda sudah tersedia.
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-secondary/60 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info pills */}
          <div className="flex items-center gap-2 mt-3 ml-12">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold font-mono"
              style={{
                background: 'rgba(20,184,166,0.08)',
                border: '1px solid rgba(20,184,166,0.2)',
                color: 'rgba(20,184,166,0.85)',
              }}
            >
              <TrendingUp className="w-3 h-3" />
              Harga Live
            </div>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold font-mono"
              style={{
                background: 'rgba(6,182,212,0.08)',
                border: '1px solid rgba(6,182,212,0.2)',
                color: 'rgba(6,182,212,0.85)',
              }}
            >
              <Newspaper className="w-3 h-3" />
              News Terbaru
            </div>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold font-mono"
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: 'rgba(129,140,248,0.85)',
              }}
            >
              <RefreshCw className="w-3 h-3" />
              Auto
            </div>
          </div>
        </div>

        {/* Progress bar — auto dismiss countdown */}
        <div className="h-0.5 bg-secondary/60">
          <div
            className="h-full bg-teal-500"
            style={{
              width: `${progress}%`,
              transition: 'width 50ms linear',
            }}
          />
        </div>
      </div>
    </div>
  );
};
