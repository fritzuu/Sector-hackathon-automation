/**
 * WatchlistSearchPanel — Search bar + watchlist cards grid.
 * Live data only — no hardcoded company list.
 * Company list is passed in from WatchlistManager (fetched from Sectors API).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, X, TrendingUp, TrendingDown, AlertTriangle,
  Send, Wifi, WifiOff, RefreshCw, Globe, ServerCrash,
} from 'lucide-react';
import { liveMarketService, RealTickerMetrics, MarketDataUnavailableError } from '../../../services/liveMarketService.js';
import { LiveIdxCompany } from '../../../services/sectorsApi.js';

interface WatchlistSearchPanelProps {
  watchlist: string[];
  isTelegramLinked: boolean;
  onAddTicker: (ticker: string) => void;
  onRemoveTicker: (ticker: string) => void;
  onOpenTelegramModal: () => void;
  onSendTelegramSummary: () => void;
  onOpenStockModal: (symbol: string) => void;
  // Lifted from WatchlistManager — single source of truth
  liveCompanies: LiveIdxCompany[];
  companiesLoading: boolean;
  companiesError: boolean;
  onRetryCompanies: () => void;
}

const fmt = (n: number) => n.toLocaleString('id-ID');
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

// ── WATCHLIST CARD ─────────────────────────────────────────────────────────────

const WatchlistCard: React.FC<{
  ticker: string;
  companyInfo: LiveIdxCompany | null;
  onRemove: () => void;
  onClick: () => void;
}> = ({ ticker, companyInfo, onRemove, onClick }) => {
  const [metrics, setMetrics] = useState<RealTickerMetrics | null>(null);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(false);
    liveMarketService.fetchTickerMetrics(ticker)
      .then(m  => { if (alive) { setMetrics(m);  setLoading(false); } })
      .catch(() => { if (alive) { setError(true); setLoading(false); } });
    return () => { alive = false; };
  }, [ticker]);

  const isAnom = metrics ? (metrics.isVolumeAnomaly || metrics.isSpreadAnomaly) : false;
  const isUp   = (metrics?.changePercent ?? 0) >= 0;

  // Name/sector from live Sectors API if available, else from Yahoo Finance meta
  const displayName   = companyInfo?.name   ?? metrics?.name   ?? ticker;
  const displaySector = companyInfo?.sector  ?? metrics?.sector ?? 'Emiten IDX';
  const displayMcap   = companyInfo?.marketCapTrillion;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl cursor-pointer select-none transition-all duration-200"
      style={{
        background: isAnom
          ? 'linear-gradient(135deg, rgba(180,83,9,0.08) 0%, rgba(13,20,36,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(20,184,166,0.04) 0%, rgba(13,20,36,0.95) 100%)',
        border: isAnom
          ? '1px solid rgba(217,119,6,0.3)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = isAnom ? 'rgba(217,119,6,0.5)' : 'rgba(20,184,166,0.25)';
        el.style.transform = 'translateY(-1px)';
        el.style.boxShadow = isAnom ? '0 4px 20px rgba(180,83,9,0.2)' : '0 4px 20px rgba(20,184,166,0.1)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = isAnom ? 'rgba(217,119,6,0.3)' : 'rgba(255,255,255,0.06)';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
      }}
    >
      {/* Remove button */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        title={`Hapus ${ticker}`}
        className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-md p-1"
        style={{ background: 'rgba(239,68,68,0.1)', color: 'rgba(252,165,165,0.7)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(252,165,165,0.7)'; }}
      >
        <X className="w-3 h-3" />
      </button>

      <div className="p-4 pr-8">
        {/* Top row */}
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="font-mono font-bold text-xs px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)', color: '#5eead4' }}
          >
            {ticker}
          </span>
          {isAnom && (
            <span
              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
              style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)', color: '#fbbf24' }}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              ANOM
            </span>
          )}
          {displayMcap != null && displayMcap > 0 && (
            <span className="ml-auto text-[10px] font-mono" style={{ color: 'rgba(148,163,184,0.5)' }}>
              Rp {displayMcap} T
            </span>
          )}
        </div>

        {/* Name + sector */}
        <div className="text-xs font-semibold text-white truncate mb-0.5">{displayName}</div>
        <div className="text-[10px] truncate mb-3" style={{ color: 'rgba(148,163,184,0.5)' }}>
          {displaySector}
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-20 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="h-2.5 w-12 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ) : error ? (
            <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: 'rgba(148,163,184,0.4)' }}>
              <WifiOff className="w-3 h-3" />
              Harga tidak tersedia
            </div>
          ) : metrics ? (
            <>
              <span className="text-sm font-bold font-mono text-white">Rp {fmt(metrics.lastPrice)}</span>
              <div className="flex items-center gap-1">
                {isUp ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                <span className="text-xs font-bold font-mono" style={{ color: isUp ? '#34d399' : '#f87171' }}>
                  {pct(metrics.changePercent)}
                </span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ── MAIN PANEL ────────────────────────────────────────────────────────────────

export const WatchlistSearchPanel: React.FC<WatchlistSearchPanelProps> = ({
  watchlist, isTelegramLinked,
  onAddTicker, onRemoveTicker,
  onOpenTelegramModal, onSendTelegramSummary,
  onOpenStockModal,
  liveCompanies, companiesLoading, companiesError, onRetryCompanies,
}) => {
  const [searchQuery,    setSearchQuery]    = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Search filtering ───────────────────────────────────────────────────────
  const filteredCompanies = liveCompanies.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.symbol.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q) ||
      (c.subSector && c.subSector.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (symbol: string) => {
    if (!watchlist.includes(symbol)) onAddTicker(symbol);
    setSearchQuery(''); setIsDropdownOpen(false);
  };

  const getLiveInfo = useCallback((symbol: string): LiveIdxCompany | null =>
    liveCompanies.find(c => c.symbol === symbol) ?? null,
  [liveCompanies]);

  // Search input placeholder
  const inputPlaceholder = companiesLoading
    ? 'Memuat daftar emiten IDX live...'
    : companiesError
      ? 'Data emiten tidak tersedia — coba lagi'
      : liveCompanies.length > 0
        ? `Cari dari ${liveCompanies.length} emiten IDX...`
        : 'Memuat emiten IDX...';

  return (
    <div
      className="rounded-xl overflow-hidden font-sans"
      style={{
        background: 'linear-gradient(135deg, hsl(301, 100%, 8%) 0%, hsl(279, 100%, 4%) 100%)',
        border: '1px solid hsl(301, 60%, 25%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              Watchlist Dipantau
              <span
                className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(20,184,166,0.12)', color: '#5eead4' }}
              >
                {watchlist.length}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <div className="text-[10px] font-mono" style={{ color: 'rgba(148,163,184,0.5)' }}>
              Harga: Yahoo Finance live · cache 5 mnt
            </div>
            {companiesLoading && (
              <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'rgba(20,184,166,0.6)' }}>
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Mengambil emiten IDX...
              </div>
            )}
            {!companiesLoading && !companiesError && liveCompanies.length > 0 && (
              <div
                className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(20,184,166,0.08)', color: 'rgba(20,184,166,0.7)', border: '1px solid rgba(20,184,166,0.15)' }}
              >
                <Globe className="w-2.5 h-2.5" />
                {liveCompanies.length} emiten IDX · Sectors API
              </div>
            )}
            {!companiesLoading && companiesError && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'rgba(239,68,68,0.7)' }}>
                  <ServerCrash className="w-2.5 h-2.5" />
                  Sectors API tidak tersedia
                </div>
                <button
                  onClick={onRetryCompanies}
                  className="flex items-center gap-1 text-[10px] font-mono transition-colors"
                  style={{ color: 'rgba(20,184,166,0.7)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5eead4'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(20,184,166,0.7)'; }}
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="p-4 space-y-4">
        {/* Search bar */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'rgba(148,163,184,0.4)' }}
            />
            <input
              type="text"
              id="watchlist-search"
              value={searchQuery}
              disabled={companiesError && liveCompanies.length === 0}
              onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  e.preventDefault();
                  handleSelect(searchQuery.trim().toUpperCase());
                }
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder={inputPlaceholder}
              className="w-full pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-500 rounded-lg focus:outline-none transition-all duration-150 disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'Inter, system-ui, sans-serif',
                cursor: companiesError && liveCompanies.length === 0 ? 'not-allowed' : 'text',
              }}
              onFocusCapture={e => {
                (e.target as HTMLInputElement).style.borderColor = 'rgba(20,184,166,0.4)';
                (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(20,184,166,0.08)';
              }}
              onBlur={e => {
                (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.target as HTMLInputElement).style.boxShadow = 'none';
              }}
            />
            {companiesLoading && (
              <RefreshCw
                className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin pointer-events-none"
                style={{ color: 'rgba(20,184,166,0.5)' }}
              />
            )}
          </div>

          {/* Autocomplete dropdown */}
          {isDropdownOpen && (
            <div
              className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-30"
              style={{
                background: 'rgba(10,15,29,0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}
            >
              {/* Dropdown header */}
              <div
                className="px-3.5 py-2 flex items-center justify-between text-[10px] font-mono bg-secondary/60 border-b border-primary/20 text-primary"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Globe className="w-3 h-3 text-accent" />
                  {searchQuery.trim() ? `${filteredCompanies.length} Hasil Pencarian` : 'Rekomendasi Top 3 Saham Pilihan'}
                </div>
                <span className="text-text/50">Tekan Enter untuk menambah</span>
              </div>

              {/* Direct Add custom ticker banner if query typed */}
              {searchQuery.trim().length > 0 && !watchlist.includes(searchQuery.trim().toUpperCase()) && (
                <div
                  onClick={() => handleSelect(searchQuery.trim().toUpperCase())}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer bg-secondary/80 hover:bg-secondary border-b border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                      {searchQuery.trim().toUpperCase()}
                    </span>
                    <span className="text-xs text-white">Tambah &amp; fetch data pasar real-time langsung</span>
                  </div>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded text-xs font-bold bg-primary text-background hover:opacity-90 transition-colors cursor-pointer"
                  >
                    + Tambah
                  </button>
                </div>
              )}

              {/* Results (Top 3 suggested when empty query, filtered when typed) */}
              {(searchQuery.trim() ? filteredCompanies : liveCompanies.slice(0, 3)).map(company => {
                const isAdded = watchlist.includes(company.symbol);
                return (
                  <div
                    key={company.symbol}
                    onClick={() => !isAdded && handleSelect(company.symbol)}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors duration-100 hover:bg-secondary/40 border-b border-border/40"
                    style={{
                      cursor: isAdded ? 'default' : 'pointer',
                      opacity: isAdded ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="font-mono font-bold text-xs px-2 py-0.5 rounded flex-shrink-0 bg-primary/15 border border-primary/30 text-primary"
                      >
                        {company.symbol}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{company.name}</div>
                        <div className="text-[10px] font-mono truncate text-text/50">
                          {company.sector}
                          {company.marketCapTrillion > 0 ? ` · Rp ${company.marketCapTrillion} T` : ''}
                          {company.rank > 0 ? ` · #${company.rank}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {company.lastPrice > 0 && (
                        <span className="text-xs font-mono font-semibold text-text/80 hidden sm:block">
                          Rp {company.lastPrice.toLocaleString('id-ID')}
                        </span>
                      )}
                      {isAdded ? (
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30"
                        >
                          Dipantau
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 border border-primary/40 text-primary hover:bg-primary hover:text-background transition-colors cursor-pointer"
                        >
                          + Tambah
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error dropdown — no fallback, just error state */}
          {isDropdownOpen && companiesError && liveCompanies.length === 0 && (
            <div
              className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-30"
              style={{
                background: 'rgba(10,15,29,0.98)',
                border: '1px solid rgba(239,68,68,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}
            >
              <div className="p-5 flex flex-col items-center gap-3 text-center">
                <ServerCrash className="w-8 h-8" style={{ color: 'rgba(239,68,68,0.4)' }} />
                <div>
                  <div className="text-xs font-semibold text-white mb-1">Data Emiten Tidak Tersedia</div>
                  <div className="text-[11px] font-mono" style={{ color: 'rgba(148,163,184,0.5)' }}>
                    Gagal mengambil daftar emiten dari Sectors API.<br />
                    Pastikan API key valid dan koneksi aktif.
                  </div>
                </div>
                <button
                  onClick={() => { onRetryCompanies(); setIsDropdownOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)', color: '#5eead4' }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Coba Lagi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Watchlist cards */}
        {watchlist.length === 0 ? (
          <div
            className="py-10 text-center rounded-xl"
            style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}
          >
            <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(148,163,184,0.5)' }}>
              Watchlist Anda masih kosong
            </div>
            <div className="text-[11px] font-mono" style={{ color: 'rgba(148,163,184,0.35)' }}>
              {liveCompanies.length > 0
                ? `Cari dari ${liveCompanies.length} emiten IDX di atas atau pasang paket sektor`
                : 'Tunggu data emiten dimuat, lalu cari saham di atas'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {watchlist.map(ticker => (
              <WatchlistCard
                key={ticker}
                ticker={ticker}
                companyInfo={getLiveInfo(ticker)}
                onRemove={() => onRemoveTicker(ticker)}
                onClick={() => onOpenStockModal(ticker)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
