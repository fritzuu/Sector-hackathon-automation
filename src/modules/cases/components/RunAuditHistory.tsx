import React from 'react';
import { History, CheckCircle } from 'lucide-react';

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
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-text/50 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-2.5 pl-2">Run ID</th>
              <th className="pb-2.5">Waktu Eksekusi</th>
              <th className="pb-2.5 text-center">Ticker Dievaluasi</th>
              <th className="pb-2.5 text-center">Trigger Aktif</th>
              <th className="pb-2.5 text-center">Durasi</th>
              <th className="pb-2.5 pr-2 text-right">Status</th>
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
              runs.map((r) => (
                <tr key={r.runId} className="hover:bg-secondary/40 transition-colors">
                  <td className="py-2.5 pl-2 text-primary">{r.runId}</td>
                  <td className="py-2.5 text-text/80 font-sans">
                    {new Date(r.timestamp).toLocaleTimeString('id-ID')}
                  </td>
                  <td className="py-2.5 text-center text-text">{r.tickersCount} saham</td>
                  <td className="py-2.5 text-center">
                    <span className={r.activeTriggersCount > 0 ? 'text-amber-400 font-bold' : 'text-text/50'}>
                      {r.activeTriggersCount} trigger
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-text/70">{r.durationMs}ms</td>
                  <td className="py-2.5 pr-2 text-right">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-accent/15 text-accent border border-accent/30">
                      <CheckCircle className="w-3 h-3" />
                      <span>{r.status}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
