/**
 * AutomationOverview — 4 KPI cards premium redesign.
 * Hallmark · redesign · genre: atmospheric · theme: Midnight
 * Workbench macrostructure · no AI slop · real data only
 */

import React from 'react';
import { Activity, Eye, Layers, Clock, Zap } from 'lucide-react';

interface OverviewProps {
  lastRunTime: string | null;
  activeCasesCount: number;
  totalWatchlistCount: number;
  lastRunStatus: 'SUCCESS' | 'PARTIAL' | 'IDLE' | 'RUNNING';
  totalRunsCount: number;
}

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  pulse?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label, value, sub, icon, accentColor, glowColor, pulse,
}) => (
  <div
    className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-200"
    style={{
      background: 'hsl(301, 100%, 7%)',
      border: '1px solid hsl(301, 60%, 25%)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 24px ${glowColor}, 0 2px 12px rgba(0,0,0,0.5)`;
      (e.currentTarget as HTMLDivElement).style.borderColor = `hsl(288, 100%, 70%)`;
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)';
      (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(301, 60%, 25%)';
    }}
  >
    <div className="flex items-center justify-between">
      <span
        className="text-[10px] font-mono font-bold uppercase tracking-widest"
        style={{ color: 'rgba(148,163,184,0.5)' }}
      >
        {label}
      </span>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center relative"
        style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}
      >
        {pulse && (
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: accentColor }}
          />
        )}
        {icon}
      </div>
    </div>
    <div>
      <div
        className="text-xl font-bold font-mono tracking-tight"
        style={{ color: accentColor }}
      >
        {value}
      </div>
      <div className="text-[10px] mt-0.5 font-mono" style={{ color: 'rgba(148,163,184,0.45)' }}>
        {sub}
      </div>
    </div>
  </div>
);

export const AutomationOverview: React.FC<OverviewProps> = ({
  lastRunTime, activeCasesCount, totalWatchlistCount, lastRunStatus, totalRunsCount,
}) => {
  const isRunning  = lastRunStatus === 'RUNNING';
  const statusText = isRunning ? 'Mengevaluasi...' : 'Aktif · 16:30 WIB';

  const cards: KpiCardProps[] = [
    {
      label:       'Status Pipeline',
      value:       statusText,
      sub:         isRunning ? 'Workflow sedang berjalan' : 'Unattended Scheduler IDX',
      icon:        <Zap className="w-3.5 h-3.5" style={{ color: isRunning ? '#fbbf24' : '#34d399' }} />,
      accentColor: isRunning ? '#fbbf24' : '#34d399',
      glowColor:   isRunning ? 'rgba(251,191,36,0.12)' : 'rgba(52,211,153,0.12)',
      pulse:       isRunning,
    },
    {
      label:       'Watchlist',
      value:       `${totalWatchlistCount}`,
      sub:         'Saham dalam pemantauan',
      icon:        <Eye className="w-3.5 h-3.5" style={{ color: '#5eead4' }} />,
      accentColor: '#5eead4',
      glowColor:   'rgba(20,184,166,0.12)',
    },
    {
      label:       'Kasus Aktif',
      value:       `${activeCasesCount}`,
      sub:         'Pola terdeteksi hari ini',
      icon:        <Layers className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />,
      accentColor: activeCasesCount > 0 ? '#fbbf24' : 'rgba(148,163,184,0.5)',
      glowColor:   'rgba(251,191,36,0.12)',
    },
    {
      label:       'Pemeriksaan Terakhir',
      value:       lastRunTime
        ? new Date(lastRunTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '—',
      sub:         `Total ${totalRunsCount} unattended run`,
      icon:        <Clock className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />,
      accentColor: '#a78bfa',
      glowColor:   'rgba(167,139,250,0.12)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
      {cards.map(card => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
};
