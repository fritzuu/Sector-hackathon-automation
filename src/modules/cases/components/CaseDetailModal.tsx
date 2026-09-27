import React, { useState, useEffect } from 'react';
import { CaseState, CaseEvent, RenderedTemplate } from '../../../types/engine.js';
import {
  X, Shield, AlertTriangle, CheckCircle, Clock, ExternalLink,
  TrendingUp, TrendingDown, Activity, FileText, Database,
} from 'lucide-react';
import { liveMarketService, RealTickerMetrics } from '../../../services/liveMarketService.js';
import { IDX_COMPANIES } from '../../../data/idxCompanies.js';

interface CaseDetailModalProps {
  caseItem: CaseState | null;
  events: CaseEvent[];
  template: RenderedTemplate | null;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString('id-ID');
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const vol = (n: number) => `${(n / 1_000_000).toFixed(2)}M`;

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  events,
  template,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<RealTickerMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    if (!caseItem) return;
    let alive = true;
    setLoadingMetrics(true);
    liveMarketService.fetchTickerMetrics(caseItem.symbol)
      .then(m => { if (alive) setMetrics(m); })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingMetrics(false); });
    return () => { alive = false; };
  }, [caseItem?.symbol]);

  if (!caseItem) return null;

  const companyData = IDX_COMPANIES.find(c => c.symbol === caseItem.symbol);
  const companyName = companyData?.name ?? metrics?.name ?? `PT ${caseItem.symbol} Tbk`;
  const companySector = companyData?.sector ?? metrics?.sector ?? 'Emiten Terdaftar IDX';
  const companySubSector = companyData?.subSector ?? '';
  const isAnom = caseItem.status === 'OPEN' || caseItem.status === 'UPDATED';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto font-sans"
      style={{ background: 'rgba(6,10,18,0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0d1424] border border-border rounded-xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-border bg-[#111d2e]">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-teal-950/80 border border-teal-600/40 flex items-center justify-center text-teal-300 font-mono font-bold text-sm flex-shrink-0 mt-0.5">
              {caseItem.symbol}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate">
                  {companyName}
                </h3>
                <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded border ${
                  isAnom
                    ? 'bg-amber-950/40 text-amber-300 border-amber-600/40'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40'
                }`}>
                  {caseItem.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-1 font-mono flex-wrap">
                <span>{companySector}{companySubSector ? ` · ${companySubSector}` : ''}</span>
                <span>•</span>
                <span className="text-slate-500">ID: {caseItem.caseId}</span>
                <span>•</span>
                <span className="text-text-muted">
                  Dibuka: {new Date(caseItem.openedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(caseItem.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-secondary transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Live Market HUD / KPI Strip */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-secondary/80 border border-border">
              <div className="p-2 rounded-lg bg-slate-950/40 border border-border">
                <div className="text-[10px] font-mono text-text-muted">Harga Terakhir</div>
                <div className="text-sm font-bold font-mono text-white mt-0.5">
                  Rp {fmt(metrics.lastPrice)}
                </div>
                <div className={`text-[10px] font-mono font-bold flex items-center gap-0.5 mt-0.5 ${metrics.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {metrics.changePercent >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {pct(metrics.changePercent)}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/40 border border-border">
                <div className="text-[10px] font-mono text-text-muted">Volume Hari Ini</div>
                <div className="text-sm font-bold font-mono text-white mt-0.5">
                  {vol(metrics.todayVolume)} lot
                </div>
                <div className="text-[10px] font-mono text-text-muted mt-0.5">
                  Med: {vol(metrics.medianVolume20d)} lot
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/40 border border-border">
                <div className="text-[10px] font-mono text-text-muted">Rasio Volume</div>
                <div className={`text-sm font-bold font-mono mt-0.5 ${metrics.isVolumeAnomaly ? 'text-amber-400' : 'text-teal-300'}`}>
                  {metrics.volumeMultiplier}x
                </div>
                <div className="text-[10px] font-mono text-text-muted mt-0.5">
                  {metrics.isVolumeAnomaly ? '≥ 2.0x Spike' : 'Batas Wajar'}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/40 border border-border">
                <div className="text-[10px] font-mono text-text-muted">Spread vs IHSG</div>
                <div className={`text-sm font-bold font-mono mt-0.5 ${metrics.isSpreadAnomaly ? 'text-amber-400' : 'text-slate-200'}`}>
                  {pct(metrics.spreadVsIhsg)}
                </div>
                <div className="text-[10px] font-mono text-text-muted mt-0.5">
                  IHSG: {pct(metrics.ihsgChangePercent)}
                </div>
              </div>
            </div>
          )}

          {template && (
            <div className="space-y-3.5">
              {/* Facts Card */}
              <div className="p-4 rounded-xl bg-secondary/90 border border-teal-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4 text-teal-400" />
                    <span>FAKTA (Terverifikasi Data Real Bursa &amp; Sectors API)</span>
                  </div>
                  <span className="text-[10px] font-mono text-teal-400/80 bg-teal-950/50 px-2 py-0.5 rounded border border-teal-800/40">
                    100% Deterministik
                  </span>
                </div>
                <ul className="space-y-2 text-slate-200 pl-1 font-mono text-[11px] leading-relaxed">
                  {template.facts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limited Interpretations */}
              <div className="p-4 rounded-xl bg-secondary/90 border border-sky-500/20 space-y-2">
                <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span>INTERPRETASI TERBATAS (Berdasarkan Parameter Matematika)</span>
                </div>
                <ul className="space-y-1.5 text-text-muted pl-1 text-[11px] leading-relaxed">
                  {template.limitedInterpretations.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-sky-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Unknowns */}
              <div className="p-4 rounded-xl bg-secondary/90 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>BATAS INFORMASI (Tidak Ditebak / Spekulasi)</span>
                </div>
                <ul className="space-y-1.5 text-text-muted pl-1 text-[11px] leading-relaxed">
                  {template.unknowns.map((u, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-text-muted text-[11px] leading-relaxed">
                <strong className="text-amber-300 block mb-1">⚠️ Disclaimer Mandatori:</strong>
                {template.disclaimer}
              </div>
            </div>
          )}

          {/* Official Intelligence Links */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border text-[11px] font-mono">
            <span className="text-text-muted">Verifikasi Langsung ke Sumber Resmi:</span>
            <div className="flex items-center gap-2">
              <a
                href={`https://sectors.app/idx/${caseItem.symbol}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-teal-400 hover:text-teal-300 underline"
              >
                <span>Sectors.app</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">·</span>
              <a
                href="https://www.idx.co.id/id/perusahaan-tercatat/keterbukaan-informasi/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-teal-400 hover:text-teal-300 underline"
              >
                <span>Keterbukaan BEI</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t border-border pt-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Linimasa Perkembangan Kasus ({events.length} Catatan Evaluasi)</span>
            </h4>

            <div className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-secondary">
              {events.map((evt, idx) => (
                <div key={evt.eventId || idx} className="relative">
                  <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-[#0d1424]" />
                  <div className="p-3 rounded-xl bg-secondary/90 border border-border">
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                      <span className="font-bold text-white">Status: {evt.newStatus}</span>
                      <span className="text-text-muted">
                        {new Date(evt.timestamp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed font-mono">{evt.renderedSummary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-border bg-secondary/60 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">
            SIBA Engine · Evaluasi Penutupan 16:30 WIB
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-secondary hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
