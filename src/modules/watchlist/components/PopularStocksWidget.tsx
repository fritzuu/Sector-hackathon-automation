import React from 'react';
import { TrendingUp, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { MAX_WATCHLIST_SIZE } from '../watchlist.rules';

interface PopularStocksWidgetProps {
  watchlist: string[];
  onAddTicker: (ticker: string) => void;
}

const POPULAR_STOCKS = [
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk.' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia Tbk.' },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk.' },
  { symbol: 'TLKM', name: 'Telkom Indonesia Tbk.' },
  { symbol: 'ASII', name: 'Astra International Tbk.' },
  { symbol: 'AMMN', name: 'Amman Mineral Internasional Tbk.' },
];

export const PopularStocksWidget: React.FC<PopularStocksWidgetProps> = ({ watchlist, onAddTicker }) => {
  const isWatchlistFull = watchlist.length >= MAX_WATCHLIST_SIZE;
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.15, ease: "easeOut" } }
  };

  return (
    <div className="rounded-xl p-5 bg-secondary/30 border border-border flex flex-col font-sans h-full">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-text-main tracking-wide">
          Trending / Populer
        </h2>
      </div>

      {isWatchlistFull && (
        <p role="status" className="mb-3 border-l-2 border-amber-400/70 bg-amber-400/5 px-3 py-2 text-xs leading-5 text-amber-200">
          Batas {MAX_WATCHLIST_SIZE} saham tercapai.
        </p>
      )}

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-2"
      >
        {POPULAR_STOCKS.map(stock => {
          const isAdded = watchlist.includes(stock.symbol);
          const isDisabled = isAdded || isWatchlistFull;

          return (
            <motion.div key={stock.symbol} variants={item}>
              <button
                type="button"
                className={`group flex w-full items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                  isAdded 
                    ? 'bg-bg/30 border-white/5 opacity-70' 
                    : isWatchlistFull
                      ? 'bg-bg/50 border-border/60 cursor-not-allowed opacity-55'
                      : 'bg-bg border-border hover:border-primary/40 hover:bg-secondary cursor-pointer'
                }`}
                disabled={isDisabled}
                aria-label={isAdded ? `${stock.symbol} sudah dipantau` : isWatchlistFull ? `Batas watchlist tercapai, tidak dapat menambah ${stock.symbol}` : `Tambah ${stock.symbol} ke watchlist`}
                onClick={() => {
                  if (!isDisabled) onAddTicker(stock.symbol);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-[10px] shadow-inner ${
                    isAdded ? 'bg-white/5 text-text-muted' : 'bg-primary/10 border border-primary/20 text-primary'
                  }`}>
                    {stock.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className={`text-xs font-bold font-mono transition-colors ${
                      isAdded ? 'text-text-muted' : 'text-text-main group-hover:text-primary'
                    }`}>
                      {stock.symbol}
                    </div>
                    <div className="text-[9px] text-text-muted truncate max-w-[120px]" title={stock.name}>
                      {stock.name}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isAdded ? (
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-accent" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-bg transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
