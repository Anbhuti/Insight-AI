import { TimeSeriesPoint, TimeFrequency, DecompositionResult, TrendDirection, SeasonalityStrength } from './forecastTypes';
import { FORECAST_CONSTANTS } from './constants';

/**
 * Calculates autocorrelation of a series at a specific lag k
 */
export function calculateAutocorrelation(values: number[], lag: number): number {
  const n = values.length;
  if (n <= lag || lag <= 0) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    denominator += Math.pow(values[i] - mean, 2);
  }

  if (denominator < 1e-9) return 0;

  for (let i = 0; i < n - lag; i++) {
    numerator += (values[i] - mean) * (values[i + lag] - mean);
  }

  return numerator / denominator;
}

/**
 * Performs time series decomposition to isolate Trend, Seasonality, and Noise
 */
export function analyzeDecomposition(
  series: TimeSeriesPoint[],
  frequency: TimeFrequency
): DecompositionResult {
  const n = series.length;
  const values = series.map((p) => p.value);

  if (n < 3) {
    return {
      trend: 'stable',
      trendSlope: 0,
      trendGrowthPct: 0,
      seasonality: 'none',
      seasonalityExplanation: 'Insufficient observations for decomposition analysis.',
      noiseRatio: 0,
    };
  }

  // 1. Linear Trend Estimation (Ordinary Least Squares)
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  const firstFitted = intercept;
  const lastFitted = intercept + slope * (n - 1);
  const baseline = Math.abs(firstFitted) > 1e-4 ? Math.abs(firstFitted) : 1;
  const trendGrowthPct = Number((((lastFitted - firstFitted) / baseline) * 100).toFixed(2));

  // Measure volatility / residual variance around trend
  let residualSumSq = 0;
  let totalSumSq = 0;
  const meanVal = sumY / n;

  for (let i = 0; i < n; i++) {
    const fitted = intercept + slope * i;
    residualSumSq += Math.pow(values[i] - fitted, 2);
    totalSumSq += Math.pow(values[i] - meanVal, 2);
  }

  const rSquared = totalSumSq > 1e-9 ? Math.max(0, 1 - residualSumSq / totalSumSq) : 0;
  const noiseRatio = totalSumSq > 1e-9 ? Math.min(1, Math.sqrt(residualSumSq / totalSumSq)) : 0;

  // Trend classification
  let trend: TrendDirection = 'stable';
  if (Math.abs(trendGrowthPct) < 3.0 || rSquared < 0.1) {
    if (noiseRatio > 0.6) {
      trend = 'volatile';
    } else {
      trend = 'stable';
    }
  } else if (slope > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  // 2. Seasonality Detection using Autocorrelation
  const defaultSeasonalPeriod = FORECAST_CONSTANTS.DEFAULT_SEASONAL_PERIODS[frequency] || 7;
  let candidatePeriods: number[] = [];

  if (frequency === 'daily') {
    candidatePeriods = [7, 14, 30];
  } else if (frequency === 'weekly') {
    candidatePeriods = [4, 12, 52];
  } else if (frequency === 'monthly') {
    candidatePeriods = [3, 6, 12];
  } else if (frequency === 'quarterly') {
    candidatePeriods = [4];
  } else {
    candidatePeriods = [defaultSeasonalPeriod];
  }

  // Filter periods that have at least 2 full cycles in dataset
  candidatePeriods = candidatePeriods.filter((p) => n >= p * 2);

  let bestPeriod: number | undefined = undefined;
  let maxAcf = 0;

  for (const p of candidatePeriods) {
    const acf = calculateAutocorrelation(values, p);
    if (acf > maxAcf && acf > 0.25) {
      maxAcf = acf;
      bestPeriod = p;
    }
  }

  let seasonality: SeasonalityStrength = 'none';
  let seasonalPatternName: string | undefined = undefined;
  let seasonalityExplanation = 'No recurring seasonal cycle detected in the historical timeframe.';

  if (bestPeriod !== undefined && maxAcf > 0.6) {
    seasonality = 'strong';
    seasonalPatternName = frequency === 'daily' && bestPeriod === 7 ? '7-Day Weekly Cycle' : `${bestPeriod}-Period Cyclical Seasonality`;
    seasonalityExplanation = `Strong recurring pattern with ${bestPeriod}-period cycle (ACF correlation ${maxAcf.toFixed(2)}).`;
  } else if (bestPeriod !== undefined && maxAcf > 0.38) {
    seasonality = 'moderate';
    seasonalPatternName = frequency === 'daily' && bestPeriod === 7 ? 'Weekly Rhythm' : `${bestPeriod}-Period Seasonality`;
    seasonalityExplanation = `Moderate cyclical behavior detected across ${bestPeriod} time units (ACF correlation ${maxAcf.toFixed(2)}).`;
  } else if (bestPeriod !== undefined && maxAcf > 0.25) {
    seasonality = 'weak';
    seasonalPatternName = `${bestPeriod}-Period Soft Pattern`;
    seasonalityExplanation = `Mild periodic pattern identified at lag ${bestPeriod}.`;
  }

  return {
    trend,
    trendSlope: Number(slope.toFixed(4)),
    trendGrowthPct,
    seasonality,
    seasonalPeriod: bestPeriod,
    seasonalPatternName,
    seasonalAutocorrelation: Number(maxAcf.toFixed(3)),
    seasonalityExplanation,
    noiseRatio: Number(noiseRatio.toFixed(3)),
  };
}
