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
    <div className={`rounded-xl overflow-hidden font-sans relative border transition-all duration-500 ${isComplete ? 'bg-accent/5 border-accent/30' : 'bg-secondary/40 border-primary/30'}`}>
      
      {/* Progress Bar Background */}
      <div className="absolute top-0 left-0 h-1 bg-secondary w-full">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out" 
          style={{ width: `${(progress / 2) * 100}%` }}
        />
      </div>

      <div className="p-5 mt-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className={`text-sm font-bold flex items-center gap-2 ${isComplete ? 'text-accent' : 'text-text-main'}`}>
                {isComplete ? (
                  <><CheckCircle2 className="w-4 h-4" /> Setup Selesai!</>
                ) : (
                  <><Sparkles className="w-4 h-4 text-primary" /> Selamat datang, {userName}</>
                )}
              </h2>
              {!isComplete && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  Langkah {progress} dari 2
                </span>
              )}
            </div>

            {/* Body */}
            <p className="text-xs leading-relaxed max-w-3xl text-text-muted mb-4">
              {isComplete 
                ? "Hebat! SIBA sekarang sepenuhnya otomatis. Sistem akan mengevaluasi portofolio Anda setiap hari bursa pada pukul 16:30 WIB dan mengirimkan notifikasi ke Telegram Anda."
                : "Untuk mengaktifkan otomatisasi penuh, selesaikan 2 langkah singkat di bawah ini agar SIBA dapat mulai memantau portofolio Anda."
              }
            </p>

            {/* Interactive Checklist */}
            {!isComplete && (
              <div className="flex flex-col sm:flex-row gap-3">
                
                {/* Step 1: Watchlist */}
                <button 
                  onClick={hasWatchlist ? undefined : handleScrollToWatchlist}
                  disabled={hasWatchlist}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    hasWatchlist 
                      ? 'bg-accent/10 border-accent/20 cursor-default opacity-70' 
                      : 'bg-surface border-border hover:border-primary hover:bg-surface/80 group cursor-pointer'
                  }`}
                >
                  {hasWatchlist ? <CheckCircle2 className="w-5 h-5 text-accent" /> : <Circle className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />}
                  <div>
                    <div className={`text-xs font-bold ${hasWatchlist ? 'text-accent' : 'text-text-main group-hover:text-primary transition-colors'}`}>
                      1. Tambahkan Saham
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      Masukkan emiten ke Watchlist Anda
                    </div>
                  </div>
                  {!hasWatchlist && <ArrowRight className="w-4 h-4 text-text-muted ml-2 group-hover:text-primary transition-transform group-hover:translate-x-1" />}
                </button>

                {/* Step 2: Telegram */}
                <button 
                  onClick={hasTelegram ? undefined : handleOpenTelegram}
                  disabled={hasTelegram}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    hasTelegram 
                      ? 'bg-accent/10 border-accent/20 cursor-default opacity-70' 
                      : 'bg-surface border-border hover:border-primary hover:bg-surface/80 group cursor-pointer'
                  }`}
                >
                  {hasTelegram ? <CheckCircle2 className="w-5 h-5 text-accent" /> : <Circle className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />}
                  <div>
                    <div className={`text-xs font-bold ${hasTelegram ? 'text-accent' : 'text-text-main group-hover:text-primary transition-colors'}`}>
                      2. Hubungkan Telegram
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      Untuk menerima alert 16:30 WIB
                    </div>
                  </div>
                  {!hasTelegram && <ArrowRight className="w-4 h-4 text-text-muted ml-2 group-hover:text-primary transition-transform group-hover:translate-x-1" />}
                </button>
              </div>
            )}
            
            {/* Tour Button (Optional extra) */}
            {onOpenTour && !isComplete && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[10px] text-text-muted">Bingung mulai dari mana?</span>
                <button
                  onClick={onOpenTour}
                  className="text-[10px] font-bold text-primary hover:text-white transition-colors underline underline-offset-2 cursor-pointer"
                >
                  Lihat Tur Interaktif
                </button>
              </div>
            )}
          </div>

          {/* Close / Dismiss */}
          <button
            onClick={handleDismissForever}
            className="flex-shrink-0 p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup selamanya"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
