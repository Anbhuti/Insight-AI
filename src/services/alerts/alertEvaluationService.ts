import {
  AlertRule,
  AlertEvidence,
  TestRuleResult,
  AlertType,
} from './alertTypes';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { formatAlertMetricValue, calculateSeverityFromDeviation } from './alertSeverityService';
import { loadDatasetRows } from '../anomaly/anomalyDetectionService';
import { parseDateToTimestamp } from '../forecasting/timeSeriesService';

export interface EvaluationOutcome {
  triggered: boolean;
  actualValue?: number;
  expectedValue?: number;
  threshold?: number;
  deviationPct?: number;
  evidence: AlertEvidence;
  reason?: string;
}

/**
 * Extracts a clean numeric time series from dataset rows for a specific metric column
 */
function extractNumericTimeSeries(
  columns: string[],
  rows: (string | number | boolean | null)[][],
  metricName: string,
  dateColumnName?: string
): { date: string; timestamp: number; value: number }[] {
  const metricColIdx = columns.findIndex(
    (c) => c.toLowerCase() === metricName.toLowerCase()
  );
  if (metricColIdx === -1) return [];

  let dateColIdx = -1;
  if (dateColumnName) {
    dateColIdx = columns.findIndex(
      (c) => c.toLowerCase() === dateColumnName.toLowerCase()
    );
  }
  if (dateColIdx === -1) {
    // Attempt to find any date column
    dateColIdx = columns.findIndex((c) => {
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

  const points: { date: string; timestamp: number; value: number }[] = [];

  rows.forEach((row, idx) => {
    const rawVal = row[metricColIdx];
    if (rawVal === null || rawVal === undefined || rawVal === '') return;

    let numVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[$,]/g, ''));
    if (isNaN(numVal)) return;

    let ts = idx;
    let dateStr = `Period ${idx + 1}`;

    if (dateColIdx !== -1) {
      const rawDate = row[dateColIdx];
      const parsedTs = parseDateToTimestamp(rawDate);
      if (parsedTs !== null) {
        ts = parsedTs;
        dateStr = new Date(parsedTs).toISOString().split('T')[0];
      } else if (rawDate) {
        dateStr = String(rawDate);
      }
    }

    points.push({ date: dateStr, timestamp: ts, value: numVal });
  });

  // Sort chronologically
  return points.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * 1. Evaluate Threshold Alert
 */
export function evaluateThresholdRule(
  rule: AlertRule,
  columns: string[],
  rows: (string | number | boolean | null)[][]
): EvaluationOutcome {
  if (!rule.metric || rule.threshold === undefined || !rule.operator) {
    return {
      triggered: false,
      evidence: { summaryText: 'Incomplete threshold rule configuration.' },
      reason: 'Missing metric, operator, or threshold.',
    };
  }

  const series = extractNumericTimeSeries(columns, rows, rule.metric);
  if (series.length === 0) {
    return {
      triggered: false,
      evidence: { summaryText: `No valid numeric data found for metric '${rule.metric}'.` },
      reason: `Metric '${rule.metric}' contains no numeric values.`,
    };
  }

  // Calculate current value (latest observation or latest aggregated period)
  const currentItem = series[series.length - 1];
  const actualValue = currentItem.value;
  const threshold = rule.threshold;
  let triggered = false;

  switch (rule.operator) {
    case '>':
      triggered = actualValue > threshold;
      break;
    case '<':
      triggered = actualValue < threshold;
      break;
    case '>=':
      triggered = actualValue >= threshold;
      break;
    case '<=':
      triggered = actualValue <= threshold;
      break;
    case '=':
      triggered = Math.abs(actualValue - threshold) < 0.0001;
      break;
    case '!=':
      triggered = Math.abs(actualValue - threshold) >= 0.0001;
      break;
  }

  const deviationPct = threshold !== 0 ? ((actualValue - threshold) / threshold) * 100 : 0;

  const summaryText = triggered
    ? `${rule.metric} is currently ${formatAlertMetricValue(actualValue)}, which is ${rule.operator} the threshold of ${formatAlertMetricValue(threshold)}.`
    : `${rule.metric} (${formatAlertMetricValue(actualValue)}) is within normal boundary (${rule.operator} ${formatAlertMetricValue(threshold)} not violated).`;

  return {
    triggered,
    actualValue,
    threshold,
    deviationPct,
    evidence: {
      metric: rule.metric,
      actualValue,
      actualValueFormatted: formatAlertMetricValue(actualValue),
      threshold,
      thresholdFormatted: formatAlertMetricValue(threshold),
      deviationPct,
      dateValue: currentItem.date,
      summaryText,
    },
  };
}

/**
 * 2. Evaluate Percentage Change Alert
 */
export function evaluatePercentageChangeRule(
  rule: AlertRule,
  columns: string[],
  rows: (string | number | boolean | null)[][]
): EvaluationOutcome {
  if (!rule.metric || rule.percentageChangeThreshold === undefined) {
    return {
      triggered: false,
      evidence: { summaryText: 'Incomplete percentage change rule configuration.' },
      reason: 'Missing metric or percentageChangeThreshold.',
    };
  }

  const series = extractNumericTimeSeries(columns, rows, rule.metric);
  if (series.length < 2) {
    return {
      triggered: false,
      evidence: { summaryText: 'Insufficient historical periods to compute percentage change (minimum 2 needed).' },
      reason: 'Insufficient history.',
    };
  }

  // Determine comparison offset based on comparison period
  let compareIndex = series.length - 2; // default previous period
  const compPeriod = rule.comparisonPeriod || 'previous_period';

  if (compPeriod === 'previous_week' && series.length >= 8) {
    compareIndex = series.length - 8;
  } else if (compPeriod === 'previous_month' && series.length >= 31) {
    compareIndex = series.length - 31;
  }

  const currentItem = series[series.length - 1];
  const previousItem = series[compareIndex];
  const actualValue = currentItem.value;
  const expectedValue = previousItem.value;

  if (expectedValue === 0) {
    return {
      triggered: false,
      evidence: { summaryText: 'Baseline period value was 0, cannot calculate relative percentage change.' },
    };
  }

  const actualChangePct = ((actualValue - expectedValue) / Math.abs(expectedValue)) * 100;
  const thresholdPct = rule.percentageChangeThreshold;
  const direction = rule.changeDirection || 'any';

  let triggered = false;
  if (direction === 'decrease') {
    triggered = actualChangePct <= -thresholdPct;
  } else if (direction === 'increase') {
    triggered = actualChangePct >= thresholdPct;
  } else {
    triggered = Math.abs(actualChangePct) >= thresholdPct;
  }

  const summaryText = triggered
    ? `${rule.metric} ${actualChangePct < 0 ? 'decreased' : 'increased'} by ${Math.abs(actualChangePct).toFixed(1)}% (from ${formatAlertMetricValue(expectedValue)} to ${formatAlertMetricValue(actualValue)}), exceeding the ${thresholdPct}% threshold.`
    : `${rule.metric} changed by ${actualChangePct.toFixed(1)}%, within acceptable limits (threshold: ${thresholdPct}%).`;

  return {
    triggered,
    actualValue,
    expectedValue,
    deviationPct: actualChangePct,
    threshold: thresholdPct,
    evidence: {
      metric: rule.metric,
      actualValue,
      actualValueFormatted: formatAlertMetricValue(actualValue),
      expectedValue,
      expectedValueFormatted: formatAlertMetricValue(expectedValue),
      threshold: thresholdPct,
      thresholdFormatted: `${thresholdPct}%`,
      deviationPct: actualChangePct,
      comparisonPeriod: compPeriod.replace('_', ' '),
      dateValue: currentItem.date,
      historicalValues: series.slice(-10).map((s) => ({ date: s.date, value: s.value })),
      summaryText,
    },
  };
}

/**
 * 3. Evaluate Trend Alert
 */
export function evaluateTrendRule(
  rule: AlertRule,
  columns: string[],
  rows: (string | number | boolean | null)[][]
): EvaluationOutcome {
  if (!rule.metric) {
    return {
      triggered: false,
      evidence: { summaryText: 'Incomplete trend rule configuration: missing metric.' },
    };
  }

  const series = extractNumericTimeSeries(columns, rows, rule.metric);
  const minPeriods = Math.max(3, rule.minConsecutivePeriods || 7);
  const minChangePct = rule.minPercentageChange || 10;
  const direction = rule.trendDirection || 'decreasing';

  if (series.length < minPeriods) {
    return {
      triggered: false,
      evidence: { summaryText: `Insufficient data points (${series.length}/${minPeriods}) to evaluate sustained trend.` },
    };
  }

  const windowSeries = series.slice(-minPeriods);
  let consecutiveMet = true;

  for (let i = 1; i < windowSeries.length; i++) {
    const prev = windowSeries[i - 1].value;
    const curr = windowSeries[i].value;
    if (direction === 'decreasing' && curr > prev) {
      consecutiveMet = false;
      break;
    }
    if (direction === 'increasing' && curr < prev) {
      consecutiveMet = false;
      break;
    }
  }

  const startVal = windowSeries[0].value;
  const endVal = windowSeries[windowSeries.length - 1].value;
  const totalChangePct = startVal !== 0 ? ((endVal - startVal) / Math.abs(startVal)) * 100 : 0;
  const satisfiesMagnitude = Math.abs(totalChangePct) >= minChangePct;

  const triggered = consecutiveMet && satisfiesMagnitude;

  const summaryText = triggered
    ? `Sustained ${direction} trend detected for ${minPeriods} consecutive periods in ${rule.metric} with total change of ${totalChangePct.toFixed(1)}% (from ${formatAlertMetricValue(startVal)} to ${formatAlertMetricValue(endVal)}).`
    : `No sustained ${direction} trend exceeding ${minPeriods} periods and ${minChangePct}% change.`;

  return {
    triggered,
    actualValue: endVal,
    expectedValue: startVal,
    deviationPct: totalChangePct,
    evidence: {
      metric: rule.metric,
      actualValue: endVal,
      actualValueFormatted: formatAlertMetricValue(endVal),
      expectedValue: startVal,
      expectedValueFormatted: formatAlertMetricValue(startVal),
      deviationPct: totalChangePct,
      consecutivePeriodsCount: minPeriods,
      historicalValues: windowSeries.map((w) => ({ date: w.date, value: w.value })),
      summaryText,
    },
  };
}

/**
 * 4. Evaluate Anomaly Alert (Integrates Phase 9 findings)
 */
export function evaluateAnomalyRule(
  rule: AlertRule,
  anomaliesList: any[]
): EvaluationOutcome {
  const minSev = rule.anomalyMinSeverity || 'high';
  const targetMetric = rule.metric?.toLowerCase();

  // Find relevant anomalies matching dataset / metric
  const matching = anomaliesList.filter((a) => {
    const sevMatch =
      minSev === 'critical'
        ? a.severity === 'critical'
        : minSev === 'high'
        ? a.severity === 'high' || a.severity === 'critical'
        : true;

    const metricMatch = !targetMetric || a.column?.toLowerCase() === targetMetric || a.metric?.toLowerCase() === targetMetric;
    const statusMatch = a.status !== 'resolved' && a.status !== 'dismissed';
    return sevMatch && metricMatch && statusMatch;
  });

  if (matching.length === 0) {
    return {
      triggered: false,
      evidence: { summaryText: `No active ${minSev} statistical anomalies detected for ${rule.metric || 'dataset'}.` },
    };
  }

  const topAnomaly = matching[0];
  const observedVal = topAnomaly.value ?? topAnomaly.observedValue ?? 0;
  const expectedVal = topAnomaly.expectedValue ?? topAnomaly.baseline ?? 0;
  const devPct = topAnomaly.deviationPct ?? (expectedVal !== 0 ? ((observedVal - expectedVal) / expectedVal) * 100 : 0);

  const summaryText = `Statistical anomaly detected in ${topAnomaly.column || rule.metric} on ${topAnomaly.date || 'latest record'}: observed value was ${formatAlertMetricValue(observedVal)} vs expected baseline of ${formatAlertMetricValue(expectedVal)} (${devPct >= 0 ? '+' : ''}${devPct.toFixed(1)}% deviation).`;

  return {
    triggered: true,
    actualValue: observedVal,
    expectedValue: expectedVal,
    deviationPct: devPct,
    evidence: {
      metric: topAnomaly.column || rule.metric,
      actualValue: observedVal,
      actualValueFormatted: formatAlertMetricValue(observedVal),
      expectedValue: expectedVal,
      expectedValueFormatted: formatAlertMetricValue(expectedVal),
      deviationPct: devPct,
      relatedAnomalyId: topAnomaly.anomalyId,
      relatedAnomalySeverity: topAnomaly.severity,
      dateValue: topAnomaly.date,
      summaryText,
    },
  };
}

/**
 * 5. Evaluate Forecast Alert (Integrates Phase 11 forecast results)
 */
export function evaluateForecastRule(
  rule: AlertRule,
  forecastResult: any | null
): EvaluationOutcome {
  if (!forecastResult || !forecastResult.forecastPoints || forecastResult.forecastPoints.length === 0) {
    return {
      triggered: false,
      evidence: { summaryText: 'No active predictive forecast models available for evaluation.' },
    };
  }

  const horizon = rule.forecastHorizon || 30;
  const points = forecastResult.forecastPoints.slice(0, horizon);
  const target = rule.forecastTarget;
  const condition = rule.forecastCondition || 'below_target';

  // Compute average projected value across horizon
  const avgForecastValue = points.reduce((acc: number, p: any) => acc + (p.value || 0), 0) / points.length;
  const finalPoint = points[points.length - 1]?.value || avgForecastValue;
  const modelName = forecastResult.selectedModel || 'Optimal Ensemble';
  const confidenceLevel = forecastResult.summary?.confidenceLevel || 'High';

  let triggered = false;
  let summaryText = '';

  if (condition === 'below_target' && target !== undefined) {
    triggered = finalPoint < target || avgForecastValue < target;
    summaryText = triggered
      ? `Forecasted ${rule.metric || 'metric'} (${formatAlertMetricValue(finalPoint)}) is projected to fall below target of ${formatAlertMetricValue(target)} over next ${horizon} periods.`
      : `Forecast trajectory meets target of ${formatAlertMetricValue(target)}.`;
  } else if (condition === 'projected_decline') {
    const startVal = points[0]?.value || 0;
    const declinePct = startVal !== 0 ? ((finalPoint - startVal) / startVal) * 100 : 0;
    triggered = declinePct < -5;
    summaryText = triggered
      ? `Forecast models project a ${Math.abs(declinePct).toFixed(1)}% decline in ${rule.metric || 'metric'} over horizon.`
      : `Forecast trajectory does not show significant projected decline.`;
  } else if (condition === 'low_confidence') {
    triggered = confidenceLevel.toLowerCase() === 'low';
    summaryText = triggered
      ? `Forecast confidence has dropped to 'Low' due to historical volatility.`
      : `Forecast confidence is healthy (${confidenceLevel}).`;
  }

  return {
    triggered,
    actualValue: finalPoint,
    expectedValue: target,
    threshold: target,
    evidence: {
      metric: rule.metric,
      actualValue: finalPoint,
      actualValueFormatted: formatAlertMetricValue(finalPoint),
      expectedValue: target,
      expectedValueFormatted: target !== undefined ? formatAlertMetricValue(target) : undefined,
      threshold: target,
      thresholdFormatted: target !== undefined ? formatAlertMetricValue(target) : undefined,
      relatedForecastSelectedModel: modelName,
      summaryText,
    },
  };
}

/**
 * 6. Evaluate Forecast vs Actual Variance
 */
export function evaluateForecastVsActualRule(
  rule: AlertRule,
  columns: string[],
  rows: (string | number | boolean | null)[][],
  forecastResult: any | null
): EvaluationOutcome {
  if (!rule.metric || rule.forecastVarianceThresholdPct === undefined) {
    return {
      triggered: false,
      evidence: { summaryText: 'Incomplete forecast vs actual rule configuration.' },
    };
  }

  const series = extractNumericTimeSeries(columns, rows, rule.metric);
  if (series.length === 0 || !forecastResult?.historicalFittedPoints) {
    return {
      triggered: false,
      evidence: { summaryText: 'Missing actual series or backtest fitted forecast points.' },
    };
  }

  const latestActual = series[series.length - 1];
  const fittedPoints = forecastResult.historicalFittedPoints;
  const latestFitted = fittedPoints[fittedPoints.length - 1]?.value ?? latestActual.value;

  const actualVal = latestActual.value;
  const expectedVal = latestFitted;
  const variancePct = expectedVal !== 0 ? ((actualVal - expectedVal) / Math.abs(expectedVal)) * 100 : 0;
  const thresholdPct = rule.forecastVarianceThresholdPct;

  const triggered = Math.abs(variancePct) >= thresholdPct;

  const summaryText = triggered
    ? `Actual ${rule.metric} (${formatAlertMetricValue(actualVal)}) deviated by ${Math.abs(variancePct).toFixed(1)}% from backtested forecast baseline (${formatAlertMetricValue(expectedVal)}), exceeding ${thresholdPct}% allowable variance.`
    : `Actual vs forecast variance is ${variancePct.toFixed(1)}%, within ${thresholdPct}% tolerance.`;

  return {
    triggered,
    actualValue: actualVal,
    expectedValue: expectedVal,
    deviationPct: variancePct,
    threshold: thresholdPct,
    evidence: {
      metric: rule.metric,
      actualValue: actualVal,
      actualValueFormatted: formatAlertMetricValue(actualVal),
      expectedValue: expectedVal,
      expectedValueFormatted: formatAlertMetricValue(expectedVal),
      deviationPct: variancePct,
      threshold: thresholdPct,
      thresholdFormatted: `${thresholdPct}%`,
      summaryText,
    },
  };
}

/**
 * 7. Evaluate Data Quality Alert (Integrates Phase 6 Profiling)
 */
export function evaluateDataQualityRule(
  rule: AlertRule,
  profile: DatasetProfile | null
): EvaluationOutcome {
  if (!profile) {
    return {
      triggered: false,
      evidence: { summaryText: 'No dataset quality profile available for evaluation.' },
    };
  }

  const dqMetric = rule.dataQualityMetric || 'missing_values_pct';
  const thresholdPct = rule.dataQualityThresholdPct || 10;
  let currentPct = 0;
  let triggered = false;
  let summaryText = '';

  const totalCells = (profile.rowCount || 1) * (profile.columnCount || 1);

  if (dqMetric === 'missing_values_pct') {
    currentPct = profile.missingCellPercentage ?? (profile.missingCellCount ? (profile.missingCellCount / totalCells) * 100 : 0);
    triggered = currentPct > thresholdPct;
    summaryText = triggered
      ? `Dataset missing values (${currentPct.toFixed(1)}%) exceeded allowable threshold of ${thresholdPct}%.`
      : `Missing values rate is ${currentPct.toFixed(1)}% (within ${thresholdPct}% limit).`;
  } else if (dqMetric === 'duplicate_records_pct') {
    currentPct = profile.duplicateRowPercentage ?? ((profile.duplicateRowCount || 0) / (profile.rowCount || 1)) * 100;
    triggered = currentPct > thresholdPct;
    summaryText = triggered
      ? `Duplicate record rate (${currentPct.toFixed(1)}%) exceeded allowable threshold of ${thresholdPct}%.`
      : `Duplicate records rate is ${currentPct.toFixed(1)}% (healthy).`;
  } else if (dqMetric === 'completeness_pct') {
    const completeness = 100 - (profile.missingCellPercentage ?? 0);
    currentPct = completeness;
    triggered = currentPct < thresholdPct;
    summaryText = triggered
      ? `Dataset completeness score (${currentPct.toFixed(1)}%) dropped below minimum standard of ${thresholdPct}%.`
      : `Dataset completeness score is ${currentPct.toFixed(1)}% (meets requirements).`;
  }

  return {
    triggered,
    actualValue: currentPct,
    expectedValue: thresholdPct,
    threshold: thresholdPct,
    deviationPct: currentPct - thresholdPct,
    evidence: {
      metric: dqMetric.replace(/_/g, ' '),
      actualValue: currentPct,
      actualValueFormatted: `${currentPct.toFixed(1)}%`,
      expectedValue: thresholdPct,
      expectedValueFormatted: `${thresholdPct}%`,
      threshold: thresholdPct,
      thresholdFormatted: `${thresholdPct}%`,
      dataQualityDetails: {
        metricName: dqMetric,
        currentPct,
        thresholdPct,
      },
      summaryText,
    },
  };
}

/**
 * Master deterministic rule evaluator dispatcher
 */
export async function evaluateRuleAgainstData(
  rule: AlertRule,
  dataset: Dataset,
  profile?: DatasetProfile | null,
  cachedData?: { columns: string[]; rows: (string | number | boolean | null)[][] },
  cachedAnomalies?: any[],
  cachedForecast?: any
): Promise<EvaluationOutcome> {
  try {
    // 1. Data Quality rules only need profile
    if (rule.type === 'data_quality') {
      return evaluateDataQualityRule(rule, profile || null);
    }

    // 2. Anomaly rules use anomalies list
    if (rule.type === 'anomaly') {
      return evaluateAnomalyRule(rule, cachedAnomalies || []);
    }

    // 3. Forecast horizon rules evaluate forecast results
    if (rule.type === 'forecast') {
      return evaluateForecastRule(rule, cachedForecast || null);
    }

    // 4. Tabular data evaluations (Threshold, % Change, Trend, Forecast vs Actual, KPI)
    let columns = cachedData?.columns || [];
    let rows = cachedData?.rows || [];

    if (rows.length === 0) {
      const loaded = await loadDatasetRows(dataset);
      columns = loaded.columns;
      rows = loaded.rows;
    }

    switch (rule.type) {
      case 'threshold':
      case 'kpi_change':
        return evaluateThresholdRule(rule, columns, rows);

      case 'percentage_change':
        return evaluatePercentageChangeRule(rule, columns, rows);

      case 'trend':
        return evaluateTrendRule(rule, columns, rows);

      case 'forecast_vs_actual':
        return evaluateForecastVsActualRule(rule, columns, rows, cachedForecast || null);

      default:
        return evaluateThresholdRule(rule, columns, rows);
    }
  } catch (error: any) {
    return {
      triggered: false,
      evidence: {
        summaryText: `Alert evaluation failed: ${error.message || 'Unknown evaluation error'}`,
      },
      reason: error.message || 'Alert evaluation failed.',
    };
  }
}
