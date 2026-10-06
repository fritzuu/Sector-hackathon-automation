import React from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, WifiOff } from 'lucide-react';
import { LiveIdxCompany } from '../../../services/sectorsApi';
import { WatchlistMarketData } from '../watchlist.marketData.js';

interface WatchlistCardProps {
  ticker: string;
  companyInfo: LiveIdxCompany | null;
  marketData: WatchlistMarketData | null;
  onRemove: () => void;
  onClick: () => void;
}

const fmt = (n?: number)  => (n ?? 0).toLocaleString('id-ID');
const pct = (n?: number) => `${(n || 0) >= 0 ? '+' : ''}${(n || 0).toFixed(2)}%`;
const compactVolume = (n?: number) => `${((n ?? 0) / 1_000_000).toFixed(1)}M`;

export const WatchlistCard: React.FC<WatchlistCardProps> = ({ ticker, companyInfo, marketData, onRemove, onClick }) => {
  const isVolumeAnomaly = (marketData?.volumeMultiplier ?? 0) >= 2;
  const isUp = (marketData?.changePercent ?? 0) >= 0;

  const displayName = companyInfo?.name ?? ticker;
  const displaySector = companyInfo?.sector ?? 'Emiten IDX';
  const displayMcap = companyInfo?.marketCapTrillion;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl cursor-pointer select-none transition-all duration-300 p-4 pr-8 border hover:-translate-y-[2px] ${
        isVolumeAnomaly 
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
        {isVolumeAnomaly && (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" />
            ANOM
          </span>
        )}
        {displayMcap != null && displayMcap > 0 && (
          <span className="ml-auto text-right">
            <span className="block text-[9px] font-semibold text-text-muted/70">Market cap</span>
            <span className="block text-[10px] font-mono font-semibold text-text-muted">
              Rp {displayMcap.toLocaleString('id-ID')} T
            </span>
          </span>
        )}
      </div>

      {/* Name + sector */}
      <div className="text-xs font-bold text-text-main truncate mb-1 group-hover:text-primary transition-colors">{displayName}</div>
      <div className="text-[10px] truncate mb-4 text-text-muted">
        {displaySector}
      </div>

      {/* Latest price and daily volume */}
      <div className="flex items-end justify-between gap-3 border-t border-white/5 pt-3">
        {marketData ? (
          <>
            <div className="min-w-0">
              <span className="mb-1 block text-[9px] font-semibold text-text-muted/70">Harga terakhir</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black font-mono text-text-main">Rp {fmt(marketData.lastPrice)}</span>
                {marketData.changePercent !== null && (
                  <span className={`flex items-center gap-0.5 text-[10px] font-black font-mono ${isUp ? 'text-accent' : 'text-rose-500'}`}>
                    {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {pct(marketData.changePercent)}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="mb-1 block text-[9px] font-semibold text-text-muted/70">Volume</span>
              {marketData.volumeMultiplier !== null ? (
                <>
                  <span className={`block text-[10px] font-bold font-mono ${isVolumeAnomaly ? 'text-rose-400' : 'text-text-main'}`}>
                    {marketData.volumeMultiplier.toFixed(1)}× median
                  </span>
                  <span className="block text-[9px] font-mono text-text-muted">
                    {compactVolume(marketData.todayVolume)} hari ini
                  </span>
                </>
              ) : (
                <>
                  <span className="block text-[10px] font-bold font-mono text-text-main">
                    {compactVolume(marketData.todayVolume)} hari ini
                  </span>
                  <span className="block text-[9px] font-mono text-text-muted">Riwayat 20 sesi belum cukup</span>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[10px] font-mono text-text-muted/60">
            <WifiOff className="h-3 w-3 shrink-0" />
            Snapshot Supabase belum tersedia
          </div>
        )}
      </div>
    </div>
  );
};
