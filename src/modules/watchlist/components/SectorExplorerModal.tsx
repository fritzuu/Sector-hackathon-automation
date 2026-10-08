import { StockLogo } from '../../../shared/components/StockLogo';
import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, Plus, Search, X } from 'lucide-react';
import { LiveIdxCompany } from '../../../services/sectorsApi';
import { MAX_WATCHLIST_SIZE } from '../watchlist.rules';
import {
  formatTaxonomyLabel,
  matchesTaxonomyPair,
  SECTOR_SUBSECTORS,
} from '../subsectorTaxonomy';

interface SectorExplorerModalProps {
  isOpen: boolean;
  companies: LiveIdxCompany[];
  companiesLoading: boolean;
  companiesError: boolean;
  watchlist: string[];
  onAddTicker: (ticker: string) => void;
  onRetryCompanies: () => void;
  onClose: () => void;
}

const SECTOR_LABELS: Record<string, string> = {
  'transportation-logistic': 'Transportation & Logistic',
  'properties-real-estate': 'Properties & Real Estate',
  'consumer-non-cyclicals': 'Consumer Non-Cyclicals',
  'consumer-cyclicals': 'Consumer Cyclicals',
};

const sectorLabel = (sector: string) =>
  SECTOR_LABELS[sector] ?? formatTaxonomyLabel(sector);

export const SectorExplorerModal: React.FC<SectorExplorerModalProps> = ({
  isOpen,
  companies,
  companiesLoading,
  companiesError,
  watchlist,
  onAddTicker,
  onRetryCompanies,
  onClose,
}) => {
  const sectors = Array.from(new Set(SECTOR_SUBSECTORS.map(pair => pair.sector)));
  const [selectedSector, setSelectedSector] = useState('financials');
  const [selectedSubsector, setSelectedSubsector] = useState('');
  const [sectorSearch, setSectorSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'market-cap-desc' | 'market-cap-asc'>('market-cap-desc');
  const isWatchlistFull = watchlist.length >= MAX_WATCHLIST_SIZE;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sectorPairs = selectedSector === 'all'
    ? SECTOR_SUBSECTORS
    : SECTOR_SUBSECTORS.filter(pair => pair.sector === selectedSector);
  const visibleSectors = sectors.filter(sector =>
    sectorLabel(sector).toLowerCase().includes(sectorSearch.trim().toLowerCase()),
  );
  const subsectorCount = (subsector: string) => companies.filter(company =>
    matchesTaxonomyPair(company.sector, company.subSector, {
      sector: selectedSector === 'all'
        ? (SECTOR_SUBSECTORS.find(pair => pair.subsector === subsector)?.sector ?? '')
        : selectedSector,
      subsector,
    }),
  ).length;
  const filteredCompanies = companies
    .filter(company => {
      const pair = sectorPairs.find(item =>
        matchesTaxonomyPair(company.sector, company.subSector, item),
      );
      if (!pair || (selectedSubsector && pair.subsector !== selectedSubsector)) return false;
      const query = companySearch.trim().toLowerCase();
      return !query || company.symbol.toLowerCase().includes(query) || company.name.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (sortOrder === 'market-cap-desc') return b.marketCapTrillion - a.marketCapTrillion;
      if (sortOrder === 'market-cap-asc') return a.marketCapTrillion - b.marketCapTrillion;
      const nameOrder = a.name.localeCompare(b.name);
      return sortOrder === 'name-asc' ? nameOrder : -nameOrder;
    });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-5"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sector-explorer-title"
        className="flex h-[min(850px,calc(100dvh-16px))] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-2xl sm:h-[min(850px,calc(100dvh-40px))]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border bg-secondary/20 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="sector-explorer-title" className="text-lg font-bold text-text-main sm:text-xl">
              Jelajahi sektor
            </h2>
            <p className="mt-1 text-xs text-text-muted sm:text-sm">
              Temukan emiten berdasarkan sektor dan subsektor.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs font-mono text-text-muted sm:inline">
              {sectors.length} sektor · {SECTOR_SUBSECTORS.length} subsektor · {watchlist.length}/{MAX_WATCHLIST_SIZE} dipantau
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup jelajahi sektor"
              className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-secondary hover:text-text-main focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <aside className="shrink-0 border-b border-border sm:w-56 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <input
                aria-label="Cari sektor"
                value={sectorSearch}
                onChange={event => setSectorSearch(event.target.value)}
                placeholder="Cari sektor..."
                className="min-w-0 flex-1 bg-transparent text-xs text-text-main outline-none placeholder:text-text-muted"
              />
            </div>
            <nav aria-label="Sektor" className="flex max-h-32 gap-1 overflow-x-auto p-2 sm:max-h-none sm:h-[calc(100%-49px)] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden">
              <button
                type="button"
                aria-pressed={selectedSector === 'all'}
                onClick={() => {
                  setSelectedSector('all');
                  setSelectedSubsector('');
                }}
                className={`flex min-w-max items-center justify-between gap-3 rounded-md border-l-2 px-2.5 py-2 text-left transition-colors sm:min-w-0 ${
                  selectedSector === 'all'
                    ? 'border-primary bg-primary/15 text-text-main'
                    : 'border-transparent text-text-muted hover:bg-secondary/70 hover:text-text-main'
                }`}
              >
                <span className="text-[11px] font-semibold">Semua sektor</span>
                <span className="shrink-0 text-[9px] font-mono text-text-muted">
                  {sectors.length} sektor · {SECTOR_SUBSECTORS.length} subsektor
                </span>
              </button>
              {visibleSectors.map(sector => {
                const isSelected = selectedSector === sector;
                const count = SECTOR_SUBSECTORS.filter(pair => pair.sector === sector).length;
                return (
                  <button
                    key={sector}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedSector(sector);
                      setSelectedSubsector('');
                    }}
                    className={`flex min-w-max items-center justify-between gap-3 rounded-md border-l-2 px-2.5 py-2 text-left transition-colors sm:min-w-0 ${
                      isSelected
                        ? 'border-primary bg-primary/15 text-text-main'
                        : 'border-transparent text-text-muted hover:bg-secondary/70 hover:text-text-main'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">{sectorLabel(sector)}</span>
                    <span className="flex shrink-0 items-center gap-1 text-[9px] font-mono text-text-muted">
                      {count} subsektor <ChevronRight className="hidden h-3 w-3 sm:block" />
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-text-main sm:text-lg">
                    {selectedSector === 'all' ? 'Semua sektor' : sectorLabel(selectedSector)}
                  </h3>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {selectedSector === 'all' ? 'Pilih sektor untuk melihat filter subsektor.' : 'Pilih subsektor untuk mempersempit hasil.'}
                  </p>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  {companiesLoading ? 'Memuat emiten...' : `${filteredCompanies.length} emiten ditemukan`}
                </span>
              </div>

              {selectedSector !== 'all' && <div role="group" aria-label="Filter subsektor" className="mb-5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  aria-pressed={!selectedSubsector}
                  onClick={() => setSelectedSubsector('')}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    !selectedSubsector
                      ? 'border-primary bg-primary text-bg'
                      : 'border-border bg-secondary/60 text-text-muted hover:border-primary/50 hover:text-text-main'
                  }`}
                >
                  Semua subsektor
                </button>
                {sectorPairs.map(pair => {
                  const isSelected = selectedSubsector === pair.subsector;
                  const count = subsectorCount(pair.subsector);
                  return (
                    <button
                      key={pair.subsector}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedSubsector(isSelected ? '' : pair.subsector)}
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-bg'
                          : 'border-border bg-secondary/60 text-text-muted hover:border-primary/50 hover:text-text-main'
                      }`}
                    >
                      {formatTaxonomyLabel(pair.subsector)}{count > 0 ? ` · ${count}` : ''}
                    </button>
                  );
                })}
              </div>}

              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative min-w-0 sm:max-w-xs sm:flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                  <input
                    type="search"
                    value={companySearch}
                    onChange={event => setCompanySearch(event.target.value)}
                    placeholder="Cari kode atau nama emiten..."
                    className="w-full rounded-md border border-border bg-secondary/50 py-2 pl-9 pr-3 text-xs text-text-main placeholder:text-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="sr-only" htmlFor="sector-explorer-sort">Urutkan emiten</label>
                <select
                  id="sector-explorer-sort"
                  value={sortOrder}
                  onChange={event => setSortOrder(event.target.value as typeof sortOrder)}
                  className="rounded-md border border-border bg-secondary/50 px-2.5 py-2 text-xs text-text-main focus:border-primary focus:outline-none"
                >
                  <option value="market-cap-desc">Market cap terbesar</option>
                  <option value="market-cap-asc">Market cap terkecil</option>
                  <option value="name-asc">Nama A–Z</option>
                  <option value="name-desc">Nama Z–A</option>
                </select>
              </div>

              {companiesError && companies.length === 0 ? (
                <div role="alert" className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                  <p className="text-sm font-semibold text-text-main">Data emiten tidak tersedia.</p>
                  <button type="button" onClick={onRetryCompanies} className="rounded-md border border-primary/40 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10">
                    Coba lagi
                  </button>
                </div>
              ) : companiesLoading && companies.length === 0 ? (
                <div aria-label="Memuat daftar emiten" aria-busy="true" className="space-y-2">
                  {[0, 1, 2, 3].map(row => <div key={row} className="h-12 animate-pulse border-b border-border bg-secondary/40" />)}
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div role="status" className="flex min-h-40 flex-col items-center justify-center border-y border-border text-center">
                  <p className="text-sm font-semibold text-text-main">Tidak ada emiten yang cocok.</p>
                  <p className="mt-1 max-w-md text-xs leading-relaxed text-text-muted">
                    Tidak ada data emiten pada pasangan sektor dan subsektor ini untuk daftar yang tersedia.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border-y border-border">
                  <table className="w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border text-xs font-semibold text-text-muted">
                        <th className="py-2.5 pr-3">Emiten</th>
                        <th className="py-2.5 pr-3">Subsektor</th>
                        <th className="py-2.5 pr-3 text-right">Market cap</th>
                        <th className="py-2.5 text-right">Watchlist</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompanies.map(company => (
                          <tr key={company.symbol} className="border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/30">
                            <td className="py-3 pr-3 pl-2">
                              <div className="flex items-center gap-2.5">
                                <StockLogo ticker={company.symbol} />
                                <div className="min-w-0">
                                  <div className="font-mono text-sm font-bold text-text-main">{company.symbol}</div>
                                  <div className="mt-0.5 max-w-56 truncate text-xs text-text-muted" title={company.name}>{company.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-3 text-xs text-text-muted">{company.subSector}</td>
                            <td className="py-3 pr-3 text-right font-mono text-xs text-text-main">
                              {company.marketCapTrillion > 0 ? `Rp ${company.marketCapTrillion.toLocaleString('id-ID')} T` : 'N/A'}
                            </td>
                            <td className="py-3 text-right">
                              {watchlist.includes(company.symbol) ? (
                                <span className="inline-flex min-w-24 items-center justify-center gap-1 rounded-md border border-border bg-secondary/70 px-2.5 py-1.5 text-xs font-semibold text-text-muted">
                                  <Check className="h-3 w-3" /> Dipantau
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isWatchlistFull}
                                  onClick={() => onAddTicker(company.symbol)}
                                  aria-label={isWatchlistFull ? 'Watchlist penuh' : `Tambah ${company.symbol} ke watchlist`}
                                  className="inline-flex min-w-24 items-center justify-center gap-1 rounded-md border border-primary/50 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-bg disabled:cursor-not-allowed disabled:border-border disabled:text-text-muted"
                                >
                                  <Plus className="h-3 w-3" /> Tambah
                                </button>
                              )}
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </main>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
              <p className="text-xs text-text-muted">
                {isWatchlistFull ? `Watchlist penuh (${MAX_WATCHLIST_SIZE}/${MAX_WATCHLIST_SIZE}).` : `${watchlist.length}/${MAX_WATCHLIST_SIZE} saham dipantau.`}
              </p>
              <button type="button" onClick={onClose} className="rounded-md bg-primary px-4 py-2 text-xs font-bold text-bg transition-opacity hover:opacity-90">
                Selesai
              </button>
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
};
