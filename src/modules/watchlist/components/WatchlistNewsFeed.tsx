/**
 * WatchlistNewsFeed — real news headlines from Yahoo Finance (free, proxied).
 *
 * Token strategy:
 *  - Yahoo Finance /v1/finance/search → 0 API tokens (public proxy)
 *  - Sectors API tokens NOT consumed here — only during Run Workflow
 *  - News cached 15 min in liveMarketService to avoid hammering proxy
 *
 * Only renders a card if YF actually returns ≥1 headline for that ticker.
 * If no news → that ticker is skipped silently (no fake/static data).
 *
 * Links:
 *  - Real headline → links to the actual article (Yahoo Finance / media source)
 *  - "Lihat di Sectors" → sectors.app/idx/{ticker}
 */

import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Clock } from 'lucide-react';
import { liveMarketService, YFNewsItem } from '../../../services/liveMarketService.js';

interface WatchlistNewsFeedProps {
  watchlist: string[];
  /** When this value changes the feed busts its news cache and re-fetches immediately. */
  forceRefreshAt?: number;
}

interface TickerNews {
  ticker: string;
  items: YFNewsItem[];
}

export const WatchlistNewsFeed: React.FC<WatchlistNewsFeedProps> = ({ watchlist, forceRefreshAt }) => {
  const [newsByTicker, setNewsByTicker] = useState<TickerNews[]>([]);
  const [loading, setLoading]           = useState(false);
  const [lastFetched, setLastFetched]   = useState<Date | null>(null);

  const fetchAllNews = async () => {
    if (watchlist.length === 0) { setNewsByTicker([]); return; }
    setLoading(true);
    try {
      const results = await Promise.all(
        watchlist.map(async ticker => {
          const items = await liveMarketService.fetchTickerNewsYF(ticker, 3);
          return { ticker, items };
        }),
      );
      // Only keep tickers that actually have headlines
      setNewsByTicker(results.filter(r => r.items.length > 0));
      setLastFetched(new Date());
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and whenever watchlist changes
  useEffect(() => {
    fetchAllNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist.join(',')]);

  // Force-refresh triggered by parent (e.g. 16:30 auto-scheduler)
  useEffect(() => {
    if (!forceRefreshAt) return;
    // Bust the news cache for every ticker in the watchlist
    watchlist.forEach(t => liveMarketService.invalidateNews(t));
    fetchAllNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceRefreshAt]);

  const totalNews = newsByTicker.reduce((sum, t) => sum + t.items.length, 0);

  const handleRefresh = () => {
    // Invalidate news cache so we get fresh data
    watchlist.forEach(t => liveMarketService.invalidateNews(t));
    fetchAllNews();
  };

  if (watchlist.length === 0) return null;

  return (
    <div className="bg-secondary border border-border rounded-lg p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              News &amp; Market Intelligence
              {!loading && totalNews > 0 && (
                <span className="ml-1.5 text-xs font-mono text-text-muted normal-case tracking-normal">
                  ({totalNews} artikel)
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Yahoo Finance · Cache 15 mnt · 0 Sectors Token
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {lastFetched && (
            <span className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
              <Clock className="w-3 h-3" />
              {lastFetched.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-teal-300 border border-border hover:border-teal-600 px-2.5 py-1 rounded transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="p-3.5 rounded-lg border border-border space-y-2 animate-pulse">
              <div className="h-2.5 bg-secondary rounded w-1/3" />
              <div className="h-3 bg-secondary rounded w-full" />
              <div className="h-3 bg-secondary rounded w-4/5" />
              <div className="h-2 bg-secondary rounded w-1/4 mt-3" />
            </div>
          ))}
        </div>
      )}

      {/* No news state */}
      {!loading && newsByTicker.length === 0 && (
        <div className="py-8 text-center border border-dashed border-border rounded-lg bg-secondary/30">
          <Newspaper className="w-6 h-6 text-slate-700 mx-auto mb-2" />
          <p className="text-xs font-semibold text-text-muted">
            Tidak ada berita terbaru dari Yahoo Finance untuk saham di watchlist Anda.
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Data mungkin belum tersedia. Coba refresh beberapa saat lagi.
          </p>
        </div>
      )}

      {/* News cards */}
      {!loading && newsByTicker.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {newsByTicker.flatMap(({ ticker, items }) =>
            items.map((news, idx) => (
              <div
                key={`${ticker}-${idx}`}
                className="p-3.5 rounded-lg bg-secondary/80 border border-border hover:border-border transition-all flex flex-col justify-between gap-2.5"
              >
                <div>
                  {/* Ticker badge + publisher */}
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-teal-300 bg-teal-950/50 px-2 py-0.5 rounded border border-teal-800/40">
                        {ticker}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{news.publisher}</span>
                    </div>
                    <span className="text-[11px] text-slate-600 font-mono flex-shrink-0">
                      {news.publishedAt > 0
                        ? new Date(news.publishedAt * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                        : '—'}
                    </span>
                  </div>

                  {/* Headline — links to actual article */}
                  <a
                    href={news.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs font-semibold text-white hover:text-teal-300 transition-colors line-clamp-3 leading-relaxed"
                  >
                    {news.title}
                  </a>
                </div>

                {/* Footer — only sectors.app/idx link */}
                <div className="pt-2 border-t border-border flex items-center justify-between text-[10px]">
                  <span className="text-slate-600 font-mono">Yahoo Finance</span>
                  <a
                    href={`https://sectors.app/idx/${ticker}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-teal-500 hover:text-teal-300 hover:underline font-semibold transition-colors"
                  >
                    <span>Sectors.app/idx/{ticker}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
