import React from 'react';
import { Database, CheckCircle } from 'lucide-react';

export const SectorsApiBadge: React.FC = () => {
  return (
    <div className="bg-[#0f172a] p-3.5 rounded-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-sans">
      <div className="flex items-center space-x-3">
        <div className="w-7 h-7 rounded bg-teal-950 text-teal-400 border border-teal-800/60 flex items-center justify-center flex-shrink-0">
          <Database className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white tracking-wide">Sectors API v2 Core Pipeline</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Terverifikasi Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Semua transaksi harian, perbandingan IHSG, dan keterbukaan informasi diambil resmi dari Sectors API v2.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-slate-300">
        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-teal-300">
          GET /v2/daily/&lt;ticker&gt;
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300">
          GET /v2/idx-index/
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
          GET /v2/filings/&lt;ticker&gt;
        </span>
      </div>
    </div>
  );
};
