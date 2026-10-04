import React, { useState } from 'react';
import { RotateCcw, LogOut, Sparkles, ChevronDown } from 'lucide-react';
import { UserProfile } from '../../../data/userProfiles.js';

interface HeaderProps {
  currentUser: UserProfile | null;
  landingSections?: Array<{ id: string; label: string }>;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenTelegramModal: () => void;
  onResetReplay: () => void;
  onOpenTour?: () => void;
  isRunning: boolean;
  totalWatchlist: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  landingSections,
  onOpenAuth,
  onLogout,
  onOpenTelegramModal,
  onResetReplay,
  onOpenTour,
  isRunning,
  totalWatchlist,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(id);
    if (targetElement) {
      const headerOffset = 72;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <header id="tour-header-actions" className="border-b border-border bg-bg/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        {/* Brand Logo */}
        <div className="flex shrink-0 items-center space-x-3">
          <img src="/siba-symbol.svg" alt="SIBA Logo" className="w-9 h-9 object-contain" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black text-white tracking-tight">SIBA</span>
              <span className="px-2 py-0.5 text-[11px] font-bold tracking-wide bg-secondary text-primary border border-border rounded-full">
                Track 02 Automation
              </span>
            </div>
            <p className="text-xs text-text-muted hidden sm:block">
              Sistem Informasi Bursa dan Aset
            </p>
          </div>
        </div>

        {!currentUser && landingSections && landingSections.length > 0 && (
          <nav className="ml-2 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex lg:ml-6" aria-label="Navigasi section landing page">
            {landingSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => handleScrollToSection(e, section.id)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-text-muted transition-all duration-200 hover:text-white hover:bg-secondary/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
              >
                {section.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right Nav Navigation & Actions */}
        {currentUser ? (
          /* Authenticated Header */
          <div className="ml-auto flex shrink-0 items-center space-x-2 sm:space-x-3">
            <div id="tour-header-online" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent font-mono text-xs font-bold" title="Sistem Online">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="hidden sm:inline">Sistem Online</span>
            </div>

            {/* Compact account menu remains available when the sidebar is hidden on mobile. */}
            <div id="tour-user-info-mobile" className="relative md:hidden">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-expanded={isProfileMenuOpen}
                aria-label="Buka info pengguna"
                className="flex items-center space-x-2 p-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/40 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/30">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="hidden md:inline max-w-30 truncate">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl p-2 z-50 divide-y divide-border text-xs">
                  <div className="p-2.5 space-y-0.5">
                    <p className="font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-text-muted truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded bg-secondary text-primary border border-primary/30">
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
                        className="w-full p-2 text-left text-primary hover:bg-primary/10 rounded-lg flex items-center space-x-2 font-semibold transition-colors cursor-pointer"
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
          <div className="ml-auto flex shrink-0 items-center space-x-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-text-muted hover:text-white bg-secondary/60 hover:bg-secondary border border-border hover:border-primary/40 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
            >
              Masuk
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 bg-primary hover:bg-primary-600 text-bg font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 cursor-pointer border border-primary/50"
            >
              Daftar Gratis
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
