import { FittedModel } from './naiveModel';

/**
 * Simple Exponential Smoothing (SES) Model
 * Level equation: L_t = alpha * y_t + (1 - alpha) * L_{t-1}
 * Forecast: y_{t+h} = L_T
 */
export function fitExponentialSmoothingModel(values: number[]): FittedModel {
  const n = values.length;
  if (n < 3) {
    throw new Error(`Simple Exponential Smoothing requires at least 3 observations (got ${n}).`);
  }

  // Grid search to optimize alpha in [0.05, 0.95]
  let bestAlpha = 0.3;
  let minMse = Infinity;

  const alphaCandidates = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];

  for (const alpha of alphaCandidates) {
    let level = values[0];
    let sse = 0;

    for (let t = 1; t < n; t++) {
      const pred = level;
      const err = values[t] - pred;
      sse += err * err;
      level = alpha * values[t] + (1 - alpha) * level;
    }

    const mse = sse / (n - 1);
    if (mse < minMse) {
      minMse = mse;
      bestAlpha = alpha;
    }
  }

  // Compute fitted values and residuals using bestAlpha
  const fittedValues: number[] = [values[0]];
  let currentLevel = values[0];

  for (let t = 1; t < n; t++) {
    fittedValues.push(currentLevel);
    currentLevel = bestAlpha * values[t] + (1 - bestAlpha) * currentLevel;
  }

  const residuals = values.map((val, idx) => val - fittedValues[idx]);
  const finalLevel = currentLevel;

  return {
    predict: (horizon: number) => {
      return Array(horizon).fill(finalLevel);
    },
    fittedValues,
    residuals,
    parameters: { alpha: bestAlpha, finalLevel },
  };
}
