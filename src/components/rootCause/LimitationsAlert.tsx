import React from 'react';
import { RCALimitation } from '../../services/rootCause/types';
import { AlertTriangle, Compass, CheckCircle2, Search } from 'lucide-react';

interface LimitationsAlertProps {
  limitations: RCALimitation[];
  recommendedInvestigations: string[];
  onOpenSQLWorkspace?: () => void;
  onOpenAIAnalyst?: () => void;
}

export const LimitationsAlert: React.FC<LimitationsAlertProps> = ({
  limitations,
  recommendedInvestigations,
  onOpenSQLWorkspace,
  onOpenAIAnalyst,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* LEFT: Dataset Limitations & Unobserved Variables */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Dataset Limitations & Unobserved Factors
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Enterprise Integrity
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          The following external and internal dimensions were not captured in this dataset, precluding direct causal confirmation for these specific areas:
        </p>

        <div className="space-y-3">
          {limitations.map((lim, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-1"
            >
              <div className="text-xs font-black text-amber-950">
                {lim.title}
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {lim.description}
              </p>
              {lim.impact && (
                <div className="text-[11px] text-amber-800 font-semibold pt-1">
                  Impact: {lim.impact}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Recommended Investigation Next Steps */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Recommended Investigation Actions
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Action Plan
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {recommendedInvestigations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
          {onOpenSQLWorkspace && (
            <button
              onClick={onOpenSQLWorkspace}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Query in SQL Workspace
            </button>
          )}
          {onOpenAIAnalyst && (
            <button
              onClick={onOpenAIAnalyst}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              Ask AI Analyst
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
