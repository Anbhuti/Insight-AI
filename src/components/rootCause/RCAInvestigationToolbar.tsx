import React from 'react';
import { Dataset } from '../../types/dataset';
import { Anomaly } from '../../types/anomaly';
import { Sparkles, Play, RefreshCw, Layers, Target, AlertTriangle } from 'lucide-react';

interface RCAInvestigationToolbarProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (dataset: Dataset) => void;
  availableMetrics: string[];
  selectedMetric: string;
  onSelectMetric: (metric: string) => void;
  availableAnomalies: Anomaly[];
  selectedAnomalyId: string;
  onSelectAnomalyId: (anomalyId: string) => void;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
}

export const RCAInvestigationToolbar: React.FC<RCAInvestigationToolbarProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  availableMetrics,
  selectedMetric,
  onSelectMetric,
  availableAnomalies,
  selectedAnomalyId,
  onSelectAnomalyId,
  isAnalyzing,
  onRunAnalysis,
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Dataset & Metric Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {/* Dataset Selector */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              Target Dataset
            </label>
            <select
              value={selectedDataset?.datasetId || ''}
              onChange={(e) => {
                const found = datasets.find((d) => d.datasetId === e.target.value);
                if (found) onSelectDataset(found);
              }}
              disabled={isAnalyzing || datasets.length === 0}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              {datasets.length === 0 ? (
                <option value="">No datasets available</option>
              ) : (
                datasets.map((d) => (
                  <option key={d.datasetId} value={d.datasetId}>
                    {d.name} ({d.rowCount || 0} rows)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Metric Selector */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              Investigate Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => onSelectMetric(e.target.value)}
              disabled={isAnalyzing || availableMetrics.length === 0}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              {availableMetrics.length === 0 ? (
                <option value="">No numeric metrics found</option>
              ) : (
                availableMetrics.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Anomaly Link Selector (Optional) */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              Link to Detected Anomaly
            </label>
            <select
              value={selectedAnomalyId}
              onChange={(e) => onSelectAnomalyId(e.target.value)}
              disabled={isAnalyzing}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">Dataset-wide Period Shift</option>
              {availableAnomalies.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.severity.toUpperCase()}] {a.title.length > 30 ? a.title.substring(0, 28) + '…' : a.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-end">
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing || !selectedDataset || !selectedMetric}
            className="w-full lg:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Investigating Root Cause…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Root Cause Analysis</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
