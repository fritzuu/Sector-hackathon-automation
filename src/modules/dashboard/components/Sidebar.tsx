import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, List, ShieldAlert, History, CalendarClock, ChevronRight, ChevronLeft, LogOut, Sparkles, X } from 'lucide-react';
import { UserProfile } from '../../../data/userProfiles.js';

interface SidebarProps {
  currentUser: UserProfile;
  isTouring?: boolean;
  tourTargetId?: string | null;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  onLogout: () => void;
  onOpenTour: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  isTouring = false,
  tourTargetId,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
  onLogout,
  onOpenTour,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);
  const userInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserInfoOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!userInfoRef.current?.contains(event.target as Node)) {
        setIsUserInfoOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isUserInfoOpen]);

  const navItems = [
    { label: 'Overview', mobileLabel: 'Overview', path: '/dashboard', id: 'tour-sidebar-overview', icon: LayoutDashboard },
    { label: 'Watchlist', mobileLabel: 'Watchlist', path: '/dashboard/watchlist', id: 'tour-sidebar-watchlist', icon: List },
    { label: 'Kasus Aktif', mobileLabel: 'Kasus', path: '/dashboard/cases', id: 'tour-sidebar-cases', icon: ShieldAlert },
    { label: 'Otomatisasi', mobileLabel: 'Otomatisasi', path: '/dashboard/automation', id: 'tour-sidebar-automation', icon: CalendarClock },
    { label: 'Audit Trail', mobileLabel: 'Audit', path: '/dashboard/audit', id: 'tour-sidebar-audit', icon: History },
  ];

  const isSidebarStep = isTouring && Boolean(
    tourTargetId && (
      tourTargetId.startsWith('tour-sidebar') || 
      tourTargetId === 'tour-user-info'
    )
  );

  const showMobileDrawer = isMobileMenuOpen || isSidebarStep;

  return (
    <>
      {/* ── Desktop Sidebar (Left Column) ────────────────────── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-[#0e041a] border-r border-border flex-col font-sans h-full">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <img src="/siba-symbol.svg" alt="" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="text-sm font-black tracking-widest text-text-main">SIBA</h1>
            <p className="text-[10px] font-mono text-text-muted/60">SECTORS API V2</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted/50 px-2 mb-3 mt-2">
            Menu Utama
          </div>
          
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                id={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-md shadow-primary/10'
                    : 'text-text-muted hover:bg-white/5 hover:text-text-main border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-muted/70'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div id="tour-user-info" ref={userInfoRef} className="relative">
            <button
              onClick={() => setIsUserInfoOpen((open) => !open)}
              aria-expanded={isUserInfoOpen}
              className="w-full flex items-center gap-3 rounded-xl bg-secondary/60 border border-border p-3 text-left hover:border-primary/40 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-text-main truncate">{currentUser.name}</div>
                <div className="text-[10px] text-text-muted truncate">{currentUser.email}</div>
              </div>
              {isUserInfoOpen
                ? <ChevronLeft className="w-4 h-4 text-text-muted" />
                : <ChevronRight className="w-4 h-4 text-text-muted" />}
            </button>

            {isUserInfoOpen && (
              <div className="absolute left-full bottom-0 ml-2 w-56 rounded-xl bg-bg border border-border shadow-2xl p-2 z-50 text-xs">
                <div className="px-2.5 py-2 border-b border-border">
                  <p className="font-bold text-text-main truncate">{currentUser.name}</p>
                  <p className="text-text-muted truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 font-bold rounded bg-secondary text-primary border border-primary/30">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsUserInfoOpen(false);
                    onOpenTour();
                  }}
                  className="w-full p-2 mt-1 text-left text-primary hover:bg-primary/10 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ulangi Tur Interaktif</span>
                </button>
                <button
                  onClick={() => {
                    setIsUserInfoOpen(false);
                    onLogout();
                  }}
                  className="w-full p-2 text-left text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile Slide-In Side Panel (From Right) ───────────── */}
      {showMobileDrawer && (
        <>
          {/* Backdrop — its own fixed layer at z-[55], closes menu on tap */}
          <div
            className="md:hidden fixed inset-0 z-[55] bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobileMenu}
          />

          {/* Panel — independent fixed layer at z-[56], always above backdrop */}
          <aside className="md:hidden fixed top-0 right-0 h-full z-[56] w-72 max-w-[85vw] bg-[#0e041a] border-l border-border shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <img src="/siba-symbol.svg" alt="" className="w-7 h-7 object-contain" />
                <div>
                  <h2 className="text-xs font-black tracking-widest text-white">SIBA</h2>
                  <p className="text-[9px] font-mono text-text-muted/60">SECTORS API V2</p>
                </div>
              </div>
              <button
                onClick={onCloseMobileMenu}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-secondary/60 transition-colors cursor-pointer"
                title="Tutup menu"
              >
                <X className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted/50 px-2 mb-3">
                Menu Utama
              </div>
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    id={item.id}
                    to={item.path}
                    onClick={onCloseMobileMenu}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/20 text-primary border border-primary/30 shadow-md shadow-primary/10'
                        : 'text-text-muted hover:bg-white/5 hover:text-text-main border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-muted/70'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile Footer */}
            <div id="tour-user-info" className="p-4 border-t border-border bg-[#0b0314] space-y-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-text-muted truncate">{currentUser.email}</div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    onCloseMobileMenu?.();
                    onOpenTour();
                  }}
                  className="w-full p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ulangi Tur Interaktif</span>
                </button>
                <button
                  onClick={() => {
                    onCloseMobileMenu?.();
                    onLogout();
                  }}
                  className="w-full p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
};
