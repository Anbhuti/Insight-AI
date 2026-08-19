import {
  Anomaly,
  AnomalyDetectionConfig,
  AnomalySeverity,
  AnomalyType,
  DetectionMethod,
  AnomalyContextPoint,
} from '../../types/anomaly';

export interface RawRowRecord {
  index: number;
  data: Record<string, string | number | boolean | null>;
}

export interface NumericSeriesItem {
  rowIndex: number;
  value: number;
  dateStr?: string;
  dimensionStr?: string;
  rowRecord?: Record<string, string | number | boolean | null>;
}

/**
 * Calculates standard statistical properties for an array of numbers
 */
export function calculateBasicStats(values: number[]): {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  min: number;
  max: number;
} {
  const count = values.length;
  if (count === 0) {
    return { count: 0, mean: 0, median: 0, stdDev: 0, q1: 0, q3: 0, iqr: 0, min: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[count - 1];

  const sum = sorted.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / count;

  const variance =
    count > 1
      ? sorted.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (count - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  const getPercentile = (p: number): number => {
    if (count === 1) return sorted[0];
    const index = (count - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  const q1 = getPercentile(0.25);
  const median = getPercentile(0.5);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  return { count, mean, median, stdDev, q1, q3, iqr, min, max };
}

/**
 * Calculates Median Absolute Deviation (MAD)
 */
export function calculateMAD(values: number[], median: number): number {
  if (values.length === 0) return 0;
  const absoluteDeviations = values.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
  const mid = Math.floor(absoluteDeviations.length / 2);
  return absoluteDeviations.length % 2 !== 0
    ? absoluteDeviations[mid]
    : (absoluteDeviations[mid - 1] + absoluteDeviations[mid]) / 2;
}

/**
 * Builds a local 9-point visual context array surrounding an anomaly index
 */
export function buildContextSeries(
  series: NumericSeriesItem[],
  anomalyIdx: number,
  expectedVal: number
): AnomalyContextPoint[] {
  const windowRadius = 4;
  const start = Math.max(0, anomalyIdx - windowRadius);
  const end = Math.min(series.length - 1, anomalyIdx + windowRadius);

  const result: AnomalyContextPoint[] = [];
  for (let i = start; i <= end; i++) {
    const item = series[i];
    const label = item.dateStr || `Row ${item.rowIndex + 1}`;
    result.push({
      label,
      value: Math.round(item.value * 100) / 100,
      expected: Math.round(expectedVal * 100) / 100,
      isAnomaly: i === anomalyIdx,
    });
  }
  return result;
}

/**
 * Determines severity based on statistical deviation multiplier
 */
export function getSeverityFromScore(score: number, method: DetectionMethod): AnomalySeverity {
  const absScore = Math.abs(score);
  if (method === 'z_score') {
    if (absScore >= 4.0) return 'critical';
    if (absScore >= 3.2) return 'high';
    if (absScore >= 2.5) return 'medium';
    return 'low';
  } else if (method === 'iqr') {
    if (absScore >= 3.0) return 'critical';
    if (absScore >= 2.2) return 'high';
    if (absScore >= 1.5) return 'medium';
    return 'low';
  } else if (method === 'pct_change') {
    if (absScore >= 100) return 'critical';
    if (absScore >= 60) return 'high';
    if (absScore >= 35) return 'medium';
    return 'low';
  } else if (method === 'mad') {
    if (absScore >= 5.0) return 'critical';
    if (absScore >= 3.8) return 'high';
    if (absScore >= 2.8) return 'medium';
    return 'low';
  }
  return absScore > 3.0 ? 'high' : 'medium';
}

/**
 * Format friendly numbers for display
 */
export function formatMetricNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (Math.abs(n) < 0.01 && n !== 0) return n.toExponential(2);
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);
}

/**
 * Z-Score Outlier Detection
 */
export function detectZScoreAnomalies(
  series: NumericSeriesItem[],
  columnName: string,
  datasetId: string,
  datasetName: string,
  userId: string,
  config: AnomalyDetectionConfig
): Anomaly[] {
  if (series.length < 5) return [];

  const rawValues = series.map((s) => s.value);
  const { mean, stdDev } = calculateBasicStats(rawValues);

  if (stdDev === 0) return []; // No variance

  const anomalies: Anomaly[] = [];
  const threshold = config.zScoreThreshold;

  for (let i = 0; i < series.length; i++) {
    const item = series[i];
    const zScore = (item.value - mean) / stdDev;
    const absZ = Math.abs(zScore);

    if (absZ >= threshold) {
      const isPositive = zScore > 0;
      const type: AnomalyType = isPositive ? 'spike' : 'drop';
      const deviation = item.value - mean;
      const deviationPercentage = mean !== 0 ? Math.round((deviation / Math.abs(mean)) * 1000) / 10 : 0;
      const severity = getSeverityFromScore(absZ, 'z_score');

      const title = `${isPositive ? 'Statistical Spike' : 'Abnormal Drop'} in "${columnName}"`;
      const formattedActual = formatMetricNumber(item.value);
      const formattedMean = formatMetricNumber(mean);
      const rowIdentifier = item.dateStr ? `${item.dateStr} (Row #${item.rowIndex + 1})` : `Row #${item.rowIndex + 1}`;

      const summary = `Value of ${formattedActual} is ${absZ.toFixed(2)} standard deviations ${
        isPositive ? 'above' : 'below'
      } the historical mean of ${formattedMean} (${deviationPercentage > 0 ? '+' : ''}${deviationPercentage}% variance).`;

      const statisticalEvidence = `Z = (X - μ) / σ = (${item.value} - ${mean.toFixed(2)}) / ${stdDev.toFixed(2)} = ${zScore.toFixed(2)} (Threshold: ±${threshold}σ)`;

      anomalies.push({
        id: `anom_z_${datasetId}_${columnName}_${item.rowIndex}`,
        datasetId,
        datasetName,
        userId,
        column: columnName,
        dateColumn: item.dateStr ? 'Date' : undefined,
        dateValue: item.dateStr,
        dimensionColumn: item.dimensionStr ? 'Segment' : undefined,
        dimensionValue: item.dimensionStr,
        rowIndex: item.rowIndex,
        rowIdentifier,
        actualValue: item.value,
        expectedValue: Math.round(mean * 100) / 100,
        baselineValue: Math.round(mean * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
        deviationPercentage,
        score: Math.round(absZ * 100) / 100,
        scoreLabel: `Z-Score: ${isPositive ? '+' : '-'}${absZ.toFixed(2)}σ`,
        severity,
        type,
        method: 'z_score',
        title,
        summary,
        statisticalEvidence,
        historicalContext: buildContextSeries(series, i, mean),
        rowData: item.rowRecord,
        status: 'active',
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return anomalies;
}

/**
 * IQR (Interquartile Range) Outlier Detection
 */
export function detectIQRAnomalies(
  series: NumericSeriesItem[],
  columnName: string,
  datasetId: string,
  datasetName: string,
  userId: string,
  config: AnomalyDetectionConfig
): Anomaly[] {
  if (series.length < 5) return [];

  const rawValues = series.map((s) => s.value);
  const { median, q1, q3, iqr } = calculateBasicStats(rawValues);

  if (iqr === 0) return [];

  const multiplier = config.iqrMultiplier;
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  const anomalies: Anomaly[] = [];

  for (let i = 0; i < series.length; i++) {
    const item = series[i];
    if (item.value < lowerBound || item.value > upperBound) {
      const isHigh = item.value > upperBound;
      const type: AnomalyType = isHigh ? 'spike' : 'drop';
      const distance = isHigh ? item.value - upperBound : lowerBound - item.value;
      const iqrMultiple = distance / iqr + multiplier;
      const deviation = item.value - median;
      const deviationPercentage = median !== 0 ? Math.round((deviation / Math.abs(median)) * 1000) / 10 : 0;
      const severity = getSeverityFromScore(iqrMultiple, 'iqr');

      const title = `IQR Distribution Outlier in "${columnName}"`;
      const formattedActual = formatMetricNumber(item.value);
      const rowIdentifier = item.dateStr ? `${item.dateStr} (Row #${item.rowIndex + 1})` : `Row #${item.rowIndex + 1}`;

      const summary = `Observed value ${formattedActual} breaches the ${multiplier}× IQR confidence corridor [${formatMetricNumber(
        lowerBound
      )} to ${formatMetricNumber(upperBound)}]. Median baseline is ${formatMetricNumber(median)}.`;

      const statisticalEvidence = `Q1=${formatMetricNumber(q1)}, Q3=${formatMetricNumber(q3)}, IQR=${formatMetricNumber(
        iqr
      )}. Expected range: [${formatMetricNumber(lowerBound)}, ${formatMetricNumber(upperBound)}]. Value: ${formattedActual} (${iqrMultiple.toFixed(1)}× IQR)`;

      anomalies.push({
        id: `anom_iqr_${datasetId}_${columnName}_${item.rowIndex}`,
        datasetId,
        datasetName,
        userId,
        column: columnName,
        dateColumn: item.dateStr ? 'Date' : undefined,
        dateValue: item.dateStr,
        dimensionColumn: item.dimensionStr ? 'Segment' : undefined,
        dimensionValue: item.dimensionStr,
        rowIndex: item.rowIndex,
        rowIdentifier,
        actualValue: item.value,
        expectedValue: Math.round(median * 100) / 100,
        baselineValue: Math.round(median * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
        deviationPercentage,
        score: Math.round(iqrMultiple * 100) / 100,
        scoreLabel: `${iqrMultiple.toFixed(1)}× IQR Bound`,
        severity,
        type,
        method: 'iqr',
        title,
        summary,
        statisticalEvidence,
        historicalContext: buildContextSeries(series, i, median),
        rowData: item.rowRecord,
        status: 'active',
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return anomalies;
}

/**
 * MAD (Median Absolute Deviation) Robust Outlier Detection
 */
export function detectMADAnomalies(
  series: NumericSeriesItem[],
  columnName: string,
  datasetId: string,
  datasetName: string,
  userId: string,
  config: AnomalyDetectionConfig
): Anomaly[] {
  if (series.length < 6) return [];

  const rawValues = series.map((s) => s.value);
  const { median } = calculateBasicStats(rawValues);
  const mad = calculateMAD(rawValues, median);

  if (mad === 0) return [];

  const anomalies: Anomaly[] = [];
  const threshold = config.madThreshold;

  for (let i = 0; i < series.length; i++) {
    const item = series[i];
    // Modified Z-Score: 0.6745 * (x - median) / MAD
    const modifiedZ = (0.6745 * (item.value - median)) / mad;
    const absModZ = Math.abs(modifiedZ);

    if (absModZ >= threshold) {
      const isPositive = modifiedZ > 0;
      const type: AnomalyType = isPositive ? 'spike' : 'drop';
      const deviation = item.value - median;
      const deviationPercentage = median !== 0 ? Math.round((deviation / Math.abs(median)) * 1000) / 10 : 0;
      const severity = getSeverityFromScore(absModZ, 'mad');

      const title = `Robust MAD Outlier in "${columnName}"`;
      const formattedActual = formatMetricNumber(item.value);
      const formattedMedian = formatMetricNumber(median);
      const rowIdentifier = item.dateStr ? `${item.dateStr} (Row #${item.rowIndex + 1})` : `Row #${item.rowIndex + 1}`;

      const summary = `Modified Z-score of ${absModZ.toFixed(2)} based on Median Absolute Deviation (MAD=${formatMetricNumber(
        mad
      )}). Value ${formattedActual} strongly diverges from median ${formattedMedian}.`;

      const statisticalEvidence = `Modified Z = (0.6745 × |X - Median|) / MAD = (0.6745 × |${item.value} - ${median}|) / ${mad.toFixed(
        2
      )} = ${absModZ.toFixed(2)} (Threshold: ${threshold})`;

      anomalies.push({
        id: `anom_mad_${datasetId}_${columnName}_${item.rowIndex}`,
        datasetId,
        datasetName,
        userId,
        column: columnName,
        dateColumn: item.dateStr ? 'Date' : undefined,
        dateValue: item.dateStr,
        dimensionColumn: item.dimensionStr ? 'Segment' : undefined,
        dimensionValue: item.dimensionStr,
        rowIndex: item.rowIndex,
        rowIdentifier,
        actualValue: item.value,
        expectedValue: Math.round(median * 100) / 100,
        baselineValue: Math.round(median * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
        deviationPercentage,
        score: Math.round(absModZ * 100) / 100,
        scoreLabel: `Mod-Z: ${absModZ.toFixed(2)}`,
        severity,
        type,
        method: 'mad',
        title,
        summary,
        statisticalEvidence,
        historicalContext: buildContextSeries(series, i, median),
        rowData: item.rowRecord,
        status: 'active',
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return anomalies;
}

/**
 * Time-Series Rolling Window Spike & Drop Detection
 */
export function detectRollingWindowAnomalies(
  series: NumericSeriesItem[],
  columnName: string,
  datasetId: string,
  datasetName: string,
  userId: string,
  config: AnomalyDetectionConfig
): Anomaly[] {
  const windowSize = Math.max(3, Math.min(config.windowSize, Math.floor(series.length / 3)));
  if (series.length < windowSize + 3) return [];

  const anomalies: Anomaly[] = [];

  for (let i = windowSize; i < series.length; i++) {
    const priorWindow = series.slice(i - windowSize, i).map((s) => s.value);
    const { mean: windowMean, stdDev: windowStd } = calculateBasicStats(priorWindow);

    if (windowStd === 0) continue;

    const currentItem = series[i];
    const localZ = (currentItem.value - windowMean) / windowStd;
    const absLocalZ = Math.abs(localZ);

    if (absLocalZ >= config.zScoreThreshold) {
      const isPositive = localZ > 0;
      const type: AnomalyType = isPositive ? 'spike' : 'drop';
      const deviation = currentItem.value - windowMean;
      const deviationPercentage =
        windowMean !== 0 ? Math.round((deviation / Math.abs(windowMean)) * 1000) / 10 : 0;
      const severity = getSeverityFromScore(absLocalZ, 'z_score');

      const title = `Sudden ${isPositive ? 'Spike' : 'Plummet'} in "${columnName}"`;
      const rowIdentifier = currentItem.dateStr
        ? `${currentItem.dateStr} (Row #${currentItem.rowIndex + 1})`
        : `Row #${currentItem.rowIndex + 1}`;

      const summary = `Sudden ${deviationPercentage > 0 ? '+' : ''}${deviationPercentage}% velocity shift compared to the preceding ${windowSize}-period moving baseline (${formatMetricNumber(
        currentItem.value
      )} vs rolling average ${formatMetricNumber(windowMean)}).`;

      const statisticalEvidence = `Rolling Window (size=${windowSize}): Mean=${formatMetricNumber(
        windowMean
      )}, StdDev=${formatMetricNumber(windowStd)}. Local Deviation = ${localZ.toFixed(2)}σ.`;

      anomalies.push({
        id: `anom_roll_${datasetId}_${columnName}_${currentItem.rowIndex}`,
        datasetId,
        datasetName,
        userId,
        column: columnName,
        dateColumn: currentItem.dateStr ? 'Date' : undefined,
        dateValue: currentItem.dateStr,
        dimensionColumn: currentItem.dimensionStr ? 'Segment' : undefined,
        dimensionValue: currentItem.dimensionStr,
        rowIndex: currentItem.rowIndex,
        rowIdentifier,
        actualValue: currentItem.value,
        expectedValue: Math.round(windowMean * 100) / 100,
        baselineValue: Math.round(windowMean * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
        deviationPercentage,
        score: Math.round(absLocalZ * 100) / 100,
        scoreLabel: `Rolling Δ: ${absLocalZ.toFixed(2)}σ`,
        severity,
        type,
        method: 'rolling_window',
        title,
        summary,
        statisticalEvidence,
        historicalContext: buildContextSeries(series, i, windowMean),
        rowData: currentItem.rowRecord,
        status: 'active',
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return anomalies;
}

/**
 * Period-over-Period Percentage Change Detection
 */
export function detectPercentageChangeAnomalies(
  series: NumericSeriesItem[],
  columnName: string,
  datasetId: string,
  datasetName: string,
  userId: string,
  config: AnomalyDetectionConfig
): Anomaly[] {
  if (series.length < 3) return [];

  const thresholdPct = config.pctChangeThreshold;
  const anomalies: Anomaly[] = [];

  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1];
    const curr = series[i];

    if (prev.value === 0) continue;

    const pctChange = ((curr.value - prev.value) / Math.abs(prev.value)) * 100;
    const absPct = Math.abs(pctChange);

    if (absPct >= thresholdPct) {
      const isIncrease = pctChange > 0;
      const type: AnomalyType = isIncrease ? 'spike' : 'drop';
      const severity = getSeverityFromScore(absPct, 'pct_change');
      const deviation = curr.value - prev.value;
      const rowIdentifier = curr.dateStr ? `${curr.dateStr} (Row #${curr.rowIndex + 1})` : `Row #${curr.rowIndex + 1}`;

      const title = `Rapid ${isIncrease ? 'Surge' : 'Drop'} in "${columnName}" (${isIncrease ? '+' : ''}${pctChange.toFixed(
        1
      )}%)`;

      const summary = `Shifted by ${isIncrease ? '+' : ''}${pctChange.toFixed(
        1
      )}% in a single step (from ${formatMetricNumber(prev.value)} to ${formatMetricNumber(curr.value)}).`;

      const statisticalEvidence = `Period-over-Period Variance: ((Current - Previous) / Previous) × 100% = ((${curr.value} - ${
        prev.value
      }) / ${prev.value}) × 100% = ${pctChange.toFixed(1)}% (Threshold: ±${thresholdPct}%)`;

      anomalies.push({
        id: `anom_pct_${datasetId}_${columnName}_${curr.rowIndex}`,
        datasetId,
        datasetName,
        userId,
        column: columnName,
        dateColumn: curr.dateStr ? 'Date' : undefined,
        dateValue: curr.dateStr,
        dimensionColumn: curr.dimensionStr ? 'Segment' : undefined,
        dimensionValue: curr.dimensionStr,
        rowIndex: curr.rowIndex,
        rowIdentifier,
        actualValue: curr.value,
        expectedValue: prev.value,
        baselineValue: prev.value,
        deviation: Math.round(deviation * 100) / 100,
        deviationPercentage: Math.round(pctChange * 10) / 10,
        score: Math.round(absPct * 10) / 10,
        scoreLabel: `${isIncrease ? '+' : ''}${pctChange.toFixed(0)}% Variance`,
        severity,
        type,
        method: 'pct_change',
        title,
        summary,
        statisticalEvidence,
        historicalContext: buildContextSeries(series, i, prev.value),
        rowData: curr.rowRecord,
        status: 'active',
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return anomalies;
}
