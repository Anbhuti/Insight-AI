import { FittedModel } from './naiveModel';

/**
 * Holt-Winters Triple Exponential Smoothing (Additive Seasonality)
 */
export function fitHoltWintersModel(values: number[], seasonalPeriod: number): FittedModel {
  const n = values.length;
  const m = seasonalPeriod;

  if (n < 2 * m) {
    throw new Error(
      `Holt-Winters requires at least 2 full seasonal cycles (${2 * m} observations, got ${n}).`
    );
  }

  // 1. Initial Level and Trend estimation
  let sumL1 = 0;
  let sumL2 = 0;
  for (let i = 0; i < m; i++) sumL1 += values[i];
  for (let i = m; i < 2 * m; i++) sumL2 += values[i];

  const initLevel = sumL2 / m;
  const initTrend = (sumL2 - sumL1) / (m * m);

  // 2. Initial Seasonal Indices
  const initSeason: number[] = [];
  for (let i = 0; i < m; i++) {
    initSeason.push(values[i] - sumL1 / m);
  }

  // 3. Grid Search for Alpha, Beta, Gamma
  let bestAlpha = 0.2;
  let bestBeta = 0.05;
  let bestGamma = 0.2;
  let minMse = Infinity;

  const alphaGrid = [0.1, 0.2, 0.3, 0.5];
  const betaGrid = [0.01, 0.05, 0.1];
  const gammaGrid = [0.1, 0.2, 0.3, 0.5];

  for (const alpha of alphaGrid) {
    for (const beta of betaGrid) {
      for (const gamma of gammaGrid) {
        let level = initLevel;
        let trend = initTrend;
        const season = [...initSeason];
        let sse = 0;

        for (let t = m; t < n; t++) {
          const sIdx = t % m;
          const pred = level + trend + season[sIdx];
          const err = values[t] - pred;
          sse += err * err;

          const prevLevel = level;
          level = alpha * (values[t] - season[sIdx]) + (1 - alpha) * (prevLevel + trend);
          trend = beta * (level - prevLevel) + (1 - beta) * trend;
          season[sIdx] = gamma * (values[t] - prevLevel - trend) + (1 - gamma) * season[sIdx];
        }

        const mse = sse / (n - m);
        if (mse < minMse) {
          minMse = mse;
          bestAlpha = alpha;
          bestBeta = beta;
          bestGamma = gamma;
        }
      }
    }
  }

  // 4. Compute fitted values with optimal hyperparameters
  const fittedValues: number[] = [];
  let level = initLevel;
  let trend = initTrend;
  const season = [...initSeason];

  for (let t = 0; t < n; t++) {
    const sIdx = t % m;
    if (t < m) {
      fittedValues.push(values[t]);
    } else {
      const pred = level + trend + season[sIdx];
      fittedValues.push(pred);

      const prevLevel = level;
      level = bestAlpha * (values[t] - season[sIdx]) + (1 - bestAlpha) * (prevLevel + trend);
      trend = bestBeta * (level - prevLevel) + (1 - bestBeta) * trend;
      season[sIdx] = bestGamma * (values[t] - prevLevel - trend) + (1 - bestGamma) * season[sIdx];
    }
  }

  const residuals = values.map((val, idx) => val - fittedValues[idx]);
  const finalLevel = level;
  const finalTrend = trend;
  const finalSeason = [...season];

  return {
    predict: (horizon: number) => {
      const predictions: number[] = [];
      for (let h = 1; h <= horizon; h++) {
        const sIdx = (n + h - 1) % m;
        const damping = Math.pow(0.98, h - 1);
        const pred = finalLevel + h * finalTrend * damping + finalSeason[sIdx];
        predictions.push(pred);
      }
      return predictions;
    },
    fittedValues,
    residuals,
    parameters: {
      alpha: Number(bestAlpha.toFixed(2)),
      beta: Number(bestBeta.toFixed(2)),
      gamma: Number(bestGamma.toFixed(2)),
      seasonalPeriod: m,
      finalLevel: Number(finalLevel.toFixed(2)),
      finalTrend: Number(finalTrend.toFixed(4)),
    },
  };
}
