import {
  DatasetProfile,
  ColumnProfile,
  ColumnLogicalType,
  DataIssue,
  DataQualitySummary,
  NumericStatistics,
  CategoricalStatistics,
  TextStatistics,
  BooleanStatistics,
  DateStatistics,
  DuplicateRowPreview,
  ProfilingProgressUpdate,
  ProfilingStatus,
  QUALITY_WEIGHTS,
  QUALITY_SCORE_RANGES,
  QualityGrade,
  CategoricalValueFrequency,
} from '../types/dataProfile';
import { Dataset } from '../types/dataset';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, getBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const PROFILE_VERSION = 1;
const LOCAL_PROFILE_KEY_PREFIX = 'insightai_dataset_profile_';

// Missing value representations
const MISSING_STRINGS = new Set([
  '',
  'null',
  'undefined',
  'na',
  'n/a',
  'nan',
  'none',
  '-',
  '--',
  '#n/a',
  '#null!',
  '#valeur!',
  '#ref!',
]);

export function isValueMissing(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'number') return Number.isNaN(val);
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase();
    return MISSING_STRINGS.has(trimmed);
  }
  return false;
}

/**
 * Interface abstraction for profiling engine
 */
export interface ProfilingEngine {
  profile(
    dataset: Dataset,
    fileData?: ArrayBuffer | string,
    onProgress?: (progress: ProfilingProgressUpdate) => void
  ): Promise<DatasetProfile>;
}

/**
 * Parses date string safely without timezone skew
 */
function parseDateValue(val: string): Date | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  
  // Must have some separator or structure resembling a date
  if (!/[\/\-\.\s,]/.test(trimmed) && trimmed.length !== 8) {
    return null;
  }

  // Check common regex patterns
  // ISO: YYYY-MM-DD or YYYY/MM/DD
  const isoPattern = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;
  // Euro/US: DD/MM/YYYY or MM/DD/YYYY
  const slashPattern = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;
  // Written: Aug 15, 2026 or 15 Aug 2026
  const wordPattern = /^[a-zA-Z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[a-zA-Z]{3,9},?\s+\d{4}/;

  if (isoPattern.test(trimmed) || slashPattern.test(trimmed) || wordPattern.test(trimmed)) {
    const timestamp = Date.parse(trimmed);
    if (!Number.isNaN(timestamp)) {
      const d = new Date(timestamp);
      // Valid year sanity range (1900 - 2100)
      if (d.getFullYear() >= 1900 && d.getFullYear() <= 2100) {
        return d;
      }
    }
  }
  return null;
}

/**
 * Heuristic logical type detection for a column of values
 */
export function detectColumnTypes(
  colName: string,
  rawValues: unknown[]
): { logicalType: ColumnLogicalType; nonNullCount: number } {
  const nonNullValues: unknown[] = [];

  for (const v of rawValues) {
    if (!isValueMissing(v)) {
      nonNullValues.push(v);
    }
  }

  const nonNullCount = nonNullValues.length;
  if (nonNullCount === 0) {
    return { logicalType: 'unknown', nonNullCount: 0 };
  }

  let numericCount = 0;
  let integerCount = 0;
  let booleanCount = 0;
  let dateCount = 0;
  let datetimeCount = 0;

  const boolRegex = /^(true|false|yes|no|y|n|1|0)$/i;

  for (const val of nonNullValues) {
    // 1. Boolean check
    if (typeof val === 'boolean') {
      booleanCount++;
      continue;
    }
    if (typeof val === 'string' && boolRegex.test(val.trim())) {
      booleanCount++;
    }

    // 2. Numeric check
    let numVal: number | null = null;
    if (typeof val === 'number') {
      numVal = val;
    } else if (typeof val === 'string') {
      const cleaned = val.replace(/,/g, '').trim();
      if (cleaned !== '' && !Number.isNaN(Number(cleaned))) {
        numVal = Number(cleaned);
      }
    }

    if (numVal !== null && !Number.isNaN(numVal)) {
      numericCount++;
      if (Number.isInteger(numVal)) {
        integerCount++;
      }
      continue; // If cleanly numeric, don't check date unless col name hints date
    }

    // 3. Date / Datetime check
    if (val instanceof Date && !Number.isNaN(val.getTime())) {
      dateCount++;
      if (val.getHours() !== 0 || val.getMinutes() !== 0 || val.getSeconds() !== 0) {
        datetimeCount++;
      }
    } else if (typeof val === 'string') {
      const parsedDate = parseDateValue(val);
      if (parsedDate) {
        dateCount++;
        if (
          val.includes(':') ||
          parsedDate.getHours() !== 0 ||
          parsedDate.getMinutes() !== 0 ||
          parsedDate.getSeconds() !== 0
        ) {
          datetimeCount++;
        }
      }
    }
  }

  // Threshold ratio (85% consistency)
  const threshold = 0.85;

  if (booleanCount / nonNullCount >= threshold && booleanCount > 0) {
    return { logicalType: 'boolean', nonNullCount };
  }

  if (dateCount / nonNullCount >= threshold && dateCount > 0) {
    return {
      logicalType: datetimeCount / dateCount > 0.4 ? 'datetime' : 'date',
      nonNullCount,
    };
  }

  if (numericCount / nonNullCount >= threshold && numericCount > 0) {
    if (integerCount === numericCount) {
      return { logicalType: 'integer', nonNullCount };
    }
    return { logicalType: 'decimal', nonNullCount };
  }

  // Categorical vs Text
  const uniqueStrings = new Set(nonNullValues.map((v) => String(v).trim()));
  const uniqueRatio = uniqueStrings.size / nonNullCount;

  if (uniqueStrings.size <= 50 || (uniqueRatio <= 0.15 && uniqueStrings.size <= 250)) {
    return { logicalType: 'categorical', nonNullCount };
  }

  return { logicalType: 'text', nonNullCount };
}

/**
 * Calculates numeric statistics including Percentiles & IQR Outliers
 */
export function calculateNumericStatistics(
  rawValues: unknown[],
  isInteger: boolean
): NumericStatistics {
  const nums: number[] = [];
  let missingCount = 0;
  let zerosCount = 0;
  let negativeCount = 0;

  for (const v of rawValues) {
    if (isValueMissing(v)) {
      missingCount++;
      continue;
    }
    let n: number | null = null;
    if (typeof v === 'number') {
      n = v;
    } else if (typeof v === 'string') {
      const cleaned = v.replace(/,/g, '').trim();
      const parsed = Number(cleaned);
      if (!Number.isNaN(parsed)) n = parsed;
    }

    if (n !== null && !Number.isNaN(n) && Number.isFinite(n)) {
      nums.push(n);
      if (n === 0) zerosCount++;
      if (n < 0) negativeCount++;
    } else {
      missingCount++;
    }
  }

  const count = nums.length;
  if (count === 0) {
    return {
      count: 0,
      missingCount,
      uniqueCount: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      standardDeviation: null,
      percentile25: null,
      percentile50: null,
      percentile75: null,
      iqr: null,
      outlierCount: 0,
      outlierPercentage: 0,
      lowerOutlierBound: null,
      upperOutlierBound: null,
      isInteger,
      zerosCount: 0,
      negativeCount: 0,
      histogram: [],
    };
  }

  // Sort ascending for percentiles
  nums.sort((a, b) => a - b);

  const min = nums[0];
  const max = nums[nums.length - 1];
  const uniqueCount = new Set(nums).size;

  // Mean
  const sum = nums.reduce((acc, curr) => acc + curr, 0);
  const mean = Math.round((sum / count) * 10000) / 10000;

  // Variance & Standard Deviation
  const variance =
    count > 1
      ? nums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (count - 1)
      : 0;
  const standardDeviation = Math.round(Math.sqrt(variance) * 10000) / 10000;

  // Percentile helper (interpolated)
  const getPercentile = (p: number): number => {
    if (count === 1) return nums[0];
    const index = (count - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper) return nums[lower];
    return nums[lower] * (1 - weight) + nums[upper] * weight;
  };

  const percentile25 = Math.round(getPercentile(0.25) * 10000) / 10000;
  const percentile50 = Math.round(getPercentile(0.50) * 10000) / 10000; // Median
  const percentile75 = Math.round(getPercentile(0.75) * 10000) / 10000;
  const median = percentile50;

  const iqr = Math.round((percentile75 - percentile25) * 10000) / 10000;

  // IQR Outlier bounds
  const lowerOutlierBound = Math.round((percentile25 - 1.5 * iqr) * 10000) / 10000;
  const upperOutlierBound = Math.round((percentile75 + 1.5 * iqr) * 10000) / 10000;

  let outlierCount = 0;
  for (const n of nums) {
    if (n < lowerOutlierBound || n > upperOutlierBound) {
      outlierCount++;
    }
  }
  const outlierPercentage =
    count > 0 ? Math.round((outlierCount / count) * 10000) / 100 : 0;

  // Histogram calculation (8 bins)
  const histogram: { binStart: number; binEnd: number; count: number; label: string }[] = [];
  const binCount = Math.min(8, Math.max(3, uniqueCount));
  const range = max - min;

  if (range === 0 || binCount <= 1) {
    histogram.push({
      binStart: min,
      binEnd: max,
      count,
      label: `${min}`,
    });
  } else {
    const binWidth = range / binCount;
    for (let i = 0; i < binCount; i++) {
      const start = min + i * binWidth;
      const end = i === binCount - 1 ? max : start + binWidth;
      const bCount = nums.filter(
        (val) => (i === binCount - 1 ? val >= start && val <= end : val >= start && val < end)
      ).length;

      const formatNum = (x: number) =>
        Math.abs(x) >= 10000 || (Math.abs(x) < 0.01 && x !== 0)
          ? x.toExponential(1)
          : x.toLocaleString(undefined, { maximumFractionDigits: 1 });

      histogram.push({
        binStart: Math.round(start * 100) / 100,
        binEnd: Math.round(end * 100) / 100,
        count: bCount,
        label: `${formatNum(start)} - ${formatNum(end)}`,
      });
    }
  }

  return {
    count,
    missingCount,
    uniqueCount,
    min,
    max,
    mean,
    median,
    standardDeviation,
    percentile25,
    percentile50,
    percentile75,
    iqr,
    outlierCount,
    outlierPercentage,
    lowerOutlierBound,
    upperOutlierBound,
    isInteger,
    zerosCount,
    negativeCount,
    histogram,
  };
}

/**
 * Calculates categorical statistics and top 10 frequencies
 */
export function calculateCategoricalStatistics(
  rawValues: unknown[],
  rowCount: number
): CategoricalStatistics {
  const freqMap = new Map<string, number>();
  let missingCount = 0;
  let nonNullCount = 0;

  for (const v of rawValues) {
    if (isValueMissing(v)) {
      missingCount++;
    } else {
      nonNullCount++;
      const key = String(v).trim();
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    }
  }

  const uniqueCount = freqMap.size;
  const uniquenessPercentage =
    rowCount > 0 ? Math.round((uniqueCount / rowCount) * 10000) / 100 : 0;

  // Sort top values descending
  const sorted = Array.from(freqMap.entries()).sort((a, b) => b[1] - a[1]);
  const topValues: CategoricalValueFrequency[] = sorted.slice(0, 10).map(([value, count]) => ({
    value,
    count,
    percentage: nonNullCount > 0 ? Math.round((count / nonNullCount) * 10000) / 100 : 0,
  }));

  const maxFreq = sorted.length > 0 ? sorted[0][1] : 0;
  const isConstant = uniqueCount === 1 || (nonNullCount > 0 && maxFreq / nonNullCount >= 0.95);
  const isHighCardinality = uniqueCount > 30 && uniquenessPercentage > 30;
  const isPotentialId = uniqueCount >= nonNullCount * 0.95 && nonNullCount >= rowCount * 0.8;

  return {
    count: nonNullCount,
    missingCount,
    uniqueCount,
    uniquenessPercentage,
    topValues,
    isPotentialId,
    isHighCardinality,
    isConstant,
  };
}

/**
 * Calculates text statistics
 */
export function calculateTextStatistics(
  rawValues: unknown[],
  rowCount: number
): TextStatistics {
  let missingCount = 0;
  let nonNullCount = 0;
  let totalLength = 0;
  let minLength = Infinity;
  let maxLength = 0;
  const uniqueSet = new Set<string>();

  for (const v of rawValues) {
    if (isValueMissing(v)) {
      missingCount++;
    } else {
      nonNullCount++;
      const str = String(v).trim();
      uniqueSet.add(str);
      const len = str.length;
      totalLength += len;
      if (len < minLength) minLength = len;
      if (len > maxLength) maxLength = len;
    }
  }

  if (nonNullCount === 0) {
    minLength = 0;
  }

  const averageLength =
    nonNullCount > 0 ? Math.round((totalLength / nonNullCount) * 10) / 10 : 0;
  const uniquenessPercentage =
    rowCount > 0 ? Math.round((uniqueSet.size / rowCount) * 10000) / 100 : 0;

  return {
    count: nonNullCount,
    missingCount,
    uniqueCount: uniqueSet.size,
    uniquenessPercentage,
    averageLength,
    minLength: minLength === Infinity ? 0 : minLength,
    maxLength,
    isPotentialId: uniqueSet.size >= nonNullCount * 0.95 && nonNullCount >= rowCount * 0.8,
    isConstant: uniqueSet.size <= 1,
  };
}

/**
 * Calculates boolean statistics
 */
export function calculateBooleanStatistics(rawValues: unknown[]): BooleanStatistics {
  let trueCount = 0;
  let falseCount = 0;
  let missingCount = 0;

  const trueRegex = /^(true|yes|y|1)$/i;
  const falseRegex = /^(false|no|n|0)$/i;

  for (const v of rawValues) {
    if (isValueMissing(v)) {
      missingCount++;
    } else if (typeof v === 'boolean') {
      if (v) trueCount++;
      else falseCount++;
    } else {
      const str = String(v).trim();
      if (trueRegex.test(str)) trueCount++;
      else if (falseRegex.test(str)) falseCount++;
      else missingCount++;
    }
  }

  const count = trueCount + falseCount;
  const truePercentage = count > 0 ? Math.round((trueCount / count) * 10000) / 100 : 0;
  const falsePercentage = count > 0 ? Math.round((falseCount / count) * 10000) / 100 : 0;

  return {
    count,
    missingCount,
    trueCount,
    falseCount,
    truePercentage,
    falsePercentage,
  };
}

/**
 * Calculates date statistics
 */
export function calculateDateStatistics(rawValues: unknown[]): DateStatistics {
  const dates: Date[] = [];
  let missingCount = 0;
  const uniqueDatesSet = new Set<string>();

  for (const v of rawValues) {
    if (isValueMissing(v)) {
      missingCount++;
    } else if (v instanceof Date && !Number.isNaN(v.getTime())) {
      dates.push(v);
      uniqueDatesSet.add(v.toISOString().split('T')[0]);
    } else {
      const parsed = parseDateValue(String(v));
      if (parsed) {
        dates.push(parsed);
        uniqueDatesSet.add(parsed.toISOString().split('T')[0]);
      } else {
        missingCount++;
      }
    }
  }

  if (dates.length === 0) {
    return {
      count: 0,
      missingCount,
      uniqueDateCount: 0,
      minDate: null,
      maxDate: null,
    };
  }

  dates.sort((a, b) => a.getTime() - b.getTime());
  const earliest = dates[0];
  const latest = dates[dates.length - 1];

  const formatDateLabel = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    count: dates.length,
    missingCount,
    uniqueDateCount: uniqueDatesSet.size,
    minDate: earliest.toISOString(),
    maxDate: latest.toISOString(),
    earliestFormatted: formatDateLabel(earliest),
    latestFormatted: formatDateLabel(latest),
  };
}

/**
 * Profiles all columns of a dataset
 */
export function profileColumns(
  columns: string[],
  rows: (string | number | boolean | null)[][],
  rowCount: number
): ColumnProfile[] {
  return columns.map((colName, colIdx) => {
    const rawValues = rows.map((r) => r[colIdx]);
    const { logicalType, nonNullCount } = detectColumnTypes(colName, rawValues);

    const missingCount = rowCount - nonNullCount;
    const missingPercentage =
      rowCount > 0 ? Math.round((missingCount / rowCount) * 10000) / 100 : 0;

    let missingSeverity: 'good' | 'low' | 'medium' | 'high' | 'critical' = 'good';
    if (missingPercentage > 50) missingSeverity = 'critical';
    else if (missingPercentage > 20) missingSeverity = 'high';
    else if (missingPercentage > 5) missingSeverity = 'medium';
    else if (missingPercentage > 0) missingSeverity = 'low';

    // Extract sample values for display (up to 5 unique non-null samples)
    const sampleValues: (string | number | boolean | null)[] = [];
    const seen = new Set<string>();
    for (const v of rawValues) {
      if (!isValueMissing(v)) {
        const key = String(v);
        if (!seen.has(key)) {
          seen.add(key);
          sampleValues.push(v as string | number | boolean | null);
          if (sampleValues.length >= 5) break;
        }
      }
    }

    let numericStats: NumericStatistics | undefined;
    let categoricalStats: CategoricalStatistics | undefined;
    let textStats: TextStatistics | undefined;
    let booleanStats: BooleanStatistics | undefined;
    let dateStats: DateStatistics | undefined;

    let uniqueCount = 0;
    let isPotentialId = false;
    let isConstant = false;
    let isHighCardinality = false;

    if (logicalType === 'numeric' || logicalType === 'integer' || logicalType === 'decimal') {
      numericStats = calculateNumericStatistics(rawValues, logicalType === 'integer');
      uniqueCount = numericStats.uniqueCount;
      const lowerName = colName.toLowerCase();
      if (
        (lowerName.includes('id') || lowerName.includes('key') || lowerName.includes('code')) &&
        uniqueCount >= rowCount * 0.9
      ) {
        isPotentialId = true;
      }
      if (numericStats.min === numericStats.max && nonNullCount > 0) {
        isConstant = true;
      }
    } else if (logicalType === 'boolean') {
      booleanStats = calculateBooleanStatistics(rawValues);
      uniqueCount = (booleanStats.trueCount > 0 ? 1 : 0) + (booleanStats.falseCount > 0 ? 1 : 0);
      if (uniqueCount <= 1 && nonNullCount > 0) isConstant = true;
    } else if (logicalType === 'date' || logicalType === 'datetime') {
      dateStats = calculateDateStatistics(rawValues);
      uniqueCount = dateStats.uniqueDateCount;
    } else if (logicalType === 'categorical') {
      categoricalStats = calculateCategoricalStatistics(rawValues, rowCount);
      uniqueCount = categoricalStats.uniqueCount;
      isPotentialId = categoricalStats.isPotentialId;
      isConstant = categoricalStats.isConstant;
      isHighCardinality = categoricalStats.isHighCardinality;
    } else {
      textStats = calculateTextStatistics(rawValues, rowCount);
      uniqueCount = textStats.uniqueCount;
      isPotentialId = textStats.isPotentialId;
      isConstant = textStats.isConstant;
    }

    // Heuristic Potential ID Name check
    const cleanColName = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (
      (cleanColName.endsWith('id') ||
        cleanColName.startsWith('id') ||
        cleanColName.includes('uuid') ||
        cleanColName.includes('guid') ||
        cleanColName.includes('key')) &&
      uniqueCount >= nonNullCount * 0.90 &&
      nonNullCount >= rowCount * 0.8
    ) {
      isPotentialId = true;
    }

    const uniquePercentage =
      rowCount > 0 ? Math.round((uniqueCount / rowCount) * 10000) / 100 : 0;

    let qualityRating: 'good' | 'fair' | 'poor' | 'critical' = 'good';
    if (missingPercentage > 50) qualityRating = 'critical';
    else if (missingPercentage > 20 || (numericStats && numericStats.outlierPercentage > 10))
      qualityRating = 'poor';
    else if (missingPercentage > 5 || isConstant || (numericStats && numericStats.outlierPercentage > 5))
      qualityRating = 'fair';

    return {
      name: colName,
      originalIndex: colIdx,
      logicalType,
      inferredType: logicalType,
      totalRows: rowCount,
      missingCount,
      missingPercentage,
      missingSeverity,
      uniqueCount,
      uniquePercentage,
      isPotentialId,
      isConstant,
      isHighCardinality,
      qualityRating,
      numericStats,
      categoricalStats,
      textStats,
      booleanStats,
      dateStats,
      sampleValues,
    };
  });
}

/**
 * Checks for full row duplicate records in the dataset
 */
export function detectDuplicateRows(
  columns: string[],
  rows: (string | number | boolean | null)[][]
): { duplicateCount: number; duplicatePercentage: number; preview: DuplicateRowPreview[] } {
  const rowHashes = new Map<string, { count: number; firstIndex: number; sample: (string | number | boolean | null)[] }>();
  let duplicateCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const key = JSON.stringify(row);
    const existing = rowHashes.get(key);
    if (existing) {
      existing.count++;
      duplicateCount++;
    } else {
      rowHashes.set(key, { count: 1, firstIndex: idx, sample: row });
    }
  }

  const duplicatePercentage =
    rows.length > 0 ? Math.round((duplicateCount / rows.length) * 10000) / 100 : 0;

  // Build preview of up to 5 duplicate rows
  const preview: DuplicateRowPreview[] = [];
  for (const [_, info] of rowHashes.entries()) {
    if (info.count > 1) {
      preview.push({
        rowIndex: info.firstIndex + 1,
        values: info.sample,
        duplicateCount: info.count,
      });
      if (preview.length >= 5) break;
    }
  }

  return { duplicateCount, duplicatePercentage, preview };
}

/**
 * Detects rule-based deterministic data quality issues and actionable recommendations
 */
export function detectPotentialIssues(
  columns: ColumnProfile[],
  rowCount: number,
  duplicateRowCount: number,
  duplicateRowPercentage: number,
  missingCellPercentage: number
): DataIssue[] {
  const issues: DataIssue[] = [];

  // 1. Duplicate Row Issues
  if (duplicateRowPercentage > 5) {
    issues.push({
      id: 'issue_dups_high',
      category: 'duplicates',
      severity: 'high',
      title: 'High Duplicate Row Rate',
      description: `${duplicateRowCount.toLocaleString()} duplicate rows detected (${duplicateRowPercentage}% of total dataset).`,
      recommendation: 'Review duplicate records to ensure they do not distort aggregations or model training.',
      affectedCount: duplicateRowCount,
      affectedPercentage: duplicateRowPercentage,
    });
  } else if (duplicateRowCount > 0) {
    issues.push({
      id: 'issue_dups_low',
      category: 'duplicates',
      severity: 'low',
      title: 'Duplicate Records Present',
      description: `${duplicateRowCount.toLocaleString()} duplicate rows found (${duplicateRowPercentage}%).`,
      recommendation: 'Verify if multiple occurrences represent genuine repeated events or inadvertent re-ingestion.',
      affectedCount: duplicateRowCount,
      affectedPercentage: duplicateRowPercentage,
    });
  } else {
    issues.push({
      id: 'issue_dups_none',
      category: 'duplicates',
      severity: 'info',
      title: 'No Duplicate Records',
      description: 'All rows in this dataset are distinct and unique.',
      recommendation: 'Dataset meets integrity requirements for row uniqueness.',
    });
  }

  // 2. Missing Value Issues per column
  columns.forEach((col) => {
    if (col.missingPercentage > 50) {
      issues.push({
        id: `issue_missing_crit_${col.name}`,
        column: col.name,
        category: 'missing_values',
        severity: 'critical',
        title: `Critical Missing Values in "${col.name}"`,
        description: `Column "${col.name}" is missing in ${col.missingPercentage}% of records (${col.missingCount.toLocaleString()} rows).`,
        recommendation: 'Consider reviewing or dropping this column before using it for predictive analysis or automated dashboards.',
        affectedCount: col.missingCount,
        affectedPercentage: col.missingPercentage,
      });
    } else if (col.missingPercentage > 20) {
      issues.push({
        id: `issue_missing_high_${col.name}`,
        column: col.name,
        category: 'missing_values',
        severity: 'high',
        title: `High Missing Values in "${col.name}"`,
        description: `"${col.name}" has ${col.missingPercentage}% missing cells (${col.missingCount.toLocaleString()} rows).`,
        recommendation: 'Consider reviewing imputation strategies or imputation defaults prior to statistical modeling.',
        affectedCount: col.missingCount,
        affectedPercentage: col.missingPercentage,
      });
    } else if (col.missingPercentage > 5) {
      issues.push({
        id: `issue_missing_med_${col.name}`,
        column: col.name,
        category: 'missing_values',
        severity: 'medium',
        title: `Moderate Missing Values in "${col.name}"`,
        description: `"${col.name}" contains ${col.missingPercentage}% missing values.`,
        recommendation: 'Check source data export to confirm whether missingness is informative or random.',
        affectedCount: col.missingCount,
        affectedPercentage: col.missingPercentage,
      });
    }

    // 3. Numeric Outlier Issues
    if (col.numericStats && col.numericStats.outlierCount > 0) {
      const pct = col.numericStats.outlierPercentage;
      const sev = pct > 5 ? 'medium' : 'low';
      issues.push({
        id: `issue_outlier_${col.name}`,
        column: col.name,
        category: 'outliers',
        severity: sev,
        title: `Potential Outliers in "${col.name}"`,
        description: `Detected ${col.numericStats.outlierCount.toLocaleString()} values (${pct}%) falling beyond 1.5× IQR boundaries [${col.numericStats.lowerOutlierBound} to ${col.numericStats.upperOutlierBound}].`,
        recommendation: 'Inspect extreme values to verify if they represent valid high-magnitude transactions or data-entry errors.',
        affectedCount: col.numericStats.outlierCount,
        affectedPercentage: pct,
      });
    }

    // 4. Constant / Low Information Columns
    if (col.isConstant) {
      issues.push({
        id: `issue_constant_${col.name}`,
        column: col.name,
        category: 'constant_column',
        severity: 'low',
        title: `Low Information in "${col.name}"`,
        description: `Column "${col.name}" contains nearly identical or uniform values across all rows.`,
        recommendation: 'This column may provide limited analytical variance or segmenting capability.',
        affectedCount: col.totalRows,
        affectedPercentage: 100,
      });
    }

    // 5. High Cardinality Categorical Fields
    if (col.isHighCardinality && !col.isPotentialId) {
      issues.push({
        id: `issue_cardinality_${col.name}`,
        column: col.name,
        category: 'cardinality',
        severity: 'info',
        title: `High Cardinality in "${col.name}"`,
        description: `Field contains ${col.uniqueCount.toLocaleString()} unique values (${col.uniquePercentage}% uniqueness).`,
        recommendation: 'This field contains many distinct categories and may benefit from grouping or frequency encoding.',
        affectedCount: col.uniqueCount,
        affectedPercentage: col.uniquePercentage,
      });
    }

    // 6. Unknown / Ambiguous Type
    if (col.logicalType === 'unknown') {
      issues.push({
        id: `issue_unknown_${col.name}`,
        column: col.name,
        category: 'data_type',
        severity: 'medium',
        title: `Ambiguous Data Type in "${col.name}"`,
        description: `Column "${col.name}" contains mixed or unclassified data structures.`,
        recommendation: 'Check the column values for unexpected format inconsistencies.',
      });
    }
  });

  // Sort issues strictly by severity
  const severityRank: Record<string, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1,
  };

  return issues.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}

/**
 * Calculates deterministic composite Data Quality Score (0-100)
 */
export function calculateDataQuality(
  rowCount: number,
  columnCount: number,
  columns: ColumnProfile[],
  duplicateRowCount: number,
  duplicateRowPercentage: number,
  missingCellCount: number,
  missingCellPercentage: number,
  issues: DataIssue[]
): DataQualitySummary {
  // 1. Missing Values Score (35% weight)
  // 0% missing -> 100; 10% missing -> 75; 40%+ missing -> 0
  const missingValuesScore = Math.max(0, Math.round(100 - missingCellPercentage * 2.5));

  // 2. Duplicates Score (20% weight)
  // 0% dups -> 100; 5% dups -> 75; 20%+ dups -> 0
  const duplicatesScore = Math.max(0, Math.round(100 - duplicateRowPercentage * 5));

  // 3. Type Consistency Score (20% weight)
  const unknownCols = columns.filter((c) => c.logicalType === 'unknown').length;
  const typeConsistencyScore =
    columnCount > 0 ? Math.max(0, Math.round(100 - (unknownCols / columnCount) * 100)) : 100;

  // 4. Critical Issues Score (15% weight)
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const highCount = issues.filter((i) => i.severity === 'high').length;
  const criticalIssuesScore = Math.max(0, 100 - (criticalCount * 30 + highCount * 10));

  // 5. Column Usability Score (10% weight)
  const constantCols = columns.filter((c) => c.isConstant).length;
  const severeMissingCols = columns.filter((c) => c.missingPercentage > 50).length;
  const usabilityDeductions = (constantCols / Math.max(1, columnCount)) * 50 + (severeMissingCols / Math.max(1, columnCount)) * 50;
  const usabilityScore = Math.max(0, Math.round(100 - usabilityDeductions));

  // Overall Weighted Score
  const rawWeightedScore =
    missingValuesScore * QUALITY_WEIGHTS.missingValues +
    duplicatesScore * QUALITY_WEIGHTS.duplicates +
    typeConsistencyScore * QUALITY_WEIGHTS.typeConsistency +
    criticalIssuesScore * QUALITY_WEIGHTS.criticalIssues +
    usabilityScore * QUALITY_WEIGHTS.usability;

  const overallScore = Math.max(0, Math.min(100, Math.round(rawWeightedScore)));

  // Determine Grade
  let grade: QualityGrade = 'Good';
  if (overallScore >= QUALITY_SCORE_RANGES.excellent.min) grade = 'Excellent';
  else if (overallScore >= QUALITY_SCORE_RANGES.good.min) grade = 'Good';
  else if (overallScore >= QUALITY_SCORE_RANGES.fair.min) grade = 'Fair';
  else if (overallScore >= QUALITY_SCORE_RANGES.poor.min) grade = 'Poor';
  else grade = 'Critical';

  const cleanColumnsCount = columns.filter((c) => c.qualityRating === 'good').length;

  const issuesCountBySeverity = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    high: issues.filter((i) => i.severity === 'high').length,
    medium: issues.filter((i) => i.severity === 'medium').length,
    low: issues.filter((i) => i.severity === 'low').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  return {
    overallScore,
    grade,
    breakdown: {
      missingValuesScore,
      duplicatesScore,
      typeConsistencyScore,
      criticalIssuesScore,
      usabilityScore,
    },
    missingCellsTotal: missingCellCount,
    missingCellsPercentage: missingCellPercentage,
    duplicateRowsTotal: duplicateRowCount,
    duplicateRowsPercentage: duplicateRowPercentage,
    totalColumns: columnCount,
    cleanColumnsCount,
    issuesCountBySeverity,
  };
}

/**
 * Default Local Client-Side Profiling Engine
 */
export class LocalProfilingEngine implements ProfilingEngine {
  async profile(
    dataset: Dataset,
    fileData?: ArrayBuffer | string,
    onProgress?: (progress: ProfilingProgressUpdate) => void
  ): Promise<DatasetProfile> {
    onProgress?.({
      stage: 'initializing',
      message: 'Preparing dataset for inspection...',
      percentage: 5,
    });

    let columns: string[] = [];
    let rows: (string | number | boolean | null)[][] = [];

    // Stage 1: Read dataset content
    onProgress?.({
      stage: 'reading',
      message: 'Reading and parsing dataset rows...',
      percentage: 15,
    });

    if (fileData) {
      if (dataset.fileType === 'csv') {
        const text = typeof fileData === 'string' ? fileData : new TextDecoder('utf-8').decode(fileData);
        const parsed = Papa.parse(text, {
          header: false,
          dynamicTyping: false,
          skipEmptyLines: 'greedy',
        });
        if (parsed.data && parsed.data.length > 0) {
          const rawHeader = parsed.data[0] as string[];
          columns = rawHeader.map((c, i) => (c && String(c).trim() ? String(c).trim() : `Column_${i + 1}`));
          rows = (parsed.data.slice(1) as (string | number | boolean | null)[][]).filter(
            (r) => r.length > 0 && r.some((cell) => cell !== null && cell !== '')
          );
        }
      } else {
        // Excel parsing
        const arrayBuf = typeof fileData === 'string' ? new TextEncoder().encode(fileData).buffer : fileData;
        const workbook = XLSX.read(arrayBuf, { type: 'array' });
        const sheetName = dataset.selectedSheet && workbook.SheetNames.includes(dataset.selectedSheet)
          ? dataset.selectedSheet
          : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as (string | number | boolean | null)[][];
        
        if (jsonData && jsonData.length > 0) {
          const rawHeader = jsonData[0] as string[];
          columns = rawHeader.map((c, i) => (c && String(c).trim() ? String(c).trim() : `Column_${i + 1}`));
          rows = jsonData.slice(1).filter((r) => r.length > 0 && r.some((cell) => cell !== null && cell !== ''));
        }
      }
    } else if (dataset.previewSample && dataset.previewSample.columns.length > 0) {
      // Fallback to sample rows if raw file is not supplied in offline mode
      columns = dataset.previewSample.columns;
      rows = dataset.previewSample.rows;
    }

    const rowCount = rows.length;
    const columnCount = columns.length;

    if (columnCount === 0 || rowCount === 0) {
      throw new Error('Dataset contains no readable records or columns.');
    }

    // Stage 2: Column Type & Stat Analysis
    onProgress?.({
      stage: 'detecting_types',
      message: 'Detecting data types and column structures...',
      percentage: 35,
    });

    onProgress?.({
      stage: 'calculating_stats',
      message: 'Calculating distributions and statistical metrics...',
      percentage: 50,
    });

    const columnProfiles = profileColumns(columns, rows, rowCount);

    // Stage 3: Missing & Duplicate Checks
    onProgress?.({
      stage: 'checking_missing',
      message: 'Calculating cell completeness and missing ratios...',
      percentage: 65,
    });

    const totalCells = rowCount * columnCount;
    let missingCellCount = 0;
    columnProfiles.forEach((col) => {
      missingCellCount += col.missingCount;
    });
    const missingCellPercentage =
      totalCells > 0 ? Math.round((missingCellCount / totalCells) * 10000) / 100 : 0;

    onProgress?.({
      stage: 'checking_duplicates',
      message: 'Inspecting exact duplicate row signatures...',
      percentage: 75,
    });

    const { duplicateCount, duplicatePercentage, preview: duplicatePreview } = detectDuplicateRows(
      columns,
      rows
    );

    // Stage 4: Outlier & Quality Evaluation
    onProgress?.({
      stage: 'detecting_outliers',
      message: 'Evaluating numeric distributions and IQR outlier thresholds...',
      percentage: 85,
    });

    const issues = detectPotentialIssues(
      columnProfiles,
      rowCount,
      duplicateCount,
      duplicatePercentage,
      missingCellPercentage
    );

    onProgress?.({
      stage: 'evaluating_quality',
      message: 'Computing comprehensive data quality score...',
      percentage: 95,
    });

    const qualitySummary = calculateDataQuality(
      rowCount,
      columnCount,
      columnProfiles,
      duplicateCount,
      duplicatePercentage,
      missingCellCount,
      missingCellPercentage,
      issues
    );

    const profile: DatasetProfile = {
      datasetId: dataset.datasetId,
      userId: dataset.userId,
      profileVersion: PROFILE_VERSION,
      profiledAt: new Date().toISOString(),
      rowCount,
      columnCount,
      duplicateRowCount: duplicateCount,
      duplicateRowPercentage: duplicatePercentage,
      missingCellCount,
      missingCellPercentage,
      qualityScore: qualitySummary.overallScore,
      qualitySummary,
      columns: columnProfiles,
      issues,
      duplicatePreview,
      status: 'profiled',
    };

    onProgress?.({
      stage: 'completed',
      message: 'Dataset profiling complete.',
      percentage: 100,
    });

    return profile;
  }
}

// Singleton Engine Instance
export const defaultProfilingEngine: ProfilingEngine = new LocalProfilingEngine();

/**
 * Top-level Orchestrator: Fetches file from Cloud Storage or Local, executes profiling, saves results
 */
export async function profileDataset(
  dataset: Dataset,
  onProgress?: (progress: ProfilingProgressUpdate) => void
): Promise<DatasetProfile> {
  onProgress?.({
    stage: 'initializing',
    message: 'Initiating dataset profiling engine...',
    percentage: 5,
  });

  let fileBuffer: ArrayBuffer | undefined;

  // 1. Fetch file content from Firebase Storage if available
  if (storage && dataset.storagePath) {
    try {
      onProgress?.({
        stage: 'reading',
        message: 'Retrieving dataset file from secure cloud storage...',
        percentage: 10,
      });

      const storageRef = ref(storage, dataset.storagePath);
      // Fetch binary content directly using getBytes (up to 25MB)
      fileBuffer = await getBytes(storageRef, 25 * 1024 * 1024);
    } catch (storageErr) {
      console.warn('Storage getBytes notice, trying download URL or fallback:', storageErr);
      if (dataset.downloadUrl) {
        try {
          const res = await fetch(dataset.downloadUrl);
          fileBuffer = await res.arrayBuffer();
        } catch {
          // Fallback to sample rows
        }
      }
    }
  }

  // 2. Execute profiling
  const profile = await defaultProfilingEngine.profile(dataset, fileBuffer, onProgress);

  // 3. Save profile to Firestore and local fallback
  onProgress?.({
    stage: 'saving',
    message: 'Persisting dataset profile to Firestore...',
    percentage: 98,
  });

  await saveDatasetProfile(profile);

  return profile;
}

/**
 * Saves profile document to Firestore at users/{userId}/datasets/{datasetId}/profile/summary
 */
export async function saveDatasetProfile(profile: DatasetProfile): Promise<void> {
  if (db && profile.userId && profile.datasetId) {
    try {
      const profileRef = doc(
        db,
        'users',
        profile.userId,
        'datasets',
        profile.datasetId,
        'profile',
        'summary'
      );

      await setDoc(profileRef, {
        ...profile,
        profiledAt: serverTimestamp(),
      });

      // Update parent dataset doc status and quality score
      const datasetRef = doc(db, 'users', profile.userId, 'datasets', profile.datasetId);
      await updateDoc(datasetRef, {
        status: 'profiled',
        qualityScore: profile.qualityScore,
        profiledAt: serverTimestamp(),
        rowCount: profile.rowCount,
        columnCount: profile.columnCount,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn('Firestore saveDatasetProfile warning, caching locally:', error);
    }
  }

  // Always cache locally as well
  saveDatasetProfileLocally(profile);
}

/**
 * Retrieves the stored profile for a dataset
 */
export async function getDatasetProfile(
  userId: string,
  datasetId: string
): Promise<DatasetProfile | null> {
  if (!userId || !datasetId) return null;

  if (db) {
    try {
      const profileRef = doc(db, 'users', userId, 'datasets', datasetId, 'profile', 'summary');
      const snap = await getDoc(profileRef);

      if (snap.exists()) {
        const data = snap.data() as DatasetProfile;
        return {
          ...data,
          profiledAt: (data.profiledAt as any)?.toDate
            ? (data.profiledAt as any).toDate().toISOString()
            : data.profiledAt || new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn('Firestore getDatasetProfile warning, checking local storage:', error);
    }
  }

  return getDatasetProfileLocally(userId, datasetId);
}

// Local Storage Caching Helpers

function getLocalKey(userId: string, datasetId: string): string {
  return `${LOCAL_PROFILE_KEY_PREFIX}${userId}_${datasetId}`;
}

export function saveDatasetProfileLocally(profile: DatasetProfile): void {
  try {
    const key = getLocalKey(profile.userId, profile.datasetId);
    localStorage.setItem(key, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to cache profile locally', e);
  }
}

export function getDatasetProfileLocally(
  userId: string,
  datasetId: string
): DatasetProfile | null {
  try {
    const key = getLocalKey(userId, datasetId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
