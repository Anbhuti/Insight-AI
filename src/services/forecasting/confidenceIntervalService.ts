import {
  TimeSeriesPoint,
  ForecastPoint,
  ConfidenceIntervalLevel,
  ForecastConfidenceRating,
  TimeSeriesMetadata,
  ModelBacktestScorecard,
  DecompositionResult,
  TimeFrequency,
} from './forecastTypes';
import { FORECAST_CONSTANTS } from './constants';
import { advanceDate, formatDateByFrequency } from './timeSeriesService';

/**
 * Calculates prediction intervals and builds final ForecastPoint array
 */
export function buildForecastPointsWithIntervals(
  rawPredictions: number[],
  historicalSeries: TimeSeriesPoint[],
  residuals: number[],
  confidenceLevel: ConfidenceIntervalLevel,
  frequency: TimeFrequency,
  metadata: TimeSeriesMetadata
): ForecastPoint[] {
  const n = historicalSeries.length;
  if (n === 0 || rawPredictions.length === 0) return [];

  const lastPoint = historicalSeries[n - 1];
  const zScore = FORECAST_CONSTANTS.Z_SCORES[confidenceLevel] || 1.95996;

  // Calculate base standard error of residuals
  let residualSumSq = 0;
  for (const r of residuals) {
    residualSumSq += r * r;
  }
  const dof = Math.max(1, residuals.length - 2);
  const baseStdError = Math.max(
    Math.sqrt(residualSumSq / dof),
    metadata.stdDev * 0.1 || 1.0
  );

  const forecastPoints: ForecastPoint[] = [];
  let currentTs = lastPoint.timestamp;

  for (let h = 1; h <= rawPredictions.length; h++) {
    currentTs = advanceDate(currentTs, frequency, 1);
    const pred = rawPredictions[h - 1];

    // Uncertainty expands with horizon sqrt expansion: sigma(h) = sigma * sqrt(1 + 0.15 * (h - 1))
    const horizonExpansionFactor = Math.sqrt(1 + 0.12 * (h - 1));
    const hStdError = baseStdError * horizonExpansionFactor;
    const margin = zScore * hStdError;

    let lowerBound = pred - margin;
    let upperBound = pred + margin;

    // If the metric has zero negative values historically and is a count/quantity/revenue, bound lower at 0
    if (metadata.negativeCount === 0 && metadata.minValue >= 0) {
      lowerBound = Math.max(0, lowerBound);
    }

    // Derived statistical scenarios
    const optimisticScenario = pred + 0.65 * margin;
    const conservativeScenario = metadata.negativeCount === 0 && metadata.minValue >= 0
      ? Math.max(0, pred - 0.65 * margin)
      : pred - 0.65 * margin;

    forecastPoints.push({
      date: formatDateByFrequency(currentTs, frequency),
      timestamp: currentTs,
      prediction: Number(pred.toFixed(2)),
      lowerBound: Number(lowerBound.toFixed(2)),
      upperBound: Number(upperBound.toFixed(2)),
      confidenceLevel,
      optimisticScenario: Number(optimisticScenario.toFixed(2)),
      conservativeScenario: Number(conservativeScenario.toFixed(2)),
    });
  }

  return forecastPoints;
}

/**
 * Assesses overall forecast confidence (High / Medium / Low) with structured rationales
 */
export function evaluateForecastConfidence(
  metadata: TimeSeriesMetadata,
  scorecard: ModelBacktestScorecard,
  decomposition: DecompositionResult,
  horizon: number
): { confidenceRating: ForecastConfidenceRating; rationales: string[]; warnings: string[] } {
  let score = 75; // Baseline
  const rationales: string[] = [];
  const warnings: string[] = [];

  // 1. Historical data volume
  if (metadata.aggregatedPointsCount >= 40) {
    score += 15;
    rationales.push(`Substantial historical history (${metadata.aggregatedPointsCount} time periods).`);
  } else if (metadata.aggregatedPointsCount >= 15) {
    score += 5;
    rationales.push(`Adequate historical depth (${metadata.aggregatedPointsCount} periods).`);
  } else {
    score -= 25;
    warnings.push(`Limited historical observations (${metadata.aggregatedPointsCount} periods); predictions carry wider variance.`);
  }

  // 2. Backtest performance (sMAPE)
  if (scorecard.smape < 10) {
    score += 15;
    rationales.push(`High validation accuracy during chronological backtesting (sMAPE: ${scorecard.smape}%).`);
  } else if (scorecard.smape < 25) {
    score += 5;
    rationales.push(`Acceptable validation error profile (sMAPE: ${scorecard.smape}%).`);
  } else if (scorecard.smape > 45) {
    score -= 25;
    warnings.push(`Elevated backtesting error (sMAPE: ${scorecard.smape}%); historical variance is high.`);
  }

  // 3. Regularity and missing periods
  if (metadata.missingPeriodsPercentage > 20) {
    score -= 15;
    warnings.push(`${metadata.missingPeriodsPercentage}% missing time periods detected and interpolated.`);
  } else if (metadata.missingPeriodsPercentage === 0) {
    score += 5;
    rationales.push('Continuous, uninterrupted historical time sequence with zero gaps.');
  }

  // 4. Forecast Horizon vs History ratio
  const horizonRatio = horizon / Math.max(1, metadata.aggregatedPointsCount);
  if (horizonRatio > 1.5) {
    score -= 20;
    warnings.push(`Forecast horizon (${horizon} periods) exceeds historical span (${metadata.aggregatedPointsCount} periods).`);
  } else if (horizonRatio <= 0.5) {
    score += 5;
    rationales.push(`Forecast horizon is well-proportioned relative to training window.`);
  }

  // 5. Outliers
  if (metadata.hasOutliers) {
    warnings.push('Historical outliers and extreme spikes were identified in the data series.');
  }

  let confidenceRating: ForecastConfidenceRating = 'medium';
  if (score >= 80 && warnings.length <= 1) {
    confidenceRating = 'high';
  } else if (score < 55 || warnings.length >= 3) {
    confidenceRating = 'low';
  }

  return { confidenceRating, rationales, warnings };
}
