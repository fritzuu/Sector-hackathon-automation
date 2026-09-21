/**
 * SectorPresetsGrid — Grid koleksi sektor IDX (LQ45 & IDX-IC).
 * Komponen ini berdiri sendiri, terpisah dari search/watchlist panel.
 *
 * Hallmark · redesign · genre: atmospheric · theme: Midnight
 * macrostructure: Workbench (Zone A standalone)
 * accent: teal oklch(65% 0.14 183) · paper: oklch(12% 0.03 240)
 */

import React, { useState } from 'react';
import { Check, Info, ShieldCheck, LayoutGrid, Plus } from 'lucide-react';
import { POPULAR_PRESETS } from '../data/idxCompanies.js';

interface SectorPresetsGridProps {
  watchlist: string[];
  onAddPreset: (tickers: string[]) => void;
}

// Sektor-color mapping — tiap sektor punya aksen warna sendiri
const SECTOR_ACCENTS: Record<string, { bg: string; border: string; badge: string; label: string }> = {
  default:        { bg: 'rgba(20,184,166,0.06)',  border: 'rgba(20,184,166,0.2)',  badge: 'rgba(20,184,166,0.12)',  label: 'text-teal-300'   },
  banking:        { bg: 'rgba(56,189,248,0.06)',  border: 'rgba(56,189,248,0.2)',  badge: 'rgba(56,189,248,0.12)',  label: 'text-sky-300'    },
  energy:         { bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.2)',  badge: 'rgba(251,191,36,0.12)',  label: 'text-amber-300'  },
  mining:         { bg: 'rgba(244,63,94,0.06)',   border: 'rgba(244,63,94,0.2)',   badge: 'rgba(244,63,94,0.12)',   label: 'text-rose-300'   },
  consumer:       { bg: 'rgba(52,211,153,0.06)',  border: 'rgba(52,211,153,0.2)',  badge: 'rgba(52,211,153,0.12)',  label: 'text-emerald-300' },
  telecom:        { bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.2)', badge: 'rgba(167,139,250,0.12)', label: 'text-violet-300' },
  global:         { bg: 'rgba(99,102,241,0.06)',  border: 'rgba(99,102,241,0.2)',  badge: 'rgba(99,102,241,0.12)',  label: 'text-indigo-300' },
};

// Map preset index ke accent key (6 sektor)
const PRESET_ACCENT_KEYS = ['banking', 'energy', 'mining', 'consumer', 'telecom', 'global'];

export const SectorPresetsGrid: React.FC<SectorPresetsGridProps> = ({ watchlist, onAddPreset }) => {
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden font-sans"
      style={{
        background: 'linear-gradient(135deg, rgba(13,20,36,0.95) 0%, rgba(9,13,22,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 0 0 1px rgba(20,184,166,0.05), 0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header strip */}
      <div
        className="px-5 py-3.5 flex items-center justify-between gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)' }}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">Koleksi 6 Sektor Pilihan IDX &amp; Global</div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(148,163,184,0.6)' }}>
              Klasifikasi LQ45, IDX-IC &amp; Barometer Pasar
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowMethodology(v => !v)}
          className="flex items-center gap-1.5 text-[10px] font-mono font-semibold transition-colors cursor-pointer"
          style={{ color: showMethodology ? 'rgba(20,184,166,0.9)' : 'rgba(148,163,184,0.5)' }}
          aria-expanded={showMethodology}
        >
          <Info className="w-3 h-3" />
          {showMethodology ? 'Tutup' : 'Metodologi'}
        </button>
      </div>

      {/* Methodology drawer */}
      {showMethodology && (
        <div
          className="px-5 py-3.5 text-xs space-y-2"
          style={{ background: 'rgba(20,184,166,0.04)', borderBottom: '1px solid rgba(20,184,166,0.1)' }}
        >
          <div className="flex items-center gap-2 font-semibold text-teal-300">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            Bagaimana koleksi 6 sektor ini disusun?
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(203,213,225,0.7)' }}>
            Pengelompokan emiten terlikuid berdasarkan data <strong className="text-slate-200">Sectors API v2</strong> — bukan rekomendasi beli/jual.
          </p>
          <ul className="text-[11px] space-y-1 pl-3 list-disc" style={{ color: 'rgba(148,163,184,0.65)' }}>
            <li><strong className="text-slate-300">Konstituen Resmi LQ45 &amp; IDX30:</strong> Saham dengan nilai transaksi &amp; frekuensi tertinggi di BEI.</li>
            <li><strong className="text-slate-300">Kapitalisasi Pasar Terbesar:</strong> Total nilai pasar puluhan hingga ribuan Triliun Rupiah.</li>
            <li><strong className="text-slate-300">Klasifikasi IDX-IC:</strong> Pengelompokan sektor terstandarisasi Bursa Efek Indonesia.</li>
          </ul>
        </div>
      )}

      {/* Preset grid — 3 cols on lg, 2 on sm */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {POPULAR_PRESETS.map((preset, idx) => {
          const allAdded = preset.tickers.every(t => watchlist.includes(t));
          const accentKey = PRESET_ACCENT_KEYS[idx] ?? 'default';
          const accent = SECTOR_ACCENTS[accentKey] ?? SECTOR_ACCENTS.default;

          return (
            <div
              key={preset.name}
              className="rounded-lg p-3.5 flex flex-col justify-between gap-3 transition-all duration-200"
              style={{
                background: allAdded ? accent.bg : 'rgba(255,255,255,0.025)',
                border: `1px solid ${allAdded ? accent.border : 'rgba(255,255,255,0.06)'}`,
                boxShadow: allAdded ? `0 0 20px ${accent.bg}` : 'none',
              }}
            >
              {/* Top: name + market cap */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-xs font-bold text-white leading-snug">{preset.name}</div>
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                    style={{ background: accent.badge, color: 'rgba(203,213,225,0.85)', border: `1px solid ${accent.border}` }}
                  >
                    {preset.totalMarketCap}
                  </span>
                </div>
                <div className={`text-[10px] font-mono font-semibold mb-1.5 ${accent.label}`}>
                  {preset.indexBasis}
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(148,163,184,0.6)' }}>
                  {preset.description}
                </p>
              </div>

              {/* Bottom: tickers + action */}
              <div
                className="pt-2.5 flex items-center justify-between gap-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-[10px] font-mono font-semibold" style={{ color: 'rgba(203,213,225,0.7)' }}>
                  {preset.tickers.join(' · ')}
                </span>
                {allAdded ? (
                  <span className={`flex items-center gap-1 text-[10px] font-bold font-mono flex-shrink-0 ${accent.label}`}>
                    <Check className="w-3 h-3" />
                    Aktif
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAddPreset(preset.tickers)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all duration-150 flex-shrink-0 cursor-pointer"
                    style={{
                      background: 'rgba(20,184,166,0.15)',
                      border: '1px solid rgba(20,184,166,0.3)',
                      color: 'rgba(20,184,166,0.9)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(20,184,166,0.25)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#5eead4';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(20,184,166,0.15)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(20,184,166,0.9)';
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    Pasang
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
