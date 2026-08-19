import React from 'react';
import { Database, FileSpreadsheet, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DatasetSummaryItem } from '../../types/dashboard';

interface DatasetStatusProps {
  datasets: DatasetSummaryItem[];
  onViewDatasets: () => void;
}

export const DatasetStatus: React.FC<DatasetStatusProps> = ({
  datasets,
  onViewDatasets,
}) => {
  const getIcon = (type: DatasetSummaryItem['type']) => {
    switch (type) {
      case 'CSV':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'Excel':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Database':
        return <Database className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Database className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
      
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Your Data
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Connected ingestion pipelines</p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            3 Connected
          </span>
        </div>

        {/* Dataset list */}
        <div className="space-y-2.5 mb-4">
          {datasets.map((ds) => (
            <div
              key={ds.id}
              className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center shadow-2xs">
                  {getIcon(ds.type)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{ds.name}</span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 rounded">
                      {ds.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Updated {ds.lastUpdated} • {ds.rowCount}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ready</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onViewDatasets}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer group"
      >
        <span>View Datasets</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </button>

    </div>
  );
};
