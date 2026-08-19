import React from 'react';
import { CorrelationResult } from '../../services/rootCause/types';
import { Network, AlertCircle, Info, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface CorrelationMatrixViewProps {
  correlations: CorrelationResult[];
  targetMetric: string;
}

export const CorrelationMatrixView: React.FC<CorrelationMatrixViewProps> = ({
  correlations,
  targetMetric,
}) => {
  if (!correlations || correlations.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Metric Correlation Analysis
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Pearson linear correlation coefficients between <span className="font-bold text-slate-700">{targetMetric}</span> and other numeric indicators
          </p>
        </div>
      </div>

      {/* Mandatory Correlation Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <span className="font-extrabold">Statistical Association Notice: </span>
          <span>
            Correlation measures aligned numerical movement across records, but <strong>does not establish causation</strong>. Coinciding movements should be validated with domain context.
          </span>
        </div>
      </div>

      {/* Correlation Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {correlations.map((c) => {
          const isPos = c.pearsonCorrelation > 0;
          const isStrong = c.statisticalStrength === 'strong';
          const isMod = c.statisticalStrength === 'moderate';

          return (
            <div
              key={c.relatedMetric}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {c.relatedMetricLabel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                      isStrong
                        ? 'bg-indigo-100 text-indigo-800'
                        : isMod
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {c.statisticalStrength}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  vs {targetMetric}
                </p>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-slate-200/50">
                <div className="flex items-center gap-1">
                  {c.direction === 'positive' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  ) : c.direction === 'negative' ? (
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Minus className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm font-black text-slate-900 font-mono">
                    r = {c.pearsonCorrelation > 0 ? '+' : ''}
                    {c.pearsonCorrelation}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {c.sampleSize} pairs
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
