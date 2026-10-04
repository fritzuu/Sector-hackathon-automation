import React from 'react';
import { Link } from '@tanstack/react-router';
import { List, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickWatchlistWidgetProps {
  watchlist: string[];
}

export const QuickWatchlistWidget: React.FC<QuickWatchlistWidgetProps> = ({ watchlist }) => {
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, x: -15 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <div id="tour-watchlist-overview" className="rounded-2xl p-6 bg-secondary/50 border border-border shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col font-sans h-full">
      {/* Header with High-Contrast Typography Hierarchy */}
      <div className="flex items-start sm:items-center justify-between mb-5 flex-wrap gap-3 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-white tracking-tight">
              Watchlist Saham
            </h2>
            <span className="whitespace-nowrap inline-flex items-center text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-secondary text-primary border border-primary/30">
              {watchlist.length} Emiten
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 font-medium">Saham yang dipantau sistem secara otomatis setiap penutupan bursa (16:30 WIB)</p>
        </div>
        <Link 
          to="/dashboard/watchlist"
          className="text-xs font-extrabold text-primary hover:text-primary-600 flex items-center gap-1.5 transition-colors group uppercase tracking-wide ml-auto sm:ml-0"
        >
          <span>Kelola Watchlist</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {watchlist.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-border rounded-xl bg-bg/30 space-y-2">
          <p className="text-sm font-semibold text-text-muted">Watchlist Anda masih kosong.</p>
          <Link to="/dashboard/watchlist" className="text-xs font-extrabold text-primary hover:underline inline-block uppercase tracking-wide">
            + Tambah Saham ke Watchlist
          </Link>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-3"
        >
          {watchlist.slice(0, 4).map(ticker => (
            <motion.div key={ticker} variants={item}>
              <div
                className="group flex items-center justify-between p-3.5 sm:px-4 sm:py-3.5 rounded-xl bg-bg/70 border border-border hover:border-primary/50 hover:bg-secondary/70 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent font-black font-mono text-sm shadow-inner">
                    {ticker.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-lg font-black text-white font-mono tracking-wide group-hover:text-primary transition-colors">
                      {ticker}
                    </div>
                    <div className="text-xs text-text-muted font-medium">Emiten Terdaftar Bursa Efek Indonesia</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {watchlist.length > 4 && (
            <motion.div variants={item}>
              <Link 
                to="/dashboard/watchlist"
                className="mt-1 block text-center py-3 text-xs font-extrabold text-text-muted hover:text-primary transition-colors bg-bg/40 rounded-xl border border-border/50 hover:border-primary/30"
              >
                + {watchlist.length - 4} saham lainnya di Watchlist Anda
              </Link>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};
