import React from 'react';
import { CaseState, CaseStatus } from '../../../types/engine.js';
import { ShieldAlert, ArrowRight, Zap, FileText, TrendingUp, AlertOctagon } from 'lucide-react';

interface ActiveCasesListProps {
  cases: CaseState[];
  onSelectCase: (caseItem: CaseState) => void;
}

export const ActiveCasesList: React.FC<ActiveCasesListProps> = ({ cases, onSelectCase }) => {
  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
            OPEN (Kasus Baru)
          </span>
        );
      case 'UPDATED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-950 text-amber-300 border border-amber-700">
            UPDATED (Perkembangan Baru)
          </span>
        );
      case 'MONITORING':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-sky-950 text-sky-300 border border-sky-700">
            MONITORING (Dipantau)
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-800 text-slate-400 border border-slate-700">
            CLOSED (Ditutup)
          </span>
        );
      case 'DATA_INCOMPLETE':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-950 text-rose-300 border border-rose-700">
            DATA INCOMPLETE
          </span>
        );
      default:
        return null;
    }
  };

  const getRuleIcon = (ruleId: string) => {
    switch (ruleId) {
      case 'ABNORMAL_VOLUME':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'RELATIVE_MOVEMENT':
        return <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />;
      case 'NEW_FILING':
        return <FileText className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <AlertOctagon className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Kasus Pemantauan Terbuka ({cases.length})
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 self-start sm:self-auto px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-400 font-mono">
          <span>P0-05 Stateful Timeline</span>
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-800 rounded bg-slate-900/30">
          <ShieldAlert className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">Belum ada kasus pemantauan yang terbuka.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Klik tombol "Jalankan Run" di atas untuk memicu evaluasi otomatis atas saham watchlist Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {cases.map((c) => (
            <div
              key={c.caseId}
              onClick={() => onSelectCase(c)}
              className="p-4 rounded bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold font-mono text-white group-hover:text-teal-400 transition-colors">
                    {c.symbol}
                  </span>
                  {getStatusBadge(c.status)}
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 mb-3 font-mono">
                  <div>ID Kasus: <span className="text-slate-300">{c.caseId}</span></div>
                  <div>Dibuka: <span className="text-slate-300">{new Date(c.openedAt).toLocaleDateString('id-ID')}</span></div>
                  <div>Riwayat: <span className="text-slate-300 font-bold">{c.eventsCount} pembaruan tercatat</span></div>
                  {c.consecutiveInactiveRuns > 0 && (
                    <div className="text-amber-400">
                      Sesi tanpa anomali: {c.consecutiveInactiveRuns}/2 (Tutup otomatis di sesi ke-2)
                    </div>
                  )}
                </div>

                {/* Triggers Tag List */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {c.activeRuleIds.map((rid) => (
                    <div
                      key={rid}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono"
                    >
                      {getRuleIcon(rid)}
                      <span>{rid.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-teal-400 font-medium group-hover:text-teal-300">
                <span>Periksa Rincian Fakta & Linimasa</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
