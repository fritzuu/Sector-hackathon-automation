import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Building2, Check, Send, Info, HelpCircle, ShieldCheck } from 'lucide-react';
import { IDX_COMPANIES, POPULAR_PRESETS, IdxCompany, PopularPreset } from '../data/idxCompanies.js';

interface WatchlistManagerProps {
  watchlist: string[];
  onAddTicker: (ticker: string) => void;
  onRemoveTicker: (ticker: string) => void;
  onAddPreset: (tickers: string[]) => void;
  isTelegramLinked: boolean;
  onOpenTelegramModal: () => void;
  onSendTelegramSummary: () => void;
}

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  watchlist,
  onAddTicker,
  onRemoveTicker,
  onAddPreset,
  isTelegramLinked,
  onOpenTelegramModal,
  onSendTelegramSummary,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showMethodologyInfo, setShowMethodologyInfo] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCompanies = IDX_COMPANIES.filter((company) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      company.symbol.toLowerCase().includes(q) ||
      company.name.toLowerCase().includes(q) ||
      company.sector.toLowerCase().includes(q) ||
      company.subSector.toLowerCase().includes(q)
    );
  }).slice(0, 6);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCompany = (company: IdxCompany) => {
    if (!watchlist.includes(company.symbol)) {
      onAddTicker(company.symbol);
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const getCompanyDetails = (symbol: string): IdxCompany => {
    return (
      IDX_COMPANIES.find((c) => c.symbol === symbol) || {
        symbol,
        name: `PT ${symbol} Tbk`,
        sector: 'Saham Terdaftar IDX',
        subSector: 'Umum',
        marketCapTier: 'Big Cap',
        marketCapTrillion: 0,
        lastPrice: 0,
        indexMembership: ['IDX'],
        description: 'Perusahaan tercatat di Bursa Efek Indonesia.',
      }
    );
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Watchlist Saham Dipantau ({watchlist.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cari berdasarkan nama perusahaan atau kode saham untuk pemantauan otomatis via Sectors API.
          </p>
        </div>

        {/* 1-Click Telegram Action */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {isTelegramLinked ? (
            <button
              onClick={onSendTelegramSummary}
              disabled={watchlist.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 text-sky-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 -translate-x-0.5" />
              <span>1-Klik Kirim Rekap ke Telegram</span>
            </button>
          ) : (
            <button
              onClick={onOpenTelegramModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 -translate-x-0.5" />
              <span>1-Klik Hubungkan Telegram</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Packages Header with Data Transparency Modal Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <span>Koleksi Sektor Berdasarkan Indeks Likuiditas LQ45 & IDX-IC (Sectors API):</span>
          </div>
          <button
            type="button"
            onClick={() => setShowMethodologyInfo(!showMethodologyInfo)}
            className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center space-x-1 underline font-mono"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showMethodologyInfo ? 'Tutup Dasar Data' : 'Dasar Data & Metodologi'}</span>
          </button>
        </div>

        {/* Methodology Info Box */}
        {showMethodologyInfo && (
          <div className="p-3.5 rounded bg-slate-900 border border-teal-500/30 text-xs text-slate-300 space-y-1.5 animate-in fade-in">
            <div className="flex items-center space-x-1.5 text-teal-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Bagaimana Koleksi Sektor Ini Disusun Berdasarkan Data Nyata?</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Koleksi ini <strong>bukan rekomendasi beli/jual</strong>, melainkan pengelompokan emiten terlikuid di Bursa Efek Indonesia berdasarkan kriteria kuantitatif data <strong>Sectors API v2</strong>:
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1 pl-3 list-disc">
              <li><strong>Konstituen Resmi Indeks LQ45 & IDX30:</strong> Saham dengan nilai transaksi harian dan frekuensi perdagangan tertinggi di BEI.</li>
              <li><strong>Kapitalisasi Pasar Terbesar (Market Cap):</strong> Total nilai pasar emiten dalam setiap kelompok sektor bernilai puluhan hingga ribuan Triliun Rupiah.</li>
              <li><strong>Klasifikasi Industri Resmi IDX-IC:</strong> Pengelompokan sektor terstandarisasi Bursa Efek Indonesia.</li>
            </ul>
          </div>
        )}

        {/* Preset Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {POPULAR_PRESETS.map((preset) => {
            const allAdded = preset.tickers.every((t) => watchlist.includes(t));
            return (
              <div
                key={preset.name}
                className={`p-3 rounded border text-left flex flex-col justify-between space-y-2 ${
                  allAdded
                    ? 'bg-teal-950/20 border-teal-500/40'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{preset.name}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                      {preset.totalMarketCap}
                    </span>
                  </div>
                  <div className="text-[10px] text-teal-400/90 font-mono mb-1">{preset.indexBasis}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{preset.description}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-bold">{preset.tickers.join(', ')}</span>
                  {allAdded ? (
                    <span className="flex items-center space-x-0.5 text-teal-400 font-sans font-bold text-[10px]">
                      <Check className="w-3 h-3" />
                      <span>Dipantau</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddPreset(preset.tickers)}
                      className="px-2 py-0.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-[10px] rounded transition-colors"
                    >
                      + Pasang
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Input with Autocomplete */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Cari nama perusahaan (cth: Bank Central Asia, Telkom, Indofood, Antam) atau kode saham..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-teal-500 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
          />
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-[#0f172a] border border-slate-700 rounded shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-800">
            {filteredCompanies.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                Tidak ada emiten IDX yang cocok dengan pencarian "{searchQuery}".
              </div>
            ) : (
              filteredCompanies.map((company) => {
                const isAdded = watchlist.includes(company.symbol);
                return (
                  <div
                    key={company.symbol}
                    onClick={() => !isAdded && handleSelectCompany(company)}
                    className={`p-2.5 flex items-center justify-between text-xs transition-colors ${
                      isAdded
                        ? 'opacity-50 cursor-default bg-slate-900/40'
                        : 'hover:bg-slate-800 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono font-bold text-teal-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-xs">
                        {company.symbol}
                      </span>
                      <div>
                        <div className="font-semibold text-white">{company.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {company.sector} • Market Cap: Rp {company.marketCapTrillion} T
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs text-slate-300">
                        Rp {company.lastPrice.toLocaleString('id-ID')}
                      </span>
                      {isAdded ? (
                        <span className="text-[10px] text-teal-400 font-medium px-2 py-0.5 bg-teal-950 rounded border border-teal-800">
                          Dipantau
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-2 py-0.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-[11px] rounded transition-colors"
                        >
                          + Tambah
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Watchlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {watchlist.map((ticker) => {
          const info = getCompanyDetails(ticker);
          return (
            <div
              key={ticker}
              className="p-3 rounded bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800/60">
                      {info.symbol}
                    </span>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">
                      Rp {info.marketCapTrillion} T
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveTicker(ticker)}
                    title={`Hapus ${ticker} dari pemantauan`}
                    className="text-slate-500 hover:text-rose-400 p-0.5 rounded hover:bg-rose-500/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs font-semibold text-white truncate">{info.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{info.sector} • {info.subSector}</div>
              </div>

              <div className="mt-2.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Harga Sesi Terakhir:</span>
                <span className="text-slate-200 font-bold">
                  Rp {info.lastPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          );
        })}

        {watchlist.length === 0 && (
          <div className="col-span-full py-6 text-center border border-dashed border-slate-800 rounded bg-slate-900/30">
            <p className="text-xs font-semibold text-slate-400">Watchlist Anda masih kosong.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gunakan pencarian nama perusahaan di atas atau pilih salah satu paket sektor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
