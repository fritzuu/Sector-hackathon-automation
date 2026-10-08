import { StockLogo } from '../../../shared/components/StockLogo';
import React, { useState } from 'react';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { useCompanyStore } from '../../../data/companyStore';
import { useWorkflowStore } from '../../cases/stores/workflow.store';
import {
  buildMarketActivityRows,
  filterMarketActivityRows,
  MarketActivityTab,
} from '../marketActivity';

interface MarketActivityWidgetProps {
  watchlist: string[];
}

const formatEstimatedValue = (value: number): string => {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} T`;
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
  return `Rp ${value.toLocaleString('id-ID')}`;
};

const tabs: Array<{ id: MarketActivityTab; label: string }> = [
  { id: 'active', label: 'Teraktif' },
  { id: 'up', label: 'Naik' },
  { id: 'down', label: 'Turun' },
];

export const MarketActivityWidget: React.FC<MarketActivityWidgetProps> = ({ watchlist }) => {
  const marketSnapshots = useWorkflowStore(state => state.marketSnapshots) as Map<string, {
    lastPrice: number;
    changePercent: number;
    todayVolume: number;
    lastUpdated: string;
  }>;
  const companies = useCompanyStore(state => state.companies);
  const [activeTab, setActiveTab] = useState<MarketActivityTab>('active');
  const [selectedSubsector, setSelectedSubsector] = useState('');

  const rows = buildMarketActivityRows(watchlist, marketSnapshots, companies);
  const visibleRows = filterMarketActivityRows(rows, activeTab, selectedSubsector).slice(0, 5);
  const subsectors = Array.from(new Set(rows.map(row => row.subsector))).sort((a, b) => a.localeCompare(b));
  const dataDate = rows.map(row => row.date).sort().at(-1);

  return (
    <section aria-labelledby="market-activity-title" className="flex min-w-0 flex-col rounded-xl border border-border bg-secondary/40 p-4 font-sans sm:p-5">
      <header className="flex items-center gap-2.5 border-b border-border/70 pb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h2 id="market-activity-title" className="text-xl font-bold text-text-main">Aktivitas watchlist</h2>
      </header>

      <div role="tablist" aria-label="Urutkan aktivitas pasar" className="mt-3 grid grid-cols-3 rounded-md border border-border bg-bg/60 p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded px-2 py-2.5 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-primary text-bg' : 'text-text-muted hover:text-text-main'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <label className="sr-only" htmlFor="market-activity-subsector">Filter subsektor aktivitas pasar</label>
      <select
        id="market-activity-subsector"
        value={selectedSubsector}
        onChange={event => setSelectedSubsector(event.target.value)}
        className="mt-3 w-full rounded-md border border-border bg-bg/60 px-2.5 py-2 text-sm text-text-main focus:border-primary focus:outline-none"
      >
        <option value="">Semua subsektor</option>
        {subsectors.map(subsector => <option key={subsector} value={subsector}>{subsector}</option>)}
      </select>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-text-main">
            {dataDate ? `Snapshot terakhir: ${new Date(`${dataDate}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Waktu snapshot belum tersedia'}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-text-muted">Aktivitas diperkirakan dari volume × harga penutupan.</p>
        </div>
        <span className="shrink-0 text-xs font-mono text-text-muted">{rows.length}/{watchlist.length} emiten tersedia</span>
      </div>

      <div className="mt-3 flex-1 border-y border-border/70">
        <div className="grid grid-cols-[22px_minmax(0,1fr)_auto] gap-2 py-2 text-xs font-semibold text-text-muted">
          <span>#</span><span>Emiten</span><span className="text-right">Est. aktivitas</span>
        </div>
        {visibleRows.length > 0 ? (
          visibleRows.map((row, index) => (
            <div key={row.symbol} className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-2 border-t border-border/60 py-2.5 first:border-t-0">
              <span className="font-mono text-xs text-text-muted">{index + 1}</span>
              <div className="flex min-w-0 items-center gap-2">
                <StockLogo ticker={row.symbol} />
                <div className="min-w-0">
                  <div className="font-mono text-base font-bold text-text-main">{row.symbol}</div>
                  <div className="text-xs leading-relaxed text-text-muted" title={row.name}>{row.name}</div>
                  <div className="mt-1 text-xs text-text-muted">Rp {row.close.toLocaleString('id-ID')} · Volume {Number.isFinite(row.volume) ? row.volume.toLocaleString('id-ID') : 'belum tersedia'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="whitespace-nowrap font-mono text-lg font-semibold text-text-main">{formatEstimatedValue(row.estimatedValue)}</div>
                <div className={`mt-0.5 flex items-center justify-end gap-0.5 font-mono text-sm ${row.changePercent === null ? 'text-text-muted' : row.changePercent >= 0 ? 'text-accent' : 'text-rose-400'}`}>
                  {row.changePercent !== null && (row.changePercent >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />)}
                  {row.changePercent === null ? 'N/A' : `${row.changePercent > 0 ? '+' : ''}${row.changePercent.toFixed(2)}%`}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div role="status" className="flex min-h-36 flex-col items-center justify-center px-3 text-center">
            <p className="text-sm font-semibold text-text-main">
              {watchlist.length === 0 ? 'Watchlist masih kosong.' : 'Data aktivitas belum tersedia.'}
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-text-muted">
              {watchlist.length === 0
                ? 'Tambahkan emiten untuk melihat aktivitas pasar.'
                : 'Snapshot belum tersimpan. Data akan muncul setelah workflow selesai berjalan.'}
            </p>
          </div>
        )}
      </div>
      <p className="pt-2 text-xs leading-relaxed text-text-muted">Hanya emiten watchlist. Estimasi aktivitas = harga × volume, bukan nilai transaksi aktual. Sumber: snapshot Sectors di Supabase.</p>
    </section>
  );
};
