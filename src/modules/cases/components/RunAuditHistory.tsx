import React from 'react';
import { History, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatWib } from '../../automation/lib/automationStatus';
import { Pagination } from '../../../shared/components/Pagination';
import { usePagination } from '../../../shared/hooks/usePagination';

export interface AuditRunItem {
  runId: string;
  timestamp: string;
  tickersCount: number;
  activeTriggersCount: number;
  status: 'SUCCESS' | 'PARTIAL' | 'INCOMPLETE';
  durationMs: number;
}

interface RunAuditHistoryProps {
  runs: AuditRunItem[];
  error?: string | null;
  isLoading?: boolean;
  onRetry?: () => void;
}

export const RunAuditHistory: React.FC<RunAuditHistoryProps> = ({ runs, error, isLoading = false, onRetry }) => {
  const pagination = usePagination(runs);
  return (
    <div
      id="tour-audit-content"
      className="rounded-xl p-5 space-y-4 font-sans bg-secondary/50 border border-border shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Riwayat Evaluasi ({runs.length})
          </h2>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-border p-3 text-sm text-text-muted">
          {error}
          <button type="button" className="ml-2 text-primary underline" disabled={isLoading} onClick={onRetry}>
            {isLoading ? 'Memuat...' : 'Coba lagi'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto" aria-busy={isLoading}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Riwayat evaluasi saham dalam zona waktu WIB</caption>
          <thead>
            <tr className="border-b border-border text-text/50 font-semibold uppercase tracking-wider text-xs">
              <th scope="col" className="pb-2.5 pl-2">Run ID</th>
              <th scope="col" className="pb-2.5">Waktu Eksekusi</th>
              <th scope="col" className="pb-2.5 text-center">Emiten dievaluasi</th>
              <th scope="col" className="pb-2.5 text-center">Pemicu aktif</th>
              <th scope="col" className="pb-2.5 text-center">Durasi</th>
              <th scope="col" className="pb-2.5 pr-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-mono">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-text/50 font-sans">
                  {isLoading ? 'Memuat riwayat evaluasi...' : error ? 'Riwayat evaluasi tidak tersedia.' : 'Belum ada riwayat evaluasi.'}
                </td>
              </tr>
            ) : (
              pagination.items.map((r) => (
                <tr key={r.runId} className="hover:bg-secondary/40 transition-colors">
                  <td className="py-2.5 pl-2 text-primary">{r.runId}</td>
                  <td className="py-2.5 text-text/80 font-sans">
                    <time dateTime={r.timestamp}>{formatWib(r.timestamp)}</time>
                  </td>
                  <td className="py-2.5 text-center text-text">{r.tickersCount} saham</td>
                  <td className="py-2.5 text-center">
                    <span className={r.activeTriggersCount > 0 ? 'text-amber-400 font-bold' : 'text-text/50'}>
                      {r.activeTriggersCount} pemicu
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-text/70">{r.durationMs}ms</td>
                  <td className="py-2.5 pr-2 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${r.status === 'SUCCESS' ? 'bg-accent/15 text-accent border-accent/30' : 'bg-amber-400/10 text-amber-300 border-amber-400/30'}`}>
                      {r.status === 'SUCCESS' ? <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span>{r.status === 'SUCCESS' ? 'Berhasil' : r.status === 'PARTIAL' ? 'Sebagian data tersedia' : 'Data belum lengkap'}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination {...pagination} label="Halaman audit trail" />
    </div>
  );
};
