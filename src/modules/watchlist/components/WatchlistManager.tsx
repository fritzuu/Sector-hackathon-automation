/**
 * WatchlistManager — Orchestrator.
 * Live company data fetched ONCE from Sectors API and passed down to children.
 * No hardcoded stock lists anywhere.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  X, ExternalLink, TrendingUp, TrendingDown, AlertTriangle, Activity, RefreshCw,
} from 'lucide-react';
import { liveMarketService, RealTickerMetrics, MarketDataUnavailableError } from '../../../services/liveMarketService.js';
import { sectorsApi, LiveIdxCompany } from '../../../services/sectorsApi.js';
import { SectorPresetsGrid } from './SectorPresetsGrid.js';
import { WatchlistSearchPanel } from './WatchlistSearchPanel.js';

interface WatchlistManagerProps {
  watchlist: string[];
  onAddTicker: (ticker: string) => void;
  onRemoveTicker: (ticker: string) => void;
  onAddPreset: (tickers: string[]) => void;
  isTelegramLinked: boolean;
  onOpenTelegramModal: () => void;
  onSendTelegramSummary: () => void;
}

// ── HELPERS ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('id-ID');
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const vol = (n: number) => `${(n / 1_000_000).toFixed(1)}M`;

// ── DETAIL MODAL ─────────────────────────────────────────────────────────────

interface StockDetailModalProps {
  symbol: string;
  companyInfo: LiveIdxCompany | null; // null = live not loaded yet
  metrics: RealTickerMetrics | null;
  metricsLoading: boolean;
  metricsError: string;
  onClose: () => void;
  onRemove: () => void;
}

const StockDetailModal: React.FC<StockDetailModalProps> = ({
  symbol, companyInfo, metrics, metricsLoading, metricsError, onClose, onRemove,
}) => {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isAnom = metrics ? (metrics.isVolumeAnomaly || metrics.isSpreadAnomaly) : false;

  // Derive display name/sector from live data only
  const displayName   = companyInfo?.name   ?? metrics?.name   ?? symbol;
  const displaySector = companyInfo?.sector  ?? metrics?.sector ?? 'Emiten Terdaftar IDX';
  const displaySub    = companyInfo?.subSector ?? '';
  const displayMcap   = companyInfo ? `Rp ${companyInfo.marketCapTrillion} T` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,0,12,0.88)', backdropFilter: 'blur(18px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[hsl(301,60%,25%)] bg-[hsl(301,100%,7%)] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'hsl(288, 100%, 70%)',
          opacity: 0.9,
        }} />

        {/* Header */}
        <div className={`px-5 py-4 border-b border-[hsl(301,60%,25%)] flex items-start justify-between gap-3 ${isAnom ? 'bg-amber-950/20' : 'bg-secondary/30'}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-[hsl(141,100%,50%)] bg-[hsl(141,100%,50%)]/15 px-2.5 py-1 rounded-lg border border-[hsl(141,100%,50%)]/30">
                {symbol}
              </span>
              {metrics && (
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${
                  isAnom
                    ? 'bg-amber-950/40 text-amber-400 border-amber-700/50'
                    : 'bg-[hsl(141,100%,50%)]/15 text-[hsl(141,100%,50%)] border-[hsl(141,100%,50%)]/30'
                }`}>
                  {isAnom ? 'ANOMALI' : 'NORMAL'}
                </span>
              )}
            </div>
            <div className="text-base font-extrabold text-white mt-1.5 truncate">{displayName}</div>
            <div className="text-xs text-text/60 mt-0.5">
              {displaySector}{displaySub ? ` · ${displaySub}` : ''}
            </div>
          </div>
          <button onClick={onClose} className="text-text/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {metricsLoading ? (
            <div className="space-y-2">
              {[100,75,60].map((w,i) => (
                <div key={i} className="h-3 rounded-md animate-pulse bg-secondary/50" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : metricsError ? (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-400 font-mono">
              {metricsError}
            </div>
          ) : metrics ? (
            <>
              {/* Price row */}
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono text-white">Rp {fmt(metrics.lastPrice)}</div>
                  <div className={`text-sm font-semibold font-mono flex items-center gap-1 mt-0.5 ${metrics.changePercent >= 0 ? 'text-[hsl(141,100%,50%)]' : 'text-rose-400'}`}>
                    {metrics.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {pct(metrics.changePercent)} hari ini
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text/50 font-mono">IHSG</div>
                  <div className={`text-sm font-bold font-mono ${metrics.ihsgChangePercent >= 0 ? 'text-text/80' : 'text-text/60'}`}>
                    {pct(metrics.ihsgChangePercent)}
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Volume Hari Ini', value: `${vol(metrics.todayVolume)} lot`, hot: metrics.isVolumeAnomaly },
                  { label: 'Median 20 Sesi',  value: `${vol(metrics.medianVolume20d)} lot`, hot: false },
                  { label: 'Rasio Volume',    value: `${metrics.volumeMultiplier}×`, hot: metrics.isVolumeAnomaly },
                  { label: 'Spread vs IHSG',  value: `${metrics.spreadVsIhsg.toFixed(2)}%`, hot: metrics.isSpreadAnomaly },
                  { label: 'Market Cap',      value: displayMcap ?? '—', hot: false },
                  { label: 'Rank IDX',        value: companyInfo ? `#${companyInfo.rank}` : '—', hot: false },
                ].map(m => (
                  <div key={m.label} className="bg-[hsl(279,100%,3%)] border border-[hsl(301,60%,25%)] rounded-xl p-2.5">
                    <div className="text-[10px] text-text/50 uppercase tracking-wider mb-1 font-semibold">{m.label}</div>
                    <div className={`text-xs font-bold font-mono ${m.hot ? 'text-amber-400' : 'text-white'}`}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Anomaly flag */}
              {isAnom && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/25 border border-amber-700/40">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-300 leading-relaxed">
                    {metrics.isVolumeAnomaly && <div>Volume {metrics.volumeMultiplier}× median — melampaui ambang 2.0×</div>}
                    {metrics.isSpreadAnomaly && <div>Spread vs IHSG {metrics.spreadVsIhsg.toFixed(2)}% — melampaui ambang 2.0%</div>}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-text/40 font-mono text-right">
                Yahoo Finance · Diperbarui {metrics.lastUpdated} · Cache 5 mnt
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[hsl(301,60%,25%)] bg-secondary/20 flex items-center justify-between gap-3 flex-wrap">
          <a
            href={`https://sectors.app/idx/${symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-[hsl(288,100%,70%)] hover:underline transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Lihat di Sectors.app/idx/{symbol}
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onRemove(); onClose(); }}
              className="px-3.5 py-1.5 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all cursor-pointer"
            >
              Hapus dari Watchlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── ORCHESTRATOR ──────────────────────────────────────────────────────────────

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  watchlist, onAddTicker, onRemoveTicker, onAddPreset,
  isTelegramLinked, onOpenTelegramModal, onSendTelegramSummary,
}) => {
  // ── Live company list — single source of truth, no hardcode ───────────────
  const [liveCompanies,    setLiveCompanies]    = useState<LiveIdxCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError,   setCompaniesError]   = useState(false);

  const loadCompanies = useCallback(async (force = false) => {
    setCompaniesLoading(true);
    setCompaniesError(false);
    try {
      if (force) sectorsApi.invalidateAll(); // bust cache on manual retry
      const companies = await sectorsApi.fetchTopCompanies();
      if (companies.length > 0) {
        setLiveCompanies(companies);
      } else {
        setCompaniesError(true);
      }
    } catch {
      setCompaniesError(true);
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  // Kick off on mount
  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalSymbol,         setModalSymbol]         = useState<string | null>(null);
  const [modalMetrics,        setModalMetrics]        = useState<RealTickerMetrics | null>(null);
  const [modalMetricsLoading, setModalMetricsLoading] = useState(false);
  const [modalMetricsError,   setModalMetricsError]   = useState('');

  const getLiveCompanyInfo = useCallback((symbol: string): LiveIdxCompany | null =>
    liveCompanies.find(c => c.symbol === symbol) ?? null,
  [liveCompanies]);

  const openModal = useCallback(async (sym: string) => {
    setModalSymbol(sym);
    setModalMetrics(null);
    setModalMetricsError('');
    setModalMetricsLoading(true);
    try {
      const m = await liveMarketService.fetchTickerMetrics(sym);
      setModalMetrics(m);
    } catch (err) {
      setModalMetricsError(
        err instanceof MarketDataUnavailableError
          ? err.message
          : `Gagal memuat data ${sym} dari Yahoo Finance.`,
      );
    } finally {
      setModalMetricsLoading(false);
    }
  }, []);

  return (
    <div className="space-y-4 font-sans">
      {/* Search + Watchlist Cards */}
      <WatchlistSearchPanel
        watchlist={watchlist}
        isTelegramLinked={isTelegramLinked}
        onAddTicker={onAddTicker}
        onRemoveTicker={onRemoveTicker}
        onOpenTelegramModal={onOpenTelegramModal}
        onSendTelegramSummary={onSendTelegramSummary}
        onOpenStockModal={openModal}
        liveCompanies={liveCompanies}
        companiesLoading={companiesLoading}
        companiesError={companiesError}
        onRetryCompanies={() => loadCompanies(true)}
      />

      {/* Detail Modal */}
      {modalSymbol && (
        <StockDetailModal
          symbol={modalSymbol}
          companyInfo={getLiveCompanyInfo(modalSymbol)}
          metrics={modalMetrics}
          metricsLoading={modalMetricsLoading}
          metricsError={modalMetricsError}
          onClose={() => setModalSymbol(null)}
          onRemove={() => onRemoveTicker(modalSymbol)}
        />
      )}
    </div>
  );
};
