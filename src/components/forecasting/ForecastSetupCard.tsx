import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Calendar,
  Layers,
  Clock,
  Sliders,
  Settings2,
  AlertCircle,
  HelpCircle,
  Wand2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import {
  ForecastConfig,
  TimeFrequency,
  AggregationType,
  ForecastModelType,
  ConfidenceIntervalLevel,
  MissingPeriodStrategy,
  OutlierHandlingStrategy,
  ForecastStatus,
} from '../../services/forecasting/forecastTypes';
import {
  detectDateColumn,
  detectForecastableMetrics,
} from '../../services/forecasting/timeSeriesService';
import { FORECAST_CONSTANTS } from '../../services/forecasting/constants';

interface ForecastSetupCardProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (dataset: Dataset) => void;
  datasetProfiles: Record<string, DatasetProfile>;
  config: ForecastConfig;
  onChangeConfig: (newConfig: ForecastConfig) => void;
  onAutoDetect: () => void;
  onRunForecast: () => void;
  status: ForecastStatus;
  statusMessage?: string;
}

export const ForecastSetupCard: React.FC<ForecastSetupCardProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  datasetProfiles,
  config,
  onChangeConfig,
  onAutoDetect,
  onRunForecast,
  status,
  statusMessage,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const profile = selectedDataset ? datasetProfiles[selectedDataset.datasetId] : null;
  const columns =
    profile?.columns?.map((c) => c.name) ||
    selectedDataset?.previewSample?.columns ||
    [];

  const { allMetrics } = detectForecastableMetrics(columns, profile);

  const isRunning = status !== 'idle' && status !== 'completed' && status !== 'failed';

  const horizonPresets = [
    { label: '7 Days', freq: 'daily', horizon: 7 },
    { label: '30 Days', freq: 'daily', horizon: 30 },
    { label: '90 Days', freq: 'daily', horizon: 90 },
    { label: '12 Weeks', freq: 'weekly', horizon: 12 },
    { label: '6 Months', freq: 'monthly', horizon: 6 },
    { label: '12 Months', freq: 'monthly', horizon: 12 },
    { label: '4 Quarters', freq: 'quarterly', horizon: 4 },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Forecasting & Predictive Engine</h2>
              <p className="text-xs text-slate-500">
                Rigorous statistical projection and chronological backtesting with real historical data
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAutoDetect}
            disabled={!selectedDataset || isRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Automatically detect date column, target metric, and frequency"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Auto-Detect Settings</span>
          </button>
        </div>
      </div>

      {/* Primary Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Dataset Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Dataset</span>
          </label>
          <select
            value={selectedDataset?.datasetId || ''}
            onChange={(e) => {
              const ds = datasets.find((d) => d.datasetId === e.target.value);
              if (ds) onSelectDataset(ds);
            }}
            disabled={isRunning}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-indigo-500 transition-all cursor-pointer"
          >
            {datasets.map((d) => (
              <option key={d.datasetId} value={d.datasetId}>
                {d.name} ({d.rowCount.toLocaleString()} rows)
              </option>
            ))}
          </select>
        </div>

        {/* Date / Time Column */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date Column</span>
          </label>
          <select
            value={config.dateColumn}
            onChange={(e) => onChangeConfig({ ...config, dateColumn: e.target.value })}
            disabled={isRunning}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-indigo-500 transition-all cursor-pointer"
          >
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Target Metric Column */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>Target Metric</span>
          </label>
          <select
            value={config.metricColumn}
            onChange={(e) => onChangeConfig({ ...config, metricColumn: e.target.value })}
            disabled={isRunning}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-indigo-500 transition-all cursor-pointer"
          >
            {(allMetrics.length > 0 ? allMetrics : columns).map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Time Frequency */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Time Frequency</span>
          </label>
          <select
            value={config.frequency}
            onChange={(e) => {
              const freq = e.target.value as TimeFrequency;
              const defH = FORECAST_CONSTANTS.DEFAULT_HORIZONS[freq] || 30;
              onChangeConfig({ ...config, frequency: freq, horizon: defH });
            }}
            disabled={isRunning}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-indigo-500 transition-all cursor-pointer"
          >
            <option value="daily">Daily (Day by Day)</option>
            <option value="weekly">Weekly (7-Day Aggregation)</option>
            <option value="monthly">Monthly (Calendar Month)</option>
            <option value="quarterly">Quarterly (3-Month Quarters)</option>
            <option value="yearly">Yearly (Annual Totals)</option>
          </select>
        </div>
      </div>

      {/* Horizon & Quick Presets */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Forecast Horizon:</span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {config.horizon} {config.frequency === 'daily' ? 'Days' : config.frequency === 'weekly' ? 'Weeks' : config.frequency === 'monthly' ? 'Months' : config.frequency === 'quarterly' ? 'Quarters' : 'Periods'}
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Presets:</span>
            {horizonPresets.map((p) => (
              <button
                key={p.label}
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    frequency: p.freq as TimeFrequency,
                    horizon: p.horizon,
                  })
                }
                disabled={isRunning}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  config.frequency === p.freq && config.horizon === p.horizon
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizon Slider */}
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max={config.frequency === 'daily' ? 180 : config.frequency === 'weekly' ? 52 : config.frequency === 'monthly' ? 24 : 12}
            value={config.horizon}
            onChange={(e) => onChangeConfig({ ...config, horizon: parseInt(e.target.value, 10) || 1 })}
            disabled={isRunning}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <input
            type="number"
            min="1"
            max="365"
            value={config.horizon}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                horizon: Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 1)),
              })
            }
            disabled={isRunning}
            className="w-16 h-8 text-center text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Advanced Toggle */}
      <div className="mb-5">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Advanced Statistical Modeling Controls</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-150">
            {/* Model Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Forecasting Model
              </label>
              <select
                value={config.modelType}
                onChange={(e) =>
                  onChangeConfig({ ...config, modelType: e.target.value as ForecastModelType })
                }
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800"
              >
                <option value="auto">Auto (Best Backtest Validation Score)</option>
                <option value="holt_winters">Holt-Winters (Triple Exponential)</option>
                <option value="holt_linear">Holt's Linear Trend</option>
                <option value="exponential_smoothing">Simple Exponential Smoothing</option>
                <option value="moving_average">Moving Average with Trend</option>
                <option value="autoregressive">AutoRegressive (AR / ARIMA)</option>
                <option value="seasonal_naive">Seasonal Naive</option>
                <option value="naive">Naive Benchmark (Last Value)</option>
              </select>
            </div>

            {/* Aggregation Method */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Value Aggregation
              </label>
              <select
                value={config.aggregation}
                onChange={(e) =>
                  onChangeConfig({ ...config, aggregation: e.target.value as AggregationType })
                }
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800"
              >
                <option value="SUM">SUM (Total across interval)</option>
                <option value="AVG">AVG (Mean average)</option>
                <option value="COUNT">COUNT (Frequency)</option>
                <option value="MAX">MAX (Peak)</option>
                <option value="MIN">MIN (Floor)</option>
              </select>
            </div>

            {/* Confidence Interval */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Confidence Band
              </label>
              <select
                value={config.confidenceLevel}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    confidenceLevel: parseInt(e.target.value, 10) as ConfidenceIntervalLevel,
                  })
                }
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800"
              >
                <option value="95">95% Confidence Interval (Standard)</option>
                <option value="90">90% Confidence Interval</option>
                <option value="80">80% Confidence Interval (Narrow)</option>
              </select>
            </div>

            {/* Missing Period Strategy */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Missing Period Handling
              </label>
              <select
                value={config.missingPeriodStrategy}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    missingPeriodStrategy: e.target.value as MissingPeriodStrategy,
                  })
                }
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800"
              >
                <option value="interpolation">Linear Interpolation</option>
                <option value="forward_fill">Forward Fill (Carry Last)</option>
                <option value="zero">Fill with Zero (0)</option>
                <option value="none">Omit (Keep Irregular)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer & Progress State */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <div>
          {isRunning ? (
            <div className="flex items-center gap-2.5 text-xs text-indigo-700 font-semibold">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              <span>{statusMessage || 'Computing statistical forecasts...'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>All 7 statistical models are backtested on chronological validation folds.</span>
            </div>
          )}
        </div>

        <button
          onClick={onRunForecast}
          disabled={isRunning || !selectedDataset}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <TrendingUp className="w-4 h-4" />
          <span>{isRunning ? 'Calculating Models...' : 'Run Statistical Forecast'}</span>
        </button>
      </div>
    </div>
  );
};
