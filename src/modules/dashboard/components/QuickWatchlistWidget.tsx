import { Link } from '@tanstack/react-router';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useCompanyStore } from '../../../data/companyStore';
import { StockLogo } from '../../../shared/components/StockLogo';
import { useWorkflowStore } from '../../cases/stores/workflow.store';

interface QuickWatchlistWidgetProps {
  watchlist: string[];
}

const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const formatNumber = (value: number) => value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
const snapshotTime = (value: unknown) => {
  if (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime())) return 'Waktu snapshot belum tersedia';
  return `Diperbarui ${new Date(value).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB`;
};

export const QuickWatchlistWidget = ({ watchlist }: QuickWatchlistWidgetProps) => {
  const companies = useCompanyStore(state => state.companies);
  const snapshots = useWorkflowStore(state => state.marketSnapshots);

  return (
    <section id="tour-watchlist-overview" aria-labelledby="watchlist-overview-title" className="min-w-0 rounded-xl border border-border bg-secondary/40 p-5 sm:p-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 id="watchlist-overview-title" className="text-xl font-bold text-text-main">Saham yang kamu pantau</h2>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">{watchlist.length} emiten · Harga dan volume dari snapshot Sectors terakhir.</p>
        </div>
        <Link to="/dashboard/watchlist" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline">
          Kelola watchlist <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {watchlist.length === 0 ? (
        <div role="status" className="rounded-lg border border-dashed border-border py-10 text-center">
          <p className="text-base font-semibold text-text-main">Belum ada saham yang dipantau.</p>
          <Link to="/dashboard/watchlist" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Tambah saham ke watchlist</Link>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {watchlist.map(ticker => {
            const company = companies.find(item => item.symbol === ticker);
            const snapshot = snapshots.get(ticker);
            const price = number(snapshot?.lastPrice) && snapshot.lastPrice > 0 ? snapshot.lastPrice : null;
            const change = number(snapshot?.changePercent) ? snapshot.changePercent : null;
            const volume = number(snapshot?.todayVolume) && snapshot.todayVolume >= 0 ? snapshot.todayVolume : null;
            const marketCap = number(company?.market_cap) && company.market_cap > 0 ? company.market_cap : null;

            return (
              <article key={ticker} className="min-w-0 rounded-lg border border-border bg-bg/40 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <StockLogo ticker={ticker} size="large" />
                  <div className="min-w-0">
                    <h3 className="font-mono text-lg font-bold text-text-main">{ticker}</h3>
                    <p className="mt-0.5 text-sm leading-snug text-text-muted">{company?.name ?? 'Nama perusahaan belum tersedia'}</p>
                  </div>
                </div>

                <div className="my-5">
                  <p className="mb-1 text-xs font-semibold text-text-muted">Harga penutupan terakhir</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-mono text-2xl font-bold tabular-nums text-text-main sm:text-3xl">{price !== null ? `Rp ${formatNumber(price)}` : 'Belum tersedia'}</p>
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold tabular-nums ${change === null || change === 0 ? 'bg-secondary text-text-muted' : change > 0 ? 'bg-accent/10 text-accent' : 'bg-rose-400/10 text-rose-400'}`}>
                      {change !== null && change !== 0 && (change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />)}
                      {change === null ? 'Perubahan belum tersedia' : `${change > 0 ? '+' : ''}${change.toFixed(2)}%`}
                    </span>
                  </div>
                </div>

                <dl className="grid grid-cols-1 gap-3 border-t sm:grid-cols-2 border-border pt-4">
                  <div><dt className="text-xs text-text-muted">Volume sesi terakhir</dt><dd className="mt-1 whitespace-nowrap font-mono text-base font-semibold text-text-main">{volume !== null ? formatNumber(volume) : 'Belum tersedia'}</dd><dd className="text-xs text-text-muted">lembar saham</dd></div>
                  <div><dt className="text-xs text-text-muted">Kapitalisasi pasar</dt><dd className="mt-1 font-mono text-base font-semibold text-text-main">{marketCap !== null ? `Rp ${formatNumber(marketCap / 1e12)} T` : 'Belum tersedia'}</dd><dd className="text-xs text-text-muted">Profil emiten Sectors</dd></div>
                </dl>
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs leading-relaxed text-text-muted">{company?.subSector || company?.sector || 'Sektor belum tersedia'}</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">{snapshotTime(snapshot?.lastUpdated)}</p>
                  {snapshot?.sessionDate && <p className="mt-1 text-xs text-text-muted">Sesi perdagangan: {new Date(`${snapshot.sessionDate}T00:00:00+07:00`).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs leading-relaxed text-text-muted">Snapshot dapat tertinggal dari sesi terbaru. Kapitalisasi pasar berasal dari profil emiten dan dapat memiliki waktu pembaruan berbeda.</p>
    </section>
  );
};
