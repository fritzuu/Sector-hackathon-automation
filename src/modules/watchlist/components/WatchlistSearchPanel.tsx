import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Globe, RefreshCw, ServerCrash, Wifi
} from 'lucide-react';
import { LiveIdxCompany } from '../../../services/sectorsApi';
import { WatchlistCard } from './WatchlistCard';

interface WatchlistSearchPanelProps {
  watchlist: string[];
  isTelegramLinked: boolean;
  onAddTicker: (ticker: string) => void;
  onRemoveTicker: (ticker: string) => void;
  onOpenTelegramModal: () => void;
  onSendTelegramSummary: () => void;
  onOpenStockModal: (symbol: string) => void;
  liveCompanies: LiveIdxCompany[];
  companiesLoading: boolean;
  companiesError: boolean;
  onRetryCompanies: () => void;
}

export const WatchlistSearchPanel: React.FC<WatchlistSearchPanelProps> = ({
  watchlist,
  onAddTicker, onRemoveTicker,
  onOpenStockModal,
  liveCompanies, companiesLoading, companiesError, onRetryCompanies,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const inputPlaceholder = companiesLoading
    ? 'Memuat daftar emiten IDX live...'
    : companiesError
      ? 'Data emiten tidak tersedia — coba lagi'
      : liveCompanies.length > 0
        ? `Cari dari ${liveCompanies.length} emiten IDX...`
        : 'Memuat emiten IDX...';

  return (
    <div className="rounded-xl font-sans bg-secondary/50 border border-border shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Header Info */}
      <div className="rounded-t-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 bg-secondary/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Wifi className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-bold text-text-main tracking-wide">
              Watchlist Dipantau
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-accent border border-accent text-bg font-bold ml-1">
              {watchlist.length}
            </span>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-[10px] font-mono text-text-muted/60">
              Harga: Yahoo Finance · cache 5 mnt
            </div>
            
            {companiesLoading ? (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Mengambil emiten IDX...
              </div>
            ) : companiesError ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] font-mono text-rose-400">
                  <ServerCrash className="w-3 h-3" />
                  API Gagal
                </div>
                <button
                  onClick={onRetryCompanies}
                  className="flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary-hover transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            ) : liveCompanies.length > 0 ? (
              <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-accent/10 text-accent border border-accent/20 font-medium">
                <Globe className="w-3 h-3" />
                {liveCompanies.length} emiten live
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Search Bar */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/50 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
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
              className="w-full pl-10 pr-10 py-3 text-sm text-text-main placeholder-text-muted/40 rounded-xl bg-bg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:opacity-50 shadow-inner"
            />
            {companiesLoading && (
              <RefreshCw className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-primary pointer-events-none" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && !companiesError && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl z-30 bg-secondary border border-border shadow-2xl divide-y divide-border/50 max-h-[350px] overflow-y-auto">
              <div className="px-4 py-2.5 flex items-center justify-between text-[10px] font-mono bg-bg/50 text-text-muted">
                <div className="flex items-center gap-1.5 font-bold">
                  <Globe className="w-3 h-3 text-primary" />
                  {searchQuery.trim() ? `${filteredCompanies.length} Hasil Pencarian` : 'Top 3 Saham Pilihan'}
                </div>
                <span>Tekan Enter ⏎</span>
              </div>

              {searchQuery.trim().length > 0 && !watchlist.includes(searchQuery.trim().toUpperCase()) && (
                <div
                  onClick={() => handleSelect(searchQuery.trim().toUpperCase())}
                  className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-bg/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-accent text-bg shadow-sm">
                      {searchQuery.trim().toUpperCase()}
                    </span>
                    <span className="text-xs text-text-muted group-hover:text-text-main transition-colors">
                      Tambah & fetch data real-time
                    </span>
                  </div>
                  <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-bg hover:opacity-90 transition-all shadow-md shadow-primary/20">
                    + Tambah
                  </button>
                </div>
              )}

              {(searchQuery.trim() ? filteredCompanies : liveCompanies.slice(0, 3)).map(company => {
                const isAdded = watchlist.includes(company.symbol);
                return (
                  <div
                    key={company.symbol}
                    onClick={() => !isAdded && handleSelect(company.symbol)}
                    className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                      isAdded ? 'opacity-50 cursor-default bg-bg/20' : 'cursor-pointer hover:bg-bg/50 group'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono font-bold text-xs px-2 py-1 rounded flex-shrink-0 bg-accent text-bg shadow-sm">
                        {company.symbol}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-main truncate group-hover:text-primary transition-colors">{company.name}</div>
                        <div className="text-[10px] font-mono truncate text-text-muted">
                          {company.sector}
                          {company.marketCapTrillion > 0 ? ` · Rp ${company.marketCapTrillion} T` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {company.lastPrice > 0 && (
                        <span className="text-xs font-mono font-bold text-text-muted hidden sm:block">
                          Rp {company.lastPrice.toLocaleString('id-ID')}
                        </span>
                      )}
                      {isAdded ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-accent/15 text-accent border border-accent/30">
                          Dipantau
                        </span>
                      ) : (
                        <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/20 border border-primary/40 text-primary group-hover:bg-primary group-hover:text-bg transition-all">
                          + Tambah
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isDropdownOpen && companiesError && liveCompanies.length === 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl overflow-hidden z-30 bg-bg border border-rose-500/30 shadow-2xl p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                <ServerCrash className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-text-main mb-1">Data Emiten Tidak Tersedia</div>
                <div className="text-[11px] font-mono text-text-muted">
                  Gagal mengambil daftar emiten dari Sectors API.<br />
                  Pastikan API key valid dan koneksi aktif.
                </div>
              </div>
              <button
                onClick={() => { onRetryCompanies(); setIsDropdownOpen(false); }}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-bg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Watchlist Cards Grid */}
        {watchlist.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-border bg-bg/30 flex flex-col items-center justify-center gap-2">
            <Globe className="w-8 h-8 text-text-muted/40 mb-2" />
            <div className="text-sm font-bold text-text-muted">
              Watchlist Anda masih kosong
            </div>
            <div className="text-[11px] font-mono text-text-muted/50">
              {liveCompanies.length > 0
                ? `Cari dari ${liveCompanies.length} emiten IDX di atas atau pasang preset sektor`
                : 'Tunggu data emiten dimuat, lalu cari saham di atas'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
