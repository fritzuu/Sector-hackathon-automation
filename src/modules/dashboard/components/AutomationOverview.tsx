/**
 * AutomationOverview — 4 KPI cards premium redesign.
 * Clean, native Tailwind implementation with semantic colors.
 */

import React from "react";
import { Eye, Layers, Clock, Zap } from "lucide-react";

interface OverviewProps {
  lastRunTime: string | null;
  activeCasesCount: number;
  totalWatchlistCount: number;
  lastRunStatus: "SUCCESS" | "PARTIAL" | "IDLE" | "RUNNING";
  totalRunsCount: number;
}

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  pulse?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  sub,
  icon,
  iconBgClass,
  iconColorClass,
  pulse,
}) => (
  <div className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-300 bg-secondary/50 border border-border hover:border-primary hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] group cursor-default">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center relative ${iconBgClass}`}
      >
        {pulse && (
          <span
            className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse ${iconColorClass.replace("text-", "bg-")}`}
          />
        )}
        <div
          className={`transition-transform duration-300 group-hover:scale-110 ${iconColorClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
    <div>
      <div
        className={`text-xl font-bold font-mono tracking-tight transition-colors duration-300 group-hover:text-primary`}
      >
        {value}
      </div>
      <div className="text-xs mt-0.5 font-mono text-text-muted">{sub}</div>
    </div>
  </div>
);

export const AutomationOverview: React.FC<OverviewProps> = ({
  lastRunTime,
  activeCasesCount,
  totalWatchlistCount,
  lastRunStatus,
  totalRunsCount,
}) => {
  const isRunning = lastRunStatus === "RUNNING";
  const statusText = isRunning ? "Mengevaluasi..." : "Aktif · 16:30 WIB";

  const cards: KpiCardProps[] = [
    {
      label: "Watchlist",
      value: `${totalWatchlistCount}`,
      sub: "Saham dalam pemantauan",
      icon: <Eye className="w-3.5 h-3.5" />,
      iconBgClass: "bg-accent/10 border border-accent/20",
      iconColorClass: "text-accent",
    },
    {
      label: "Kasus Aktif",
      value: `${activeCasesCount}`,
      sub: "Pola terdeteksi hari ini",
      icon: <Layers className="w-3.5 h-3.5" />,
      iconBgClass:
        activeCasesCount > 0
          ? "bg-amber-500/10 border border-amber-500/20"
          : "bg-text-muted/10 border border-text-muted/20",
      iconColorClass:
        activeCasesCount > 0 ? "text-amber-500" : "text-text-muted",
    },
    {
      label: "Pemeriksaan Terakhir",
      value: isRunning 
        ? "Mengevaluasi..." 
        : lastRunTime
          ? new Date(lastRunTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          : "—",
      sub: isRunning 
        ? "Sistem sedang memproses data" 
        : `Total ${totalRunsCount} eksekusi otomatis`,
      icon: isRunning ? <Zap className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />,
      iconBgClass: isRunning 
        ? "bg-amber-500/10 border border-amber-500/20" 
        : "bg-primary/10 border border-primary/20",
      iconColorClass: isRunning ? "text-amber-500" : "text-primary",
      pulse: isRunning,
    },
  ];

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
          Ringkasan Otomatisasi
        </h2>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
          <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-amber-400 animate-pulse' : 'bg-accent shadow-[0_0_8px_rgba(0,255,85,0.8)]'}`} />
          <span className={`text-[10px] font-mono font-bold ${isRunning ? 'text-amber-400' : 'text-accent'}`}>
            {isRunning ? 'PIPELINE MENGEVALUASI...' : 'SCHEDULER AKTIF · 16:30 WIB'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  );
};
