import { CompanyFiling } from '../../types/sectors.ts';
import { RuleResult, NewFilingEvidence } from '../../types/engine.ts';

export function evaluateNewFiling(
  filings: CompanyFiling[],
  seenFilingIds: string[] | null
): RuleResult {
  const ruleId: 'NEW_FILING' = 'NEW_FILING';
  const name = 'Keterbukaan Informasi Baru (Filing Resmi IDX)';

  const verified = (filings || []).filter((f) => f.isVerified);
  const allIds = verified.map((f) => f.id);

  const notTriggered = {
    ruleId,
    name,
    isTriggered: false,
    summary: 'Tidak ada keterbukaan informasi baru sejak pemeriksaan terakhir.',
  };

  if (seenFilingIds === null) {
    // First sight: establish baseline silently (DECISIONS.md "Filing pertama")
    return {
      ...notTriggered,
      evidence: { newFilings: [], knownFilingIds: allIds, count: 0 },
    };
  }

  const seen = new Set(seenFilingIds);
  const newFilings = verified
    .filter((f) => !seen.has(f.id))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    
  const knownFilingIds = [...new Set([...allIds, ...seenFilingIds])].slice(0, 100);

  const isTriggered = newFilings.length > 0;
  const summary = isTriggered
    ? `Ditemukan ${newFilings.length} keterbukaan informasi baru: "${newFilings[0].title}".`
    : notTriggered.summary;

  const evidence: NewFilingEvidence = {
    newFilings,
    knownFilingIds,
    count: newFilings.length,
  };

  return {
    ruleId,
    name,
    isTriggered,
    summary,
    evidence,
  };
}

