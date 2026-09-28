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
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-accent/20 text-accent border border-accent/40">
            OPEN (Kasus Baru)
          </span>
        );
      case 'UPDATED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-950/60 text-amber-300 border border-amber-700">
            UPDATED (Perkembangan Baru)
          </span>
        );
      case 'MONITORING':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-secondary text-primary border border-primary/40">
            MONITORING (Dipantau)
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-secondary/50 text-text/40 border border-border">
            CLOSED (Ditutup)
          </span>
        );
      case 'DATA_INCOMPLETE':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-950/60 text-rose-300 border border-rose-700">
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
        return <TrendingUp className="w-3.5 h-3.5 text-primary" />;
      case 'NEW_FILING':
        return <FileText className="w-3.5 h-3.5 text-accent" />;
      default:
        return <AlertOctagon className="w-3.5 h-3.5 text-text/40" />;
    }
  };

  return (
    <div
      id="tour-cases-content"
      className="rounded-xl p-5 space-y-4 font-sans bg-secondary/50 border border-border shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Kasus Pemantauan Terbuka ({cases.length})
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 self-start sm:self-auto px-2 py-0.5 bg-bg border border-border rounded text-[11px] text-text/60 font-mono">
          <span>P0-05 Stateful Timeline</span>
        </div>
      </div>

      {cases.length === 0 ? (
        <div
          className="py-8 text-center border border-dashed rounded-xl space-y-1"
          style={{
            backgroundColor: 'var(--color-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <ShieldAlert className="w-6 h-6 text-primary/40 mx-auto mb-2" />
          <p className="text-xs font-semibold text-text/70">Belum ada kasus pemantauan yang terbuka.</p>
          <p className="text-[11px] text-text/50">
            Klik tombol "Jalankan Run" di atas untuk memicu evaluasi otomatis atas saham watchlist Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {cases.map((c) => (
            <div
              key={c.caseId}
              onClick={() => onSelectCase(c)}
              className="p-4 rounded-xl bg-bg hover:bg-secondary/40 border border-border hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold font-mono text-white group-hover:text-primary transition-colors">
                    {c.symbol}
                  </span>
                  {getStatusBadge(c.status)}
                </div>

                <div className="text-[11px] text-text/60 space-y-1 mb-3 font-mono">
                  <div>ID Kasus: <span className="text-text/90">{c.caseId}</span></div>
                  <div>Dibuka: <span className="text-text/90">{new Date(c.openedAt).toLocaleDateString('id-ID')}</span></div>
                  <div>Riwayat: <span className="text-text/90 font-bold">{c.eventsCount} pembaruan tercatat</span></div>
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
                      className="flex items-center space-x-1 px-2 py-0.5 rounded bg-secondary border border-primary/30 text-[10px] text-primary font-mono"
                    >
                      {getRuleIcon(rid)}
                      <span>{rid.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-border flex items-center justify-between text-xs text-primary font-medium group-hover:text-accent">
                <span>Periksa Rincian Fakta &amp; Linimasa</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
