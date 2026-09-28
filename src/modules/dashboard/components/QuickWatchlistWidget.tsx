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
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <div id="tour-watchlist-overview" className="rounded-xl p-5 bg-secondary/50 border border-border shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col font-sans h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
          <List className="w-4 h-4 text-primary" />
          Saham yang Anda Pantau
        </h2>
        <Link 
          to="/dashboard/watchlist"
          className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors group"
        >
          Kelola Watchlist
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {watchlist.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-border rounded-lg bg-bg/30">
          <p className="text-xs text-text-muted">Watchlist Anda masih kosong.</p>
          <Link to="/dashboard/watchlist" className="text-xs font-bold text-primary mt-1 inline-block">
            + Tambah Saham
          </Link>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-2"
        >
          {watchlist.slice(0, 4).map(ticker => (
            <motion.div key={ticker} variants={item}>
              <Link 
                to="/dashboard/watchlist"
                className="group flex items-center justify-between px-4 py-2.5 rounded-lg bg-bg/50 border border-border hover:border-primary/40 hover:bg-secondary transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold font-mono text-[10px] shadow-inner">
                    {ticker.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-text-main font-mono group-hover:text-primary transition-colors">{ticker}</div>
                    <div className="text-[10px] text-text-muted">Emiten IDX</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          ))}
          
          {watchlist.length > 4 && (
            <motion.div variants={item}>
              <Link 
                to="/dashboard/watchlist"
                className="mt-1 block text-center py-2 text-[11px] font-bold text-text-muted hover:text-primary transition-colors bg-bg/30 rounded-lg border border-transparent hover:border-primary/20"
              >
                + {watchlist.length - 4} saham lainnya
              </Link>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};
