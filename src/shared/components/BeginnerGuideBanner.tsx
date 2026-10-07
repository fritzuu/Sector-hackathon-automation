import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";
import { useAuthStore } from "../../modules/auth/stores/auth.store";
import { useWatchlistStore } from "../../modules/watchlist/stores/watchlist.store";

interface BeginnerGuideBannerProps {
  userName: string;
  onOpenTour?: () => void;
}

export const BeginnerGuideBanner: React.FC<BeginnerGuideBannerProps> = ({
  userName,
  onOpenTour,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { currentUser } = useAuthStore();
  const watchlist = useWatchlistStore(state => state.watchlist);

  // Check if permanently dismissed in local storage
  useEffect(() => {
    const dismissed = localStorage.getItem('siba_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismissForever = () => {
    localStorage.setItem('siba_banner_dismissed', 'true');
    setIsDismissed(true);
  };

  if (isDismissed || !currentUser) return null;

  const hasWatchlist = watchlist.length > 0;
  const hasTelegram = currentUser.isTelegramLinked;
  const progress = (hasWatchlist ? 1 : 0) + (hasTelegram ? 1 : 0);
  const isComplete = progress === 2;

  const handleScrollToWatchlist = () => {
    document.getElementById('tour-watchlist-overview')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenTelegram = () => {
    window.dispatchEvent(new CustomEvent('open-telegram-modal'));
  };

  return (
    <div className={`rounded-2xl overflow-hidden font-sans relative border transition-all duration-200 shadow-sm ${isComplete ? 'bg-accent/5 border-accent/30' : 'bg-secondary/40 border-primary/30'}`}>
      
      {/* Progress Bar Background */}
      <div className="absolute top-0 left-0 h-1.5 bg-secondary w-full">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out" 
          style={{ width: `${(progress / 2) * 100}%` }}
        />
      </div>

      <div className="p-6 mt-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className={`text-lg sm:text-xl font-black tracking-tight flex items-center gap-2.5 ${isComplete ? 'text-accent' : 'text-white'}`}>
                {isComplete ? (
                  <><CheckCircle2 className="w-5 h-5 text-accent" /> Setup Otomatisasi Selesai!</>
                ) : (
                  <><Sparkles className="w-5 h-5 text-primary" /> Selamat datang di SIBA, {userName}</>
                )}
              </h2>
              {!isComplete && (
                <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                  Langkah {progress} dari 2 Selesai
                </span>
              )}
            </div>

            {/* Body */}
            <p className="text-xs sm:text-sm leading-relaxed max-w-3xl text-text-muted mb-5 font-normal">
              {isComplete 
                ? "Hebat! SIBA sekarang sepenuhnya otomatis. Sistem akan mengevaluasi portofolio Anda setiap hari bursa pada pukul 07:00 WIB dan mengirimkan notifikasi ke Telegram Anda."
                : "Untuk mengaktifkan otomatisasi penuh, selesaikan 2 langkah singkat di bawah ini agar SIBA dapat mulai memantau portofolio Anda."
              }
            </p>

            {/* Interactive Checklist */}
            {!isComplete && (
              <div className="flex flex-col sm:flex-row gap-3.5">
                
                {/* Step 1: Watchlist */}
                <button 
                  onClick={hasWatchlist ? undefined : handleScrollToWatchlist}
                  disabled={hasWatchlist}
                  className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${
                    hasWatchlist 
                      ? 'bg-accent/10 border-accent/25 cursor-default opacity-80' 
                      : 'bg-bg/80 border-border hover:border-primary hover:bg-secondary/70 group cursor-pointer shadow-sm'
                  }`}
                >
                  {hasWatchlist ? <CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> : <Circle className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors shrink-0" />}
                  <div>
                    <div className={`text-sm font-black tracking-tight ${hasWatchlist ? 'text-accent' : 'text-white group-hover:text-primary transition-colors'}`}>
                      1. Tambahkan Saham
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      Masukkan emiten ke Watchlist Anda
                    </div>
                  </div>
                  {!hasWatchlist && <ArrowRight className="w-4 h-4 text-text-muted ml-2 group-hover:text-primary transition-transform group-hover:translate-x-1 shrink-0" />}
                </button>

                {/* Step 2: Telegram */}
                <button 
                  onClick={hasTelegram ? undefined : handleOpenTelegram}
                  disabled={hasTelegram}
                  className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${
                    hasTelegram 
                      ? 'bg-accent/10 border-accent/25 cursor-default opacity-80' 
                      : 'bg-bg/80 border-border hover:border-primary hover:bg-secondary/70 group cursor-pointer shadow-sm'
                  }`}
                >
                  {hasTelegram ? <CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> : <Circle className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors shrink-0" />}
                  <div>
                    <div className={`text-sm font-black tracking-tight ${hasTelegram ? 'text-accent' : 'text-white group-hover:text-primary transition-colors'}`}>
                      2. Hubungkan Telegram
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      Untuk menerima alert 07:00 WIB
                    </div>
                  </div>
                  {!hasTelegram && <ArrowRight className="w-4 h-4 text-text-muted ml-2 group-hover:text-primary transition-transform group-hover:translate-x-1 shrink-0" />}
                </button>
              </div>
            )}
            
            {/* Tour Button (Optional extra) */}
            {onOpenTour && !isComplete && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-text-muted">Bingung mulai dari mana?</span>
                <button
                  onClick={onOpenTour}
                  className="text-xs font-bold text-primary hover:text-white transition-colors underline underline-offset-2 cursor-pointer"
                >
                  Lihat Tur Interaktif SIBA
                </button>
              </div>
            )}
          </div>

          {/* Close / Dismiss */}
          <button
            onClick={handleDismissForever}
            className="flex-shrink-0 p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup selamanya"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
