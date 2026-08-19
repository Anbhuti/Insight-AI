import React from 'react';
import { Sparkles, UploadCloud, FileText, Bell } from 'lucide-react';

interface QuickActionsProps {
  onAskInsightAI: () => void;
  onUploadDataset?: () => void;
  onViewReports?: () => void;
  onViewAlerts?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAskInsightAI,
  onUploadDataset,
  onViewReports,
  onViewAlerts,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 leading-tight">
          Quick Actions
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">Common workflows</span>
      </div>

      {/* Action buttons grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Ask InsightAI */}
        <button
          onClick={onAskInsightAI}
          className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-900 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-center">Ask InsightAI</span>
        </button>

        {/* 2. Upload Dataset */}
        <button
          onClick={onUploadDataset}
          className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-900 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <UploadCloud className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-center">Upload Dataset</span>
        </button>

        {/* 3. Reports */}
        <button
          onClick={onViewReports}
          className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-center">Executive Reports</span>
        </button>

        {/* 4. Alerts & Monitoring (Phase 13) */}
        <button
          onClick={onViewAlerts}
          className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/60 hover:bg-rose-100/70 text-rose-900 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <Bell className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-center">Alert Engine</span>
        </button>
      </div>
    </div>
  );
};
