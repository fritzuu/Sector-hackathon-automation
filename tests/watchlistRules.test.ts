import { describe, expect, it } from 'vitest';
import {
  addWatchlistTicker,
  addWatchlistTickers,
  limitWatchlist,
  MAX_WATCHLIST_SIZE,
} from '../src/modules/watchlist/watchlist.rules.js';

describe('watchlist size limit', () => {
  it('limits restored lists to five unique tickers', () => {
    expect(limitWatchlist(['BBCA', 'BBRI', 'TLKM', 'ASII', 'BMRI', 'BBCA', 'UNVR']))
      .toEqual(['BBCA', 'BBRI', 'TLKM', 'ASII', 'BMRI']);
  });

  it('does not add a sixth ticker or duplicate', () => {
    const fullWatchlist = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'BMRI'];

    expect(addWatchlistTicker(fullWatchlist, 'UNVR')).toBe(fullWatchlist);
    expect(addWatchlistTicker(fullWatchlist, 'BBCA')).toBe(fullWatchlist);
    expect(fullWatchlist).toHaveLength(MAX_WATCHLIST_SIZE);
  });

  it('adds as many preset tickers as available slots allow', () => {
    expect(addWatchlistTickers(['BBCA', 'BBRI', 'TLKM'], ['BBRI', 'ASII', 'BMRI', 'UNVR']))
      .toEqual(['BBCA', 'BBRI', 'TLKM', 'ASII', 'BMRI']);
  });
});