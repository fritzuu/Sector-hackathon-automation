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
  isRunning,
  totalWatchlist,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 font-black text-slate-950 text-sm">
            SIBA
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold text-white tracking-tight">SIBA</span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                Track 02 Automation
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Sistem Informasi & Bot Analisis IDX
            </p>
          </div>
        </div>

        {/* Right Nav Navigation & Actions */}
        {currentUser ? (
          /* Authenticated Header */
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Telegram Status Button */}
            <button
              onClick={onOpenTelegramModal}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                currentUser.isTelegramLinked
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 animate-pulse'
              }`}
            >
              <Send className="w-3.5 h-3.5 -translate-x-0.5" />
              <span className="hidden sm:inline">
                {currentUser.isTelegramLinked ? 'Telegram Terhubung' : 'Hubungkan Telegram'}
              </span>
            </button>

            {/* Reset Action */}
            <button
              onClick={onResetReplay}
              title="Reset data sesi"
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-700/80 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset</span>
            </button>

            {/* Run Unattended Workflow */}
            <button
              onClick={onRunWorkflow}
              disabled={isRunning || totalWatchlist === 0}
              className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm transition-all ${
                isRunning
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold shadow-teal-500/25 glow-teal cursor-pointer'
              }`}
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Mengevaluasi...' : 'Jalankan Run'}</span>
            </button>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-white transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="hidden md:inline max-w-[120px] truncate">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl p-2 z-50 divide-y divide-slate-800 text-xs">
                  <div className="p-2.5 space-y-0.5">
                    <p className="font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full p-2 text-left text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center space-x-2 font-semibold transition-colors"
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
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all cursor-pointer"
            >
              Daftar Gratis
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
