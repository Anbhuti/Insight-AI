import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Repeat,
  AlertTriangle,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { DecompositionResult, TimeSeriesMetadata } from '../../services/forecasting/forecastTypes';

interface TimeSeriesDecompositionCardProps {
  decomposition: DecompositionResult;
  metadata: TimeSeriesMetadata;
}

export const TimeSeriesDecompositionCard: React.FC<TimeSeriesDecompositionCardProps> = ({
  decomposition,
  metadata,
}) => {
  const isPositiveTrend = decomposition.trendSlope > 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
      <div className="flex items-center gap-2 pb-5 mb-5 border-b border-slate-100">
        <Activity className="w-5 h-5 text-indigo-600" />
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Time-Series Decomposition & Patterns
          </h3>
          <p className="text-xs text-slate-500">
            Mathematical breakdown of historical trend, cyclical seasonality, and signal regularity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trend Analysis */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Underlying Trend
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                decomposition.trend === 'increasing'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : decomposition.trend === 'decreasing'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {decomposition.trend.toUpperCase()}
            </span>
          </div>

          <div className="text-xl font-bold text-slate-900 flex items-baseline gap-2">
            <span>{isPositiveTrend ? '+' : ''}{decomposition.trendSlope}</span>
            <span className="text-xs font-semibold text-slate-500">/ period</span>
          </div>

          <p className="text-xs text-slate-600">
            Historical span growth trajectory of <span className="font-bold text-slate-800">{decomposition.trendGrowthPct}%</span>. Noise ratio: {(decomposition.noiseRatio * 100).toFixed(0)}%.
          </p>
        </div>

        {/* Seasonality Detection */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Seasonality & Cycles
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                decomposition.seasonality === 'strong'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : decomposition.seasonality === 'moderate'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {decomposition.seasonality.toUpperCase()}
            </span>
          </div>

          <div className="text-sm font-bold text-slate-900">
            {decomposition.seasonalPatternName || 'Non-Periodic'}
          </div>

          <p className="text-xs text-slate-600">
            {decomposition.seasonalityExplanation}
            {decomposition.seasonalAutocorrelation ? ` (ACF r = ${decomposition.seasonalAutocorrelation})` : ''}
          </p>
        </div>

        {/* Series Hygiene & Gaps */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Data Regularity
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Score: {(metadata.regularityScore * 100).toFixed(0)}%
            </span>
          </div>

          <div className="text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Historical Periods:</span>
              <span className="font-bold">{metadata.aggregatedPointsCount} points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date Range:</span>
              <span className="font-semibold text-slate-800">{metadata.minDate} → {metadata.maxDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Missing Gaps:</span>
              <span className={metadata.missingPeriodsCount > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-semibold'}>
                {metadata.missingPeriodsCount} ({metadata.missingPeriodsPercentage}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
