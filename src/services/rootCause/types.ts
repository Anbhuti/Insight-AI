export type RCAStatus = 'completed' | 'insufficient_data' | 'failed' | 'in_progress';

export type RCAConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

export type EvidenceType =
  | 'period_change'
  | 'dimension_contribution'
  | 'metric_decomposition'
  | 'correlation'
  | 'trend_shift'
  | 'segment_interaction'
  | 'data_quality';

export type HypothesisClassification =
  | 'Observed Contributor'
  | 'Potential Root Cause'
  | 'Coinciding Shift';

export interface RCAInvestigationTarget {
  datasetId: string;
  datasetName: string;
  userId: string;
  targetMetric: string;
  targetMetricLabel: string;
  anomalyId?: string;
  anomalyTitle?: string;
  anomalyType?: string;
  observedValue?: number;
  expectedValue?: number;
  dateColumn?: string;
  anomalyDate?: string;
  anomalyRowIndex?: number;
}

export interface PeriodComparisonData {
  periodBeforeLabel: string;
  periodAfterLabel: string;
  beforeValue: number;
  afterValue: number;
  absoluteChange: number;
  percentageChange: number;
  sampleSizeBefore: number;
  sampleSizeAfter: number;
  unit?: string;
  confidence: RCAConfidenceLevel;
}

export interface DimensionContribution {
  dimension: string;
  segment: string;
  beforeValue: number;
  afterValue: number;
  absoluteChange: number;
  contributionPct: number; // e.g. 59.5 for 59.5%
  recordCountBefore: number;
  recordCountAfter: number;
  confidence: RCAConfidenceLevel;
}

export interface DimensionAnalysisResult {
  dimension: string;
  distinctValuesCount: number;
  totalBeforeValue: number;
  totalAfterValue: number;
  totalAbsoluteChange: number;
  topDrivers: DimensionContribution[];
  paretoSummary: string; // e.g. "Top 2 segments explain 84.2% of the observed decline"
  paretoExplainedPct: number;
  isHighCardinality: boolean;
}

export interface InteractionContribution {
  dimensionA: string;
  dimensionB: string;
  segmentA: string;
  segmentB: string;
  combinedLabel: string; // e.g. "North + Electronics"
  beforeValue: number;
  afterValue: number;
  absoluteChange: number;
  contributionPct: number;
  recordCount: number;
  confidence: RCAConfidenceLevel;
}

export interface MetricComponentChange {
  metricName: string;
  friendlyLabel: string;
  beforeValue: number;
  afterValue: number;
  percentageChange: number;
  role: 'primary' | 'component_multiplier' | 'component_divisor' | 'component_subtraction';
}

export interface MetricDecompositionResult {
  formulaType: 'multiplication' | 'subtraction' | 'ratio';
  formulaExpression: string; // e.g. "Revenue = Quantity × Price"
  targetMetric: string;
  targetChangePct: number;
  components: MetricComponentChange[];
  analyticalInsight: string;
}

export interface CorrelationResult {
  targetMetric: string;
  relatedMetric: string;
  relatedMetricLabel: string;
  pearsonCorrelation: number; // -1 to 1
  spearmanCorrelation?: number;
  sampleSize: number;
  statisticalStrength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative' | 'neutral';
  isSignificant: boolean;
  disclaimer: string; // "Correlation does not imply causation."
}

export interface TemporalChangePoint {
  dateOrIndex: string;
  beforeMean: number;
  afterMean: number;
  shiftMagnitudePct: number;
  cusumScore?: number;
  description: string;
}

export interface RCAEvidence {
  id: string;
  type: EvidenceType;
  title: string;
  statement: string;
  dimension?: string;
  segment?: string;
  metric?: string;
  valueBefore?: number;
  valueAfter?: number;
  absoluteChange?: number;
  contributionPct?: number;
  correlation?: number;
  sampleSize: number;
  dataQualityScore: number; // 0 to 1
  confidenceScore: number; // 0 to 1
  confidenceLevel: RCAConfidenceLevel;
  supportingDataSnippet?: Record<string, any>[];
}

export interface RCAHypothesis {
  id: string;
  title: string;
  statement: string;
  classification: HypothesisClassification;
  confidenceLevel: RCAConfidenceLevel;
  confidenceScore: number;
  evidenceIds: string[];
  supportingEvidence: RCAEvidence[];
  rationale: string;
}

export interface RCALimitation {
  title: string;
  description: string;
  unobservedVariable?: string; // e.g. "Marketing Spend", "Competitor Pricing"
  impact: string;
}

export interface AIExecutiveSummary {
  headline: string;
  executiveSummary: string;
  keyFacts: string[];
  topDriversExplanation: string[];
  hypothesesSummary: string[];
  limitationsExplained: string[];
  recommendedInvestigations: string[];
  confidenceNarrative: string;
  generatedAt: string;
}

export interface RCAResult {
  analysisId: string;
  datasetId: string;
  datasetName: string;
  datasetVersion: string;
  anomalyId?: string;
  targetMetric: string;
  targetMetricLabel: string;
  status: RCAStatus;
  statusMessage?: string;
  createdAt: string;
  completedAt: string;
  
  // Mathematical Core
  overallConfidenceScore: number; // 0 - 1
  overallConfidenceLevel: RCAConfidenceLevel;
  periodComparison: PeriodComparisonData;
  
  // Breakdown & Evidence
  facts: string[];
  topDrivers: DimensionContribution[];
  dimensionAnalyses: DimensionAnalysisResult[];
  interactionAnalyses: InteractionContribution[];
  metricDecompositions: MetricDecompositionResult[];
  correlations: CorrelationResult[];
  changePoints: TemporalChangePoint[];
  evidence: RCAEvidence[];
  hypotheses: RCAHypothesis[];
  limitations: RCALimitation[];
  recommendedInvestigations: string[];
  
  // AI Grounded Interpretation
  aiExecutiveSummary?: AIExecutiveSummary;
}
