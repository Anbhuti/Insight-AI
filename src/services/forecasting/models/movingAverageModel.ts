import { FittedModel } from './naiveModel';

/**
 * Moving Average Model with configurable window k and mild slope extrapolation
 */
export function fitMovingAverageModel(values: number[], windowSize: number = 3): FittedModel {
  const n = values.length;
  if (n < windowSize) {
    throw new Error(`Moving Average requires at least ${windowSize} observations (got ${n}).`);
  }

  const fittedValues: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      fittedValues.push(values[0]);
    } else {
      const start = Math.max(0, i - windowSize);
      const slice = values.slice(start, i);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      fittedValues.push(avg);
    }
  }

  const residuals = values.map((val, idx) => val - fittedValues[idx]);

  // Compute final moving average from last windowSize points
  const lastSlice = values.slice(n - windowSize);
  const baseAvg = lastSlice.reduce((a, b) => a + b, 0) / lastSlice.length;

  // Gentle slope from the last window to allow directionality
  let slope = 0;
  if (lastSlice.length >= 2) {
    const firstHalf = lastSlice.slice(0, Math.floor(lastSlice.length / 2));
    const secondHalf = lastSlice.slice(Math.floor(lastSlice.length / 2));
    const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    slope = (avg2 - avg1) / Math.max(1, lastSlice.length / 2);
  }

  return {
    predict: (horizon: number) => {
      const predictions: number[] = [];
      for (let h = 1; h <= horizon; h++) {
        // Damped slope into the future
        const dampingFactor = Math.pow(0.95, h - 1);
        const pred = baseAvg + slope * h * dampingFactor;
        predictions.push(pred);
      }
      return predictions;
    },
    fittedValues,
    residuals,
    parameters: { windowSize, baseAvg, slope },
  };
}
