import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
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
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
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
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const [isLandingMobileMenuOpen, setIsLandingMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsLandingMobileMenuOpen(false);

    const targetElement = document.getElementById(id);
    if (!targetElement) return;

    window.history.pushState(null, '', `#${id}`);

    const headerOffset = 72;
    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerOffset;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;

    if (Math.abs(distance) < 2) return;

    const duration = 420;
    let startTime: number | null = null;

    const animateScroll = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      // easeOutQuart: starts fast, decelerates smoothly — no jarring lead-in
      const ease = 1 - Math.pow(1 - progress, 4);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <>
      <header id="tour-header-actions" className="border-b border-border bg-bg/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          {/* Brand Logo */}
          <div className="flex shrink-0 items-center space-x-2.5">
            <img src="/siba-symbol.svg" alt="SIBA Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-black text-white tracking-tight">SIBA</span>
                <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wide bg-secondary text-primary border border-border rounded-full hidden xs:inline">
                  Track 02
                </span>
              </div>
              <p className="text-xs text-text-muted hidden sm:block">
                Sistem Informasi Bursa dan Aset
              </p>
            </div>
          </div>

          {/* Desktop landing nav */}
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

          {/* Right side actions */}
          {currentUser ? (
            <div className="ml-auto flex shrink-0 items-center space-x-2 sm:space-x-3">
              {/* Hamburger button — delegates entirely to _auth.tsx state */}
              <button
                type="button"
                onClick={onToggleMobileMenu}
                aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                className="md:hidden flex items-center justify-center p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border hover:border-primary/40 text-primary hover:text-white active:scale-95 transition-all duration-200 cursor-pointer shadow-md select-none touch-manipulation z-50 relative"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
              </button>
            </div>
          ) : (
            <div className="ml-auto flex shrink-0 items-center space-x-2 sm:space-x-3">
              {landingSections && landingSections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsLandingMobileMenuOpen(!isLandingMobileMenuOpen)}
                  aria-label="Buka menu navigasi"
                  className="md:hidden p-2 rounded-xl bg-secondary/60 border border-border text-text-muted hover:text-white transition-colors cursor-pointer"
                >
                  {isLandingMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-text-muted hover:text-white bg-secondary/60 hover:bg-secondary border border-border hover:border-primary/40 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary hover:bg-primary-600 text-bg font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 cursor-pointer border border-primary/50"
              >
                Daftar
              </button>
            </div>
          )}
        </div>

        {/* Mobile landing nav dropdown */}
        {!currentUser && isLandingMobileMenuOpen && landingSections && landingSections.length > 0 && (
          <div className="md:hidden border-t border-border/50 bg-bg/98 px-4 py-3 grid grid-cols-3 gap-2">
            {landingSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => handleScrollToSection(e, section.id)}
                className="rounded-lg px-2 py-2 text-xs font-bold text-text-muted text-center transition-all duration-200 hover:text-white hover:bg-secondary/60 cursor-pointer"
              >
                {section.label}
              </a>
            ))}
          </div>
        )}
      </header>

    </>
  );
};
