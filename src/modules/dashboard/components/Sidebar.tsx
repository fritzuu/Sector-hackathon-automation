import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, List, ShieldAlert, History, ChevronRight, ChevronLeft, LogOut, Sparkles } from 'lucide-react';
import { UserProfile } from '../../../data/userProfiles.js';

interface SidebarProps {
  currentUser: UserProfile;
  isTouring?: boolean;
  onLogout: () => void;
  onOpenTour: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, isTouring = false, onLogout, onOpenTour }) => {
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
    { label: 'Overview', path: '/dashboard', id: 'tour-sidebar-overview', icon: LayoutDashboard },
    { label: 'Watchlist', path: '/dashboard/watchlist', id: 'tour-sidebar-watchlist', icon: List },
    { label: 'Kasus Aktif', path: '/dashboard/cases', id: 'tour-sidebar-cases', icon: ShieldAlert },
    { label: 'Audit Trail', path: '/dashboard/audit', id: 'tour-sidebar-audit', icon: History },
  ];

  return (
    <aside className={`w-64 flex-shrink-0 bg-secondary/30 border-r border-border flex-col font-sans h-full ${isTouring ? 'flex fixed inset-y-0 left-0 z-40 shadow-2xl' : 'hidden md:flex'}`}>
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
  );
};
