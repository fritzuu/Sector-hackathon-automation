import React from "react";
import { FileText, ExternalLink, Clock } from "lucide-react";
import { useWorkflowStore } from "../../cases/stores/workflow.store.js";
import { CompanyFiling } from "../../../types/sectors.js";

interface WatchlistNewsFeedProps {
  watchlist: string[];
  forceRefreshAt?: number;
}

interface TickerFilings {
  ticker: string;
  items: CompanyFiling[];
}

export const WatchlistNewsFeed: React.FC<WatchlistNewsFeedProps> = ({
  watchlist,
}) => {
  const marketSnapshots = useWorkflowStore((s) => s.marketSnapshots);

  // Directly extract filings from the database snapshots
  const filingsByTicker: TickerFilings[] = watchlist
    .map((ticker) => {
      const snap = marketSnapshots.get(ticker);
      return { ticker, items: snap?.latestFilings || [] };
    })
    .filter((group) => group.items.length > 0);

  // Find the most recent update time across all snapshots
  let latestUpdate = "--:--";
  const allDates = watchlist
    .map((t) => marketSnapshots.get(t)?.lastUpdated)
    .filter(Boolean)
    .map((d) => new Date(d as string));

  if (allDates.length > 0) {
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
    latestUpdate = maxDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="bg-secondary/40 border border-border rounded-2xl overflow-hidden flex flex-col h-full shadow-[0_4px_24px_rgba(0,0,0,0.4)] max-h-[640px] font-sans">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/80 backdrop-blur-md sticky top-0 z-10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Keterbukaan Informasi &amp; Transaksi Insider
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Sectors API • Dokumen Resmi IDX
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-bg/70 border border-border rounded-full">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs font-mono text-text-muted">
              Update {latestUpdate}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
        {filingsByTicker.length === 0 && (
          <div className="flex flex-col items-center justify-center h-44 space-y-2 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-text-muted mb-1">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm text-white font-bold">
              Tidak Ada Laporan Baru
            </p>
            <p className="text-xs text-text-muted max-w-sm">
              Tidak ada dokumen Keterbukaan Informasi &amp; Transaksi Insider
              terbaru untuk emiten di Watchlist Anda.
            </p>
          </div>
        )}

        {filingsByTicker.length > 0 && (
          <div className="space-y-6">
            {filingsByTicker.map((block) => (
              <div key={block.ticker} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 bg-primary/15 text-primary font-mono font-extrabold text-xs rounded-lg border border-primary/30">
                      {block.ticker}
                    </span>
                    <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">
                      Pengumuman Resmi BEI
                    </span>
                  </div>
                  <a
                    href={`https://sectors.app/idx/${block.ticker}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1 group font-semibold"
                  >
                    <span>Lihat di Sectors</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>

                <div className="space-y-3">
                  {block.items.map((item, i) => {
                    const isNew =
                      new Date().getTime() -
                        new Date(item.publishedAt).getTime() <
                      14 * 24 * 60 * 60 * 1000;

                    const formatIDR = (val?: number) => {
                      if (!val) return "";
                      if (val >= 1_000_000_000)
                        return `Rp ${(val / 1_000_000_000).toFixed(2)} Miliar`;
                      if (val >= 1_000_000)
                        return `Rp ${(val / 1_000_000).toFixed(2)} Juta`;
                      return `Rp ${val.toLocaleString("id-ID")}`;
                    };

                    const isBuy = item.transactionType?.toLowerCase() === "buy";
                    const isSell =
                      item.transactionType?.toLowerCase() === "sell";
                    const initials = item.holderName
                      ? item.holderName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : null;

                    return (
                      <a
                        key={`${item.id || item.sourceUrl || "filing"}-${i}`}
                        href={item.sourceUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative flex flex-col p-4 rounded-xl bg-bg/60 hover:bg-secondary/60 border border-border hover:border-primary/40 transition-all overflow-hidden"
                      >
                        {/* Transaction Type Indicator Bar */}
                        {(isBuy || isSell) && (
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${isBuy ? "bg-accent" : "bg-rose-500"}`}
                          />
                        )}

                        <div className="flex flex-col-reverse md:flex-row justify-between items-start gap-4">
                          <div className="flex flex-col w-full md:flex-row gap-3.5">
                            <div className="flex flex-row justify-between">
                              {initials ? (
                                <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                                  {initials}
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-text-muted group-hover:text-primary transition-colors shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}
                              {/* Top Right: Money Badge + NEW */}
                              <div className="flex md:hidden flex-row items-center gap-1.5 shrink-0">
                                {isNew && (
                                  <span className="px-2 py-1 text-[10px] font-bold tracking-wider text-primary bg-primary/20 border border-primary/30 rounded-md uppercase animate-pulse">
                                    NEW
                                  </span>
                                )}
                                {item.transactionValue && (
                                  <span
                                    className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-bg border ${isBuy ? "text-accent border-accent/30" : isSell ? "text-rose-400 border-rose-500/30" : "text-text-muted border-border"}`}
                                  >
                                    {isBuy ? "+" : isSell ? "-" : ""}
                                    {formatIDR(item.transactionValue)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <h3 className="text-sm font-semibold text-white group-hover:text-primary leading-snug transition-colors">
                                {item.title}
                              </h3>

                              {/* Price and Volume details */}
                              {item.amount && item.price && (
                                <p className="text-xs text-text-muted font-mono">
                                  {item.amount.toLocaleString("id-ID")} lembar @
                                  Rp {item.price.toLocaleString("id-ID")}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Top Right: Money Badge + NEW */}
                          <div className="hidden md:flex flex-row items-center gap-1.5 shrink-0">
                            {isNew && (
                              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary bg-primary/20 border border-primary/30 rounded-md uppercase animate-pulse">
                                NEW
                              </span>
                            )}
                            {item.transactionValue && (
                              <span
                                className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-bg border ${isBuy ? "text-accent border-accent/30" : isSell ? "text-rose-400 border-rose-500/30" : "text-text-muted border-border"}`}
                              >
                                {isBuy ? "+" : isSell ? "-" : ""}
                                {formatIDR(item.transactionValue)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer tags */}
                        <div className="flex items-center gap-3 text-xs text-text-muted font-mono mt-3 ml-0 md:ml-12">
                          <span>
                            {new Date(item.publishedAt).toLocaleDateString(
                              "id-ID",
                            )}
                          </span>
                          {(item.category || item.transactionType) && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span
                                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${isBuy ? "bg-accent/10 text-accent border border-accent/20" : isSell ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-secondary text-primary border border-primary/20"}`}
                              >
                                {(
                                  item.transactionType ||
                                  item.category ||
                                  ""
                                ).toUpperCase()}
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
