import {
  TimeSeriesPoint,
  ForecastModelType,
  ModelBacktestScorecard,
  BacktestFold,
  TimeFrequency,
} from './forecastTypes';
import { FORECAST_CONSTANTS } from './constants';
import { fitNaiveModel, fitSeasonalNaiveModel, FittedModel } from './models/naiveModel';
import { fitMovingAverageModel } from './models/movingAverageModel';
import { fitExponentialSmoothingModel } from './models/exponentialSmoothingModel';
import { fitHoltLinearModel } from './models/holtLinearModel';
import { fitHoltWintersModel } from './models/holtWintersModel';
import { fitAutoregressiveModel } from './models/autoregressiveModel';

/**
 * Calculates standard forecast error metrics on actuals vs predictions
 */
export function calculateErrorMetrics(
  actuals: number[],
  predictions: number[]
): { mae: number; rmse: number; smape: number; mape: number | null; wape: number } {
  const n = Math.min(actuals.length, predictions.length);
  if (n === 0) {
    return { mae: 0, rmse: 0, smape: 0, mape: 0, wape: 0 };
  }

  let absErrSum = 0;
  let sqErrSum = 0;
  let smapeSum = 0;
  let mapeSum = 0;
  let validMapeCount = 0;
  let actualsSum = 0;

  for (let i = 0; i < n; i++) {
    const act = actuals[i];
    const pred = predictions[i];
    const absErr = Math.abs(act - pred);

    absErrSum += absErr;
    sqErrSum += Math.pow(act - pred, 2);
    actualsSum += Math.abs(act);

    // sMAPE: 200% * |y - yhat| / (|y| + |yhat| + epsilon)
    const denom = Math.abs(act) + Math.abs(pred);
    if (denom > 1e-9) {
      smapeSum += (2 * absErr) / denom;
    }

    // MAPE: guarded against 0
    if (Math.abs(act) > 1e-4) {
      mapeSum += absErr / Math.abs(act);
      validMapeCount++;
    }
  }

  const mae = absErrSum / n;
  const rmse = Math.sqrt(sqErrSum / n);
  const smape = (smapeSum / n) * 100;
  const mape = validMapeCount > 0 ? (mapeSum / validMapeCount) * 100 : null;
  const wape = actualsSum > 1e-9 ? (absErrSum / actualsSum) * 100 : 0;

  return {
    mae: Number(mae.toFixed(4)),
    rmse: Number(rmse.toFixed(4)),
    smape: Number(smape.toFixed(2)),
    mape: mape !== null ? Number(mape.toFixed(2)) : null,
    wape: Number(wape.toFixed(2)),
  };
}

/**
 * Fits a specific model type to raw numerical values
 */
export function fitModelByType(
  modelType: ForecastModelType,
  values: number[],
  seasonalPeriod: number = 7
): FittedModel {
  switch (modelType) {
    case 'naive':
      return fitNaiveModel(values);
    case 'seasonal_naive':
      return fitSeasonalNaiveModel(values, seasonalPeriod);
    case 'moving_average':
      return fitMovingAverageModel(values, Math.min(5, Math.max(2, Math.floor(values.length / 3))));
    case 'exponential_smoothing':
      return fitExponentialSmoothingModel(values);
    case 'holt_linear':
      return fitHoltLinearModel(values);
    case 'holt_winters':
      return fitHoltWintersModel(values, seasonalPeriod);
    case 'autoregressive':
      return fitAutoregressiveModel(values, 2);
    default:
      return fitNaiveModel(values);
  }
}

/**
 * Performs expanding-window chronological backtesting across time-series folds
 */
export function backtestModel(
  modelType: ForecastModelType,
  modelName: string,
  series: TimeSeriesPoint[],
  frequency: TimeFrequency,
  seasonalPeriod: number = 7
): ModelBacktestScorecard {
  const n = series.length;
  const values = series.map((p) => p.value);
  const minRequired = FORECAST_CONSTANTS.MODEL_MIN_OBSERVATIONS[modelType] || 4;

  // Check eligibility
  if (n < minRequired) {
    return {
      modelType,
      modelName,
      isEligible: false,
      ineligibilityReason: `Requires at least ${minRequired} observations (dataset has ${n}).`,
      mae: Infinity,
      rmse: Infinity,
      smape: Infinity,
      mape: null,
      wape: Infinity,
      rank: 99,
      testFolds: [],
    };
  }

  // Model-specific checks
  if (modelType === 'holt_winters' && n < 2 * seasonalPeriod) {
    return {
      modelType,
      modelName,
      isEligible: false,
      ineligibilityReason: `Holt-Winters requires at least 2 full cycles (${2 * seasonalPeriod} observations for period=${seasonalPeriod}).`,
      mae: Infinity,
      rmse: Infinity,
      smape: Infinity,
      mape: null,
      wape: Infinity,
      rank: 99,
      testFolds: [],
    };
  }

  if (modelType === 'seasonal_naive' && n < seasonalPeriod + 2) {
    return {
      modelType,
      modelName,
      isEligible: false,
      ineligibilityReason: `Seasonal Naive requires history longer than seasonal cycle (${seasonalPeriod} periods).`,
      mae: Infinity,
      rmse: Infinity,
      smape: Infinity,
      mape: null,
      wape: Infinity,
      rank: 99,
      testFolds: [],
    };
  }

  // Setup Chronological Cross-Validation Folds
  const testWindowSize = Math.max(
    1,
    Math.min(
      FORECAST_CONSTANTS.BACKTEST.MAX_TEST_POINTS,
      Math.floor(n * FORECAST_CONSTANTS.BACKTEST.TEST_WINDOW_PCT) || 2
    )
  );

  const initialTrainSize = Math.max(
    minRequired,
    Math.floor(n * FORECAST_CONSTANTS.BACKTEST.MIN_TRAIN_PCT)
  );

  const availableTestRange = n - initialTrainSize;
  const numFolds = Math.max(
    1,
    Math.min(
      FORECAST_CONSTANTS.BACKTEST.MAX_FOLDS,
      Math.floor(availableTestRange / testWindowSize) || 1
    )
  );

  const testFolds: BacktestFold[] = [];
  const allActuals: number[] = [];
  const allPredictions: number[] = [];
  let modelParams: Record<string, any> = {};

  try {
    for (let fold = 0; fold < numFolds; fold++) {
      const trainEndIdx = initialTrainSize + fold * testWindowSize;
      const testEndIdx = Math.min(n, trainEndIdx + testWindowSize);

      if (testEndIdx <= trainEndIdx) break;

      const trainValues = values.slice(0, trainEndIdx);
      const testValues = values.slice(trainEndIdx, testEndIdx);
      const horizon = testValues.length;

      const fitted = fitModelByType(modelType, trainValues, seasonalPeriod);
      modelParams = fitted.parameters || {};

      const predictions = fitted.predict(horizon);

      const foldErrors = calculateErrorMetrics(testValues, predictions);

      testFolds.push({
        foldIndex: fold + 1,
        trainStart: series[0].date,
        trainEnd: series[trainEndIdx - 1].date,
        testStart: series[trainEndIdx].date,
        testEnd: series[testEndIdx - 1].date,
        trainCount: trainValues.length,
        testCount: testValues.length,
        actuals: testValues,
        predictions: predictions.map((p) => Number(p.toFixed(4))),
        mae: foldErrors.mae,
        rmse: foldErrors.rmse,
        smape: foldErrors.smape,
      });

      allActuals.push(...testValues);
      allPredictions.push(...predictions);
    }

    // If backtesting had no test points (e.g. very small series), do in-sample fit evaluation
    if (allActuals.length === 0) {
      const fitted = fitModelByType(modelType, values, seasonalPeriod);
      modelParams = fitted.parameters || {};
      const fittedVals = fitted.fittedValues;
      const errors = calculateErrorMetrics(values, fittedVals);

      return {
        modelType,
        modelName,
        isEligible: true,
        mae: errors.mae,
        rmse: errors.rmse,
        smape: errors.smape,
        mape: errors.mape,
        wape: errors.wape,
        rank: 1,
        parameters: modelParams,
        testFolds: [],
      };
    }

    const overallErrors = calculateErrorMetrics(allActuals, allPredictions);

    return {
      modelType,
      modelName,
      isEligible: true,
      mae: overallErrors.mae,
      rmse: overallErrors.rmse,
      smape: overallErrors.smape,
      mape: overallErrors.mape,
      wape: overallErrors.wape,
      rank: 1,
      parameters: modelParams,
      testFolds,
    };
  } catch (err: any) {
    return {
      modelType,
      modelName,
      isEligible: false,
      ineligibilityReason: `Convergence / Fitting error: ${err.message || 'Model failed on dataset.'}`,
      mae: Infinity,
      rmse: Infinity,
      smape: Infinity,
      mape: null,
      wape: Infinity,
      rank: 99,
      testFolds: [],
    };
  }
}
