import { motion } from "framer-motion";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Globe, RefreshCw, ServerCrash, Wifi, LayoutGrid, ShieldAlert, AlertTriangle, Lock
} from 'lucide-react';
import { LiveIdxCompany } from '../../../services/sectorsApi';
import { WatchlistCard } from './WatchlistCard';
import { WatchlistMarketData } from '../watchlist.marketData';
import { MAX_WATCHLIST_SIZE, MAX_WATCHLIST_MUTATIONS_PER_DAY } from '../watchlist.rules';
import { SectorExplorerModal } from './SectorExplorerModal';
import { normalizeSubsectorSearchValue } from '../subsectorTaxonomy';

interface WatchlistSearchPanelProps {
  watchlist: string[];
  isTelegramLinked: boolean;
  onAddTicker: (ticker: string) => void;
  onRemoveTicker: (ticker: string) => void;
  onOpenTelegramModal: () => void;
  onSendTelegramSummary: () => void;
  onOpenStockModal: (symbol: string) => void;
  liveCompanies: LiveIdxCompany[];
  marketDataByTicker: Map<string, WatchlistMarketData | null>;
  companiesLoading: boolean;
  companiesError: boolean;
  onRetryCompanies: () => void;
  mutationCount?: number;
  onOpenLimitModal?: () => void;
}

export const WatchlistSearchPanel: React.FC<WatchlistSearchPanelProps> = ({
  watchlist,
  onAddTicker, onRemoveTicker,
  onOpenStockModal,
  liveCompanies, marketDataByTicker,
  companiesLoading, companiesError, onRetryCompanies,
  mutationCount = 0,
  onOpenLimitModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isWatchlistFull = watchlist.length >= MAX_WATCHLIST_SIZE;

  const query = searchQuery.toLowerCase().trim();
  const normalizedSubsectorQuery = normalizeSubsectorSearchValue(query);
  const isSubsectorQuery = query.length > 0 && liveCompanies.some(company =>
    normalizeSubsectorSearchValue(company.subSector) === normalizedSubsectorQuery,
  );
  const filteredCompanies = liveCompanies.filter(c => {
    if (!query) return true;
    if (isSubsectorQuery) {
      return normalizeSubsectorSearchValue(c.subSector) === normalizedSubsectorQuery;
    }
    return (
      c.symbol.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query) ||
      c.sector.toLowerCase().includes(query) ||
      c.subSector.toLowerCase().includes(query)
    );
  }).slice(0, MAX_WATCHLIST_SIZE);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isLimitReached = mutationCount >= MAX_WATCHLIST_MUTATIONS_PER_DAY;
  const remainingMutations = Math.max(0, MAX_WATCHLIST_MUTATIONS_PER_DAY - mutationCount);

  const handleSelect = (symbol: string) => {
    const registeredCompany = liveCompanies.find(company => company.symbol === symbol);
    if (!registeredCompany) return;
    if (isLimitReached) {
      if (onOpenLimitModal) onOpenLimitModal();
      return;
    }
    if (!watchlist.includes(registeredCompany.symbol) && !isWatchlistFull) {
      onAddTicker(registeredCompany.symbol);
    }
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
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Wifi className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-bold text-text-main tracking-wide">
              Tambah saham
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-accent border border-accent text-bg font-bold ml-1">
              {watchlist.length}/{MAX_WATCHLIST_SIZE}
            </span>

            {/* Addition Quota Meter */}
            <button
              type="button"
              onClick={onOpenLimitModal}
              title="Klik untuk melihat aturan kuota penambahan saham"
              className={`flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ml-2 ${
                isLimitReached
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                  : mutationCount >= 15
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                  : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20 hover:text-white'
              }`}
            >
              {isLimitReached ? (
                <Lock className="w-3 h-3 text-rose-400" />
              ) : (
                <ShieldAlert className="w-3 h-3 text-primary" />
              )}
              <span>Tambah Saham:</span>
              <span className={isLimitReached ? 'text-rose-400 font-bold' : 'text-white'}>
                {mutationCount}/{MAX_WATCHLIST_MUTATIONS_PER_DAY}
              </span>
            </button>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-[10px] font-mono text-text-muted/60">
              Harga: Sectors API · cache 5 mnt
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

      <div className="space-y-4 p-4 sm:p-5">
        {/* Warning Banner when Quota Reached or Near Limit */}
        {isLimitReached ? (
          <div
            onClick={onOpenLimitModal}
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-500/15 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-rose-300">
                  Batas Maksimal 20x Penambahan Saham Tercapai
                </div>
                <div className="text-[11px] text-rose-200/70">
                  Penambahan saham baru dikunci sementara (20/20). Anda tetap dapat menghapus saham yang dipantau.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-1 text-[11px] font-bold rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors flex-shrink-0 cursor-pointer"
            >
              Lihat Peringatan
            </button>
          </div>
        ) : mutationCount >= 15 ? (
          <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Peringatan: Sisa kuota penambahan saham hari ini tinggal{' '}
                <strong>{remainingMutations} kali</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenLimitModal}
              className="text-[11px] font-mono underline hover:text-amber-200 cursor-pointer"
            >
              Aturan 20x
            </button>
          </div>
        ) : null}

        {/* Search Bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="relative min-w-0 flex-1" ref={dropdownRef}>
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/50 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchQuery}
              disabled={(companiesError && liveCompanies.length === 0) || isLimitReached}
              onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  e.preventDefault();
                  const exactTicker = liveCompanies.find(
                    company => company.symbol.toUpperCase() === searchQuery.trim().toUpperCase(),
                  );
                  if (exactTicker) handleSelect(exactTicker.symbol);
                }
              }}
              onFocus={() => {
                if (isLimitReached) {
                  if (onOpenLimitModal) onOpenLimitModal();
                } else {
                  setIsDropdownOpen(true);
                }
              }}
              placeholder={isLimitReached ? 'Penambahan saham terkunci (batas 20x per hari)' : inputPlaceholder}
              className="w-full pl-10 pr-10 py-3 text-sm text-text-main placeholder-text-muted/40 rounded-xl bg-bg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:opacity-50 shadow-inner"
            />
            {companiesLoading && (
              <RefreshCw className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-primary pointer-events-none" />
            )}
          </div>

          {isWatchlistFull && !isLimitReached && (
            <p
              role="status"
              className="mt-2 border-l-2 border-amber-400/70 bg-amber-400/5 px-3 py-2 text-xs leading-5 text-amber-200"
            >
              Batas 5 saham tercapai. Hapus salah satu saham sebelum menambah yang lain.
            </p>
          )}

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && !companiesError && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl z-30 bg-secondary border border-border shadow-2xl divide-y divide-border/50 max-h-[350px] overflow-y-auto">
              <div className="px-4 py-2.5 flex items-center justify-between text-[10px] font-mono bg-bg/50 text-text-muted">
                <div className="flex items-center gap-1.5 font-bold">
                  <Globe className="w-3 h-3 text-primary" />
                  {searchQuery.trim() ? `${filteredCompanies.length} Hasil Pencarian` : 'Top 3 Saham Pilihan'}
                </div>
                <span>Pilih emiten terdaftar</span>
              </div>

              {companiesLoading && liveCompanies.length === 0 && (
                <div aria-label="Memuat daftar emiten" aria-busy="true" className="space-y-2 p-4">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-12 animate-pulse bg-bg/70" />
                  ))}
                </div>
              )}

              {searchQuery.trim().length > 0 && !companiesLoading && filteredCompanies.length === 0 && (
                <div role="status" className="px-4 py-5 text-center text-xs text-text-muted">
                  Tidak ditemukan emiten pada daftar yang tersedia.
                </div>
              )}

              {isWatchlistFull && searchQuery.trim().length > 0 && (
                <div className="px-4 py-3 text-xs text-amber-200" role="status">
                  Watchlist sudah mencapai batas 5 saham.
                </div>
              )}

              {(searchQuery.trim() ? filteredCompanies : liveCompanies.slice(0, 3)).map(company => {
                const isAdded = watchlist.includes(company.symbol);
                return (
                  <div
                    key={company.symbol}
                    onClick={() => !isAdded && !isWatchlistFull && handleSelect(company.symbol)}
                    className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                      isAdded ? 'opacity-50 cursor-default bg-bg/20' : isWatchlistFull ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-bg/50 group'
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
                        <button type="button" disabled={isWatchlistFull} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/20 border border-primary/40 text-primary group-hover:bg-primary group-hover:text-bg transition-all disabled:cursor-not-allowed disabled:border-border disabled:bg-bg disabled:text-text-muted">
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
        <button
          type="button"
          onClick={() => setIsExplorerOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3.5 py-3 text-xs font-semibold text-text-main transition-colors hover:border-primary/50 hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <LayoutGrid className="h-4 w-4 text-primary" />
          Jelajahi sektor
        </button>
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
          <motion.div 
            className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3 sm:gap-4"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
            initial="hidden"
            animate="show"
          >
            {watchlist.map(ticker => (
              <motion.div 
                key={ticker}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } }
                }}
              >
                <WatchlistCard
                  ticker={ticker}
                  companyInfo={getLiveInfo(ticker)}
                  marketData={marketDataByTicker.get(ticker) ?? null}
                  onRemove={() => onRemoveTicker(ticker)}
                  onClick={() => onOpenStockModal(ticker)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <SectorExplorerModal
        isOpen={isExplorerOpen}
        companies={liveCompanies}
        companiesLoading={companiesLoading}
        companiesError={companiesError}
        watchlist={watchlist}
        onAddTicker={onAddTicker}
        onRetryCompanies={onRetryCompanies}
        onClose={() => setIsExplorerOpen(false)}
      />
    </div>
  );
};
