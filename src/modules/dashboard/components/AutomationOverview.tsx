import React from "react";
import { Eye, Layers, Clock, Zap, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

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
  linkTo: string;
  linkText: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  sub,
  icon,
  iconBgClass,
  iconColorClass,
  pulse,
  linkTo,
  linkText,
}) => (
  <div className="rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 bg-secondary/50 border border-border hover:border-primary/50 hover:shadow-[0_0_24px_rgba(230,102,255,0.12)] group relative overflow-hidden">
    <div>
      {/* Top Row: Clear Label + Icon */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-sm font-semibold text-text-muted group-hover:text-text-main transition-colors">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center relative flex-shrink-0 ${iconBgClass}`}>
          {pulse && (
            <span className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${iconColorClass.replace("text-", "bg-")}`} />
          )}
          <div className={`transition-transform duration-300 group-hover:scale-110 ${iconColorClass}`}>
            {icon}
          </div>
        </div>
      </div>

      {/* Hero Metric Number */}
      <div className="my-2">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white transition-colors duration-300 group-hover:text-primary">
          {value}
        </div>
        <p className="text-xs text-text-muted mt-2 leading-relaxed">
          {sub}
        </p>
      </div>
    </div>
    
    {/* Bottom Action Link */}
    <Link
      to={linkTo}
      className="flex items-center justify-between pt-4 mt-4 border-t border-border/60 text-xs font-semibold text-primary/90 hover:text-primary transition-colors group-hover:translate-x-0.5"
    >
      <span>{linkText}</span>
      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
    </Link>
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

  const cards: KpiCardProps[] = [
    {
      label: "Watchlist Saham",
      value: `${totalWatchlistCount}`,
      sub: "Emiten dalam radar otomatis bursa",
      icon: <Eye className="w-4.5 h-4.5" />,
      iconBgClass: "bg-accent/10 border border-accent/20",
      iconColorClass: "text-accent",
      linkTo: "/dashboard/watchlist",
      linkText: "Kelola Watchlist",
    },
    {
      label: "Kasus Aktif Terbuka",
      value: `${activeCasesCount}`,
      sub: "Pola anomali terdeteksi hari ini",
      icon: <Layers className="w-4.5 h-4.5" />,
      iconBgClass:
        activeCasesCount > 0
          ? "bg-amber-500/10 border border-amber-500/20"
          : "bg-secondary/80 border border-border",
      iconColorClass:
        activeCasesCount > 0 ? "text-amber-400" : "text-text-muted",
      linkTo: "/dashboard/cases",
      linkText: "Lihat Rincian Kasus",
    },
    {
      label: "Pemeriksaan Terakhir",
      value: isRunning 
        ? "Mengevaluasi..." 
        : lastRunTime
          ? new Date(lastRunTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          : "—",
      sub: isRunning 
        ? "Sistem sedang memproses data bursa" 
        : `Total ${totalRunsCount} eksekusi otomatis selesai`,
      icon: isRunning ? <Zap className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />,
      iconBgClass: isRunning 
        ? "bg-amber-500/10 border border-amber-500/20" 
        : "bg-primary/10 border border-primary/20",
      iconColorClass: isRunning ? "text-amber-400" : "text-primary",
      pulse: isRunning,
      linkTo: "/dashboard/audit",
      linkText: "Buka Log Audit",
    },
  ];

  return (
    <div id="tour-automation-kpis" className="space-y-4 font-sans">
      <div className="flex items-start sm:items-center justify-between px-1 flex-wrap gap-3 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            Ringkasan Otomatisasi
          </h2>
          <p className="text-xs text-text-muted mt-1 font-medium">Status evaluasi bursa &amp; metrik eksekusi harian</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 shadow-sm shrink-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRunning ? 'bg-amber-400 animate-pulse' : 'bg-accent shadow-[0_0_8px_rgba(0,255,85,0.8)]'}`} />
          <span className={`text-[11px] font-mono font-extrabold ${isRunning ? 'text-amber-400' : 'text-accent'}`}>
            {isRunning ? 'MENGEVALUASI...' : 'AKTIF · 16:30 WIB'}
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
