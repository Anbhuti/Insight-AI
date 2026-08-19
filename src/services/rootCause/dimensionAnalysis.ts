import {
  DimensionAnalysisResult,
  DimensionContribution,
  RCAConfidenceLevel,
} from './types';
import { RCA_CONSTANTS, KNOWN_DIMENSION_PATTERNS, IDENTIFIER_EXCLUSIONS } from './constants';
import { DatasetProfile } from '../../types/dataProfile';
import { parseNumericValue } from './periodComparison';

/**
 * Determines whether a column is a viable categorical dimension for RCA
 */
export function isViableDimension(
  columnName: string,
  profile?: DatasetProfile | null,
  distinctCount?: number,
  totalRows?: number
): boolean {
  const lower = columnName.toLowerCase().trim();

  // Exclude explicit identifier patterns
  if (IDENTIFIER_EXCLUSIONS.some((idPattern) => lower === idPattern || lower.endsWith(`_${idPattern}`) || lower.startsWith(`${idPattern}_`))) {
    return false;
  }

  // Check dataset profile logical type if available
  if (profile?.columns) {
    const colProf = profile.columns.find((c) => c.name.toLowerCase() === lower);
    if (colProf) {
      if (colProf.isPotentialId || colProf.logicalType === 'numeric' || colProf.logicalType === 'integer' || colProf.logicalType === 'decimal') {
        return false;
      }
      if (colProf.logicalType === 'categorical' || colProf.logicalType === 'boolean') {
        return colProf.uniqueCount <= RCA_CONSTANTS.MAX_DISTINCT_VALUES_FOR_DIMENSION && colProf.uniqueCount > 1;
      }
    }
  }

  // Fallback heuristic based on distinct count
  if (typeof distinctCount === 'number' && typeof totalRows === 'number' && totalRows > 0) {
    if (distinctCount <= 1) return false;
    if (distinctCount > RCA_CONSTANTS.MAX_DISTINCT_VALUES_FOR_DIMENSION) return false;
    if (distinctCount / totalRows > 0.6 && totalRows > 20) return false; // high uniqueness ratio
    return true;
  }

  // Known naming pattern match
  return KNOWN_DIMENSION_PATTERNS.some((pat) => lower.includes(pat));
}

/**
 * Analyzes dimension segment contributions for a single categorical dimension
 */
export function analyzeDimensionContribution(
  dimensionName: string,
  beforeRows: Record<string, any>[],
  afterRows: Record<string, any>[],
  targetMetric: string,
  totalDelta: number
): DimensionAnalysisResult {
  const segmentStats: Record<
    string,
    {
      beforeSum: number;
      beforeCount: number;
      afterSum: number;
      afterCount: number;
    }
  > = {};

  // Aggregate Before Period
  for (const r of beforeRows) {
    const rawVal = r[dimensionName];
    const seg = rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '' ? String(rawVal).trim() : '(Unspecified)';
    const num = parseNumericValue(r[targetMetric]) ?? 0;

    if (!segmentStats[seg]) {
      segmentStats[seg] = { beforeSum: 0, beforeCount: 0, afterSum: 0, afterCount: 0 };
    }
    segmentStats[seg].beforeSum += num;
    segmentStats[seg].beforeCount++;
  }

  // Aggregate After Period
  for (const r of afterRows) {
    const rawVal = r[dimensionName];
    const seg = rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '' ? String(rawVal).trim() : '(Unspecified)';
    const num = parseNumericValue(r[targetMetric]) ?? 0;

    if (!segmentStats[seg]) {
      segmentStats[seg] = { beforeSum: 0, beforeCount: 0, afterSum: 0, afterCount: 0 };
    }
    segmentStats[seg].afterSum += num;
    segmentStats[seg].afterCount++;
  }

  const distinctSegments = Object.keys(segmentStats);
  const totalBefore = distinctSegments.reduce((acc, s) => acc + segmentStats[s].beforeSum, 0);
  const totalAfter = distinctSegments.reduce((acc, s) => acc + segmentStats[s].afterSum, 0);
  const actualTotalDelta = totalDelta !== 0 ? totalDelta : totalAfter - totalBefore;

  const drivers: DimensionContribution[] = distinctSegments.map((seg) => {
    const st = segmentStats[seg];
    const delta = st.afterSum - st.beforeSum;
    
    // Calculate contribution percentage relative to total change
    let contribPct = 0;
    if (actualTotalDelta !== 0) {
      contribPct = Number(((delta / actualTotalDelta) * 100).toFixed(2));
    }

    let confidence: RCAConfidenceLevel = 'high';
    const totalSegmentRecords = st.beforeCount + st.afterCount;
    if (totalSegmentRecords < RCA_CONSTANTS.MIN_RECORDS_FOR_SEGMENT_ANALYSIS) {
      confidence = 'insufficient';
    } else if (totalSegmentRecords < 10) {
      confidence = 'low';
    } else if (totalSegmentRecords < 30) {
      confidence = 'medium';
    }

    return {
      dimension: dimensionName,
      segment: seg,
      beforeValue: Number(st.beforeSum.toFixed(2)),
      afterValue: Number(st.afterSum.toFixed(2)),
      absoluteChange: Number(delta.toFixed(2)),
      contributionPct: contribPct,
      recordCountBefore: st.beforeCount,
      recordCountAfter: st.afterCount,
      confidence,
    };
  });

  // Sort drivers by magnitude of contribution in the direction of the total change
  const isDecline = actualTotalDelta < 0;
  drivers.sort((a, b) => {
    if (isDecline) {
      // For a decline, largest negative changes are top contributors
      return a.absoluteChange - b.absoluteChange;
    } else {
      // For a growth/spike, largest positive changes are top contributors
      return b.absoluteChange - a.absoluteChange;
    }
  });

  // Calculate Pareto concentration (how much the top N explain)
  let cumulativeContrib = 0;
  let paretoCount = 0;
  for (const d of drivers) {
    if (d.contributionPct > 0) {
      cumulativeContrib += d.contributionPct;
      paretoCount++;
      if (cumulativeContrib >= RCA_CONSTANTS.PARETO_TARGET_PCT) {
        break;
      }
    }
  }

  const topDrivers = drivers.slice(0, RCA_CONSTANTS.MAX_TOP_DRIVERS_PER_DIMENSION);
  let paretoSummary = `${distinctSegments.length} segments analyzed across "${dimensionName}".`;

  if (paretoCount > 0 && paretoCount <= 3 && cumulativeContrib > 0) {
    paretoSummary = `Top ${paretoCount} segment${paretoCount > 1 ? 's' : ''} (${topDrivers.slice(0, paretoCount).map(t => `"${t.segment}"`).join(', ')}) explain ${cumulativeContrib.toFixed(1)}% of the observed shift.`;
  }

  return {
    dimension: dimensionName,
    distinctValuesCount: distinctSegments.length,
    totalBeforeValue: Number(totalBefore.toFixed(2)),
    totalAfterValue: Number(totalAfter.toFixed(2)),
    totalAbsoluteChange: Number(actualTotalDelta.toFixed(2)),
    topDrivers,
    paretoSummary,
    paretoExplainedPct: Number(cumulativeContrib.toFixed(1)),
    isHighCardinality: distinctSegments.length > RCA_CONSTANTS.MAX_DISTINCT_VALUES_FOR_DIMENSION,
  };
}
