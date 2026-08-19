import {
  DimensionAnalysisResult,
  DimensionContribution,
  InteractionContribution,
  RCAConfidenceLevel,
} from './types';
import { isViableDimension, analyzeDimensionContribution } from './dimensionAnalysis';
import { DatasetProfile } from '../../types/dataProfile';
import { RCA_CONSTANTS } from './constants';
import { parseNumericValue } from './periodComparison';

/**
 * Discovers viable dimensions, runs contribution analysis on each, and ranks all drivers
 */
export function performMultiDimensionContributionAnalysis(
  columns: string[],
  beforeRows: Record<string, any>[],
  afterRows: Record<string, any>[],
  targetMetric: string,
  totalDelta: number,
  profile?: DatasetProfile | null
): {
  dimensionAnalyses: DimensionAnalysisResult[];
  rankedGlobalDrivers: DimensionContribution[];
  interactionAnalyses: InteractionContribution[];
} {
  const viableDimensions: string[] = [];

  for (const col of columns) {
    if (col.toLowerCase() === targetMetric.toLowerCase()) continue;

    // Check distinct count from before+after samples
    const distinctSet = new Set<string>();
    const totalSample = [...beforeRows, ...afterRows];
    for (const r of totalSample) {
      if (r[col] !== undefined && r[col] !== null && r[col] !== '') {
        distinctSet.add(String(r[col]).trim());
      }
    }

    if (isViableDimension(col, profile, distinctSet.size, totalSample.length)) {
      viableDimensions.push(col);
    }
  }

  // Limit dimensions to top viable ones
  const chosenDimensions = viableDimensions.slice(0, RCA_CONSTANTS.MAX_DIMENSIONS_TO_ANALYZE);

  const dimensionAnalyses: DimensionAnalysisResult[] = [];
  const allDrivers: DimensionContribution[] = [];

  for (const dim of chosenDimensions) {
    const res = analyzeDimensionContribution(
      dim,
      beforeRows,
      afterRows,
      targetMetric,
      totalDelta
    );
    dimensionAnalyses.push(res);
    allDrivers.push(...res.topDrivers);
  }

  // Sort global drivers by contribution percentage
  const isDecline = totalDelta < 0;
  allDrivers.sort((a, b) => {
    if (isDecline) {
      return a.absoluteChange - b.absoluteChange;
    } else {
      return b.absoluteChange - a.absoluteChange;
    }
  });

  const rankedGlobalDrivers = allDrivers.slice(0, 10);

  // Perform interaction analysis on top 2 dimensions if available
  const interactionAnalyses = performInteractionAnalysis(
    chosenDimensions.slice(0, 2),
    beforeRows,
    afterRows,
    targetMetric,
    totalDelta
  );

  return {
    dimensionAnalyses,
    rankedGlobalDrivers,
    interactionAnalyses,
  };
}

/**
 * Computes 2-way cross-dimension interaction analysis (e.g. Region + Product)
 */
export function performInteractionAnalysis(
  dimensions: string[],
  beforeRows: Record<string, any>[],
  afterRows: Record<string, any>[],
  targetMetric: string,
  totalDelta: number
): InteractionContribution[] {
  if (dimensions.length < 2) return [];

  const dimA = dimensions[0];
  const dimB = dimensions[1];

  const map: Record<
    string,
    {
      segA: string;
      segB: string;
      beforeSum: number;
      afterSum: number;
      count: number;
    }
  > = {};

  for (const r of beforeRows) {
    const aVal = String(r[dimA] ?? '(Unspecified)').trim();
    const bVal = String(r[dimB] ?? '(Unspecified)').trim();
    const key = `${aVal}::${bVal}`;
    const num = parseNumericValue(r[targetMetric]) ?? 0;

    if (!map[key]) {
      map[key] = { segA: aVal, segB: bVal, beforeSum: 0, afterSum: 0, count: 0 };
    }
    map[key].beforeSum += num;
    map[key].count++;
  }

  for (const r of afterRows) {
    const aVal = String(r[dimA] ?? '(Unspecified)').trim();
    const bVal = String(r[dimB] ?? '(Unspecified)').trim();
    const key = `${aVal}::${bVal}`;
    const num = parseNumericValue(r[targetMetric]) ?? 0;

    if (!map[key]) {
      map[key] = { segA: aVal, segB: bVal, beforeSum: 0, afterSum: 0, count: 0 };
    }
    map[key].afterSum += num;
    map[key].count++;
  }

  const interactions: InteractionContribution[] = [];

  for (const key of Object.keys(map)) {
    const item = map[key];
    const delta = item.afterSum - item.beforeSum;
    let contribPct = 0;
    if (totalDelta !== 0) {
      contribPct = Number(((delta / totalDelta) * 100).toFixed(2));
    }

    let confidence: RCAConfidenceLevel = 'high';
    if (item.count < RCA_CONSTANTS.MIN_RECORDS_FOR_SEGMENT_ANALYSIS) {
      confidence = 'insufficient';
    } else if (item.count < 8) {
      confidence = 'low';
    } else if (item.count < 20) {
      confidence = 'medium';
    }

    interactions.push({
      dimensionA: dimA,
      dimensionB: dimB,
      segmentA: item.segA,
      segmentB: item.segB,
      combinedLabel: `${item.segA} + ${item.segB}`,
      beforeValue: Number(item.beforeSum.toFixed(2)),
      afterValue: Number(item.afterSum.toFixed(2)),
      absoluteChange: Number(delta.toFixed(2)),
      contributionPct: contribPct,
      recordCount: item.count,
      confidence,
    });
  }

  const isDecline = totalDelta < 0;
  interactions.sort((a, b) => {
    if (isDecline) {
      return a.absoluteChange - b.absoluteChange;
    } else {
      return b.absoluteChange - a.absoluteChange;
    }
  });

  return interactions.slice(0, RCA_CONSTANTS.MAX_INTERACTIONS_TO_ANALYZE);
}
