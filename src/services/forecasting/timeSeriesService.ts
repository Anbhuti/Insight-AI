import { Dataset } from '../../types/dataset';
import { DatasetProfile, ColumnProfile } from '../../types/dataProfile';
import {
  TimeFrequency,
  AggregationType,
  MissingPeriodStrategy,
  OutlierHandlingStrategy,
  TimeSeriesPoint,
  TimeSeriesMetadata,
} from './forecastTypes';

/**
 * Automatically detects the best date column in a dataset
 */
export function detectDateColumn(
  columns: string[],
  profile?: DatasetProfile | null,
  sampleRows?: (string | number | boolean | null)[][]
): string | null {
  // 1. Check profile columns for logicalType === 'date' | 'datetime'
  if (profile?.columns) {
    const dateCol = profile.columns.find(
      (c) => c.logicalType === 'date' || c.logicalType === 'datetime'
    );
    if (dateCol) return dateCol.name;
  }

  // 2. Check column name hints
  const dateKeywords = [
    'date',
    'time',
    'timestamp',
    'created_at',
    'createdat',
    'updated_at',
    'order_date',
    'orderdate',
    'sale_date',
    'saledate',
    'transaction_date',
    'transaction_time',
    'event_date',
    'day',
    'month',
    'period',
    'year',
  ];

  for (const kw of dateKeywords) {
    const matched = columns.find((c) => c.toLowerCase() === kw || c.toLowerCase().includes(kw));
    if (matched) return matched;
  }

  // 3. Test parse success rate on sample rows
  if (sampleRows && sampleRows.length > 0) {
    let bestCol: string | null = null;
    let bestScore = 0;

    columns.forEach((col, colIdx) => {
      let validDateCount = 0;
      let totalChecked = 0;

      for (let r = 0; r < Math.min(sampleRows.length, 25); r++) {
        const val = sampleRows[r]?.[colIdx];
        if (val !== null && val !== undefined && val !== '') {
          totalChecked++;
          const parsed = Date.parse(String(val));
          if (!isNaN(parsed) && parsed > 0 && parsed < 253402300799000) {
            validDateCount++;
          }
        }
      }

      if (totalChecked > 0) {
        const score = validDateCount / totalChecked;
        if (score > 0.6 && score > bestScore) {
          bestScore = score;
          bestCol = col;
        }
      }
    });

    if (bestCol) return bestCol;
  }

  return columns[0] || null;
}

/**
 * Automatically detects forecastable numeric metrics in a dataset
 */
export function detectForecastableMetrics(
  columns: string[],
  profile?: DatasetProfile | null
): { defaultMetric: string; allMetrics: string[] } {
  let candidateMetrics: string[] = [];

  if (profile?.columns) {
    candidateMetrics = profile.columns
      .filter((c) => {
        const isNumeric =
          c.logicalType === 'numeric' ||
          c.logicalType === 'integer' ||
          c.logicalType === 'decimal';
        return isNumeric && !c.isPotentialId && c.uniqueCount > 1;
      })
      .map((c) => c.name);
  }

  if (candidateMetrics.length === 0) {
    // Fallback: exclude common ID names
    candidateMetrics = columns.filter((col) => {
      const lower = col.toLowerCase();
      const isId =
        lower.endsWith('_id') ||
        lower.endsWith('id') ||
        lower.includes('uuid') ||
        lower.includes('phone') ||
        lower.includes('zip') ||
        lower.includes('code');
      return !isId;
    });
  }

  // Rank keywords to pick the best default metric (revenue, sales, orders, profit, demand, quantity)
  const priorityKeywords = [
    'revenue',
    'sales',
    'total_sales',
    'profit',
    'net_profit',
    'orders',
    'quantity',
    'demand',
    'volume',
    'amount',
    'total',
    'mrr',
    'arr',
    'gmv',
  ];

  let defaultMetric = candidateMetrics[0] || columns[0] || '';
  for (const kw of priorityKeywords) {
    const match = candidateMetrics.find(
      (c) => c.toLowerCase() === kw || c.toLowerCase().includes(kw)
    );
    if (match) {
      defaultMetric = match;
      break;
    }
  }

  return { defaultMetric, allMetrics: candidateMetrics };
}

/**
 * Safely parses any date string / number / timestamp to a valid Unix Millisecond timestamp
 */
export function parseDateToTimestamp(rawVal: any): number | null {
  if (rawVal === null || rawVal === undefined || rawVal === '') return null;

  if (typeof rawVal === 'number') {
    // Check if epoch seconds (e.g. 10 digits) or milliseconds (13 digits)
    if (rawVal > 1e11 && rawVal < 1e14) return rawVal;
    if (rawVal > 1e8 && rawVal < 1e11) return rawVal * 1000;
    // Excel serial number (e.g. 44562 is ~Jan 2022)
    if (rawVal > 25000 && rawVal < 60000) {
      return (rawVal - 25569) * 86400 * 1000;
    }
  }

  const str = String(rawVal).trim();
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return parsed;

  // Try DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  return null;
}

/**
 * Detects time frequency from a series of timestamps
 */
export function detectTimeFrequency(
  timestamps: number[]
): { frequency: TimeFrequency; confidence: number; avgIntervalDays: number; regularityScore: number } {
  if (timestamps.length < 2) {
    return {
      frequency: 'daily',
      confidence: 0.5,
      avgIntervalDays: 1,
      regularityScore: 0.5,
    };
  }

  // Sort timestamps ascending
  const sorted = [...timestamps].sort((a, b) => a - b);
  const diffsDays: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const diffMs = sorted[i] - sorted[i - 1];
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 0.001) {
      diffsDays.push(diffDays);
    }
  }

  if (diffsDays.length === 0) {
    return { frequency: 'daily', confidence: 0.5, avgIntervalDays: 1, regularityScore: 0.5 };
  }

  // Calculate median difference in days
  diffsDays.sort((a, b) => a - b);
  const medianDiff = diffsDays[Math.floor(diffsDays.length / 2)];
  const avgDiff = diffsDays.reduce((acc, v) => acc + v, 0) / diffsDays.length;

  // Calculate standard deviation / regularity
  const variance =
    diffsDays.reduce((acc, v) => acc + Math.pow(v - medianDiff, 2), 0) / diffsDays.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = medianDiff > 0 ? stdDev / medianDiff : 1;
  const regularityScore = Math.max(0, Math.min(1, 1 - coefficientOfVariation * 0.5));

  let frequency: TimeFrequency = 'daily';
  let confidence = 0.8;

  if (medianDiff >= 0.7 && medianDiff <= 1.5) {
    frequency = 'daily';
    confidence = Math.min(0.95, regularityScore + 0.2);
  } else if (medianDiff >= 5.5 && medianDiff <= 8.5) {
    frequency = 'weekly';
    confidence = Math.min(0.95, regularityScore + 0.2);
  } else if (medianDiff >= 25 && medianDiff <= 35) {
    frequency = 'monthly';
    confidence = Math.min(0.95, regularityScore + 0.2);
  } else if (medianDiff >= 80 && medianDiff <= 100) {
    frequency = 'quarterly';
    confidence = Math.min(0.95, regularityScore + 0.2);
  } else if (medianDiff >= 330 && medianDiff <= 380) {
    frequency = 'yearly';
    confidence = Math.min(0.95, regularityScore + 0.2);
  } else if (regularityScore < 0.4) {
    frequency = 'irregular';
    confidence = 0.6;
  } else if (medianDiff < 1) {
    frequency = 'daily';
    confidence = 0.7;
  } else {
    frequency = 'monthly';
    confidence = 0.6;
  }

  return {
    frequency,
    confidence: Number(confidence.toFixed(2)),
    avgIntervalDays: Number(avgDiff.toFixed(2)),
    regularityScore: Number(regularityScore.toFixed(2)),
  };
}

/**
 * Standardizes a timestamp into a discrete bucket date string according to frequency
 */
export function getBucketKey(timestamp: number, frequency: TimeFrequency): { key: string; bucketTimestamp: number } {
  const d = new Date(timestamp);

  if (frequency === 'daily' || frequency === 'irregular') {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    const bucketTimestamp = new Date(year, d.getMonth(), d.getDate()).getTime();
    return { key, bucketTimestamp };
  }

  if (frequency === 'weekly') {
    // Align to beginning of the week (Monday)
    const dayOfWeek = d.getDay(); // 0 is Sunday
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    return { key, bucketTimestamp: monday.getTime() };
  }

  if (frequency === 'monthly') {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}-01`;
    const bucketTimestamp = new Date(year, d.getMonth(), 1).getTime();
    return { key, bucketTimestamp };
  }

  if (frequency === 'quarterly') {
    const year = d.getFullYear();
    const qMonth = Math.floor(d.getMonth() / 3) * 3;
    const monthStr = String(qMonth + 1).padStart(2, '0');
    const key = `${year}-${monthStr}-01`;
    const bucketTimestamp = new Date(year, qMonth, 1).getTime();
    return { key, bucketTimestamp };
  }

  // Yearly
  const year = d.getFullYear();
  const key = `${year}-01-01`;
  const bucketTimestamp = new Date(year, 0, 1).getTime();
  return { key, bucketTimestamp };
}

/**
 * Advances a timestamp by N intervals according to frequency
 */
export function advanceDate(timestamp: number, frequency: TimeFrequency, step: number = 1): number {
  const d = new Date(timestamp);

  if (frequency === 'daily' || frequency === 'irregular') {
    d.setDate(d.getDate() + step);
    return d.getTime();
  }

  if (frequency === 'weekly') {
    d.setDate(d.getDate() + step * 7);
    return d.getTime();
  }

  if (frequency === 'monthly') {
    d.setMonth(d.getMonth() + step);
    return d.getTime();
  }

  if (frequency === 'quarterly') {
    d.setMonth(d.getMonth() + step * 3);
    return d.getTime();
  }

  // Yearly
  d.setFullYear(d.getFullYear() + step);
  return d.getTime();
}

/**
 * Formats timestamp to human readable date string based on frequency
 */
export function formatDateByFrequency(timestamp: number, frequency: TimeFrequency): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  if (frequency === 'daily' || frequency === 'irregular' || frequency === 'weekly') {
    return `${year}-${month}-${day}`;
  }
  if (frequency === 'monthly') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[d.getMonth()]} ${year}`;
  }
  if (frequency === 'quarterly') {
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `Q${q} ${year}`;
  }
  return `${year}`;
}

/**
 * Aggregates an array of numerical values based on selected AggregationType
 */
export function aggregateValues(values: number[], agg: AggregationType): number {
  if (values.length === 0) return 0;
  if (agg === 'SUM') {
    return values.reduce((sum, v) => sum + v, 0);
  }
  if (agg === 'AVG') {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  if (agg === 'COUNT') {
    return values.length;
  }
  if (agg === 'MIN') {
    return Math.min(...values);
  }
  if (agg === 'MAX') {
    return Math.max(...values);
  }
  return values.reduce((sum, v) => sum + v, 0);
}

/**
 * Prepares and aggregates raw dataset rows into a clean, chronological TimeSeries
 */
export function prepareTimeSeries(
  columns: string[],
  rows: (string | number | boolean | null)[][],
  dateColumn: string,
  metricColumn: string,
  frequency: TimeFrequency,
  aggregation: AggregationType,
  missingStrategy: MissingPeriodStrategy = 'interpolation',
  outlierStrategy: OutlierHandlingStrategy = 'original'
): { series: TimeSeriesPoint[]; metadata: TimeSeriesMetadata } {
  const dateColIdx = columns.findIndex((c) => c.toLowerCase() === dateColumn.toLowerCase());
  const metricColIdx = columns.findIndex((c) => c.toLowerCase() === metricColumn.toLowerCase());

  if (dateColIdx === -1 || metricColIdx === -1) {
    throw new Error(
      `Required columns not found (Date: "${dateColumn}", Metric: "${metricColumn}") in dataset columns: ${columns.join(', ')}`
    );
  }

  // 1. Extract valid points
  const rawTimestamps: number[] = [];
  const buckets: Map<string, { bucketTimestamp: number; values: number[] }> = new Map();
  let duplicateCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dateVal = row[dateColIdx];
    const metricVal = row[metricColIdx];

    const ts = parseDateToTimestamp(dateVal);
    if (ts === null) continue;

    let numVal: number | null = null;
    if (typeof metricVal === 'number' && !isNaN(metricVal)) {
      numVal = metricVal;
    } else if (typeof metricVal === 'string') {
      const clean = metricVal.replace(/[\$,€,£,¥,\s]/g, '').trim();
      const parsed = parseFloat(clean);
      if (!isNaN(parsed)) numVal = parsed;
    }

    if (numVal !== null) {
      rawTimestamps.push(ts);
      const { key, bucketTimestamp } = getBucketKey(ts, frequency);

      if (!buckets.has(key)) {
        buckets.set(key, { bucketTimestamp, values: [numVal] });
      } else {
        duplicateCount++;
        buckets.get(key)!.values.push(numVal);
      }
    }
  }

  if (buckets.size < 2) {
    throw new Error(
      `Insufficient valid time-series observations (${buckets.size} distinct time periods found). Forecasting requires at least 3 historical periods.`
    );
  }

  // 2. Sort aggregated buckets chronologically
  const sortedEntries = Array.from(buckets.entries()).sort(
    (a, b) => a[1].bucketTimestamp - b[1].bucketTimestamp
  );

  const initialSeries: TimeSeriesPoint[] = sortedEntries.map(([_, data]) => {
    const aggregatedVal = aggregateValues(data.values, aggregation);
    return {
      date: formatDateByFrequency(data.bucketTimestamp, frequency),
      timestamp: data.bucketTimestamp,
      value: aggregatedVal,
    };
  });

  // 3. Missing Period Detection & Regular Grid Filling
  const filledSeries: TimeSeriesPoint[] = [];
  let missingPeriodsCount = 0;

  if (missingStrategy !== 'none' && initialSeries.length >= 2) {
    for (let i = 0; i < initialSeries.length; i++) {
      const current = initialSeries[i];
      filledSeries.push(current);

      if (i < initialSeries.length - 1) {
        const next = initialSeries[i + 1];
        let expectedNextTs = advanceDate(current.timestamp, frequency, 1);

        // Fill gap if next point is further than 1.5 intervals
        let gapCount = 0;
        while (expectedNextTs < next.timestamp - (next.timestamp - current.timestamp) * 0.25 && gapCount < 50) {
          missingPeriodsCount++;
          gapCount++;

          const gapRatio = (expectedNextTs - current.timestamp) / (next.timestamp - current.timestamp);
          let imputedVal = current.value;

          if (missingStrategy === 'interpolation') {
            imputedVal = current.value + gapRatio * (next.value - current.value);
          } else if (missingStrategy === 'forward_fill') {
            imputedVal = current.value;
          } else if (missingStrategy === 'zero') {
            imputedVal = 0;
          }

          filledSeries.push({
            date: formatDateByFrequency(expectedNextTs, frequency),
            timestamp: expectedNextTs,
            value: Number(imputedVal.toFixed(4)),
            isImputed: true,
          });

          expectedNextTs = advanceDate(expectedNextTs, frequency, 1);
        }
      }
    }
  } else {
    filledSeries.push(...initialSeries);
  }

  // 4. Outlier Handling (if requested)
  let hasOutliers = false;
  if (filledSeries.length >= 6) {
    const vals = filledSeries.map((p) => p.value);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(
      vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length
    );

    if (std > 0) {
      filledSeries.forEach((p, idx) => {
        const zScore = Math.abs(p.value - mean) / std;
        if (zScore > 3.0) {
          hasOutliers = true;
          p.isOutlier = true;
          if (outlierStrategy === 'anomaly_adjusted') {
            p.originalValue = p.value;
            // Cap at 2.5 sigma
            const cappedVal = mean + Math.sign(p.value - mean) * 2.5 * std;
            p.value = Number(cappedVal.toFixed(4));
          }
        }
      });
    }
  }

  // 5. Compute comprehensive metadata
  const values = filledSeries.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const meanVal = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - meanVal, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const isConstant = stdDev < 1e-6 || maxVal === minVal;

  const freqInfo = detectTimeFrequency(rawTimestamps);

  const metadata: TimeSeriesMetadata = {
    dateColumn,
    metricColumn,
    detectedFrequency: frequency,
    frequencyConfidence: freqInfo.confidence,
    averageIntervalDays: freqInfo.avgIntervalDays,
    regularityScore: freqInfo.regularityScore,
    totalRawRows: rows.length,
    aggregatedPointsCount: filledSeries.length,
    missingPeriodsCount,
    missingPeriodsPercentage: Number(
      ((missingPeriodsCount / (filledSeries.length || 1)) * 100).toFixed(1)
    ),
    duplicateTimestampsCount: duplicateCount,
    zeroCount: values.filter((v) => Math.abs(v) < 1e-6).length,
    negativeCount: values.filter((v) => v < 0).length,
    minDate: filledSeries[0]?.date || '',
    maxDate: filledSeries[filledSeries.length - 1]?.date || '',
    minValue: Number(minVal.toFixed(2)),
    maxValue: Number(maxVal.toFixed(2)),
    meanValue: Number(meanVal.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    isConstant,
    hasOutliers,
  };

  return { series: filledSeries, metadata };
}
