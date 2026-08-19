import { FittedModel } from './naiveModel';

/**
 * Holt's Linear Trend Model (Double Exponential Smoothing)
 * Level equation: L_t = alpha * y_t + (1 - alpha) * (L_{t-1} + b_{t-1})
 * Trend equation: b_t = beta * (L_t - L_{t-1}) + (1 - beta) * b_{t-1}
 * Forecast: y_{T+h} = L_T + h * b_T
 */
export function fitHoltLinearModel(values: number[]): FittedModel {
  const n = values.length;
  if (n < 4) {
    throw new Error(`Holt's Linear Trend requires at least 4 observations (got ${n}).`);
  }

  // Initial values
  const initLevel = values[0];
  const initTrend = values[1] - values[0];

  let bestAlpha = 0.3;
  let bestBeta = 0.1;
  let minMse = Infinity;

  const alphaGrid = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
  const betaGrid = [0.01, 0.05, 0.1, 0.2, 0.3, 0.4];

  for (const alpha of alphaGrid) {
    for (const beta of betaGrid) {
      let level = initLevel;
      let trend = initTrend;
      let sse = 0;

      for (let t = 1; t < n; t++) {
        const pred = level + trend;
        const err = values[t] - pred;
        sse += err * err;

        const prevLevel = level;
        level = alpha * values[t] + (1 - alpha) * (prevLevel + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
      }

      const mse = sse / (n - 1);
      if (mse < minMse) {
        minMse = mse;
        bestAlpha = alpha;
        bestBeta = beta;
      }
    }
  }

  // Calculate fitted values using optimal parameters
  const fittedValues: number[] = [values[0]];
  let level = initLevel;
  let trend = initTrend;

  for (let t = 1; t < n; t++) {
    fittedValues.push(level + trend);
    const prevLevel = level;
    level = bestAlpha * values[t] + (1 - bestAlpha) * (prevLevel + trend);
    trend = bestBeta * (level - prevLevel) + (1 - bestBeta) * trend;
  }

  const residuals = values.map((val, idx) => val - fittedValues[idx]);
  const finalLevel = level;
  const finalTrend = trend;

  return {
    predict: (horizon: number) => {
      const predictions: number[] = [];
      for (let h = 1; h <= horizon; h++) {
        // Apply slight damping to prevent infinite linear runaway on long horizons
        const damping = Math.pow(0.98, h - 1);
        const pred = finalLevel + h * finalTrend * damping;
        predictions.push(pred);
      }
      return predictions;
    },
    fittedValues,
    residuals,
    parameters: {
      alpha: Number(bestAlpha.toFixed(2)),
      beta: Number(bestBeta.toFixed(2)),
      finalLevel: Number(finalLevel.toFixed(2)),
      finalTrend: Number(finalTrend.toFixed(4)),
    },
  };
}
