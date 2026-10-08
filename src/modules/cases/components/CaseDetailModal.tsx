import React from 'react';
import { CaseState, CaseEvent, RenderedTemplate } from '../../../types/engine.js';
import {
  X, Shield, CheckCircle, Clock, ExternalLink,
  TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';
import { useCompanyStore } from "../../../data/companyStore";
import { useWorkflowStore } from '../stores/workflow.store.js';

import { useDialogFocus } from "../../../shared/hooks/useDialogFocus";
import { formatWib } from "../../automation/lib/automationStatus";

interface CaseDetailModalProps {
  caseItem: CaseState | null;
  events: CaseEvent[];
  template: RenderedTemplate | null;
  onClose: () => void;
}

const available = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const fmt = (value?: number | null) => available(value) ? value.toLocaleString('id-ID') : 'Belum tersedia';
const pct = (value?: number | null) => available(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : 'Belum tersedia';
const sessionLabel = (value?: string | null) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
  ? new Date(`${value}T00:00:00+07:00`).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum tercatat';

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  events,
  template,
  onClose,
}) => {
  const rawMetrics = useWorkflowStore(s => caseItem ? s.marketSnapshots.get(caseItem.symbol) : null);

  const dialogRef = useDialogFocus(caseItem?.caseId || null, onClose);
  const volumeAvailable = available(rawMetrics?.todayVolume) && rawMetrics.todayVolume >= 0;
  const baselineAvailable = available(rawMetrics?.medianVolume20d) && rawMetrics.medianVolume20d > 0;
  const ratio = volumeAvailable && baselineAvailable ? rawMetrics.todayVolume / rawMetrics.medianVolume20d : null;
  const matchedSessions = !!rawMetrics?.sessionDate && rawMetrics.sessionDate === rawMetrics.ihsgSessionDate;
  const spread = matchedSessions && available(rawMetrics?.changePercent) && available(rawMetrics?.ihsgChangePercent)
    ? rawMetrics.changePercent - rawMetrics.ihsgChangePercent : null;
  const metrics = rawMetrics ? { ...rawMetrics, volumeMultiplier: ratio, spreadVsIhsg: spread,
    isVolumeAnomaly: ratio !== null && ratio >= 2, isSpreadAnomaly: spread !== null && Math.abs(spread) >= 2,
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-detail-title"
        tabIndex={-1}
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
                <h3 id="case-detail-title" className="text-lg sm:text-xl font-extrabold text-white truncate tracking-tight">
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
                <span>{companySector}{companySubSector && companySubSector !== companySector ? ` · ${companySubSector}` : ''}</span>
                <span>•</span>
                <span className="text-text-muted/80">ID: {caseItem.caseId}</span>
                <span>•</span>
                <span className="text-text-muted">
                  Dibuka: {formatWib(caseItem.openedAt)}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup detail kasus"
            onClick={onClose}
            className="min-h-11 min-w-11 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-xl text-text-muted hover:text-white hover:bg-secondary transition-colors flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {events[0]?.newStatus === 'DATA_INCOMPLETE' && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300"><strong>Menunggu data sumber.</strong> {(events[0].dataQualityIssues || []).join(' · ')} Status kasus {caseItem.status} tetap dipertahankan.</div>}
          <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-text-muted">
            <p>Sesi saham: <strong className="text-text-main">{sessionLabel(metrics?.sessionDate)}</strong> · Sesi IHSG: <strong className="text-text-main">{sessionLabel(metrics?.ihsgSessionDate)}</strong></p>
            <p className="mt-1 text-xs">Snapshot diperbarui: {formatWib(metrics?.lastUpdated || null)}. Waktu pembaruan berbeda dari tanggal perdagangan.</p>
            {!matchedSessions && <p className="mt-2 text-amber-300">Perbandingan dengan IHSG menunggu tanggal sesi yang cocok dan tercatat.</p>}
          </div>
          {metrics ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="text-xs text-text-muted">Harga penutupan terakhir</div>
                <div className="text-lg font-bold font-mono text-text-main mt-2">{available(metrics.lastPrice) ? `Rp ${fmt(metrics.lastPrice)}` : 'Belum tersedia'}</div>
                <p className={`mt-1 text-sm ${!available(metrics.changePercent) || metrics.changePercent === 0 ? 'text-text-muted' : metrics.changePercent > 0 ? 'text-accent' : 'text-rose-400'}`}>{pct(metrics.changePercent)}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="text-xs text-text-muted">Volume sesi terakhir</div>
                <div className="text-lg font-bold font-mono text-text-main mt-2">{volumeAvailable ? fmt(metrics.todayVolume) : 'Belum tersedia'}</div>
                <p className="mt-1 text-xs text-text-muted">{volumeAvailable ? 'lembar saham' : 'Data volume belum tersedia'}</p>
                <p className="mt-2 text-xs text-text-muted">Median 20 sesi: {baselineAvailable ? `${fmt(metrics.medianVolume20d)} lembar` : 'Belum tersedia'}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="text-xs text-text-muted">Rasio volume</div>
                <div className={`text-lg font-bold font-mono mt-2 ${ratio === null ? 'text-text-muted' : metrics.isVolumeAnomaly ? 'text-amber-300' : 'text-text-main'}`}>{ratio !== null ? `${ratio.toFixed(2)}×` : 'Belum tersedia'}</div>
                <p className="mt-1 text-xs text-text-muted">{ratio === null ? 'Memerlukan volume dan baseline valid' : metrics.isVolumeAnomaly ? 'Mencapai ambang 2× median' : 'Di bawah ambang 2× median'}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="text-xs text-text-muted">Selisih perubahan vs IHSG</div>
                <div className={`text-lg font-bold font-mono mt-2 ${spread === null ? 'text-text-muted' : metrics.isSpreadAnomaly ? 'text-amber-300' : 'text-text-main'}`}>{spread !== null ? `${spread > 0 ? '+' : ''}${spread.toFixed(2)} poin` : 'Belum tersedia'}</div>
                <p className="mt-1 text-xs text-text-muted">{matchedSessions ? `IHSG: ${pct(metrics.ihsgChangePercent)}` : 'Tanggal sesi belum cocok atau belum tercatat'}</p>
              </div>
            </div>
          ) : <p className="rounded-xl border border-border p-4 text-sm text-text-muted">Snapshot pasar belum tersedia. Riwayat kasus tetap dapat dibaca di bawah.</p>}

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
                <strong className="text-amber-400 block mb-1 font-semibold">Catatan:</strong>
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
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Linimasa Perkembangan Kasus ({events.length} Catatan Evaluasi)</span>
            </h4>

            <div className="relative pl-7 space-y-4 before:absolute before:left-2.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60 before:border-l-2 before:border-dashed before:border-border/50">
              {events.map((evt, idx) => {
                let styles = {
                  icon: AlertTriangle,
                  iconColor: 'text-gray-400',
                  bgColor: 'bg-secondary/60',
                  borderColor: 'border-border',
                  ringColor: 'ring-border/50',
                };
                
                if (evt.newStatus === 'OPEN') {
                  styles = { icon: AlertCircle, iconColor: 'text-red-400', bgColor: 'bg-red-400/10', borderColor: 'border-red-400/30', ringColor: 'ring-red-500/20' };
                } else if (evt.newStatus === 'UPDATED') {
                  styles = { icon: Activity, iconColor: 'text-cyan-400', bgColor: 'bg-cyan-400/10', borderColor: 'border-cyan-400/30', ringColor: 'ring-cyan-500/20' };
                } else if (evt.newStatus === 'CLOSED') {
                  styles = { icon: CheckCircle2, iconColor: 'text-emerald-400', bgColor: 'bg-emerald-400/10', borderColor: 'border-emerald-400/30', ringColor: 'ring-emerald-500/20' };
                }

                const Icon = styles.icon;

                return (
                  <div key={evt.eventId || idx} className="relative">
                    <div className={`absolute -left-7 top-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-surface ring-4 ring-surface`}>
                      <Icon className={`w-3.5 h-3.5 ${styles.iconColor} bg-surface`} />
                    </div>
                    
                    <div className={`p-3.5 rounded-xl ${styles.bgColor} border ${styles.borderColor} shadow-sm backdrop-blur-sm transition-colors`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-1.5 font-mono gap-1 sm:gap-0">
                        <span className={`font-bold ${styles.iconColor}`}>Status: {evt.newStatus}</span>
                        <span className="text-text-muted">
                          {formatWib(evt.timestamp)}
                        </span>
                      </div>
                      {evt.triggeredRules && evt.triggeredRules.length > 0 ? (
                        <div className="mt-1 space-y-2.5">
                          {evt.triggeredRules.filter(r => r.isTriggered).map((rule) => {
                            let RuleIcon = Activity;
                            if (rule.ruleId === 'ABNORMAL_VOLUME') RuleIcon = TrendingUp;
                            if (rule.ruleId === 'RELATIVE_MOVEMENT') RuleIcon = TrendingDown;
                            if (rule.ruleId === 'NEW_FILING') RuleIcon = FileText;
                            
                            return (
                              <div key={rule.ruleId} className="flex flex-col gap-1.5">
                                <span className={`inline-flex w-fit items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold font-mono ${styles.bgColor} ${styles.iconColor} border ${styles.borderColor}`}>
                                  <RuleIcon className="w-3 h-3" />
                                  {rule.name.split(' (')[0]}
                                </span>
                                <p className="text-xs text-white/90 leading-relaxed font-sans">{rule.summary}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-white/90 leading-relaxed font-sans mt-1">{evt.renderedSummary}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-secondary/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs font-mono text-text-muted">
            SIBA Engine · Evaluasi Pagi 07:00 WIB
          </span>
          <button
            type="button"
            aria-label="Tutup detail kasus"
            onClick={onClose}
            className="min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary px-5 py-2 text-sm font-bold text-white bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/40 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
