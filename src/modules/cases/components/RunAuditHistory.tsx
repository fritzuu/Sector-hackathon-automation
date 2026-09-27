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
}

export const RunAuditHistory: React.FC<RunAuditHistoryProps> = ({ runs }) => {
  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Audit Trail Unattended Run ({runs.length})
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 self-start sm:self-auto px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-400 font-mono">
          <span>P0-02 Unattended Execution Proof</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-2.5 pl-2">Run ID</th>
              <th className="pb-2.5">Waktu Eksekusi</th>
              <th className="pb-2.5 text-center">Ticker Dievaluasi</th>
              <th className="pb-2.5 text-center">Trigger Aktif</th>
              <th className="pb-2.5 text-center">Durasi</th>
              <th className="pb-2.5 pr-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                  Belum ada log eksekusi. Klik "Jalankan Run" untuk menghasilkan bukti audit unattended.
                </td>
              </tr>
            ) : (
              runs.map((r) => (
                <tr key={r.runId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 pl-2 text-slate-300">{r.runId}</td>
                  <td className="py-2.5 text-slate-400 font-sans">
                    {new Date(r.timestamp).toLocaleTimeString('id-ID')}
                  </td>
                  <td className="py-2.5 text-center text-slate-200">{r.tickersCount} saham</td>
                  <td className="py-2.5 text-center">
                    <span className={r.activeTriggersCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      {r.activeTriggersCount} trigger
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-slate-400">{r.durationMs}ms</td>
                  <td className="py-2.5 pr-2 text-right">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
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
