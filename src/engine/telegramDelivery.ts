export type TelegramDeliveryStatus = 'pending' | 'queued' | 'sent' | 'unknown';
// evening remains accepted for legacy manual requests and persisted history.
export type TelegramCheckpoint = 'evening' | 'morning';

export interface KeyedTelegramItem {
  key: string;
}

export function normalizeNewsUrl(sourceUrl: string): string {
  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return sourceUrl.trim();

    url.hash = '';
    for (const name of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid|ref|source)$/i.test(name)) {
        url.searchParams.delete(name);
      }
    }
    url.searchParams.sort();
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return sourceUrl.trim();
  }
}

export function newsDeliveryKey(sourceUrl: string): string {
  return `news:${normalizeNewsUrl(sourceUrl)}`;
}

export function marketDeliveryKey(
  dataType: 'price' | 'ihsg' | 'comparison' | 'volume',
  symbol: string,
  sessionDate: string
): string {
  return `${dataType}:${symbol.toUpperCase().replace(/\.JK$/, '')}:${sessionDate}`;
}

export function marketSymbolFromDeliveryKey(key: string): string | null {
  const [prefix, typeOrSymbol, symbolOrDate] = key.split(':');
  const symbol = prefix === 'pending'
    ? ['price', 'benchmark', 'comparison'].includes(typeOrSymbol) ? symbolOrDate : null
    : ['price', 'comparison'].includes(prefix) ? typeOrSymbol : null;
  return symbol ? symbol.toUpperCase().replace(/\.JK$/, '') : null;
}

export function filingDeliveryKey(
  symbol: string,
  filing: {
    sourceUrl?: string;
    id?: string;
    holderName?: string;
    transactionType?: string;
    publishedAt?: string;
    amount?: number;
  }
): string {
  const cleanSymbol = symbol.toUpperCase().replace(/\.JK$/, '');
  const identity = filing.sourceUrl
    ? normalizeNewsUrl(filing.sourceUrl)
    : filing.id || [
        filing.holderName || '',
        filing.transactionType || '',
        filing.publishedAt || '',
        filing.amount ?? '',
      ].join('|');
  return `filing:${cleanSymbol}:${identity}`;
}

export function selectUndeliveredItems<T extends KeyedTelegramItem>(
  items: readonly T[],
  statuses: ReadonlyMap<string, TelegramDeliveryStatus>
): T[] {
  const selected = new Map<string, T>();
  for (const item of items) {
    const status = statuses.get(item.key);
    if (status === 'queued' || status === 'sent' || status === 'unknown') continue;
    selected.set(item.key, item);
  }
  return [...selected.values()];
}