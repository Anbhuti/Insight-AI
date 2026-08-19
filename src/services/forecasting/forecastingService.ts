import {
  ForecastConfig,
  ForecastResult,
  ForecastSummary,
  ForecastHistoryItem,
  ForecastStatus,
  TimeFrequency,
  AggregationType,
  ForecastModelType,
  ConfidenceIntervalLevel,
} from './forecastTypes';
import { FORECAST_CONSTANTS } from './constants';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { loadDatasetRows } from '../anomaly/anomalyDetectionService';
import {
  detectDateColumn,
  detectForecastableMetrics,
  detectTimeFrequency,
  prepareTimeSeries,
  parseDateToTimestamp,
} from './timeSeriesService';
import { analyzeDecomposition } from './decompositionService';
import { fitModelByType } from './backtestingService';
import { evaluateAllModels, selectBestModel } from './modelSelectionService';
import {
  buildForecastPointsWithIntervals,
  evaluateForecastConfidence,
} from './confidenceIntervalService';
import { explainForecastWithAI } from './forecastAIService';
import { db } from '../../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

function generateForecastId(datasetId: string, metric: string): string {
  const cleanMetric = metric.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const timestamp = Date.now().toString(36);
  return `fc_${datasetId}_${cleanMetric}_${timestamp}`;
}

/**
 * Automatically creates the optimal configuration for a dataset
 */
export function autoConfigureForecast(
  dataset: Dataset,
  profile?: DatasetProfile | null,
  sampleRows?: (string | number | boolean | null)[][]
): ForecastConfig {
  const columns = profile?.columns?.map((c) => c.name) || dataset.previewSample?.columns || [];
  const previewRows = sampleRows || dataset.previewSample?.rows || [];

  const dateColumn = detectDateColumn(columns, profile, previewRows) || columns[0] || 'date';
  const { defaultMetric } = detectForecastableMetrics(columns, profile);

  // Estimate frequency from preview sample timestamps if available
  let detectedFrequency: TimeFrequency = 'daily';
  const dateColIdx = columns.findIndex((c) => c.toLowerCase() === dateColumn.toLowerCase());
  if (dateColIdx !== -1 && previewRows.length >= 2) {
    const rawTs = previewRows
      .map((r) => parseDateToTimestamp(r[dateColIdx]))
      .filter((ts): ts is number => ts !== null);
    if (rawTs.length >= 2) {
      detectedFrequency = detectTimeFrequency(rawTs).frequency;
    }
  }

  const defaultHorizon = FORECAST_CONSTANTS.DEFAULT_HORIZONS[detectedFrequency] || 30;

  return {
    datasetId: dataset.datasetId,
    datasetName: dataset.name,
    dateColumn,
    metricColumn: defaultMetric || columns[1] || columns[0] || 'value',
    frequency: detectedFrequency,
    aggregation: 'SUM',
    horizon: defaultHorizon,
    modelType: 'auto',
    confidenceLevel: 95,
    missingPeriodStrategy: 'interpolation',
    outlierStrategy: 'original',
  };
}

/**
 * Orchestrates the full statistical forecasting engine
 */
export async function runFullForecast(
  dataset: Dataset,
  config: ForecastConfig,
  profile?: DatasetProfile | null,
  onProgress?: (status: ForecastStatus, message: string) => void
): Promise<ForecastResult> {
  const startTime = Date.now();
  const datasetVersion =
    typeof dataset.updatedAt === 'string'
      ? dataset.updatedAt
      : (dataset.updatedAt as any)?.toDate?.()?.toISOString?.() || 'v1';

  // 1. Preparing Data
  onProgress?.('preparing_data', 'Loading and validating tabular dataset records...');
  const { columns, rows } = await loadDatasetRows(dataset);

  if (!rows || rows.length < 3) {
    throw new Error(
      `Insufficient dataset rows (${rows?.length || 0} found). Forecasting requires at least 3 historical rows.`
    );
  }

  // 2. Preparing Time-Series and Bucketing
  onProgress?.('analyzing_series', 'Aggregating time-series and analyzing historical patterns...');
  const { series, metadata } = prepareTimeSeries(
    columns,
    rows,
    config.dateColumn,
    config.metricColumn,
    config.frequency,
    config.aggregation,
    config.missingPeriodStrategy,
    config.outlierStrategy
  );

  if (series.length < 3) {
    throw new Error(
      `Insufficient historical time-series intervals (${series.length} periods created after aggregation). Minimum 3 periods required for forecasting.`
    );
  }

  if (metadata.isConstant) {
    // Constant series warning / handling
    console.warn('Metric is constant across historical periods.');
  }

  // 3. Trend & Seasonality Decomposition
  const decomposition = analyzeDecomposition(series, config.frequency);

  // 4. Backtesting Candidate Models
  onProgress?.('testing_models', 'Executing chronological rolling-origin backtesting across models...');
  const scorecards = evaluateAllModels(series, config.frequency, decomposition);

  // 5. Model Selection
  onProgress?.('selecting_model', 'Selecting optimal model based on validation scorecard...');
  const selection = selectBestModel(scorecards, config.modelType, decomposition);

  // 6. Generate Forecast using the selected model on full series
  onProgress?.('generating_forecast', `Generating ${config.horizon}-period predictions using ${selection.selectedModelName}...`);
  const values = series.map((p) => p.value);
  const fittedFinalModel = fitModelByType(
    selection.selectedModelType,
    values,
    decomposition.seasonalPeriod || 7
  );
  const rawPredictions = fittedFinalModel.predict(config.horizon);

  // 7. Calculate Confidence Intervals & Scenarios
  onProgress?.('calculating_intervals', `Calculating ${config.confidenceLevel}% prediction intervals and scenarios...`);
  const forecastSeries = buildForecastPointsWithIntervals(
    rawPredictions,
    series,
    fittedFinalModel.residuals,
    config.confidenceLevel,
    config.frequency,
    metadata
  );

  const { confidenceRating, rationales, warnings } = evaluateForecastConfidence(
    metadata,
    selection.scorecard,
    decomposition,
    config.horizon
  );

  // 8. Build Summary Statistics
  const latestHistoricalPoint = series[series.length - 1];
  const finalForecastPoint = forecastSeries[forecastSeries.length - 1];
  const forecastedSum = forecastSeries.reduce((acc, p) => acc + p.prediction, 0);
  const expectedAbsChange = finalForecastPoint.prediction - latestHistoricalPoint.value;
  const expectedGrowthPct =
    Math.abs(latestHistoricalPoint.value) > 1e-4
      ? Number(((expectedAbsChange / Math.abs(latestHistoricalPoint.value)) * 100).toFixed(2))
      : 0;

  const horizonUnitMap: Record<TimeFrequency, string> = {
    daily: 'days',
    weekly: 'weeks',
    monthly: 'months',
    quarterly: 'quarters',
    yearly: 'years',
    irregular: 'periods',
  };

  const summary: ForecastSummary = {
    latestHistoricalDate: latestHistoricalPoint.date,
    latestActualValue: Number(latestHistoricalPoint.value.toFixed(2)),
    endForecastDate: finalForecastPoint.date,
    finalPredictedValue: Number(finalForecastPoint.prediction.toFixed(2)),
    totalForecastedSum: Number(forecastedSum.toFixed(2)),
    meanForecastedValue: Number((forecastedSum / forecastSeries.length).toFixed(2)),
    expectedGrowthPct,
    expectedAbsoluteChange: Number(expectedAbsChange.toFixed(2)),
    forecastHorizon: config.horizon,
    horizonUnit: horizonUnitMap[config.frequency] || 'periods',
    bestModelMae: selection.scorecard.mae,
    bestModelSmape: selection.scorecard.smape,
  };

  const forecastId = generateForecastId(dataset.datasetId, config.metricColumn);

  const baseResult: Omit<ForecastResult, 'aiExplanation'> = {
    forecastId,
    datasetId: dataset.datasetId,
    datasetName: dataset.name,
    datasetVersion,
    userId: dataset.userId,
    createdAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    config,
    metadata,
    decomposition,
    historicalSeries: series,
    forecastSeries,
    selectedModel: selection.selectedModelType,
    selectedModelName: selection.selectedModelName,
    selectionReason: selection.selectionReason,
    scorecard: scorecards,
    summary,
    confidenceRating,
    confidenceRationale: rationales,
    warnings,
  };

  // 9. AI Business Explanation
  onProgress?.('generating_ai_explanation', 'Synthesizing executive AI business interpretation...');
  let aiExplanation;
  try {
    aiExplanation = await explainForecastWithAI(baseResult);
  } catch (err) {
    console.warn('AI explanation failed, continuing with mathematical brief:', err);
  }

  const finalResult: ForecastResult = {
    ...baseResult,
    aiExplanation,
  };

  // 10. Persist to Firestore & Local Storage
  try {
    await saveForecast(dataset.userId, finalResult);
  } catch (err) {
    console.warn('Could not persist forecast to Firestore (saving to local cache):', err);
  }

  onProgress?.('completed', 'Forecast generated successfully.');
  return finalResult;
}

/**
 * Saves forecast result to Firestore & Local Storage
 */
export async function saveForecast(userId: string, result: ForecastResult): Promise<void> {
  // Local storage backup
  try {
    const key = `${FORECAST_CONSTANTS.LOCAL_STORAGE_KEY_PREFIX}${userId}_${result.datasetId}`;
    const raw = localStorage.getItem(key);
    const list: ForecastResult[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((f) => f.forecastId !== result.forecastId);
    filtered.unshift(result);
    // Keep max 15 recent forecasts in local storage
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 15)));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // Firestore Document
  if (db && userId) {
    const forecastDocRef = doc(
      db,
      'users',
      userId,
      'datasets',
      result.datasetId,
      'forecasts',
      result.forecastId
    );

    // Save summary / metadata document
    await setDoc(forecastDocRef, {
      ...result,
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Loads previous forecasts for a dataset
 */
export async function loadForecastHistory(
  userId: string,
  datasetId: string,
  currentDatasetVersion?: string
): Promise<ForecastResult[]> {
  const results: ForecastResult[] = [];

  // Try Firestore
  if (db && userId) {
    try {
      const forecastsColl = collection(db, 'users', userId, 'datasets', datasetId, 'forecasts');
      const q = query(forecastsColl, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);

      snap.forEach((d) => {
        const data = d.data() as ForecastResult;
        if (currentDatasetVersion && data.datasetVersion !== currentDatasetVersion) {
          data.isOutdated = true;
        }
        results.push(data);
      });
    } catch (err) {
      console.warn('Firestore loadForecastHistory warning:', err);
    }
  }

  // If Firestore empty, try Local Storage
  if (results.length === 0) {
    try {
      const key = `${FORECAST_CONSTANTS.LOCAL_STORAGE_KEY_PREFIX}${userId}_${datasetId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const list: ForecastResult[] = JSON.parse(raw);
        list.forEach((data) => {
          if (currentDatasetVersion && data.datasetVersion !== currentDatasetVersion) {
            data.isOutdated = true;
          }
          results.push(data);
        });
      }
    } catch (e) {
      console.warn('LocalStorage load warning:', e);
    }
  }

  return results;
}

/**
 * Deletes a stored forecast from Firestore & Local Storage
 */
export async function deleteForecast(
  userId: string,
  datasetId: string,
  forecastId: string
): Promise<void> {
  // Local storage
  try {
    const key = `${FORECAST_CONSTANTS.LOCAL_STORAGE_KEY_PREFIX}${userId}_${datasetId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: ForecastResult[] = JSON.parse(raw);
      const filtered = list.filter((f) => f.forecastId !== forecastId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('LocalStorage delete error:', e);
  }

  // Firestore
  if (db && userId) {
    try {
      const forecastDocRef = doc(
        db,
        'users',
        userId,
        'datasets',
        datasetId,
        'forecasts',
        forecastId
      );
      await deleteDoc(forecastDocRef);
    } catch (err) {
      console.warn('Firestore delete error:', err);
    }
  }
}

/**
 * Generates CSV download content for a forecast result
 */
export function exportForecastToCSV(result: ForecastResult): string {
  const rows: string[] = [
    'Date,Type,Actual_Value,Forecast_Prediction,Lower_Bound,Upper_Bound,Optimistic_Scenario,Conservative_Scenario,Confidence_Level,Model',
  ];

  // 1. Historical Actuals
  for (const h of result.historicalSeries) {
    rows.push(
      `"${h.date}","Historical",${h.value},"","","","","",,"${result.selectedModelName}"`
    );
  }

  // 2. Future Predictions
  for (const f of result.forecastSeries) {
    rows.push(
      `"${f.date}","Forecast","",${f.prediction},${f.lowerBound},${f.upperBound},${f.optimisticScenario || ''},${f.conservativeScenario || ''},"${f.confidenceLevel}%","${result.selectedModelName}"`
    );
  }

  return rows.join('\n');
}
