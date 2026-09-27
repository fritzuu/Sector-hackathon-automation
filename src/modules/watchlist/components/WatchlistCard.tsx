import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, WifiOff } from 'lucide-react';
import { liveMarketService, RealTickerMetrics } from '../../../services/liveMarketService';
import { LiveIdxCompany } from '../../../services/sectorsApi';

interface WatchlistCardProps {
  ticker: string;
  companyInfo: LiveIdxCompany | null;
  onRemove: () => void;
  onClick: () => void;
}

const fmt = (n: number) => n.toLocaleString('id-ID');
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export const WatchlistCard: React.FC<WatchlistCardProps> = ({ ticker, companyInfo, onRemove, onClick }) => {
  const [metrics, setMetrics] = useState<RealTickerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(false);
    liveMarketService.fetchTickerMetrics(ticker)
      .then(m => { if (alive) { setMetrics(m); setLoading(false); } })
      .catch(() => { if (alive) { setError(true); setLoading(false); } });
    return () => { alive = false; };
  }, [ticker]);

  const isAnom = metrics ? (metrics.isVolumeAnomaly || metrics.isSpreadAnomaly) : false;
  const isUp = (metrics?.changePercent ?? 0) >= 0;

  const displayName = companyInfo?.name ?? metrics?.name ?? ticker;
  const displaySector = companyInfo?.sector ?? metrics?.sector ?? 'Emiten IDX';
  const displayMcap = companyInfo?.marketCapTrillion;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl cursor-pointer select-none transition-all duration-300 p-4 pr-8 border hover:-translate-y-[2px] ${
        isAnom 
          ? 'bg-amber-900/10 border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.1)] hover:border-amber-500/50 hover:shadow-[0_4px_20px_rgba(245,158,11,0.2)]'
          : 'bg-secondary/50 border-border shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-primary hover:shadow-[0_4px_20px_rgba(168,85,247,0.15)]'
      }`}
    >
      {/* Remove button */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        title={`Hapus ${ticker}`}
        className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Top row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-accent border border-accent text-bg shadow-sm shadow-accent/20">
          {ticker}
        </span>
        {isAnom && (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" />
            ANOM
          </span>
        )}
        {displayMcap != null && displayMcap > 0 && (
          <span className="ml-auto text-[10px] font-mono text-text-muted">
            Rp {displayMcap} T
          </span>
        )}
      </div>

      {/* Name + sector */}
      <div className="text-xs font-bold text-text-main truncate mb-1 group-hover:text-primary transition-colors">{displayName}</div>
      <div className="text-[10px] truncate mb-4 text-text-muted">
        {displaySector}
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        {loading ? (
          <div className="flex items-center gap-2 w-full">
            <div className="h-3 w-20 rounded animate-pulse bg-white/10" />
            <div className="h-3 w-12 rounded animate-pulse bg-white/5 ml-auto" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted/60">
            <WifiOff className="w-3 h-3" />
            Harga tidak tersedia
          </div>
        ) : metrics ? (
          <>
            <span className="text-sm font-black font-mono text-text-main">Rp {fmt(metrics.lastPrice)}</span>
            <div className="flex items-center gap-1.5">
              {isUp ? <TrendingUp className="w-3 h-3 text-accent" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
              <span className={`text-xs font-black font-mono ${isUp ? 'text-accent' : 'text-rose-500'}`}>
                {pct(metrics.changePercent)}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
