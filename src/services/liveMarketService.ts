/**
 * Live Market Data Service for IDX (Indonesia Stock Exchange)
 * Fetches real market prices, 30-day historical volumes, and calculates real 20-day medians
 * via Yahoo Finance IDX endpoints.
 *
 * No hardcoded fallback data. If the API is unreachable, throws a typed error
 * so callers can surface an honest failure state to the user.
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

const STOCK_METADATA: Record<string, { name: string; sector: string }> = {
  BBCA: { name: 'PT Bank Central Asia Tbk',                    sector: 'Perbankan Swasta (Big 4)' },
  TLKM: { name: 'PT Telkom Indonesia (Persero) Tbk',           sector: 'Infrastruktur Telekomunikasi' },
  ASII: { name: 'PT Astra International Tbk',                  sector: 'Otomotif & Industri Alat Berat' },
  BBNI: { name: 'PT Bank Negara Indonesia (Persero) Tbk',      sector: 'Perbankan BUMN' },
  BBRI: { name: 'PT Bank Rakyat Indonesia (Persero) Tbk',      sector: 'Perbankan Mikro & BUMN' },
  BMRI: { name: 'PT Bank Mandiri (Persero) Tbk',               sector: 'Perbankan Korporasi BUMN' },
  UNTR: { name: 'PT United Tractors Tbk',                      sector: 'Alat Berat & Kontraktor Tambang' },
  ICBP: { name: 'PT Indofood CBP Sukses Makmur Tbk',           sector: 'Barang Konsumen Primer' },
};

export class LiveMarketService {
  private cache    = new Map<string, RealTickerMetrics>();
  private ihsgCache: { price: number; changePercent: number } | null = null;

  /**
   * Fetch IHSG index data.
   * Throws IhsgUnavailableError if the request fails or returns no usable data.
   */
  async fetchIhsgIndex(): Promise<{ price: number; changePercent: number }> {
    if (this.ihsgCache) return this.ihsgCache;

    let res: Response;
    try {
      res = await fetch('/yf/v8/finance/chart/%5EJKSE?interval=1d&range=5d');
    } catch (err) {
      throw new IhsgUnavailableError(err);
    }

    if (!res.ok) {
      throw new IhsgUnavailableError(new Error(`HTTP ${res.status}`));
    }

    let json: any;
    try {
      json = await res.json();
    } catch (err) {
      throw new IhsgUnavailableError(err);
    }

    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) throw new IhsgUnavailableError(new Error('Respons JSON tidak mengandung data IHSG.'));

    const price         = Number(meta.regularMarketPrice ?? meta.chartPreviousClose);
    const changePercent = Number(meta.regularMarketChangePercent ?? 0);

    if (!isFinite(price) || price <= 0) {
      throw new IhsgUnavailableError(new Error('Harga IHSG tidak valid dalam respons.'));
    }

    this.ihsgCache = { price, changePercent };
    return this.ihsgCache;
  }

  /**
   * Fetch real-time metrics for a single IDX ticker.
   * Throws MarketDataUnavailableError if the request fails or data is unusable.
   * Callers should catch this and surface an honest error state — no silent fallback.
   */
  async fetchTickerMetrics(rawSymbol: string): Promise<RealTickerMetrics> {
    const symbol = rawSymbol.toUpperCase().replace('.JK', '');

    if (this.cache.has(symbol)) return this.cache.get(symbol)!;

    // IHSG is required for spread calculation; propagate its error upward
    const ihsg = await this.fetchIhsgIndex();

    let res: Response;
    try {
      res = await fetch(`/yf/v8/finance/chart/${symbol}.JK?interval=1d&range=1mo`);
    } catch (err) {
      throw new MarketDataUnavailableError(symbol, err);
    }

    if (!res.ok) {
      throw new MarketDataUnavailableError(symbol, new Error(`HTTP ${res.status}`));
    }

    let data: any;
    try {
      data = await res.json();
    } catch (err) {
      throw new MarketDataUnavailableError(symbol, err);
    }

    const result = data?.chart?.result?.[0];
    if (!result) throw new MarketDataUnavailableError(symbol, new Error('Tidak ada data dalam respons Yahoo Finance.'));

    const meta  = result.meta;
    const quote = result.indicators?.quote?.[0];

    if (!meta || !quote) {
      throw new MarketDataUnavailableError(symbol, new Error('Struktur respons tidak dikenali.'));
    }

    const volumes: number[] = (quote.volume ?? []).filter(
      (v: unknown): v is number => typeof v === 'number' && v > 0,
    );

    const latestVolume      = Number(meta.regularMarketVolume ?? volumes.at(-1) ?? 0);
    const previous20Volumes = volumes.slice(Math.max(0, volumes.length - 21), volumes.length - 1);
    const median20d         = previous20Volumes.length > 0 ? calculateMedian(previous20Volumes) : 0;
    const volumeMultiplier  = median20d > 0 ? latestVolume / median20d : 0;

    const price         = Number(meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0);
    const changePercent = Number(meta.regularMarketChangePercent ?? 0);
    const changeAmount  = Number(meta.regularMarketChange ?? 0);

    if (!isFinite(price) || price <= 0) {
      throw new MarketDataUnavailableError(symbol, new Error('Harga saham tidak valid dalam respons.'));
    }

    const spread = Math.abs(changePercent - ihsg.changePercent);
    const info   = STOCK_METADATA[symbol] ?? {
      name:   meta.longName ?? meta.shortName ?? `${symbol} Tbk`,
      sector: 'Emiten Terdaftar IDX',
    };

    const metrics: RealTickerMetrics = {
      symbol,
      name:              info.name,
      sector:            info.sector,
      currency:          'IDR',
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

    this.cache.set(symbol, metrics);
    return metrics;
  }

  /** Invalidate cache for a symbol (or all if no symbol given). */
  invalidate(symbol?: string): void {
    if (symbol) {
      this.cache.delete(symbol.toUpperCase().replace('.JK', ''));
    } else {
      this.cache.clear();
      this.ihsgCache = null;
    }
  }

  getAvailablePresetTickers(): string[] {
    return ['BBCA', 'TLKM', 'ASII', 'BBNI', 'UNTR', 'ICBP'];
  }
}

export const liveMarketService = new LiveMarketService();
