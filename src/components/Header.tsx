import React, { useState } from 'react';
import { Shield, Play, RotateCcw, Activity, Send, User, LogOut, Sparkles, ChevronDown } from 'lucide-react';
import { UserProfile } from '../data/userProfiles.js';

interface HeaderProps {
  currentUser: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenTelegramModal: () => void;
  onRunWorkflow: () => void;
  onResetReplay: () => void;
  onOpenTour?: () => void;
  isRunning: boolean;
  totalWatchlist: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenTelegramModal,
  onRunWorkflow,
  onResetReplay,
  onOpenTour,
  isRunning,
  totalWatchlist,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header id="tour-header-actions" className="border-b border-[hsl(301,60%,25%)] bg-[hsl(279,100%,3%)]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[hsl(288,100%,70%)] to-[hsl(141,100%,50%)] flex items-center justify-center shadow-lg shadow-primary/30 font-black text-[hsl(279,100%,3%)] text-sm">
            SIBA
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold text-white tracking-tight">SIBA</span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide bg-[hsl(301,100%,20%)] text-[hsl(288,100%,70%)] border border-[hsl(288,100%,70%)]/30 rounded-full">
                Track 02 Automation
              </span>
            </div>
            <p className="text-[11px] text-text/60 hidden sm:block">
              Sistem Informasi &amp; Bot Analisis IDX
            </p>
          </div>
        </div>

        {/* Right Nav Navigation & Actions */}
        {currentUser ? (
          /* Authenticated Header */
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Reset Action */}
            <button
              onClick={onResetReplay}
              title="Reset data sesi"
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-text/80 hover:text-white bg-secondary border border-primary/30 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" />
              <span className="hidden lg:inline">Reset</span>
            </button>

            {/* Run Unattended Workflow */}
            <button
              onClick={onRunWorkflow}
              disabled={isRunning || totalWatchlist === 0}
              className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm transition-all ${
                isRunning
                  ? 'bg-secondary text-text/40 cursor-not-allowed border border-primary/20'
                  : 'bg-accent hover:opacity-95 text-background font-black shadow-accent/25 glow-blue cursor-pointer border border-primary'
              }`}
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Mengevaluasi...' : 'Jalankan Run'}</span>
            </button>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-primary/40 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/30">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="hidden md:inline max-w-[120px] truncate">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[hsl(279,100%,4%)] border border-[hsl(301,60%,25%)] rounded-xl shadow-2xl p-2 z-50 divide-y divide-[hsl(301,60%,20%)] text-xs">
                  <div className="p-2.5 space-y-0.5">
                    <p className="font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-text/60 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-secondary text-primary border border-primary/30">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="py-1 space-y-1">
                    {onOpenTour && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenTour();
                        }}
                        className="w-full p-2 text-left text-[hsl(141,100%,50%)] hover:bg-[hsl(141,100%,50%)]/10 rounded-lg flex items-center space-x-2 font-semibold transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ulangi Tur Interaktif</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full p-2 text-left text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center space-x-2 font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Guest Header */
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-xs font-black text-white bg-[hsl(301,100%,15%)] hover:bg-[hsl(301,100%,25%)] border border-[hsl(301,60%,35%)] rounded-xl transition-colors duration-200 cursor-pointer shadow-md"
            >
              Masuk
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 bg-[hsl(141,100%,50%)] hover:bg-[hsl(141,100%,40%)] text-[hsl(279,100%,3%)] font-black text-xs rounded-xl shadow-lg shadow-[hsl(141,100%,50%)]/20 transition-colors duration-200 cursor-pointer border border-[hsl(141,100%,50%)]"
            >
              Daftar Gratis
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
