import { describe, expect, it } from 'vitest';
import { mapNewsArticles } from '../src/services/sectorsApi.ts';

describe('mapNewsArticles', () => {
  it('maps documented news fields and preserves pagination state', () => {
    expect(mapNewsArticles({
      results: [{
        title: 'GOTO article',
        body: 'Factual article text.',
        source: 'https://example.com/story',
        timestamp: '2026-10-07T06:00:00',
        symbols: ['GOTO.JK'],
        sector: 'technology',
        sub_sector: ['internet-services'],
      }],
      pagination: { has_next: true, next_offset: 30 },
    })).toEqual({
      articles: [{
        title: 'GOTO article',
        body: 'Factual article text.',
        source: 'https://example.com/story',
        publishedAt: '2026-10-07T06:00:00',
        symbols: ['GOTO.JK'],
        sector: 'technology',
        subSector: ['internet-services'],
      }],
      hasNext: true,
      nextOffset: 30,
    });
  });

  it('keeps a successful empty page distinct from malformed article rows', () => {
    expect(mapNewsArticles({ results: [null, { title: 'missing source' }], pagination: {} }))
      .toEqual({ articles: [], hasNext: false, nextOffset: null });
  });
});