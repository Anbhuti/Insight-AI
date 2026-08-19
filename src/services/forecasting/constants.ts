import { TimeFrequency, ConfidenceIntervalLevel, ForecastModelType } from './forecastTypes';

export const FORECAST_CONSTANTS = {
  // Confidence Interval critical values (Z-scores for two-tailed normal distribution)
  Z_SCORES: {
    80: 1.28155,
    90: 1.64485,
    95: 1.95996,
  } as Record<ConfidenceIntervalLevel, number>,

  // Minimum required observations for time series analysis
  MIN_REQUIRED_OBSERVATIONS: 3,

  // Model-specific minimum historical observations
  MODEL_MIN_OBSERVATIONS: {
    naive: 3,
    seasonal_naive: 8,
    moving_average: 4,
    exponential_smoothing: 5,
    holt_linear: 6,
    holt_winters: 12,
    autoregressive: 8,
    auto: 3,
  } as Record<ForecastModelType, number>,

  // Default seasonal periods per frequency
  DEFAULT_SEASONAL_PERIODS: {
    daily: 7, // 7 days in a week
    weekly: 4, // 4 weeks in a month or 52 in a year
    monthly: 12, // 12 months in a year
    quarterly: 4, // 4 quarters in a year
    yearly: 1, // yearly (no intra-year seasonality)
    irregular: 7,
  } as Record<TimeFrequency, number>,

  // Default forecast horizons per frequency
  DEFAULT_HORIZONS: {
    daily: 30,
    weekly: 12,
    monthly: 6,
    quarterly: 4,
    yearly: 3,
    irregular: 14,
  } as Record<TimeFrequency, number>,

  // Horizon limits
  MIN_HORIZON: 1,
  MAX_HORIZON: 365,

  // Backtesting parameters
  BACKTEST: {
    MIN_TRAIN_PCT: 0.6,
    MIN_TRAIN_POINTS: 4,
    MAX_FOLDS: 4,
    TEST_WINDOW_PCT: 0.2,
    MIN_TEST_POINTS: 2,
    MAX_TEST_POINTS: 15,
  },

  // Storage
  LOCAL_STORAGE_KEY_PREFIX: 'insightai_forecasts_',
  LOCAL_CACHE_KEY_PREFIX: 'insightai_forecast_cache_',
};
