/**
 * Live Market Data Service for IDX (Indonesia Stock Exchange)
 * Fetches real market prices, 30-day historical volumes, and calculates real 20-day medians
 * via Yahoo Finance IDX endpoints (proxy /yf → query1.finance.yahoo.com).
 *
 * Token-saving strategy:
 *  - Yahoo Finance (free): used for live price/volume/news — cached with 5-min TTL
 *  - Sectors API (paid): only called when user explicitly runs a workflow audit
 *  - All caches are TTL-keyed so data stays reasonably fresh without hammering APIs
 */

export interface RealTickerMetrics {
  symbol: string;
  name: string;
  sector: string;
  currency: string;
  lastPrice: number;
  changeAmount: number;
  changePercent: number;
  todayVolume: number;
  medianVolume20d: number;
  volumeMultiplier: number;
  ihsgPrice: number;
  ihsgChangePercent: number;
  spreadVsIhsg: number;
  isVolumeAnomaly: boolean;
  isSpreadAnomaly: boolean;
  lastUpdated: string;
  isRealLive: boolean;
}

export interface YFNewsItem {
  title: string;
  link: string;
  publisher: string;
  publishedAt: number; // unix timestamp (seconds)
}

export class MarketDataUnavailableError extends Error {
  constructor(public readonly symbol: string, cause?: unknown) {
    super(`Data pasar untuk ${symbol} tidak tersedia. Coba lagi beberapa saat.`);
    this.name = 'MarketDataUnavailableError';
    if (cause instanceof Error) this.cause = cause;
  }
}

export class IhsgUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Data IHSG tidak tersedia saat ini.');
    this.name = 'IhsgUnavailableError';
    if (cause instanceof Error) this.cause = cause;
  }
}

export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}


/** TTL in milliseconds */
const PRICE_TTL_MS  = 5  * 60 * 1000; // 5 minutes — Yahoo Finance live price
const NEWS_TTL_MS   = 15 * 60 * 1000; // 15 minutes — Yahoo Finance news
const IHSG_TTL_MS   = 5  * 60 * 1000; // 5 minutes — IHSG index

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // Date.now() + TTL
}

export class LiveMarketService {
  private priceCache = new Map<string, CacheEntry<RealTickerMetrics>>();
  private newsCache  = new Map<string, CacheEntry<YFNewsItem[]>>();
  private ihsgCache: CacheEntry<{ price: number; changePercent: number }> | null = null;

  private isFresh<T>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> {
    return !!entry && Date.now() < entry.expiresAt;
  }

  // ── IHSG ─────────────────────────────────────────────────────────────────
  async fetchIhsgIndex(): Promise<{ price: number; changePercent: number }> {
    if (this.isFresh(this.ihsgCache)) return this.ihsgCache.data;

    let res: Response;
    try {
      res = await fetch('/yf/v8/finance/chart/%5EJKSE?interval=1d&range=5d');
    } catch (err) {
      throw new IhsgUnavailableError(err);
    }

    if (!res.ok) throw new IhsgUnavailableError(new Error(`HTTP ${res.status}`));

    let json: any;
    try { json = await res.json(); } catch (err) { throw new IhsgUnavailableError(err); }

    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) throw new IhsgUnavailableError(new Error('Respons JSON tidak mengandung data IHSG.'));

    const price         = Number(meta.regularMarketPrice ?? meta.chartPreviousClose);
    const changePercent = Number(meta.regularMarketChangePercent ?? 0);

    if (!isFinite(price) || price <= 0) {
      throw new IhsgUnavailableError(new Error('Harga IHSG tidak valid dalam respons.'));
    }

    this.ihsgCache = { data: { price, changePercent }, expiresAt: Date.now() + IHSG_TTL_MS };
    return this.ihsgCache.data;
  }

  // ── TICKER METRICS ───────────────────────────────────────────────────────
  /**
   * Fetch real-time metrics for a ticker (IDX or Global) via Yahoo Finance (free).
   * TTL-cached (5 min) to avoid hammering the proxy.
   */
  async fetchTickerMetrics(rawSymbol: string): Promise<RealTickerMetrics> {
    const cleanSym = rawSymbol.trim().toUpperCase();
    const isExplicitGlobal = cleanSym.includes('-') || cleanSym.includes('=') || cleanSym.includes('.');
    const symbol = cleanSym.replace('.JK', '');
    const cached = this.priceCache.get(cleanSym);
    if (this.isFresh(cached)) return cached.data;

    const ihsg = await this.fetchIhsgIndex();

    const candidates = isExplicitGlobal
      ? [cleanSym]
      : [`${symbol}.JK`, symbol];

    let lastError: any = null;
    let validMeta: any = null;
    let validQuote: any = null;
    let targetSym = symbol;

    for (const querySym of candidates) {
      try {
        const res = await fetch(`/yf/v8/finance/chart/${encodeURIComponent(querySym)}?interval=1d&range=1mo`);
        if (res.ok) {
          const data = await res.json();
          const result = data?.chart?.result?.[0];
          if (result?.meta && result?.indicators?.quote?.[0]) {
            validMeta = result.meta;
            validQuote = result.indicators.quote[0];
            targetSym = querySym.replace('.JK', '');
            break;
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!validMeta || !validQuote) {
      throw new MarketDataUnavailableError(symbol, lastError || new Error('Tidak ada data bursa yang ditemukan.'));
    }

    const volumes: number[] = (validQuote.volume ?? []).filter(
      (v: unknown): v is number => typeof v === 'number' && v > 0,
    );

    const latestVolume      = Number(validMeta.regularMarketVolume ?? volumes.at(-1) ?? 0);
    const previous20Volumes = volumes.slice(Math.max(0, volumes.length - 21), volumes.length - 1);
    const median20d         = previous20Volumes.length > 0 ? calculateMedian(previous20Volumes) : 0;
    const volumeMultiplier  = median20d > 0 ? latestVolume / median20d : 0;

    const price         = Number(validMeta.regularMarketPrice ?? validMeta.chartPreviousClose ?? 0);
    const changePercent = Number(validMeta.regularMarketChangePercent ?? 0);
    const changeAmount  = Number(validMeta.regularMarketChange ?? 0);

    if (!isFinite(price) || price <= 0) {
      throw new MarketDataUnavailableError(symbol, new Error('Harga saham tidak valid dalam respons.'));
    }

    const spread = Math.abs(changePercent - ihsg.changePercent);
    const currency = validMeta.currency ?? (targetSym.includes('.JK') || !isExplicitGlobal ? 'IDR' : 'USD');
    const info = {
      name:   validMeta.longName ?? validMeta.shortName ?? `${targetSym}`,
      sector: validMeta.instrumentType === 'CRYPTOCURRENCY' ? 'Crypto Asset' : 'Bursa Efek (Real)',
    };

    const metrics: RealTickerMetrics = {
      symbol:            targetSym,
      name:              info.name,
      sector:            info.sector,
      currency:          currency,
      lastPrice:         price,
      changeAmount:      Number(changeAmount.toFixed(2)),
      changePercent:     Number(changePercent.toFixed(2)),
      todayVolume:       latestVolume,
      medianVolume20d:   Math.round(median20d),
      volumeMultiplier:  Number(volumeMultiplier.toFixed(2)),
      ihsgPrice:         ihsg.price,
      ihsgChangePercent: Number(ihsg.changePercent.toFixed(2)),
      spreadVsIhsg:      Number(spread.toFixed(2)),
      isVolumeAnomaly:   volumeMultiplier >= 2.0,
      isSpreadAnomaly:   spread >= 2.0,
      lastUpdated:       new Date().toLocaleTimeString('id-ID'),
      isRealLive:        true,
    };

    this.priceCache.set(targetSym, { data: metrics, expiresAt: Date.now() + PRICE_TTL_MS });
    this.priceCache.set(cleanSym, { data: metrics, expiresAt: Date.now() + PRICE_TTL_MS });
    return metrics;
  }

  // ── NEWS (Yahoo Finance, free, proxied) ───────────────────────────────────
  /**
   * Fetch recent Yahoo Finance news headlines for an IDX ticker.
   * Returns [] on any error — callers must skip render if empty.
   * TTL-cached (15 min) — news changes slowly, saves bandwidth.
   */
  async fetchTickerNewsYF(rawSymbol: string, maxItems = 3): Promise<YFNewsItem[]> {
    const symbol = rawSymbol.toUpperCase().replace('.JK', '');
    const cached = this.newsCache.get(symbol);
    if (this.isFresh(cached)) return cached.data;

    try {
      // Yahoo Finance v1 search endpoint returns news — no auth needed
      const res = await fetch(
        `/yf/v1/finance/search?q=${symbol}.JK&newsCount=${maxItems}&quotesCount=0&enableFuzzyQuery=false`,
      );
      if (!res.ok) {
        this.newsCache.set(symbol, { data: [], expiresAt: Date.now() + NEWS_TTL_MS });
        return [];
      }
      const json = await res.json();
      const raw: any[] = json?.news ?? [];
      const items: YFNewsItem[] = raw
        .filter((n: any) => n?.title && n?.link)
        .slice(0, maxItems)
        .map((n: any) => ({
          title:       String(n.title),
          link:        String(n.link),
          publisher:   String(n.publisher ?? 'Yahoo Finance'),
          publishedAt: Number(n.providerPublishTime ?? 0),
        }));

      this.newsCache.set(symbol, { data: items, expiresAt: Date.now() + NEWS_TTL_MS });
      return items;
    } catch {
      // Never throw — return empty so UI skips gracefully
      this.newsCache.set(symbol, { data: [], expiresAt: Date.now() + NEWS_TTL_MS });
      return [];
    }
  }

  // ── CACHE MANAGEMENT ─────────────────────────────────────────────────────
  /** Invalidate price + IHSG cache (e.g. on user-triggered refresh). Does NOT clear news. */
  invalidate(symbol?: string): void {
    if (symbol) {
      this.priceCache.delete(symbol.toUpperCase().replace('.JK', ''));
    } else {
      this.priceCache.clear();
      this.ihsgCache = null;
    }
  }

  /** Force-expire news cache for one or all symbols */
  invalidateNews(symbol?: string): void {
    if (symbol) {
      this.newsCache.delete(symbol.toUpperCase().replace('.JK', ''));
    } else {
      this.newsCache.clear();
    }
  }

  /**
   * Bust ALL caches — price, IHSG, and news — in one call.
   * Called at 16:30 WIB market-close so every subsequent fetch gets fresh data.
   */
  invalidateAll(): void {
    this.priceCache.clear();
    this.ihsgCache = null;
    this.newsCache.clear();
    console.log('[LiveMarketService] All caches invalidated — market-close refresh.');
  }
}

export const liveMarketService = new LiveMarketService();
