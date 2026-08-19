import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Sliders,
  Eye,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ForecastResult, TimeSeriesPoint, ForecastPoint } from '../../services/forecasting/forecastTypes';

interface ForecastChartProps {
  forecast: ForecastResult;
}

type RangeFilter = 'all' | 'recent' | 'forecast_only';

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecast }) => {
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('all');
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showScenarios, setShowScenarios] = useState<boolean>(false);

  const { historicalSeries, forecastSeries, config, summary, selectedModelName } = forecast;

  // Build unified chart data
  const chartData = useMemo(() => {
    let historyPoints = [...historicalSeries];

    if (rangeFilter === 'recent') {
      const recentCount = Math.max(15, Math.min(60, config.horizon * 2));
      historyPoints = historyPoints.slice(-recentCount);
    } else if (rangeFilter === 'forecast_only') {
      // Keep only last historical point to connect the line
      historyPoints = historyPoints.slice(-1);
    }

    const lastHistory = historyPoints[historyPoints.length - 1];

    const formattedHistory = historyPoints.map((h, idx) => ({
      date: h.date,
      timestamp: h.timestamp,
      actual: h.value,
      forecast: idx === historyPoints.length - 1 ? h.value : null,
      lowerBound: null as number | null,
      upperBound: null as number | null,
      confidenceBand: null as [number, number] | null,
      optimistic: null as number | null,
      conservative: null as number | null,
      isImputed: h.isImputed,
      isOutlier: h.isOutlier,
      isHistorical: true,
    }));

    const formattedForecast = forecastSeries.map((f) => ({
      date: f.date,
      timestamp: f.timestamp,
      actual: null as number | null,
      forecast: f.prediction,
      lowerBound: f.lowerBound,
      upperBound: f.upperBound,
      confidenceBand: [f.lowerBound, f.upperBound] as [number, number],
      optimistic: f.optimisticScenario || null,
      conservative: f.conservativeScenario || null,
      isHistorical: false,
    }));

    return [...formattedHistory, ...formattedForecast];
  }, [historicalSeries, forecastSeries, rangeFilter, config.horizon]);

  // Compute nice Y-axis domain
  const yDomain = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    chartData.forEach((d) => {
      if (d.actual !== null) {
        min = Math.min(min, d.actual);
        max = Math.max(max, d.actual);
      }
      if (d.forecast !== null) {
        min = Math.min(min, d.forecast);
        max = Math.max(max, d.forecast);
      }
      if (showConfidenceBand) {
        if (d.lowerBound !== null) min = Math.min(min, d.lowerBound);
        if (d.upperBound !== null) max = Math.max(max, d.upperBound);
      }
    });

    if (!isFinite(min) || !isFinite(max)) return [0, 100];
    const pad = (max - min) * 0.1 || 10;
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
  }, [chartData, showConfidenceBand]);

  const lastHistoricalDate = historicalSeries[historicalSeries.length - 1]?.date;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              {config.metricColumn} — Predictive Trajectory
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {selectedModelName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical actuals with {config.horizon}-{config.frequency === 'daily' ? 'day' : config.frequency === 'weekly' ? 'week' : 'period'} projection & {config.confidenceLevel}% confidence intervals
          </p>
        </div>

        {/* Chart View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Range Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
            <button
              onClick={() => setRangeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                rangeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All History
            </button>
            <button
              onClick={() => setRangeFilter('recent')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                rangeFilter === 'recent'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recent + Forecast
            </button>
            <button
              onClick={() => setRangeFilter('forecast_only')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                rangeFilter === 'forecast_only'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Forecast Only
            </button>
          </div>

          {/* Toggle Confidence Band */}
          <button
            onClick={() => setShowConfidenceBand(!showConfidenceBand)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              showConfidenceBand
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            Confidence Band ({config.confidenceLevel}%)
          </button>

          {/* Toggle Scenarios */}
          <button
            onClick={() => setShowScenarios(!showScenarios)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              showScenarios
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            Scenarios
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              dy={10}
              interval="preserveStartEnd"
            />

            <YAxis
              domain={yDomain}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0]?.payload;
                if (!data) return null;

                const isHist = data.isHistorical && data.actual !== null;

                return (
                  <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-2 min-w-[210px] z-50">
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
                      <span className="font-bold text-slate-200">{label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isHist ? 'bg-slate-800 text-slate-300' : 'bg-indigo-900/80 text-indigo-300 border border-indigo-700/50'
                        }`}
                      >
                        {isHist ? 'Historical Record' : 'Statistical Forecast'}
                      </span>
                    </div>

                    {isHist ? (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Actual Value:</span>
                          <span className="font-bold text-white text-sm">
                            {data.actual?.toLocaleString()}
                          </span>
                        </div>
                        {data.isImputed && (
                          <span className="text-[10px] text-amber-400 block">
                            (Interpolated missing period)
                          </span>
                        )}
                        {data.isOutlier && (
                          <span className="text-[10px] text-rose-400 block">
                            (Identified outlier)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-300 font-semibold">Predicted:</span>
                          <span className="font-extrabold text-indigo-400 text-sm">
                            {data.forecast?.toLocaleString()}
                          </span>
                        </div>
                        {data.lowerBound !== null && data.upperBound !== null && (
                          <div className="pt-1 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                            <div className="flex justify-between">
                              <span>Upper Bound ({config.confidenceLevel}%):</span>
                              <span className="font-mono text-slate-300">{data.upperBound?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Lower Bound ({config.confidenceLevel}%):</span>
                              <span className="font-mono text-slate-300">{data.lowerBound?.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                        {showScenarios && data.optimistic !== null && (
                          <div className="pt-1 border-t border-slate-800 text-[10px] space-y-0.5">
                            <div className="flex justify-between text-emerald-400">
                              <span>Optimistic Scenario:</span>
                              <span>{data.optimistic?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-amber-400">
                              <span>Conservative Scenario:</span>
                              <span>{data.conservative?.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Vertical demarcation line between historical and forecast */}
            {lastHistoricalDate && (
              <ReferenceLine
                x={lastHistoricalDate}
                stroke="#6366f1"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Forecast Start',
                  position: 'top',
                  fill: '#6366f1',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />
            )}

            {/* Shaded Confidence Interval Range Area */}
            {showConfidenceBand && (
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="transparent"
                fill="#6366f1"
                fillOpacity={0.12}
                name="Confidence Range"
              />
            )}

            {/* Historical Series Line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#0f172a"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#0f172a', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#0f172a', stroke: '#ffffff', strokeWidth: 2 }}
              name="Historical Actuals"
              connectNulls={false}
            />

            {/* Future Forecast Prediction Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#6366f1"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
              name="Forecast Prediction"
              connectNulls
            />

            {/* Scenarios */}
            {showScenarios && (
              <Line
                type="monotone"
                dataKey="optimistic"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
                name="Optimistic Scenario"
                connectNulls
              />
            )}

            {showScenarios && (
              <Line
                type="monotone"
                dataKey="conservative"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
                name="Conservative Scenario"
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-4 mt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 bg-slate-900 rounded-full" />
          <span className="font-semibold text-slate-700">Historical Actuals</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 bg-indigo-600 rounded-full border-dashed" />
          <span className="font-semibold text-indigo-700">Model Prediction ({selectedModelName})</span>
        </div>
        {showConfidenceBand && (
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3 bg-indigo-100 border border-indigo-300 rounded" />
            <span className="text-slate-500">{config.confidenceLevel}% Confidence Envelope</span>
          </div>
        )}
        {showScenarios && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-emerald-500 rounded-full" />
              <span className="text-emerald-700">Optimistic Case</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-amber-500 rounded-full" />
              <span className="text-amber-700">Conservative Case</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
