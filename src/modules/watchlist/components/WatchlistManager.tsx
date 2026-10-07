import { useCompanies } from "../../../data/useCompanies";
/**
 * WatchlistManager — Orchestrator.
 * Company data is cached from Supabase and passed down to children.
 * No hardcoded stock lists anywhere.
 */

import React, { useState, useCallback } from "react";
import {
  X,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  RefreshCw,
} from "lucide-react";
import { RealTickerMetrics } from "../../../types/engine.js";
import { LiveIdxCompany } from "../../../services/sectorsApi.js";
import { useWorkflowStore } from "../../cases/stores/workflow.store.js";
import { useWatchlistStore } from "../stores/watchlist.store.js";
import { SectorPresetsGrid } from "./SectorPresetsGrid.js";
import { WatchlistSearchPanel } from "./WatchlistSearchPanel.js";
import { toWatchlistMarketData } from "../watchlist.marketData.js";
import { WatchlistLimitModal } from "./WatchlistLimitModal.js";

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

const fmt = (n: number) => n.toLocaleString("id-ID");
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
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
  symbol,
  companyInfo,
  metrics,
  metricsLoading,
  metricsError,
  onClose,
  onRemove,
}) => {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isAnom = metrics
    ? metrics.isVolumeAnomaly || metrics.isSpreadAnomaly
    : false;

  // Derive display name/sector from live data only
  const displayName = companyInfo?.name ?? metrics?.name ?? symbol;
  const displaySector =
    companyInfo?.sector ?? metrics?.sector ?? "Emiten Terdaftar IDX";
  const displaySub = companyInfo?.subSector ?? "";
  const displayMcap = companyInfo
    ? `Rp ${companyInfo.marketCapTrillion} T`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-secondary/50"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-secondary shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: "var(--color-secondary)",
            opacity: 0.9,
          }}
        />

        {/* Header */}
        <div
          className={`px-5 py-4 border-b border-border flex items-start justify-between gap-3 ${isAnom ? "bg-amber-950/20" : "bg-secondary/30"}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-bg bg-accent px-2.5 py-1 rounded-lg border border-accent">
                {symbol}
              </span>
              {metrics && (
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${
                    isAnom
                      ? "bg-amber-950/40 text-amber-400 border-amber-700/50"
                      : "bg-accent text-bg border-accent"
                  }`}
                >
                  {isAnom ? "ANOMALI" : "NORMAL"}
                </span>
              )}
            </div>
            <div className="text-base font-extrabold text-white mt-1.5 truncate">
              {displayName}
            </div>
            <div className="text-xs text-text/60 mt-0.5">
              {displaySector}
              {displaySub ? ` · ${displaySub}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {metricsLoading ? (
            <div className="space-y-2">
              {[100, 75, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-3 rounded-md animate-pulse bg-secondary/50"
                  style={{ width: `${w}%` }}
                />
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
                  <div className="text-2xl font-bold font-mono text-white">
                    Rp {fmt(metrics.lastPrice)}
                  </div>
                  <div
                    className={`text-sm font-semibold font-mono flex items-center gap-1 mt-0.5 ${metrics.changePercent >= 0 ? "text-accent" : "text-rose-400"}`}
                  >
                    {metrics.changePercent >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {pct(metrics.changePercent)} hari ini
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text/50 font-mono">IHSG</div>
                  <div
                    className={`text-sm font-bold font-mono ${metrics.ihsgChangePercent >= 0 ? "text-text/80" : "text-text/60"}`}
                  >
                    {pct(metrics.ihsgChangePercent)}
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  {
                    label: "Volume Hari Ini",
                    value: `${vol(metrics.todayVolume)} lot`,
                    hot: metrics.isVolumeAnomaly,
                  },
                  {
                    label: "Median 20 Sesi",
                    value: `${vol(metrics.medianVolume20d)} lot`,
                    hot: false,
                  },
                  {
                    label: "Rasio Volume",
                    value: `${metrics.volumeMultiplier}×`,
                    hot: metrics.isVolumeAnomaly,
                  },
                  {
                    label: "Spread vs IHSG",
                    value: `${metrics.spreadVsIhsg.toFixed(2)}%`,
                    hot: metrics.isSpreadAnomaly,
                  },
                  {
                    label: "Market Cap",
                    value: displayMcap ?? "N/A",
                    hot: false,
                  },
                  {
                    label: "Rank IDX",
                    value: companyInfo ? `#${companyInfo.rank}` : "N/A",
                    hot: false,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="bg-bg border border-border rounded-xl p-2.5"
                  >
                    <div className="text-[10px] text-text/50 uppercase tracking-wider mb-1 font-semibold">
                      {m.label}
                    </div>
                    <div
                      className={`text-xs font-bold font-mono ${m.hot ? "text-amber-400" : "text-white"}`}
                    >
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Anomaly flag */}
              {isAnom && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/25 border border-amber-700/40">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-300 leading-relaxed">
                    {metrics.isVolumeAnomaly && (
                      <div>
                        Volume {metrics.volumeMultiplier}× median: melampaui
                        ambang 2.0×
                      </div>
                    )}
                    {metrics.isSpreadAnomaly && (
                      <div>
                        Spread vs IHSG {metrics.spreadVsIhsg.toFixed(2)}%
                        melampaui ambang 2.0%
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-text/40 font-mono text-right">
                Sectors API · Diperbarui {metrics.lastUpdated} · Cache 5 mnt
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border bg-secondary/20 flex items-center justify-between gap-3 flex-wrap">
          <a
            href={`https://sectors.app/idx/${symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Lihat di Sectors.app/idx/{symbol}
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRemove();
                onClose();
              }}
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
  watchlist,
  onAddTicker,
  onRemoveTicker,
  onAddPreset,
  isTelegramLinked,
  onOpenTelegramModal,
  onSendTelegramSummary,
}) => {
  // ── Live company list — single source of truth, no hardcode ───────────────
  const { data: liveCompanies = [], isPending: companiesLoading, isError: companiesError, refetch } = useCompanies();
  const marketSnapshots = useWorkflowStore((state) => state.marketSnapshots);
  const watchlistMarketData = new Map(
    watchlist.map((symbol) => [
      symbol,
      toWatchlistMarketData(marketSnapshots.get(symbol)),
    ] as const),
  );

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalSymbol, setModalSymbol] = useState<string | null>(null);
  const [modalMetrics, setModalMetrics] = useState<RealTickerMetrics | null>(
    null,
  );
  const [modalMetricsLoading, setModalMetricsLoading] = useState(false);
  const [modalMetricsError, setModalMetricsError] = useState("");

  const getLiveCompanyInfo = useCallback(
    (symbol: string): LiveIdxCompany | null =>
      liveCompanies.find((c) => c.symbol === symbol) ?? null,
    [liveCompanies],
  );

  const openModal = useCallback(async (sym: string) => {
    setModalSymbol(sym);
    setModalMetrics(null);
    setModalMetricsError("");
    setModalMetricsLoading(true);
    try {
      const snap = useWorkflowStore.getState().marketSnapshots.get(sym);
      if (snap) {
        setModalMetrics({
          ...snap,
          volumeMultiplier: snap.volumeMultiplier ?? (snap.medianVolume20d > 0 ? Number((snap.todayVolume / snap.medianVolume20d).toFixed(2)) : 0),
          isVolumeAnomaly: snap.isVolumeAnomaly ?? (snap.todayVolume >= (snap.medianVolume20d * 2)),
          isSpreadAnomaly: snap.isSpreadAnomaly ?? (Math.abs((snap.changePercent||0) - (snap.ihsgChangePercent||0)) >= 2.0),
          spreadVsIhsg: snap.spreadVsIhsg ?? Math.abs((snap.changePercent||0) - (snap.ihsgChangePercent||0))
        });
      } else {
        throw new Error(`Snapshot ${sym} belum tersedia di Supabase. Data akan muncul setelah workflow berjalan.`);
      }
    } catch (err) {
      setModalMetricsError(
        err instanceof Error
          ? err.message
          : `Gagal memuat data ${sym} dari Sectors API.`,
      );
    } finally {
      setModalMetricsLoading(false);
    }
  }, []);

  const { mutationCount, isLimitModalOpen, setLimitModalOpen } = useWatchlistStore();

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
        marketDataByTicker={watchlistMarketData}
        companiesLoading={companiesLoading}
        companiesError={companiesError}
        onRetryCompanies={() => { void refetch(); }}
        mutationCount={mutationCount}
        onOpenLimitModal={() => setLimitModalOpen(true)}
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

      {/* Limit & Violation Warning Modal */}
      <WatchlistLimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        mutationCount={mutationCount}
        currentWatchlist={watchlist}
      />
    </div>
  );
};
