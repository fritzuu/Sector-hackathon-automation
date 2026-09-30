/**
 * WatchlistFilingsFeed — official company filings (Keterbukaan Informasi & Transaksi Insider) from Sectors API.
 * Reads directly from the market_snapshots injected by the backend Cron Job.
 */

import React from 'react';
import { FileText, ExternalLink, Clock } from 'lucide-react';
import { useWorkflowStore } from '../../cases/stores/workflow.store.js';
import { CompanyFiling } from '../../../types/sectors.js';

interface WatchlistNewsFeedProps {
  watchlist: string[];
  forceRefreshAt?: number;
}

interface TickerFilings {
  ticker: string;
  items: CompanyFiling[];
}

export const WatchlistNewsFeed: React.FC<WatchlistNewsFeedProps> = ({ watchlist }) => {
  const marketSnapshots = useWorkflowStore((s) => s.marketSnapshots);

  // Directly extract filings from the database snapshots
  const filingsByTicker: TickerFilings[] = watchlist
    .map((ticker) => {
      const snap = marketSnapshots.get(ticker);
      return { ticker, items: snap?.latestFilings || [] };
    })
    .filter((group) => group.items.length > 0);

  // Find the most recent update time across all snapshots
  let latestUpdate = '--:--';
  const allDates = watchlist
    .map(t => marketSnapshots.get(t)?.lastUpdated)
    .filter(Boolean)
    .map(d => new Date(d as string));
  
  if (allDates.length > 0) {
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    latestUpdate = maxDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="bg-secondary/40 border border-border/60 rounded-xl overflow-hidden flex flex-col h-full shadow-sm max-h-[600px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-md">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Keterbukaan Informasi & Transaksi Insider</h2>
            <p className="text-[10px] text-text-muted mt-0.5">Sectors API • Dokumen Resmi IDX</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/50 border border-slate-700/50 rounded-full">
            <Clock className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] font-mono text-slate-300">Update {latestUpdate}</span>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
        {filingsByTicker.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 space-y-2 text-center px-4">
            <FileText className="w-6 h-6 text-slate-600 mb-1" />
            <p className="text-sm text-slate-300 font-medium">Tidak Ada Laporan Baru</p>
            <p className="text-xs text-text-muted">Tidak ada dokumen Keterbukaan Informasi & Transaksi Insider terbaru untuk emiten di Watchlist Anda.</p>
          </div>
        )}

        {filingsByTicker.length > 0 && (
          <div className="space-y-5">
            {filingsByTicker.map((block) => (
              <div key={block.ticker} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 font-mono font-bold text-xs rounded border border-blue-500/20">
                      {block.ticker}
                    </span>
                    <span className="text-xs text-text-muted font-medium uppercase tracking-wide">
                      Pengumuman BEI
                    </span>
                  </div>
                  <a
                    href={`https://sectors.app/idx/${block.ticker}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-text-muted hover:text-blue-400 transition-colors flex items-center gap-1 group"
                  >
                    <span>Lihat di Sectors</span>
                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>

                <div className="space-y-2.5">
                  {block.items.map((item, i) => {
                    // Logic for "NEW" badge (< 14 days old)
                    const isNew = (new Date().getTime() - new Date(item.publishedAt).getTime()) < 14 * 24 * 60 * 60 * 1000;
                    
                    // Format currency nicely (e.g. 2.64 Miliar)
                    const formatIDR = (val?: number) => {
                      if (!val) return '';
                      if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} Miliar`;
                      if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(2)} Juta`;
                      return `Rp ${val.toLocaleString('id-ID')}`;
                    };

                    const isBuy = item.transactionType?.toLowerCase() === 'buy';
                    const isSell = item.transactionType?.toLowerCase() === 'sell';
                    const initials = item.holderName 
                      ? item.holderName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : null;

                    return (
                      <a
                        key={item.id || i}
                        href={item.sourceUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative flex flex-col p-4 rounded-lg bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/50 transition-all overflow-hidden"
                      >
                        {/* Transaction Type Indicator Bar */}
                        {(isBuy || isSell) && (
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${isBuy ? 'bg-emerald-500/80' : 'bg-red-500/80'}`} />
                        )}

                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-3">
                            {initials ? (
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                                {initials}
                              </div>
                            ) : (
                              <FileText className="w-5 h-5 text-slate-500 mt-0.5 group-hover:text-blue-400 transition-colors shrink-0" />
                            )}
                            
                            <div className="flex flex-col gap-1">
                              <h3 className="text-sm font-medium text-slate-200 group-hover:text-blue-300 leading-snug line-clamp-2 transition-colors">
                                {item.title}
                              </h3>
                              
                              {/* Price and Volume details */}
                              {item.amount && item.price && (
                                <p className="text-xs text-slate-400 font-mono">
                                  {item.amount.toLocaleString('id-ID')} lembar @ Rp {item.price.toLocaleString('id-ID')}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Top Right: Money Badge + NEW */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {isNew && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-orange-200 bg-orange-500/20 border border-orange-500/30 rounded uppercase shadow-[0_0_8px_rgba(249,115,22,0.15)] animate-pulse">
                                NEW
                              </span>
                            )}
                            {item.transactionValue && (
                              <span className={`text-xs font-bold font-mono px-2 py-1 rounded bg-slate-950/50 border ${isBuy ? 'text-emerald-400 border-emerald-500/20' : isSell ? 'text-red-400 border-red-500/20' : 'text-slate-300 border-slate-700'}`}>
                                {isBuy ? '+' : isSell ? '-' : ''}{formatIDR(item.transactionValue)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer tags */}
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-3 ml-11">
                          <span>{new Date(item.publishedAt).toLocaleDateString('id-ID')}</span>
                          {(item.category || item.transactionType) && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className={`px-1.5 rounded ${isBuy ? 'bg-emerald-500/10 text-emerald-400' : isSell ? 'bg-red-500/10 text-red-400' : 'bg-slate-800'}`}>
                                {(item.transactionType || item.category || '').toUpperCase()}
                              </span>
                            </>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
