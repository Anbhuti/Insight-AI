import React, { useState } from 'react';
import { Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { RevenueDataPoint, RevenueSummaryData } from '../../types/dashboard';

interface RevenueChartProps {
  data: RevenueDataPoint[];
  summary: RevenueSummaryData;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, summary }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(data.length - 2); // default hover near end

  // Dimensions for SVG line calculation
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 30;
  const paddingY = 25;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Max and min calculation
  const allValues = [
    ...data.map((d) => d.currentRevenue),
    ...data.map((d) => d.previousRevenue),
  ];
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.05;
  const valRange = maxVal - minVal || 1;

  // Generate path points
  const currentPoints = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - ((d.currentRevenue - minVal) / valRange) * chartHeight;
    return { x, y, data: d };
  });

  const previousPoints = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - ((d.previousRevenue - minVal) / valRange) * chartHeight;
    return { x, y, data: d };
  });

  const currentPathD = currentPoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ''
  );

  const previousPathD = previousPoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ''
  );

  const currentAreaD = `${currentPathD} L ${currentPoints[currentPoints.length - 1].x},${
    paddingY + chartHeight
  } L ${currentPoints[0].x},${paddingY + chartHeight} Z`;

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];
  const activeCurrentPos = hoveredIndex !== null ? currentPoints[hoveredIndex] : currentPoints[currentPoints.length - 1];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
      
      {/* Header with Title and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Revenue Performance
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Revenue trend over the selected period.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-indigo-600"></span>
            <span>Current Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-slate-300"></span>
            <span className="text-slate-400">Previous Period</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative mt-4 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-56 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="currentRevenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid horizontal lines */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = paddingY + chartHeight * pct;
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Previous Period Line (Dashed) */}
          <path
            d={previousPathD}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeDasharray="4,4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Period Area Gradient */}
          <path d={currentAreaD} fill="url(#currentRevenueGradient)" />

          {/* Current Period Main Line */}
          <path
            d={currentPathD}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Vertical Guideline & Dots */}
          {hoveredIndex !== null && (
            <>
              <line
                x1={activeCurrentPos.x}
                y1={paddingY}
                x2={activeCurrentPos.x}
                y2={paddingY + chartHeight}
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="3,3"
                opacity="0.7"
              />
              <circle
                cx={activeCurrentPos.x}
                cy={activeCurrentPos.y}
                r="5"
                fill="#ffffff"
                stroke="#4f46e5"
                strokeWidth="3"
              />
            </>
          )}

          {/* X-axis date labels */}
          {data.map((d, i) => {
            // Show every 3rd or key date
            if (i % 3 !== 0 && i !== data.length - 1) return null;
            const x = paddingX + (i / (data.length - 1)) * chartWidth;
            return (
              <text
                key={d.date}
                x={x}
                y={svgHeight - 4}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-medium font-sans"
              >
                {d.date}
              </text>
            );
          })}

          {/* Invisible Overlay Hit-boxes for mouse hover */}
          {data.map((d, i) => {
            const x = paddingX + (i / (data.length - 1)) * chartWidth;
            const hitWidth = chartWidth / (data.length - 1);
            return (
              <rect
                key={d.date}
                x={x - hitWidth / 2}
                y={0}
                width={hitWidth}
                height={svgHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
              />
            );
          })}
        </svg>

        {/* Polished Floating Hover Tooltip */}
        {activePoint && hoveredIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none transition-all duration-150 bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl border border-slate-800"
            style={{
              left: `${Math.min(Math.max((activeCurrentPos.x / svgWidth) * 100, 15), 85)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-1 mb-1 flex items-center justify-between gap-3">
              <span>{activePoint.date}</span>
              <span className="text-[10px] text-indigo-400 font-normal">Details</span>
            </div>
            <div className="space-y-0.5 font-medium">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Revenue:</span>
                <span className="font-bold text-emerald-400">{activePoint.currentRevenueFormatted}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Orders:</span>
                <span className="font-bold text-white">{activePoint.orders}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Summary Section */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 p-3.5 rounded-xl">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current</p>
            <p className="text-base font-extrabold text-slate-900">{summary.currentTotal}</p>
          </div>
          <div className="h-7 w-px bg-slate-200"></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Previous</p>
            <p className="text-base font-extrabold text-slate-600">{summary.previousTotal}</p>
          </div>
          <div className="h-7 w-px bg-slate-200"></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Growth</p>
            <p className="text-base font-extrabold text-emerald-600">{summary.growthPct}</p>
          </div>
        </div>

        {/* AI Observation Callout */}
        <div className="flex items-start gap-2 max-w-md bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-700 leading-snug">
              {summary.observation}
            </p>
            <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              Demo insight
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
