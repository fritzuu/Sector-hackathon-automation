import React from 'react';
import { CaseState, CaseEvent, RenderedTemplate } from '../../../types/engine.js';
import {
  X, Shield, CheckCircle, Clock, ExternalLink,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { useCompanyStore } from "../../../data/companyStore";
import { useWorkflowStore } from '../stores/workflow.store.js';

interface CaseDetailModalProps {
  caseItem: CaseState | null;
  events: CaseEvent[];
  template: RenderedTemplate | null;
  onClose: () => void;
}

const fmt = (n?: number)  => (n ?? 0).toLocaleString('id-ID');
const pct = (n?: number) => `${(n || 0) >= 0 ? '+' : ''}${(n || 0).toFixed(2)}%`;
const vol = (n?: number) => `${((n || 0) / 1_000_000).toFixed(2)}M`;

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  events,
  template,
  onClose,
}) => {
  const rawMetrics = useWorkflowStore(s => caseItem ? s.marketSnapshots.get(caseItem.symbol) : null);

  const metrics = rawMetrics ? {
    ...rawMetrics,
    volumeMultiplier: rawMetrics.volumeMultiplier ?? (rawMetrics.medianVolume20d > 0 ? Number((rawMetrics.todayVolume / rawMetrics.medianVolume20d).toFixed(2)) : 0),
    isVolumeAnomaly: rawMetrics.isVolumeAnomaly ?? (rawMetrics.todayVolume >= (rawMetrics.medianVolume20d * 2)),
    isSpreadAnomaly: rawMetrics.isSpreadAnomaly ?? (Math.abs((rawMetrics.changePercent||0) - (rawMetrics.ihsgChangePercent||0)) >= 2.0),
    spreadVsIhsg: rawMetrics.spreadVsIhsg ?? Math.abs((rawMetrics.changePercent||0) - (rawMetrics.ihsgChangePercent||0))
  } : null;

  if (!caseItem) return null;

  const companyData = useCompanyStore.getState().getCompany(caseItem.symbol);
  const companyName = companyData?.name ?? metrics?.name ?? `PT ${caseItem.symbol} Tbk`;
  const companySector = companyData?.sector ?? metrics?.sector ?? 'Emiten Terdaftar IDX';
  const companySubSector = companyData?.subSector ?? '';
  const isAnom = caseItem.status === 'OPEN' || caseItem.status === 'UPDATED';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-bg/85 backdrop-blur-md font-sans"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-3xl bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-border bg-secondary/70 backdrop-blur-md">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-mono font-black text-base flex-shrink-0 mt-0.5 shadow-inner">
              {caseItem.symbol}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-extrabold text-white truncate tracking-tight">
                  {companyName}
                </h3>
                <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border ${
                  isAnom
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-accent/15 text-accent border border-accent/30'
                }`}>
                  {caseItem.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-1 font-mono flex-wrap">
                <span>{companySector}{companySubSector ? ` · ${companySubSector}` : ''}</span>
                <span>•</span>
                <span className="text-text-muted/80">ID: {caseItem.caseId}</span>
                <span>•</span>
                <span className="text-text-muted">
                  Dibuka: {new Date(caseItem.openedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(caseItem.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-secondary transition-colors flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Live Market HUD / KPI Strip */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border">
              <div className="p-2.5 rounded-lg bg-bg/70 border border-border">
                <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">Harga Terakhir</div>
                <div className="text-base font-extrabold font-mono text-white mt-0.5">
                  Rp {fmt(metrics.lastPrice)}
                </div>
                <div className={`text-xs font-mono font-bold flex items-center gap-1 mt-0.5 ${metrics.changePercent >= 0 ? 'text-accent' : 'text-rose-400'}`}>
                  {metrics.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {pct(metrics.changePercent)}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-bg/70 border border-border">
                <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">Volume Hari Ini</div>
                <div className="text-base font-extrabold font-mono text-white mt-0.5">
                  {vol(metrics.todayVolume)} lot
                </div>
                <div className="text-[11px] font-mono text-text-muted mt-0.5">
                  Med: {vol(metrics.medianVolume20d)} lot
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-bg/70 border border-border">
                <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">Rasio Volume</div>
                <div className={`text-base font-extrabold font-mono mt-0.5 ${metrics.isVolumeAnomaly ? 'text-amber-400' : 'text-accent'}`}>
                  {metrics.volumeMultiplier}x
                </div>
                <div className="text-[11px] font-mono text-text-muted mt-0.5">
                  {metrics.isVolumeAnomaly ? '≥ 2.0x Spike' : 'Batas Wajar'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-bg/70 border border-border">
                <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">Spread vs IHSG</div>
                <div className={`text-base font-extrabold font-mono mt-0.5 ${metrics.isSpreadAnomaly ? 'text-amber-400' : 'text-white'}`}>
                  {pct(metrics.spreadVsIhsg)}
                </div>
                <div className="text-[11px] font-mono text-text-muted mt-0.5">
                  IHSG: {pct(metrics.ihsgChangePercent)}
                </div>
              </div>
            </div>
          )}

          {template && (
            <div className="space-y-4">
              {/* Facts Card */}
              <div className="p-4.5 rounded-xl bg-secondary/60 border border-accent/30 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>FAKTA (Terverifikasi Data Real Bursa &amp; Sectors API)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
                    100% Deterministik
                  </span>
                </div>
                <ul className="space-y-2 text-white/90 pl-1 font-mono text-xs leading-relaxed">
                  {template.facts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limited Interpretations */}
              <div className="p-4.5 rounded-xl bg-secondary/60 border border-primary/30 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>INTERPRETASI TERBATAS (Berdasarkan Parameter Matematika)</span>
                </div>
                <ul className="space-y-1.5 text-text-muted pl-1 text-xs leading-relaxed">
                  {template.limitedInterpretations.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-text-muted text-xs leading-relaxed">
                <strong className="text-amber-400 block mb-1 font-semibold">⚠️ Disclaimer Mandatori:</strong>
                {template.disclaimer}
              </div>
            </div>
          )}

          {/* Official Intelligence Links */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border text-xs font-mono flex-wrap gap-2">
            <span className="text-text-muted">Verifikasi Langsung ke Sumber Resmi:</span>
            <div className="flex items-center gap-3">
              <a
                href={`https://sectors.app/idx/${caseItem.symbol}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-primary hover:text-primary-600 font-semibold underline transition-colors"
              >
                <span>Sectors.app</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-border">·</span>
              <a
                href="https://www.idx.co.id/id/perusahaan-tercatat/keterbukaan-informasi/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-primary hover:text-primary-600 font-semibold underline transition-colors"
              >
                <span>Keterbukaan BEI</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t border-border pt-5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Linimasa Perkembangan Kasus ({events.length} Catatan Evaluasi)</span>
            </h4>

            <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {events.map((evt, idx) => (
                <div key={evt.eventId || idx} className="relative">
                  <div className="absolute -left-6 top-2 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-surface" />
                  <div className="p-3.5 rounded-xl bg-secondary/60 border border-border">
                    <div className="flex items-center justify-between text-xs mb-1 font-mono">
                      <span className="font-bold text-white">Status: {evt.newStatus}</span>
                      <span className="text-text-muted">
                        {new Date(evt.timestamp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed font-mono">{evt.renderedSummary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-secondary/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs font-mono text-text-muted">
            SIBA Engine · Evaluasi Pagi 07:00 WIB
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/40 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
