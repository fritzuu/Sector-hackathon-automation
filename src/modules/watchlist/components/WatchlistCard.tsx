import { StockLogo } from '../../../shared/components/StockLogo';
import React from 'react';
import { X, ArrowRight, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { LiveIdxCompany } from '../../../services/sectorsApi';
import { WatchlistMarketData } from '../watchlist.marketData.js';

interface WatchlistCardProps {
  ticker: string;
  companyInfo: LiveIdxCompany | null;
  marketData: WatchlistMarketData | null;
  onRemove: () => void;
  onClick: () => void;
}

const validNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const fmt = (value: number) => value.toLocaleString('id-ID', { maximumFractionDigits: 2 });

export const WatchlistCard: React.FC<WatchlistCardProps> = ({ ticker, companyInfo, marketData, onRemove, onClick }) => {
  const price = validNumber(marketData?.lastPrice) && marketData.lastPrice > 0 ? marketData.lastPrice : null;
  const change = validNumber(marketData?.changePercent) ? marketData.changePercent : null;
  const volume = validNumber(marketData?.todayVolume) && marketData.todayVolume >= 0 ? marketData.todayVolume : null;
  const multiplier = validNumber(marketData?.volumeMultiplier) ? marketData.volumeMultiplier : null;
  const isVolumeAnomaly = multiplier !== null && multiplier >= 2;
  const mcap = companyInfo?.marketCapTrillion;
  const updatedAt = marketData?.asOfDate ? new Date(marketData.asOfDate) : null;
  const timeLabel = updatedAt && Number.isFinite(updatedAt.getTime())
    ? `Diperbarui ${updatedAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB`
    : 'Waktu snapshot belum tersedia';

  return (
    <article className={`flex h-full min-w-0 flex-col rounded-xl border bg-bg/40 p-4 sm:p-5 ${isVolumeAnomaly ? 'border-amber-500/40' : 'border-border'}`}>
      <header className="flex items-start justify-between gap-2">
        <button type="button" onClick={onClick} aria-label={`Lihat detail ${ticker}`} className="flex min-w-0 items-start gap-3 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <StockLogo ticker={ticker} size="large" />
          <span className="min-w-0">
            <span className="block font-mono text-lg font-bold text-text-main">{ticker}</span>
            <span className="mt-0.5 block text-sm leading-snug text-text-muted">{companyInfo?.name ?? 'Nama perusahaan belum tersedia'}</span>
          </span>
        </button>
        <button type="button" onClick={onRemove} aria-label={`Hapus ${ticker} dari watchlist`} title={`Hapus ${ticker}`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-rose-400/10 hover:text-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="my-5">
        <p className="mb-1 text-xs font-semibold text-text-muted">Harga penutupan terakhir</p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-2xl font-bold tabular-nums text-text-main sm:text-3xl">{price !== null ? `Rp ${fmt(price)}` : 'Belum tersedia'}</p>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold tabular-nums ${change === null || change === 0 ? 'bg-secondary text-text-muted' : change > 0 ? 'bg-accent/10 text-accent' : 'bg-rose-400/10 text-rose-400'}`}>
            {change !== null && change !== 0 && (change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />)}
            {change === null ? 'Perubahan belum tersedia' : `${change > 0 ? '+' : ''}${change.toFixed(2)}%`}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 border-t border-border pt-4">
        <div><dt className="text-xs text-text-muted">Volume sesi terakhir</dt><dd className="mt-1 whitespace-nowrap font-mono text-base font-semibold text-text-main">{volume !== null ? fmt(volume) : 'Belum tersedia'}</dd><dd className="text-xs text-text-muted">lembar saham</dd></div>
        <div><dt className="text-xs text-text-muted">Kapitalisasi pasar</dt><dd className="mt-1 font-mono text-base font-semibold text-text-main">{validNumber(mcap) && mcap > 0 ? `Rp ${fmt(mcap)} T` : 'Belum tersedia'}</dd><dd className="text-xs text-text-muted">Profil emiten Sectors</dd></div>
      </dl>

      <div className="mt-4 space-y-1 border-t border-border pt-3">
        {multiplier !== null ? (
          <p className={`flex items-center gap-1.5 text-xs leading-relaxed ${isVolumeAnomaly ? 'text-amber-300' : 'text-text-muted'}`}>
            {isVolumeAnomaly && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
            Volume {multiplier.toFixed(2)}× median 20 sesi{isVolumeAnomaly ? ' · Di atas ambang 2×' : ''}
          </p>
        ) : <p className="text-xs text-text-muted">Perbandingan median volume belum tersedia.</p>}
        <p className="text-xs leading-relaxed text-text-muted">{companyInfo?.subSector || companyInfo?.sector || 'Sektor belum tersedia'}</p>
        <p className="text-xs leading-relaxed text-text-muted">{timeLabel}</p>
      </div>
      <button type="button" onClick={onClick} className="mt-auto flex min-h-10 items-center justify-between gap-2 pt-4 text-sm font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label={`Buka rincian ${ticker}`}>
        Lihat detail saham <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  );
};
