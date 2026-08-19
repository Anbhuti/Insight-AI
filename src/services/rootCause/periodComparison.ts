import { PeriodComparisonData, TemporalChangePoint, RCAConfidenceLevel } from './types';
import { RCA_CONSTANTS } from './constants';

export interface SplitDatasetResult {
  beforeRows: Record<string, any>[];
  afterRows: Record<string, any>[];
  periodBeforeLabel: string;
  periodAfterLabel: string;
  dateColumnName?: string;
  splitIndex: number;
}

/**
 * Parses numeric cell values safely
 */
export function parseNumericValue(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[$,%]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Attempts to parse date string or timestamp
 */
export function parseDateValue(val: any): number | null {
  if (!val) return null;
  const d = new Date(val);
  const time = d.getTime();
  return isNaN(time) ? null : time;
}

/**
 * Splits dataset into Baseline (Before) and Comparison/Anomaly (After) periods
 */
export function splitDatasetByPeriod(
  columns: string[],
  rows: (string | number | boolean | null)[][],
  targetMetric: string,
  dateColumn?: string,
  anomalyDate?: string,
  anomalyRowIndex?: number
): SplitDatasetResult {
  const metricColIndex = columns.findIndex(
    (c) => c.toLowerCase() === targetMetric.toLowerCase()
  );

  let dateColIndex = -1;
  if (dateColumn) {
    dateColIndex = columns.findIndex(
      (c) => c.toLowerCase() === dateColumn.toLowerCase()
    );
  }

  // If no date column supplied, try finding one
  if (dateColIndex === -1) {
    dateColIndex = columns.findIndex((c) => {
      const lower = c.toLowerCase();
      return (
        lower.includes('date') ||
        lower.includes('time') ||
        lower.includes('day') ||
        lower.includes('month') ||
        lower.includes('year')
      );
    });
  }

  // Convert raw rows to object records
  const objectRows = rows.map((r, i) => {
    const obj: Record<string, any> = { _originalRowIndex: i };
    columns.forEach((col, ci) => {
      obj[col] = r[ci];
    });
    return obj;
  });

  const totalCount = objectRows.length;
  if (totalCount === 0) {
    return {
      beforeRows: [],
      afterRows: [],
      periodBeforeLabel: 'Baseline Period',
      periodAfterLabel: 'Current Period',
      splitIndex: 0,
    };
  }

  // If date column exists, sort chronologically
  let sortedRows = [...objectRows];
  const dateColName = dateColIndex !== -1 ? columns[dateColIndex] : undefined;

  if (dateColName) {
    sortedRows.sort((a, b) => {
      const ta = parseDateValue(a[dateColName]) ?? 0;
      const tb = parseDateValue(b[dateColName]) ?? 0;
      return ta - tb;
    });
  }

  let splitIdx = Math.floor(totalCount / 2);

  // Case 1: Specific anomaly row provided
  if (typeof anomalyRowIndex === 'number' && anomalyRowIndex >= 0 && anomalyRowIndex < totalCount) {
    // If anomaly row index is specific, compare preceding baseline with recent/anomaly window
    splitIdx = Math.max(1, Math.min(anomalyRowIndex, totalCount - 1));
  } else if (anomalyDate && dateColName) {
    const targetTime = parseDateValue(anomalyDate);
    if (targetTime) {
      const foundIdx = sortedRows.findIndex((r) => (parseDateValue(r[dateColName]) ?? 0) >= targetTime);
      if (foundIdx > 0) {
        splitIdx = foundIdx;
      }
    }
  } else if (metricColIndex !== -1) {
    // Case 2: Detect change point dynamically using rolling mean delta
    const detected = detectChangePoint(sortedRows, targetMetric);
    if (detected && detected.splitIndex > 0 && detected.splitIndex < totalCount) {
      splitIdx = detected.splitIndex;
    }
  }

  // Guard against extreme split boundaries
  if (splitIdx < 1) splitIdx = 1;
  if (splitIdx >= totalCount) splitIdx = totalCount - 1;

  const before = sortedRows.slice(0, splitIdx);
  const after = sortedRows.slice(splitIdx);

  let beforeLabel = 'Baseline Period';
  let afterLabel = 'Comparison Period';

  if (dateColName && before.length > 0 && after.length > 0) {
    const startBefore = String(before[0][dateColName] || '').substring(0, 10);
    const endBefore = String(before[before.length - 1][dateColName] || '').substring(0, 10);
    const startAfter = String(after[0][dateColName] || '').substring(0, 10);
    const endAfter = String(after[after.length - 1][dateColName] || '').substring(0, 10);

    if (startBefore && endBefore) {
      beforeLabel = `Period (${startBefore} - ${endBefore})`;
    }
    if (startAfter && endAfter) {
      afterLabel = `Period (${startAfter} - ${endAfter})`;
    }
  } else {
    beforeLabel = `Baseline (Rows 1 - ${splitIdx})`;
    afterLabel = `Observed (Rows ${splitIdx + 1} - ${totalCount})`;
  }

  return {
    beforeRows: before,
    afterRows: after,
    periodBeforeLabel: beforeLabel,
    periodAfterLabel: afterLabel,
    dateColumnName: dateColName,
    splitIndex: splitIdx,
  };
}

/**
 * Calculates pre vs post period comparison metrics
 */
export function calculatePeriodComparison(
  beforeRows: Record<string, any>[],
  afterRows: Record<string, any>[],
  targetMetric: string,
  periodBeforeLabel: string,
  periodAfterLabel: string
): PeriodComparisonData {
  let sumBefore = 0;
  let countBefore = 0;
  let sumAfter = 0;
  let countAfter = 0;

  for (const r of beforeRows) {
    const val = parseNumericValue(r[targetMetric]);
    if (val !== null) {
      sumBefore += val;
      countBefore++;
    }
  }

  for (const r of afterRows) {
    const val = parseNumericValue(r[targetMetric]);
    if (val !== null) {
      sumAfter += val;
      countAfter++;
    }
  }

  const absChange = sumAfter - sumBefore;
  const pctChange =
    sumBefore !== 0
      ? Number(((absChange / Math.abs(sumBefore)) * 100).toFixed(2))
      : sumAfter > 0
      ? 100
      : 0;

  let confidence: RCAConfidenceLevel = 'high';
  if (countBefore < RCA_CONSTANTS.MIN_RECORDS_FOR_SEGMENT_ANALYSIS || countAfter < RCA_CONSTANTS.MIN_RECORDS_FOR_SEGMENT_ANALYSIS) {
    confidence = 'insufficient';
  } else if (countBefore < 15 || countAfter < 15) {
    confidence = 'low';
  } else if (countBefore < 40 || countAfter < 40) {
    confidence = 'medium';
  }

  return {
    periodBeforeLabel,
    periodAfterLabel,
    beforeValue: Number(sumBefore.toFixed(2)),
    afterValue: Number(sumAfter.toFixed(2)),
    absoluteChange: Number(absChange.toFixed(2)),
    percentageChange: pctChange,
    sampleSizeBefore: countBefore,
    sampleSizeAfter: countAfter,
    confidence,
  };
}

/**
 * Detects significant structural change point across a time series
 */
export function detectChangePoint(
  rows: Record<string, any>[],
  targetMetric: string
): { splitIndex: number; changePoint: TemporalChangePoint } | null {
  const numericValues = rows
    .map((r, i) => ({ index: i, val: parseNumericValue(r[targetMetric]) }))
    .filter((x): x is { index: number; val: number } => x.val !== null);

  const n = numericValues.length;
  if (n < RCA_CONSTANTS.MIN_TOTAL_RECORDS_FOR_RCA) return null;

  let maxMeanDiff = 0;
  let bestSplitIndex = Math.floor(n / 2);
  let bestBeforeMean = 0;
  let bestAfterMean = 0;

  // Window step comparison
  const minWindow = Math.max(3, Math.floor(n * 0.15));
  for (let s = minWindow; s <= n - minWindow; s++) {
    const beforeSlice = numericValues.slice(0, s);
    const afterSlice = numericValues.slice(s);

    const meanBefore = beforeSlice.reduce((acc, c) => acc + c.val, 0) / beforeSlice.length;
    const meanAfter = afterSlice.reduce((acc, c) => acc + c.val, 0) / afterSlice.length;

    const diff = Math.abs(meanAfter - meanBefore);
    if (diff > maxMeanDiff) {
      maxMeanDiff = diff;
      bestSplitIndex = numericValues[s].index;
      bestBeforeMean = meanBefore;
      bestAfterMean = meanAfter;
    }
  }

  const shiftPct =
    bestBeforeMean !== 0
      ? Number((((bestAfterMean - bestBeforeMean) / Math.abs(bestBeforeMean)) * 100).toFixed(2))
      : 0;

  return {
    splitIndex: bestSplitIndex,
    changePoint: {
      dateOrIndex: `Record #${bestSplitIndex + 1}`,
      beforeMean: Number(bestBeforeMean.toFixed(2)),
      afterMean: Number(bestAfterMean.toFixed(2)),
      shiftMagnitudePct: shiftPct,
      description: `Structural baseline shifted by ${shiftPct > 0 ? '+' : ''}${shiftPct}% around record #${bestSplitIndex + 1}.`,
    },
  };
}
