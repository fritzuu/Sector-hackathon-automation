import { describe, expect, it } from 'vitest';
import { claimMarketCloseRun } from '../src/utils/marketCloseGuard.js';

describe('market close scheduler guard', () => {
  it('claims at most one run per user and date across remounts', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(claimMarketCloseRun('user-a', '2026-09-28', storage)).toBe(true);
    expect(claimMarketCloseRun('user-a', '2026-09-28', storage)).toBe(false);
    expect(claimMarketCloseRun('user-b', '2026-09-28', storage)).toBe(true);
    expect(claimMarketCloseRun('user-a', '2026-09-29', storage)).toBe(true);
  });
});