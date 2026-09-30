import { CompanyFiling } from './sectors.ts';

export type RuleId = 'ABNORMAL_VOLUME' | 'RELATIVE_MOVEMENT' | 'NEW_FILING';

export type CaseStatus = 'OPEN' | 'MONITORING' | 'UPDATED' | 'CLOSED' | 'DATA_INCOMPLETE';

export interface VolumeEvidence {
  latestVolume: number;
  medianVolume20Days: number;
  multiplier: number;
  threshold: number; // 2.0
  tradingDaysEvaluated: number;
}

export interface RelativeMovementEvidence {
  stockReturn: number; // e.g. 0.05 for 5%
  benchmarkReturn: number; // e.g. 0.01 for 1%
  spreadPercentagePoints: number; // e.g. 4.0 percentage points
  thresholdPercentagePoints: number; // 2.0
}

export interface NewFilingEvidence {
  newFilings: CompanyFiling[];
  latestFilingId: string | null;
  count: number;
}

export type RuleEvidence = VolumeEvidence | RelativeMovementEvidence | NewFilingEvidence;

export interface RuleResult {
  ruleId: RuleId;
  name: string;
  isTriggered: boolean;
  summary: string;
  evidence: RuleEvidence;
  missingDataReasons?: string[];
}

export interface EvaluationResult {
  symbol: string;
  evaluationDate: string;
  ruleResults: RuleResult[];
  activeTriggerCount: number;
  hasIncompleteData: boolean;
  missingDataReasons: string[];
}

export interface CaseState {
  caseId: string;
  symbol: string;
  status: CaseStatus;
  openedAt: string;
  lastUpdatedAt: string;
  consecutiveInactiveRuns: number;
  activeRuleIds: RuleId[];
  lastSeenFilingId?: string | null;
  eventsCount: number;
}

export interface CaseEvent {
  eventId: string;
  caseId: string;
  symbol: string;
  timestamp: string;
  previousStatus: CaseStatus | null;
  newStatus: CaseStatus;
  triggeredRules: RuleResult[];
  renderedSummary: string;
  dataQualityIssues?: string[];
}

export interface RenderedTemplate {
  symbol: string;
  asOfDate: string;
  status: CaseStatus;
  version: string;
  facts: string[];
  limitedInterpretations: string[];
  unknowns: string[];
  disclaimer: string;
  plainText: string;
}

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
  latestFilings?: import('./sectors.ts').CompanyFiling[];
}
