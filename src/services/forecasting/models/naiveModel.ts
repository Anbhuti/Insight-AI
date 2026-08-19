/**
 * Naive Baseline Forecast Models
 */

export interface FittedModel {
  predict: (horizon: number) => number[];
  fittedValues: number[];
  residuals: number[];
  parameters: Record<string, any>;
}

/**
 * Standard Naive Model: Projects the latest observed value forward
 */
export function fitNaiveModel(values: number[]): FittedModel {
  const n = values.length;
  if (n === 0) throw new Error('Cannot fit Naive model on empty series.');

  const lastValue = values[n - 1];
  const fittedValues: number[] = [values[0]];
  for (let i = 1; i < n; i++) {
    fittedValues.push(values[i - 1]);
  }

  const residuals = values.map((val, idx) => val - fittedValues[idx]);

  return {
    predict: (horizon: number) => {
      return Array(horizon).fill(lastValue);
    },
    fittedValues,
    residuals,
    parameters: { lastValue },
  };
}

/**
 * Seasonal Naive Model: Projects the value from the same period of the previous cycle
 */
export function fitSeasonalNaiveModel(values: number[], seasonalPeriod: number): FittedModel {
  const n = values.length;
  if (n < seasonalPeriod) {
    throw new Error(`Seasonal Naive requires at least ${seasonalPeriod} observations (got ${n}).`);
  }

  const fittedValues: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i < seasonalPeriod) {
      fittedValues.push(values[i]); // Fallback for initial cycle
    } else {
      fittedValues.push(values[i - seasonalPeriod]);
    }
  }

  const residuals = values.map((val, idx) => val - fittedValues[idx]);

  return {
    predict: (horizon: number) => {
      const predictions: number[] = [];
      for (let h = 1; h <= horizon; h++) {
        // Look back by seasonal periods
        const idxFromEnd = ((h - 1) % seasonalPeriod) + 1;
        const lookupIdx = n - seasonalPeriod + idxFromEnd - 1;
        predictions.push(values[lookupIdx]);
      }
      return predictions;
    },
    fittedValues,
    residuals,
    parameters: { seasonalPeriod },
  };
}
