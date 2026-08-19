import React from 'react';
import { Sparkles, ArrowRight, Clock, Zap } from 'lucide-react';
import { RecentInsight } from '../../types/dashboard';

interface RecentInsightsProps {
  insights: RecentInsight[];
  onViewAnalysis: (insight: RecentInsight) => void;
}

export const RecentInsights: React.FC<RecentInsightsProps> = ({
  insights,
  onViewAnalysis,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Recent Insights
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Automated pattern detections & observations</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
          Demo insights
        </span>
      </div>

      {/* Grid of Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-200 bg-slate-50/40 hover:bg-white transition-all flex flex-col justify-between group shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ins.badgeColor}`}
                >
                  {ins.category}
                </span>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {ins.timestamp}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                {ins.title}
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-3">
                {ins.description}
              </p>
            </div>

            <button
              onClick={() => onViewAnalysis(ins)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 group/btn cursor-pointer mt-auto pt-2 border-t border-slate-100"
            >
              <span>View Analysis</span>
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
