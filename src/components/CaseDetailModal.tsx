import React from 'react';
import { CaseState, CaseEvent, RenderedTemplate } from '../types/engine.js';
import { X, Shield, Calendar, AlertTriangle, FileCode, CheckCircle, Clock } from 'lucide-react';

interface CaseDetailModalProps {
  caseItem: CaseState | null;
  events: CaseEvent[];
  template: RenderedTemplate | null;
  onClose: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  events,
  template,
  onClose,
}) => {
  if (!caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-3xl bg-[#0d1424] border border-slate-700 rounded-lg shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-teal-950 border border-teal-800/60 flex items-center justify-center text-teal-300 font-mono font-bold text-xs">
              {caseItem.symbol}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Detail Kasus Pemantauan SIBA</h3>
                <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-teal-300 border border-slate-700">
                  {caseItem.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                ID: {caseItem.caseId} • Dibuka: {new Date(caseItem.openedAt).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {template && (
            <div className="space-y-3.5">
              {/* Facts Card */}
              <div className="p-3.5 rounded bg-slate-900/90 border border-teal-500/40 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-teal-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>📌 FAKTA (Terverifikasi Data Sectors API)</span>
                </div>
                <ul className="space-y-1 text-slate-200 pl-1 font-mono text-[11px]">
                  {template.facts.map((f, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-teal-400">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limited Interpretations */}
              <div className="p-3.5 rounded bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-sky-400 font-bold text-xs uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>🔍 INTERPRETASI TERBATAS (Tanpa Prediksi)</span>
                </div>
                <ul className="space-y-1 text-slate-300 pl-1 text-[11px]">
                  {template.limitedInterpretations.map((item, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-sky-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Unknowns */}
              <div className="p-3.5 rounded bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>❓ BELUM DIKETAHUI (Batas Informasi)</span>
                </div>
                <ul className="space-y-1 text-slate-300 pl-1 text-[11px]">
                  {template.unknowns.map((u, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-amber-400">•</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded bg-amber-950/20 border border-amber-500/20 text-slate-400 text-[11px] leading-relaxed">
                <strong className="text-amber-300 block mb-0.5">⚠️ Disclaimer Mandatori:</strong>
                {template.disclaimer}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Linimasa Perkembangan Kasus ({events.length} Catatan)</span>
            </h4>

            <div className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {events.map((evt, idx) => (
                <div key={evt.eventId || idx} className="relative">
                  <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-[#0d1424]" />
                  <div className="p-3 rounded bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-white font-mono">Status: {evt.newStatus}</span>
                      <span className="text-slate-500 font-mono">
                        {new Date(evt.timestamp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{evt.renderedSummary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
