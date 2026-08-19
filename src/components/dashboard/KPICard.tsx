import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardKPI } from '../../types/dashboard';

interface KPICardProps {
  kpi: DashboardKPI;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  const { title, value, change, isPositive, comparisonLabel, sparkline } = kpi;

  // Compute mini SVG sparkline path
  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline);
  const range = max - min || 1;
  const width = 80;
  const height = 28;

  const points = sparkline
    .map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-200/90 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
            isPositive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-emerald-600" />
          ) : (
            <TrendingDown className="w-3 h-3 text-rose-600" />
          )}
          <span>{change}</span>
        </div>
      </div>

      {/* Main Metric Value & Sparkline */}
      <div className="flex items-end justify-between gap-2 mt-1">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {comparisonLabel}
          </p>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="shrink-0 pb-1">
          <svg
            width={width}
            height={height}
            className="overflow-visible"
            aria-hidden="true"
          >
            <polyline
              fill="none"
              stroke={isPositive ? '#10b981' : '#f43f5e'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            {/* Sparkline Gradient fill */}
            <polygon
              fill={isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)'}
              points={`0,${height} ${points} ${width},${height}`}
            />
          </svg>
        </div>
      </div>

    </div>
  );
};
