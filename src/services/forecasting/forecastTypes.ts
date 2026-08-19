import { Timestamp, FieldValue } from 'firebase/firestore';

export type FirestoreDate = Timestamp | FieldValue | Date | string;

export type TimeFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'irregular';

export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';

export type MissingPeriodStrategy =
  | 'interpolation'
  | 'forward_fill'
  | 'zero'
  | 'none';

export type OutlierHandlingStrategy = 'original' | 'anomaly_adjusted';

export type ForecastModelType =
  | 'auto'
  | 'naive'
  | 'seasonal_naive'
  | 'moving_average'
  | 'exponential_smoothing'
  | 'holt_linear'
  | 'holt_winters'
  | 'autoregressive';

export type ConfidenceIntervalLevel = 80 | 90 | 95;

export type ForecastStatus =
  | 'idle'
  | 'preparing_data'
  | 'analyzing_series'
  | 'testing_models'
  | 'selecting_model'
  | 'generating_forecast'
  | 'calculating_intervals'
  | 'generating_ai_explanation'
  | 'completed'
  | 'failed';

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';

export type SeasonalityStrength = 'strong' | 'moderate' | 'weak' | 'none';

export type ForecastConfidenceRating = 'high' | 'medium' | 'low';

export interface TimeSeriesPoint {
  date: string;
  timestamp: number;
  value: number;
  isImputed?: boolean;
  isOutlier?: boolean;
  originalValue?: number;
}

export interface ForecastPoint {
  date: string;
  timestamp: number;
  prediction: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
  optimisticScenario?: number;
  conservativeScenario?: number;
}

export interface BacktestFold {
  foldIndex: number;
  trainStart: string;
  trainEnd: string;
  testStart: string;
  testEnd: string;
  trainCount: number;
  testCount: number;
  actuals: number[];
  predictions: number[];
  mae: number;
  rmse: number;
  smape: number;
}

export interface ModelBacktestScorecard {
  modelType: ForecastModelType;
  modelName: string;
  isEligible: boolean;
  ineligibilityReason?: string;
  mae: number;
  rmse: number;
  smape: number;
  mape?: number | null;
  wape: number;
  rank: number;
  parameters?: Record<string, number | string | boolean>;
  testFolds: BacktestFold[];
}

export interface TimeSeriesMetadata {
  dateColumn: string;
  metricColumn: string;
  detectedFrequency: TimeFrequency;
  frequencyConfidence: number; // 0 to 1
  averageIntervalDays: number;
  regularityScore: number; // 0 to 1
  totalRawRows: number;
  aggregatedPointsCount: number;
  missingPeriodsCount: number;
  missingPeriodsPercentage: number;
  duplicateTimestampsCount: number;
  zeroCount: number;
  negativeCount: number;
  minDate: string;
  maxDate: string;
  minValue: number;
  maxValue: number;
  meanValue: number;
  stdDev: number;
  isConstant: boolean;
  hasOutliers: boolean;
}

export interface DecompositionResult {
  trend: TrendDirection;
  trendSlope: number;
  trendGrowthPct: number;
  seasonality: SeasonalityStrength;
  seasonalPeriod?: number;
  seasonalPatternName?: string;
  seasonalAutocorrelation?: number;
  seasonalityExplanation: string;
  noiseRatio: number;
}

export interface ForecastConfig {
  datasetId: string;
  datasetName: string;
  dateColumn: string;
  metricColumn: string;
  frequency: TimeFrequency;
  aggregation: AggregationType;
  horizon: number;
  modelType: ForecastModelType;
  confidenceLevel: ConfidenceIntervalLevel;
  missingPeriodStrategy: MissingPeriodStrategy;
  outlierStrategy: OutlierHandlingStrategy;
}

export interface ForecastSummary {
  latestHistoricalDate: string;
  latestActualValue: number;
  endForecastDate: string;
  finalPredictedValue: number;
  totalForecastedSum: number;
  meanForecastedValue: number;
  expectedGrowthPct: number;
  expectedAbsoluteChange: number;
  forecastHorizon: number;
  horizonUnit: string;
  bestModelMae: number;
  bestModelSmape: number;
}

export interface ForecastAIExplanation {
  headline: string;
  executiveSummary: string;
  historicalTrendNarrative: string;
  forecastDirectionNarrative: string;
  modelSelectionNarrative: string;
  uncertaintyNarrative: string;
  limitationsNarrative: string;
  recommendedActions: string[];
}

export interface ForecastResult {
  forecastId: string;
  datasetId: string;
  datasetName: string;
  datasetVersion: string;
  userId: string;
  createdAt: string;
  durationMs: number;
  config: ForecastConfig;
  metadata: TimeSeriesMetadata;
  decomposition: DecompositionResult;
  historicalSeries: TimeSeriesPoint[];
  forecastSeries: ForecastPoint[];
  selectedModel: ForecastModelType;
  selectedModelName: string;
  selectionReason: string;
  scorecard: ModelBacktestScorecard[];
  summary: ForecastSummary;
  confidenceRating: ForecastConfidenceRating;
  confidenceRationale: string[];
  warnings: string[];
  aiExplanation?: ForecastAIExplanation;
  isOutdated?: boolean;
}

export interface ForecastHistoryItem {
  forecastId: string;
  datasetId: string;
  datasetName: string;
  datasetVersion: string;
  metricColumn: string;
  frequency: TimeFrequency;
  horizon: number;
  selectedModel: ForecastModelType;
  selectedModelName: string;
  expectedGrowthPct: number;
  confidenceRating: ForecastConfidenceRating;
  createdAt: string;
  status: 'completed' | 'outdated' | 'failed';
}
