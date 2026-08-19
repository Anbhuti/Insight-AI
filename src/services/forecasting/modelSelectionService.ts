import {
  TimeSeriesPoint,
  ForecastModelType,
  ModelBacktestScorecard,
  TimeFrequency,
  DecompositionResult,
} from './forecastTypes';
import { backtestModel } from './backtestingService';

export interface ModelCandidateDef {
  type: ForecastModelType;
  name: string;
}

export const ALL_MODEL_CANDIDATES: ModelCandidateDef[] = [
  { type: 'naive', name: 'Naive Benchmark' },
  { type: 'seasonal_naive', name: 'Seasonal Naive' },
  { type: 'moving_average', name: 'Moving Average' },
  { type: 'exponential_smoothing', name: 'Simple Exponential Smoothing' },
  { type: 'holt_linear', name: "Holt's Linear Trend" },
  { type: 'holt_winters', name: 'Holt-Winters Triple Smoothing' },
  { type: 'autoregressive', name: 'AutoRegressive (AR/ARIMA)' },
];

/**
 * Runs historical backtesting across all candidate models and ranks them by performance
 */
export function evaluateAllModels(
  series: TimeSeriesPoint[],
  frequency: TimeFrequency,
  decomposition: DecompositionResult
): ModelBacktestScorecard[] {
  const seasonalPeriod = decomposition.seasonalPeriod || 7;
  const scorecards: ModelBacktestScorecard[] = [];

  for (const candidate of ALL_MODEL_CANDIDATES) {
    const scorecard = backtestModel(
      candidate.type,
      candidate.name,
      series,
      frequency,
      seasonalPeriod
    );
    scorecards.push(scorecard);
  }

  // Rank eligible models: lowest sMAPE first (or lowest MAE if sMAPE is equal/infinite)
  const eligible = scorecards.filter((s) => s.isEligible);
  eligible.sort((a, b) => {
    if (a.smape !== b.smape) return a.smape - b.smape;
    return a.mae - b.mae;
  });

  eligible.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  const ineligibles = scorecards.filter((s) => !s.isEligible);
  ineligibles.forEach((s, idx) => {
    s.rank = eligible.length + idx + 1;
  });

  return scorecards;
}

/**
 * Selects the optimal model from backtested scorecards based on performance and user choice
 */
export function selectBestModel(
  scorecards: ModelBacktestScorecard[],
  preferredModel: ForecastModelType = 'auto',
  decomposition: DecompositionResult
): {
  selectedModelType: ForecastModelType;
  selectedModelName: string;
  selectionReason: string;
  isFallback: boolean;
  scorecard: ModelBacktestScorecard;
} {
  const eligible = scorecards.filter((s) => s.isEligible && isFinite(s.mae));

  // If user requested a specific model
  if (preferredModel !== 'auto') {
    const chosen = scorecards.find((s) => s.modelType === preferredModel);
    if (chosen && chosen.isEligible) {
      const isTopRanked = eligible[0]?.modelType === preferredModel;
      return {
        selectedModelType: chosen.modelType,
        selectedModelName: chosen.modelName,
        selectionReason: isTopRanked
          ? `User selected ${chosen.modelName}, which also scored highest in chronological backtesting (sMAPE: ${chosen.smape}%).`
          : `User selected ${chosen.modelName} (Validation sMAPE: ${chosen.smape}%).`,
        isFallback: false,
        scorecard: chosen,
      };
    } else {
      // User choice failed eligibility -> fallback to best available
      const fallback = eligible[0] || scorecards.find((s) => s.modelType === 'naive')!;
      return {
        selectedModelType: fallback.modelType,
        selectedModelName: fallback.modelName,
        selectionReason: `Requested model "${preferredModel}" could not be fitted (${chosen?.ineligibilityReason || 'insufficient historical depth'}). Automatically fell back to ${fallback.modelName}.`,
        isFallback: true,
        scorecard: fallback,
      };
    }
  }

  // Automatic Model Selection based on validation performance
  if (eligible.length > 0) {
    const best = eligible[0];
    let reason = `Selected ${best.modelName} because it achieved the lowest error in chronological backtesting (sMAPE: ${best.smape}%, MAE: ${best.mae}).`;

    if (best.modelType === 'naive') {
      reason = `Selected Naive Benchmark because more complex models did not outperform the baseline on historical validation data.`;
    } else if (best.modelType === 'holt_winters' && decomposition.seasonality !== 'none') {
      reason = `Selected Holt-Winters Triple Smoothing to model both the observed ${decomposition.seasonalPatternName || 'seasonality'} and trend dynamics (sMAPE: ${best.smape}%).`;
    } else if (best.modelType === 'holt_linear' && decomposition.trend !== 'stable') {
      reason = `Selected Holt's Linear Trend to capture historical ${decomposition.trend} trajectory with minimum validation variance (sMAPE: ${best.smape}%).`;
    }

    return {
      selectedModelType: best.modelType,
      selectedModelName: best.modelName,
      selectionReason: reason,
      isFallback: false,
      scorecard: best,
    };
  }

  // Extreme fallback to Naive if nothing else passed
  const naiveScorecard = scorecards.find((s) => s.modelType === 'naive') || {
    modelType: 'naive',
    modelName: 'Naive Benchmark',
    isEligible: true,
    mae: 0,
    rmse: 0,
    smape: 0,
    mape: 0,
    wape: 0,
    rank: 1,
    testFolds: [],
  };

  return {
    selectedModelType: 'naive',
    selectedModelName: 'Naive Benchmark',
    selectionReason: 'Fallback baseline model applied due to limited historical series length.',
    isFallback: true,
    scorecard: naiveScorecard,
  };
}
