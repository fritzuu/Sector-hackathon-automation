import React from 'react';
import { Database } from 'lucide-react';

export const SectorsApiBadge: React.FC = () => {
  return (
    <div
      className="p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans"
      style={{
        background: 'hsl(301, 100%, 7%)',
        border: '1px solid hsl(301, 60%, 25%)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'hsl(301, 100%, 15%)', border: '1px solid hsl(288, 100%, 70%)/30' }}
        >
          <Database className="w-3.5 h-3.5 text-[hsl(288,100%,70%)]" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-white tracking-wide">Sectors API v2 Core Pipeline</span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ background: 'hsl(141, 100%, 10%)', color: 'hsl(141, 100%, 50%)', border: '1px solid hsl(141, 100%, 30%)' }}
            >
              Terverifikasi Aktif
            </span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Semua transaksi harian, perbandingan IHSG, dan keterbukaan informasi diambil resmi dari Sectors API v2.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
        <span
          className="px-2 py-0.5 rounded"
          style={{ background: 'hsl(288, 100%, 10%)', color: 'hsl(288, 100%, 75%)', border: '1px solid hsl(288, 100%, 25%)' }}
        >
          GET /v2/daily/&lt;ticker&gt;
        </span>
        <span
          className="px-2 py-0.5 rounded"
          style={{ background: 'hsl(220, 100%, 10%)', color: 'hsl(220, 100%, 75%)', border: '1px solid hsl(220, 100%, 25%)' }}
        >
          GET /v2/idx-index/
        </span>
        <span
          className="px-2 py-0.5 rounded"
          style={{ background: 'hsl(40, 100%, 10%)', color: 'hsl(40, 100%, 65%)', border: '1px solid hsl(40, 100%, 25%)' }}
        >
          GET /v2/filings/&lt;ticker&gt;
        </span>
      </div>
    </div>
  );
};
