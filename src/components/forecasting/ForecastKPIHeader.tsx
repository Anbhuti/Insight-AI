import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Award,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  Layers,
} from 'lucide-react';
import { ForecastResult } from '../../services/forecasting/forecastTypes';

interface ForecastKPIHeaderProps {
  forecast: ForecastResult;
}

export const ForecastKPIHeader: React.FC<ForecastKPIHeaderProps> = ({ forecast }) => {
  const { summary, selectedModelName, scorecard, confidenceRating, confidenceRationale, warnings } = forecast;
  const isPositive = summary.expectedGrowthPct > 0;
  const isNeutral = Math.abs(summary.expectedGrowthPct) < 0.5;

  const bestScorecard = scorecard.find((s) => s.modelType === forecast.selectedModel) || scorecard[0];

  const confidenceBadge = {
    high: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: ShieldCheck,
      label: 'High Confidence',
    },
    medium: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      label: 'Moderate Confidence',
    },
    low: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: ShieldAlert,
      label: 'Low Confidence / Wide Bounds',
    },
  }[confidenceRating] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: ShieldCheck,
    label: 'Evaluated',
  };

  const ConfIcon = confidenceBadge.icon;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Final Horizon Projected Value */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Projected End Value
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
              isNeutral
                ? 'bg-slate-50 text-slate-600 border-slate-200'
                : isPositive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{isPositive ? '+' : ''}{summary.expectedGrowthPct}%</span>
          </span>
        </div>

        <div className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">
          {summary.finalPredictedValue.toLocaleString()}
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>Baseline:</span>
          <span className="font-semibold text-slate-700">
            {summary.latestActualValue.toLocaleString()}
          </span>
          <span className="text-slate-400">({summary.latestHistoricalDate})</span>
        </div>
      </div>

      {/* 2. Cumulative Forecasted Sum */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Cumulative Forecast
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {summary.forecastHorizon} {summary.horizonUnit}
          </span>
        </div>

        <div className="text-2xl font-extrabold text-indigo-600 mb-1 tracking-tight">
          {summary.totalForecastedSum.toLocaleString()}
        </div>

        <div className="text-xs text-slate-500">
          Mean per period: <span className="font-semibold text-slate-700">{summary.meanForecastedValue.toLocaleString()}</span>
        </div>
      </div>

      {/* 3. Winning Model Score */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Optimal Model
          </span>
          <Award className="w-4 h-4 text-amber-500" />
        </div>

        <div className="text-base font-extrabold text-slate-900 mb-1 truncate" title={selectedModelName}>
          {selectedModelName}
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>Backtest sMAPE:</span>
          <span className="font-bold text-emerald-600">
            {bestScorecard ? `${bestScorecard.smape}%` : 'N/A'}
          </span>
          {bestScorecard && (
            <span className="text-[11px] text-slate-400">
              (MAE: {bestScorecard.mae})
            </span>
          )}
        </div>
      </div>

      {/* 4. Confidence Assessment */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Data & Model Health
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${confidenceBadge.bg}`}>
            <ConfIcon className="w-3 h-3" />
            <span>{confidenceBadge.label}</span>
          </span>
        </div>

        <div className="text-xs font-semibold text-slate-700 mb-1.5 line-clamp-2">
          {confidenceRationale[0] || 'Statistical cross-validation passed.'}
        </div>

        <div className="text-[11px] text-slate-400">
          {warnings.length > 0 ? (
            <span className="text-amber-600 font-medium">⚠️ {warnings.length} data caveat{warnings.length > 1 ? 's' : ''} noted</span>
          ) : (
            <span className="text-emerald-600 font-medium">✓ Clean time series</span>
          )}
        </div>
      </div>
    </div>
  );
};
