import React from "react";
import { Eye, Layers, Clock, Zap, ArrowRight, Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useWorkflowStore } from "../../cases/stores/workflow.store";
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
        <div className={`${value.length > 8 ? 'text-xl' : 'text-3xl sm:text-4xl'} break-words font-bold font-mono tracking-tight text-text-main`}>
          {value}
        </div>
        <p className="text-sm text-text-muted mt-2 leading-relaxed">
          {sub}
        </p>
      </div>
    </div>
    
    {/* Bottom Action Link */}
    <Link
      to={linkTo}
      className="flex items-center justify-between pt-4 mt-4 border-t border-border/60 text-sm font-semibold text-primary/90 hover:text-primary transition-colors group-hover:translate-x-0.5"
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
  const ihsgSnapshot = useWorkflowStore(s => s.marketSnapshots.get('IHSG'));
  
  const ihsgPrice = ihsgSnapshot?.lastPrice 
    ? `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(ihsgSnapshot.lastPrice)}` 
    : "---";
    
  const ihsgChange = ihsgSnapshot?.changePercent !== undefined
    ? `${ihsgSnapshot.changePercent >= 0 ? '+' : ''}${ihsgSnapshot.changePercent.toFixed(2)}%`
    : "";

  const cards: KpiCardProps[] = [
    {
      label: "Indeks Harga Saham Gabungan",
      value: ihsgPrice,
      sub: ihsgChange ? `Pergerakan terakhir: ${ihsgChange}` : "Menunggu data bursa...",
      icon: <Activity className="w-4.5 h-4.5" />,
      iconBgClass: "bg-accent/10 border border-accent/20",
      iconColorClass: "text-accent",
      linkTo: "/dashboard/watchlist",
      linkText: "Bandingkan dengan Watchlist",
    },
    {
      label: "Kasus Aktif Terbuka",
      value: `${activeCasesCount}`,
      sub: "Kasus pemantauan yang masih terbuka di watchlist",
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
          ? new Date(lastRunTime).toLocaleTimeString("id-ID", { timeZone: 'Asia/Jakarta', hour: "2-digit", minute: "2-digit" })
          : "N/A",
      sub: isRunning 
        ? "Sistem sedang memproses data bursa" 
        : lastRunTime ? `${new Date(lastRunTime).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short' })} WIB · ${totalRunsCount} run dalam riwayat` : 'Belum ada riwayat pemeriksaan',
      icon: isRunning ? <Zap className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />,
      iconBgClass: isRunning 
        ? "bg-amber-500/10 border border-amber-500/20" 
        : "bg-primary/10 border border-primary/20",
      iconColorClass: isRunning ? "text-amber-400" : "text-primary",
      pulse: isRunning,
      linkTo: "/dashboard/automation",
      linkText: "Pantau Otomatisasi",
    },
  ];

  return (
    <div id="tour-automation-kpis" className="space-y-4 font-sans">
      <div className="flex items-start sm:items-center justify-between px-1 flex-wrap gap-3 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            Ringkasan Otomatisasi
          </h2>
          <p className="text-sm text-text-muted mt-1 font-medium">Watchlist, kasus yang perlu diperhatikan, dan riwayat pemeriksaan.</p>
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
