import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, List, ShieldAlert, History } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Watchlist', path: '/dashboard/watchlist', icon: List },
    { label: 'Kasus Aktif', path: '/dashboard/cases', icon: ShieldAlert },
    { label: 'Audit Trail', path: '/dashboard/audit', icon: History },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-secondary/30 border-r border-border flex flex-col hidden md:flex font-sans h-full">
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
        <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 text-center">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse mx-auto mb-2" />
          <div className="text-xs font-bold text-accent">Sistem Online</div>
          <div className="text-[10px] font-mono text-text-muted mt-1">
            Menunggu 16:30 WIB
          </div>
        </div>
      </div>
    </aside>
  );
};
