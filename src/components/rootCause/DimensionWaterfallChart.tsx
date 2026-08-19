import React, { useState } from 'react';
import { DimensionAnalysisResult, DimensionContribution } from '../../services/rootCause/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Layers, PieChart, Info, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DimensionWaterfallChartProps {
  dimensionAnalyses: DimensionAnalysisResult[];
  topDrivers: DimensionContribution[];
  targetMetric: string;
}

export const DimensionWaterfallChart: React.FC<DimensionWaterfallChartProps> = ({
  dimensionAnalyses,
  topDrivers,
  targetMetric,
}) => {
  const [selectedDimensionIndex, setSelectedDimensionIndex] = useState<number>(0);

  if (!dimensionAnalyses || dimensionAnalyses.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
        No categorical dimensions available in this dataset for contribution breakdown.
      </div>
    );
  }

  const activeDim = dimensionAnalyses[selectedDimensionIndex] || dimensionAnalyses[0];
  const isDecline = activeDim.totalAbsoluteChange < 0;

  const chartData = activeDim.topDrivers.map((d) => ({
    name: d.segment.length > 18 ? d.segment.substring(0, 16) + '…' : d.segment,
    fullName: d.segment,
    contributionPct: d.contributionPct,
    absoluteChange: d.absoluteChange,
    beforeValue: d.beforeValue,
    afterValue: d.afterValue,
    confidence: d.confidence,
    isPositive: d.absoluteChange >= 0,
  }));

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-6">
      
      {/* Header & Dimension Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Dimension Contribution Breakdown
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Exact mathematical contribution percentage (<span className="font-semibold text-slate-700">Δsegment / Δtotal</span>) by category
          </p>
        </div>

        {/* Dimension Pill Selectors */}
        {dimensionAnalyses.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {dimensionAnalyses.map((dim, idx) => (
              <button
                key={dim.dimension}
                onClick={() => setSelectedDimensionIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedDimensionIndex === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {dim.dimension}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pareto Concentration Banner */}
      {activeDim.paretoSummary && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900">
            <span className="font-extrabold">Pareto Driver Concentration: </span>
            <span className="font-medium">{activeDim.paretoSummary}</span>
          </div>
        </div>
      )}

      {/* Bar Chart Visualization */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              unit="%"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                      <div className="font-extrabold text-indigo-300 border-b border-slate-700 pb-1">
                        {data.fullName}
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Contribution:</span>
                        <span className="font-bold text-white">{data.contributionPct}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Absolute Shift:</span>
                        <span className="font-bold text-white">
                          {data.absoluteChange > 0 ? '+' : ''}
                          {data.absoluteChange.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Baseline → Current:</span>
                        <span className="font-semibold text-slate-300">
                          {data.beforeValue.toLocaleString()} → {data.afterValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1} />
            <Bar dataKey="contributionPct" radius={[0, 6, 6, 0]}>
              {chartData.map((entry, index) => {
                const color = entry.isPositive
                  ? isDecline
                    ? '#10b981' // counter-trend growth in decline
                    : '#6366f1' // positive contribution in growth
                  : isDecline
                  ? '#f43f5e' // largest negative contributor
                  : '#f59e0b';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Segment Breakdown Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Segment ({activeDim.dimension})</th>
              <th className="px-4 py-3 text-right">Baseline</th>
              <th className="px-4 py-3 text-right">Current</th>
              <th className="px-4 py-3 text-right">Absolute Delta</th>
              <th className="px-4 py-3 text-right">Contribution %</th>
              <th className="px-4 py-3 text-center">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {activeDim.topDrivers.map((driver) => {
              const isDriverDecline = driver.absoluteChange < 0;
              return (
                <tr key={driver.segment} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-1.5">
                    {driver.segment}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {driver.beforeValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-900 font-semibold">
                    {driver.afterValue.toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      isDriverDecline ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {driver.absoluteChange > 0 ? '+' : ''}
                    {driver.absoluteChange.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-black border border-indigo-100">
                      {driver.contributionPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        driver.confidence === 'high'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : driver.confidence === 'medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {driver.confidence}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
