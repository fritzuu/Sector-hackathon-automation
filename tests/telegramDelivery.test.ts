import { describe, expect, it } from 'vitest';
import {
  filingDeliveryKey,
  inferTelegramCheckpoint,
  marketDeliveryKey,
  marketSymbolFromDeliveryKey,
  newsDeliveryKey,
  normalizeNewsUrl,
  selectUndeliveredItems,
} from '../src/engine/telegramDelivery.ts';

describe('Telegram delivery identity', () => {
  it('infers the expected checkpoint from WIB time when a trigger omits its mode', () => {
    expect(inferTelegramCheckpoint(7)).toBe('morning');
    expect(inferTelegramCheckpoint(19)).toBe('evening');
    expect(() => inferTelegramCheckpoint(24)).toThrow(RangeError);
  });

  it('normalizes tracking parameters and fragments for article identity', () => {
    expect(newsDeliveryKey('https://News.example/story/?utm_source=feed&id=4#top'))
      .toBe(newsDeliveryKey('https://news.example/story?id=4&utm_medium=email'));
    expect(normalizeNewsUrl('https://news.example/story/?ref=home'))
      .toBe('https://news.example/story');
  });

  it('keys market items by type, symbol, and exchange session', () => {
    expect(marketDeliveryKey('comparison', 'GOTO.JK', '2026-10-06'))
      .toBe('comparison:GOTO:2026-10-06');
    expect(marketDeliveryKey('comparison', 'GOTO', '2026-10-07'))
      .not.toBe(marketDeliveryKey('comparison', 'GOTO', '2026-10-06'));
    expect(marketSymbolFromDeliveryKey('pending:price:GOTO'))
      .toBe('GOTO');
    expect(marketSymbolFromDeliveryKey('pending:comparison:GOTO:2026-10-06'))
      .toBe('GOTO');
    expect(marketSymbolFromDeliveryKey('ihsg:IHSG:2026-10-06'))
      .toBeNull();
  });

  it('uses source URL and a deterministic fallback for filing identities', () => {
    expect(filingDeliveryKey('GOTO', { sourceUrl: 'https://idx.example/file?utm_source=api' }))
      .toBe(filingDeliveryKey('GOTO.JK', { sourceUrl: 'https://idx.example/file' }));
    expect(filingDeliveryKey('GOTO', {
      holderName: 'Investor A',
      transactionType: 'sell',
      publishedAt: '2026-10-06',
      amount: 100,
    })).toBe('filing:GOTO:Investor A|sell|2026-10-06|100');
  });

  it('selects missing and pending items but avoids duplicate or ambiguous sends', () => {
    const items = ['new', 'pending', 'queued', 'sent', 'unknown'].map((key) => ({ key }));
    const statuses = new Map([
      ['pending', 'pending'],
      ['queued', 'queued'],
      ['sent', 'sent'],
      ['unknown', 'unknown'],
    ] as const);

    expect(selectUndeliveredItems(items, statuses).map((item) => item.key))
      .toEqual(['new', 'pending']);
  });
});