/**
 * WatchlistFilingsFeed — official company filings (Keterbukaan Informasi) from Sectors API.
 * Replaces the unauthorized Yahoo Finance News feed.
 */

import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, RefreshCw, Clock } from 'lucide-react';
import { sectorsApi } from '../../../services/sectorsApi.js';
import { CompanyFiling } from '../../../types/sectors.js';

interface WatchlistNewsFeedProps {
  watchlist: string[];
  forceRefreshAt?: number;
}

interface TickerFilings {
  ticker: string;
  items: CompanyFiling[];
}

export const WatchlistNewsFeed: React.FC<WatchlistNewsFeedProps> = ({ watchlist, forceRefreshAt }) => {
  const [filingsByTicker, setFilingsByTicker] = useState<TickerFilings[]>([]);
  const [loading, setLoading]           = useState(false);
  const [lastFetched, setLastFetched]   = useState<Date | null>(null);

  const fetchAllFilings = async () => {
    if (watchlist.length === 0) { setFilingsByTicker([]); return; }
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        watchlist.map(async (ticker) => {
          const items = await sectorsApi.fetchCompanyFilings(ticker);
          return { ticker, items: items.slice(0, 3) }; // Show max 3 recent filings
        })
      );

      const aggregated: TickerFilings[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value.items.length > 0) {
          aggregated.push(res.value);
        }
      }

      setFilingsByTicker(aggregated);
      setLastFetched(new Date());
    } catch (err) {
      console.warn('[FilingsFeed] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFilings();
    // eslint-disable-next-line
  }, [watchlist, forceRefreshAt]);

  const handleManualRefresh = () => {
    fetchAllFilings();
  };

  const timeStr = lastFetched
    ? lastFetched.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="bg-secondary/40 border border-border/60 rounded-xl overflow-hidden flex flex-col h-full shadow-sm max-h-[600px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-md">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Keterbukaan Informasi</h2>
            <p className="text-[10px] text-text-muted mt-0.5">Sectors API • BEI (IDX)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/50 border border-slate-700/50 rounded-full">
            <Clock className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] font-mono text-slate-300">Update {timeStr}</span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className={`p-1.5 rounded-md hover:bg-white/5 transition-colors group ${loading ? 'opacity-50' : ''}`}
            title="Refresh Keterbukaan Informasi"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-text-muted group-hover:text-blue-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
        {loading && filingsByTicker.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 space-y-3 text-center">
            <RefreshCw className="w-5 h-5 text-text-muted animate-spin" />
            <p className="text-xs text-text-muted font-mono">Mengambil dokumen resmi...</p>
          </div>
        )}

        {!loading && filingsByTicker.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 space-y-2 text-center px-4">
            <FileText className="w-6 h-6 text-slate-600 mb-1" />
            <p className="text-sm text-slate-300 font-medium">Tidak Ada Pengumuman</p>
            <p className="text-xs text-text-muted">Tidak ada dokumen Keterbukaan Informasi terbaru untuk emiten di Watchlist Anda.</p>
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
                  {block.items.map((item, i) => (
                    <a
                      key={item.id || i}
                      href={item.sourceUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex flex-col gap-1.5 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/50 transition-all"
                    >
                      <div className="flex gap-2">
                        <FileText className="w-4 h-4 text-slate-500 mt-0.5 group-hover:text-blue-400 transition-colors shrink-0" />
                        <h3 className="text-sm font-medium text-slate-200 group-hover:text-blue-300 leading-snug line-clamp-2 transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono ml-6">
                        <span>{new Date(item.publishedAt).toLocaleDateString('id-ID')}</span>
                        {item.category && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="truncate max-w-[120px]">{item.category}</span>
                          </>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
