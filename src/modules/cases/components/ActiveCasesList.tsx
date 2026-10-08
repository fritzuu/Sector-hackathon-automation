import React from "react";
import { CaseState, CaseStatus } from "../../../types/engine.js";
import {
  ShieldAlert,
  ArrowRight,
  Zap,
  FileText,
  TrendingUp,
  AlertOctagon,
} from "lucide-react";

interface ActiveCasesListProps {
  cases: CaseState[];
  onSelectCase: (caseItem: CaseState) => void;
  waitingCaseIds?: Set<string>;
  eventCounts?: Map<string, number>;
}

export const ActiveCasesList: React.FC<ActiveCasesListProps> = ({
  cases,
  onSelectCase,
  waitingCaseIds,
  eventCounts,
}) => {
  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-accent/15 text-accent border border-accent/30">
            OPEN (Kasus Baru)
          </span>
        );
      case "UPDATED":
        return (
          <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            UPDATED (Pembaruan)
          </span>
        );
      case "MONITORING":
        return (
          <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-secondary text-primary border border-primary/30">
            MONITORING (Dipantau)
          </span>
        );
      case "CLOSED":
        return (
          <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-secondary text-text-muted border border-border">
            CLOSED (Ditutup)
          </span>
        );
      case "DATA_INCOMPLETE":
        return (
          <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            DATA INCOMPLETE
          </span>
        );
      default:
        return null;
    }
  };

  const getRuleIcon = (ruleId: string) => {
    switch (ruleId) {
      case "ABNORMAL_VOLUME":
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case "RELATIVE_MOVEMENT":
        return <TrendingUp className="w-3.5 h-3.5 text-primary" />;
      case "NEW_FILING":
        return <FileText className="w-3.5 h-3.5 text-accent" />;
      default:
        return <AlertOctagon className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  return (
    <div
      id="tour-cases-content"
      className="rounded-2xl p-6 space-y-5 font-sans bg-secondary/50 border border-border shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Kasus Pemantauan Terbuka</span>
              <span className="whitespace-nowrap inline-flex item-center text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-secondary text-primary border border-primary/30">
                {cases.length} Kasus
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Daftar anomali bursa yang sedang dalam pemantauan otomatis
            </p>
          </div>
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-border rounded-xl bg-bg/30 space-y-2">
          <ShieldAlert className="w-8 h-8 text-primary/40 mx-auto" />
          <p className="text-sm font-bold text-white">
            Belum ada kasus pemantauan yang terbuka.
          </p>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Sistem akan secara otomatis mendeteksi anomali volume, pergerakan
            relatif vs IHSG, dan keterbukaan informasi setiap hari bursa
            pukul 07:00 WIB.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cases.map((c) => (
            <article
              key={c.caseId}
              className="p-5 rounded-2xl bg-bg/70 hover:bg-secondary/60 border border-border hover:border-primary/40 transition-all group flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between mb-3">
                  <span className="text-base font-extrabold font-mono text-white group-hover:text-primary transition-colors">
                    {c.symbol}
                  </span>
                  {getStatusBadge(c.status)}
                </div>

                {waitingCaseIds?.has(c.caseId) && <p className="mb-3 text-sm text-amber-300">Menunggu kelengkapan data sumber · status kasus dipertahankan</p>}
                <div className="text-xs text-text-muted space-y-1 mb-4 font-mono">
                  <div>
                    ID Kasus:{" "}
                    <span className="text-white font-medium">{c.caseId}</span>
                  </div>
                  <div>
                    Dibuka:{" "}
                    <span className="text-white font-medium">
                      {new Date(c.openedAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  <div>
                    Riwayat:{" "}
                    <span className="text-primary font-bold">
                      {eventCounts?.get(c.caseId) ?? c.eventsCount} catatan evaluasi
                    </span>
                  </div>
                  {c.consecutiveInactiveRuns > 0 && (
                    <div className="text-amber-400 font-bold">
                      Sesi tanpa anomali: {c.consecutiveInactiveRuns}/2 (Tutup
                      otomatis di sesi ke-2)
                    </div>
                  )}
                </div>

                {/* Triggers Tag List */}
                <div className="flex flex-wrap gap-2">
                  {c.activeRuleIds.map((rid) => (
                    <div
                      key={rid}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-secondary border border-primary/30 text-xs text-primary font-mono"
                    >
                      {getRuleIcon(rid)}
                      <span>{rid.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => onSelectCase(c)} aria-label={`Lihat detail kasus ${c.symbol}`} aria-haspopup="dialog" className="min-h-11 w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-primary font-bold group-hover:text-accent transition-colors">
                <span>Periksa Rincian Fakta &amp; Linimasa</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
