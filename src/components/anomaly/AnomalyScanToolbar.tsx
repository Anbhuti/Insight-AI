import React from 'react';
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
} from 'lucide-react';
import {
  AnomalyFilterOptions,
  AnomalySensitivity,
  AnomalySeverity,
  DetectionMethod,
} from '../../types/anomaly';
import { Dataset } from '../../types/dataset';

interface AnomalyScanToolbarProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (dataset: Dataset) => void;
  filters: AnomalyFilterOptions;
  onFilterChange: (filters: AnomalyFilterOptions) => void;
  sensitivity: AnomalySensitivity;
  onSensitivityChange: (sensitivity: AnomalySensitivity) => void;
  onRunScan: () => void;
  isScanning: boolean;
  onOpenSettings: () => void;
  availableColumns: string[];
}

export const AnomalyScanToolbar: React.FC<AnomalyScanToolbarProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  filters,
  onFilterChange,
  sensitivity,
  onSensitivityChange,
  onRunScan,
  isScanning,
  onOpenSettings,
  availableColumns,
}) => {
  const severities: { label: string; value: AnomalySeverity | 'all'; color: string }[] = [
    { label: 'All Severities', value: 'all', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
    { label: 'Critical', value: 'critical', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
    { label: 'High', value: 'high', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    { label: 'Medium', value: 'medium', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { label: 'Low', value: 'low', color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
  ];

  const methods: { label: string; value: DetectionMethod | 'all' }[] = [
    { label: 'All Methods', value: 'all' },
    { label: 'Z-Score (Gaussian)', value: 'z_score' },
    { label: 'IQR (Quartiles)', value: 'iqr' },
    { label: 'MAD (Robust)', value: 'mad' },
    { label: 'Rolling Window', value: 'rolling_window' },
    { label: '% Variance Shift', value: 'pct_change' },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Top Row: Dataset Selection & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        
        {/* Dataset Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Active Dataset:
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedDataset?.datasetId || ''}
              onChange={(e) => {
                const ds = datasets.find((d) => d.datasetId === e.target.value);
                if (ds) onSelectDataset(ds);
              }}
              disabled={isScanning || datasets.length === 0}
              className="px-3.5 py-2 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
            >
              {datasets.length === 0 ? (
                <option value="">No datasets available</option>
              ) : (
                datasets.map((d) => (
                  <option key={d.datasetId} value={d.datasetId}>
                    {d.name} ({d.rowCount?.toLocaleString()} rows)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Sensitivity Preset Quick Switch */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <span className="text-[10px] text-slate-400 px-2 uppercase tracking-wider">Sensitivity:</span>
            {(['conservative', 'standard', 'aggressive'] as AnomalySensitivity[]).map((sens) => (
              <button
                key={sens}
                onClick={() => onSensitivityChange(sens)}
                disabled={isScanning}
                className={`px-2.5 py-1 rounded-lg transition-all capitalize cursor-pointer text-xs ${
                  sensitivity === sens
                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                    : 'hover:text-slate-900 text-slate-600'
                }`}
              >
                {sens}
              </button>
            ))}
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSettings}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Thresholds</span>
          </button>

          <button
            onClick={onRunScan}
            disabled={isScanning || !selectedDataset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Computing Outliers...' : 'Run Detection Scan'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Search, Severity Filter Pills, and Dropdowns */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anomalies by metric, dimension, or context..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Severity Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {severities.map((sev) => {
            const isActive = filters.severity === sev.value;
            return (
              <button
                key={sev.value}
                onClick={() => onFilterChange({ ...filters, severity: sev.value })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : `${sev.color} border-transparent`
                }`}
              >
                {sev.label}
              </button>
            );
          })}
        </div>

        {/* Method & Column Selectors */}
        <div className="flex items-center gap-2">
          {/* Method Filter */}
          <select
            value={filters.method}
            onChange={(e) => onFilterChange({ ...filters, method: e.target.value as any })}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {methods.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Target Column Filter */}
          {availableColumns.length > 0 && (
            <select
              value={filters.column}
              onChange={(e) => onFilterChange({ ...filters, column: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[160px] truncate"
            >
              <option value="all">All Columns</option>
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          )}
        </div>

      </div>
    </div>
  );
};
