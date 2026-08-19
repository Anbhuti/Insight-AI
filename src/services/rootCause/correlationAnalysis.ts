import { CorrelationResult } from './types';
import { RCA_CONSTANTS } from './constants';
import { parseNumericValue } from './periodComparison';

/**
 * Calculates Pearson Correlation Coefficient r between two numeric arrays
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  if (n < RCA_CONSTANTS.MIN_RECORDS_FOR_SEGMENT_ANALYSIS) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
    sumY2 += yi * yi;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  const r = numerator / denominator;
  return Number(Math.max(-1, Math.min(1, r)).toFixed(3));
}

/**
 * Performs correlation analysis between the target metric and all numeric columns
 */
export function performCorrelationAnalysis(
  columns: string[],
  rows: Record<string, any>[],
  targetMetric: string
): CorrelationResult[] {
  const targetColLower = targetMetric.toLowerCase().trim();
  const results: CorrelationResult[] = [];

  // Extract target numbers
  const targetValuesWithIdx = rows
    .map((r, i) => ({ idx: i, val: parseNumericValue(r[targetMetric]) }))
    .filter((t): t is { idx: number; val: number } => t.val !== null);

  if (targetValuesWithIdx.length < RCA_CONSTANTS.MIN_TOTAL_RECORDS_FOR_RCA) {
    return [];
  }

  for (const col of columns) {
    if (col.toLowerCase().trim() === targetColLower) continue;

    // Check if column is numeric
    const pairs: { x: number; y: number }[] = [];
    for (const item of targetValuesWithIdx) {
      const otherVal = parseNumericValue(rows[item.idx][col]);
      if (otherVal !== null) {
        pairs.push({ x: item.val, y: otherVal });
      }
    }

    // Must have at least minimum sample size
    if (pairs.length < RCA_CONSTANTS.MIN_TOTAL_RECORDS_FOR_RCA) {
      continue;
    }

    const xVals = pairs.map((p) => p.x);
    const yVals = pairs.map((p) => p.y);

    const r = calculatePearsonCorrelation(xVals, yVals);
    if (r === null) continue;

    const absR = Math.abs(r);
    let statisticalStrength: 'strong' | 'moderate' | 'weak' = 'weak';
    if (absR >= RCA_CONSTANTS.CORRELATION_STRONG_THRESHOLD) {
      statisticalStrength = 'strong';
    } else if (absR >= RCA_CONSTANTS.CORRELATION_MODERATE_THRESHOLD) {
      statisticalStrength = 'moderate';
    }

    let direction: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (r > 0.05) direction = 'positive';
    else if (r < -0.05) direction = 'negative';

    results.push({
      targetMetric,
      relatedMetric: col,
      relatedMetricLabel: col.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      pearsonCorrelation: r,
      sampleSize: pairs.length,
      statisticalStrength,
      direction,
      isSignificant: absR >= RCA_CONSTANTS.CORRELATION_MODERATE_THRESHOLD && pairs.length >= 15,
      disclaimer: 'Correlation indicates statistical association and does not imply causation.',
    });
  }

  // Sort by strongest absolute correlation
  results.sort((a, b) => Math.abs(b.pearsonCorrelation) - Math.abs(a.pearsonCorrelation));

  return results.slice(0, 8);
}
