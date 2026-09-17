import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Eye, Layers, Database } from 'lucide-react';

interface OverviewProps {
  lastRunTime: string | null;
  activeCasesCount: number;
  totalWatchlistCount: number;
  lastRunStatus: 'SUCCESS' | 'PARTIAL' | 'IDLE' | 'RUNNING';
  totalRunsCount: number;
}

export const AutomationOverview: React.FC<OverviewProps> = ({
  lastRunTime,
  activeCasesCount,
  totalWatchlistCount,
  lastRunStatus,
  totalRunsCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
      {/* Card 1: Pipeline Status */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Status Workflow</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="mt-2">
          <div className="text-base font-bold text-white uppercase tracking-tight font-mono">
            {lastRunStatus === 'RUNNING' ? 'Mengevaluasi...' : 'Aktif (16:30 WIB)'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Unattended Scheduler Hari Bursa
          </p>
        </div>
      </div>

      {/* Card 2: Watchlist Monitored */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Watchlist Pribadi</span>
          <Eye className="w-3.5 h-3.5 text-teal-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-white font-mono">
            {totalWatchlistCount} <span className="text-xs font-normal text-slate-400 font-sans">Saham Terdaftar</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Data Sectors API v2 Terverifikasi
          </p>
        </div>
      </div>

      {/* Card 3: Active Cases */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Kasus Aktif</span>
          <Layers className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-amber-400 font-mono">
            {activeCasesCount} <span className="text-xs font-normal text-slate-400 font-sans">Kasus Dipantau</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Mencatat linimasa lintas hari
          </p>
        </div>
      </div>

      {/* Card 4: Run History */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Pemeriksaan Terakhir</span>
          <Clock className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="mt-2">
          <div className="text-sm font-bold text-white font-mono truncate">
            {lastRunTime ? new Date(lastRunTime).toLocaleTimeString('id-ID') : 'Belum Dijalankan'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Total {totalRunsCount} Unattended Run
          </p>
        </div>
      </div>
    </div>
  );
};
