import React from 'react';
import { MetricDecompositionResult } from '../../services/rootCause/types';
import { Calculator, ArrowRight, TrendingUp, TrendingDown, Layers, Sparkles } from 'lucide-react';

interface MetricDecompositionViewProps {
  decompositions: MetricDecompositionResult[];
}

export const MetricDecompositionView: React.FC<MetricDecompositionViewProps> = ({
  decompositions,
}) => {
  if (!decompositions || decompositions.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Mathematical Metric Decomposition
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Decomposing the primary metric into underlying mathematical component forces
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {decompositions.map((decomp, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4"
          >
            {/* Formula Expression Title */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="px-3 py-1 rounded-xl bg-white border border-slate-200 font-mono text-xs font-black text-slate-800 shadow-2xs">
                {decomp.formulaExpression}
              </div>
              <span className="text-xs font-bold text-slate-500">
                Target Shift: <span className={decomp.targetChangePct < 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>{decomp.targetChangePct > 0 ? '+' : ''}{decomp.targetChangePct}%</span>
              </span>
            </div>

            {/* Component Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {decomp.components.map((comp) => {
                const isDec = comp.percentageChange < 0;
                const isPrimary = comp.role === 'primary';
                return (
                  <div
                    key={comp.metricName}
                    className={`p-4 rounded-xl border ${
                      isPrimary
                        ? 'bg-indigo-50/50 border-indigo-200'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                        {comp.friendlyLabel}
                      </span>
                      {comp.percentageChange !== 0 && (
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center ${
                            isDec ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {isDec ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <span
                        className={`text-xl font-black ${
                          isDec ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {comp.percentageChange > 0 ? '+' : ''}
                        {comp.percentageChange}%
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {comp.beforeValue.toLocaleString()} → {comp.afterValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Analytical Takeaway Note */}
            <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed font-medium">
              <span className="font-extrabold text-slate-800">Decomposition Insight: </span>
              {decomp.analyticalInsight}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};
