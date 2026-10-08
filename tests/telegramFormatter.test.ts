import { describe, expect, it } from 'vitest';
import {
  formatTelegramDigest,
  formatTelegramHtml,
  formatTelegramTickerDigest,
} from '../src/engine/telegramFormatter.ts';

describe('formatTelegramHtml', () => {
  it('links every message format to Watchlist without a ticker parameter', () => {
    const block = formatTelegramHtml('BBCA', 'MONITORING', {
      asOfDate: '2026-10-07', facts: [], limitedInterpretations: [],
    });
    const tickerDigest = formatTelegramTickerDigest('morning', '2026-10-08', 'BBCA.JK', 'Recap', '07.00');
    const digest = formatTelegramDigest('morning', '2026-10-08', ['Recap'], '07.00');
    for (const message of [block, tickerDigest]) {
      expect(message).toContain('href="https://siba-pi.vercel.app/dashboard/watchlist"');
      expect(message).not.toContain('?ticker=');
      expect(message).not.toContain('siba.investor.id');
    }
    expect(digest).toContain('href="https://siba-pi.vercel.app/dashboard/watchlist"');
  });

  it('uses the configured origin and removes stale paths from the dashboard entry', () => {
    const message = formatTelegramTickerDigest('morning', '2026-10-08', 'GOTO', 'Recap', '07.00', 'https://example.com/dashboard?old=value');
    expect(message).toContain('href="https://example.com/dashboard/watchlist"');
    const invalid = formatTelegramDigest('morning', '2026-10-08', ['Recap'], '07.00', 'javascript:alert(1)');
    expect(invalid).toContain('href="https://siba-pi.vercel.app/dashboard/watchlist"');
  });

  it('keeps the previous available session and places news after market context', () => {
    const block = formatTelegramHtml('GOTO', 'MONITORING', {
      asOfDate: '2026-10-07', facts: [], limitedInterpretations: [],
    }, {
      prices: [
        { date: '2026-10-06', close: 31, volume: 100 },
        { date: '2026-10-07', close: 30, volume: 200 },
      ],
      benchmark: [
        { date: '2026-10-06', close: 6200 },
        { date: '2026-10-07', close: 6146.72 },
      ],
      news: [{ title: 'Berita GOTO', url: 'https://example.com/news', publishedAt: '2026-10-07' }],
      includeSections: ['price', 'benchmark', 'volume', 'news'],
      includeHeader: false, includeFooter: false,
    });
    const message = formatTelegramTickerDigest('evening', '2026-10-08', 'GOTO', block, '15.00');
    expect(message).toContain('Harga penutupan — 7 Oktober 2026');
    expect(message).toContain('Volume sesi 7 Oktober 2026');
    expect(message.indexOf('Harga penutupan')).toBeLessThan(message.indexOf('IHSG'));
    expect(message.indexOf('IHSG')).toBeLessThan(message.indexOf('Sorotan volume'));
    expect(message.indexOf('Sorotan volume')).toBeLessThan(message.indexOf('Berita terkait'));
    expect(message.indexOf('Berita terkait')).toBeLessThan(message.indexOf('Disclaimer'));
  });

  it('shows the latest available IHSG date and price when it lags the stock session', () => {
    const message = formatTelegramHtml(
      'GOTO',
      'UPDATED',
      { asOfDate: '2026-10-06', facts: [], limitedInterpretations: [] },
      {
        prices: [
          { date: '2026-10-05', close: 29, volume: 100 },
          { date: '2026-10-06', close: 31, volume: 18_443_953_300 },
        ],
        benchmark: [{ date: '2026-10-05', close: 6118.86 }],
        evalResult: {
          ruleResults: [{
            ruleId: 'ABNORMAL_VOLUME',
            evidence: {
              latestVolume: 18_443_953_300,
              medianVolume20Days: 10_000,
              multiplier: 1_844_395.33,
              threshold: 2,
              tradingDaysEvaluated: 20,
            },
          }],
        },
      }
    );

    expect(message).toContain('Data terakhir tersedia untuk 5 Oktober 2026');
    expect(message).toContain('6.118,86');
    expect(message).toContain('tanggal data berbeda');
    expect(message).toContain('Data IHSG terakhir: 5 Oktober 2026 (sesi perdagangan).');
    expect(message).toContain('Volume sesi 6 Oktober 2026');
    expect(message).toContain('18.443.953.300');
    expect(message).toContain('1.844.395,33x');
    expect(message).not.toContain('belum dirilis bursa');
  });

  it('states that IHSG comparison is unavailable when no benchmark data was returned', () => {
    const message = formatTelegramHtml(
      'GOTO',
      'UPDATED',
      { asOfDate: '2026-10-06', facts: [], limitedInterpretations: [] },
      { prices: [{ date: '2026-10-06', close: 31, volume: 100 }] }
    );

    expect(message).toContain('Data IHSG belum tersedia');
    expect(message).toContain('Volume sesi 6 Oktober 2026');
    expect(message).toContain('Perbandingan dengan median 20 sesi tidak tersedia');
  });

  it('renders only the newly available benchmark section inside one morning digest', () => {
    const tickerBlock = formatTelegramHtml(
      'GOTO',
      'MONITORING',
      { asOfDate: '2026-10-06', facts: [], limitedInterpretations: [] },
      {
        prices: [
          { date: '2026-10-05', close: 29, volume: 100 },
          { date: '2026-10-06', close: 31, volume: 200 },
        ],
        benchmark: [
          { date: '2026-10-05', close: 6118.86 },
          { date: '2026-10-06', close: 6192.927 },
        ],
        includeSections: ['benchmark'],
        includeHeader: false,
        includeFooter: false,
      }
    );
    const digest = formatTelegramDigest(
      'morning',
      '2026-10-08',
      [tickerBlock],
      '07.00'
    );

    expect(digest).toContain('REKAP PAGI');
    expect(digest).toContain('Kinerja vs IHSG: lebih kuat');
    expect(digest).not.toContain('Harga penutupan');
    expect(digest).not.toContain('Lihat detail kasus di Dashboard');
  });

  it('includes engine facts in a digest even when price data is present for context', () => {
    const block = formatTelegramHtml(
      'GOTO',
      'OPEN',
      { asOfDate: '2026-10-06', facts: ['Volume abnormal terverifikasi'], limitedInterpretations: [] },
      {
        prices: [{ date: '2026-10-06', close: 31, volume: 200 }],
        includeSections: ['engine'],
        includeHeader: false,
        includeFooter: false,
      }
    );

    expect(block).toContain('Volume abnormal terverifikasi');
    expect(block).not.toContain('Harga penutupan');
  });
});

describe('formatTelegramTickerDigest', () => {
  it('uses the watchlist report layout and wraps only the requested ticker', () => {
    const message = formatTelegramTickerDigest(
      'evening',
      '2026-10-08',
      'BBCA.JK',
      '💵 <b>Harga penutupan</b>\nRp6.050',
      '14.30'
    );

    expect(message).toContain('<b>🌙 Update Watchlist — BBCA</b>');
    expect(message).toContain('📅 8 Oktober 2026');
    expect(message).toContain('Harga penutupan');
    expect(message).not.toContain('GOTO');
    expect(message).not.toContain('TLKM');
  });
});
