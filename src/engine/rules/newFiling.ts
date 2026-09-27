import { CompanyFiling } from '../../types/sectors.js';
import { RuleResult, NewFilingEvidence } from '../../types/engine.js';

export function evaluateNewFiling(
  filings: CompanyFiling[],
  lastEvaluatedFilingId?: string | null
): RuleResult {
  const ruleId = 'NEW_FILING';
  const name = 'Keterbukaan Informasi Baru (Filing Resmi IDX)';

  if (!filings || filings.length === 0) {
    return {
      ruleId,
      name,
      isTriggered: false,
      summary: 'Tidak ada keterbukaan informasi baru yang tercatat pada sesi ini.',
      evidence: {
        newFilings: [],
        latestFilingId: lastEvaluatedFilingId || null,
        count: 0,
      },
    };
  }

  // Filter only verified filings
  const verifiedFilings = filings.filter((f) => f.isVerified);

  let newFilings: CompanyFiling[] = [];

  if (!lastEvaluatedFilingId) {
    // If no previous baseline, any existing verified filings are considered newly observed
    newFilings = verifiedFilings;
  } else {
    // Find index of last seen filing
    const lastIndex = verifiedFilings.findIndex((f) => f.id === lastEvaluatedFilingId);
    if (lastIndex === -1) {
      // Last seen not in current window; all verified in current window are new
      newFilings = verifiedFilings;
    } else {
      // Any filings after the last seen index
      newFilings = verifiedFilings.slice(lastIndex + 1);
    }
  }

  const isTriggered = newFilings.length > 0;
  const latestFilingId = newFilings.length > 0 ? newFilings[newFilings.length - 1].id : lastEvaluatedFilingId || null;

  const summary = isTriggered
    ? `Ditemukan ${newFilings.length} keterbukaan informasi baru: "${newFilings[0].title}".`
    : 'Tidak ada keterbukaan informasi baru sejak pemeriksaan terakhir.';

  const evidence: NewFilingEvidence = {
    newFilings,
    latestFilingId,
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
