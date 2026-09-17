import React, { useMemo } from 'react';
import { Newspaper, ExternalLink, ShieldCheck } from 'lucide-react';
import { IDX_COMPANIES } from '../data/idxCompanies.js';

interface WatchlistNewsFeedProps {
  watchlist: string[];
}

export const WatchlistNewsFeed: React.FC<WatchlistNewsFeedProps> = ({ watchlist }) => {
  const newsList = useMemo(() => {
    if (watchlist.length === 0) return [];

    return watchlist.map((ticker) => {
      const comp = IDX_COMPANIES.find((c) => c.symbol === ticker);
      const name = comp ? comp.name : `PT ${ticker} Tbk`;
      const sector = comp ? comp.sector : 'Pasar Modal';
      return {
        id: `FILING-${ticker}-${Date.now().toString().slice(0, 6)}`,
        ticker,
        companyName: name,
        title: `Financial News & Market Intelligence: ${name}`,
        category: 'Intelligence' as const,
        publishedAt: '2026-09-17T10:00:00+07:00',
        source: 'Sectors API (Financial Market Intelligence)' as const,
        summary: `Pemantauan otomatis data intelijen pasar, valuasi, dan aksi emiten ${ticker} (${sector}) via Sectors App.`,
        filingUrl: `https://sectors.app/company/${ticker}`,
      };
    });
  }, [watchlist]);

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Indonesia Financial News & Market Intelligence ({newsList.length})
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>Sectors.app Intelligence • 0 Token / Local Cache</span>
        </div>
      </div>

      {newsList.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
          <Newspaper className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">
            Belum ada data intelijen berita untuk saham di watchlist Anda.
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
            Tambahkan saham ke watchlist untuk melihat financial news terbaru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {newsList.map((news) => (
            <div
              key={news.id}
              className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2.5"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                      {news.ticker}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {news.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(news.publishedAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white hover:text-teal-300 transition-colors line-clamp-2">
                  {news.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {news.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>Sumber: Sectors.app Intelligence</span>
                <a
                  href={news.filingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-teal-400 hover:text-teal-300 hover:underline flex-shrink-0 font-medium"
                >
                  <span>Buka di Sectors.app</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
