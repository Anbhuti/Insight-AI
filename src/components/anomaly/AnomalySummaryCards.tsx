import React from 'react';
import { AnomalyScanSummary } from '../../types/anomaly';
import { AlertCircle, AlertTriangle, Activity, ShieldAlert, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface AnomalySummaryCardsProps {
  summary: AnomalyScanSummary | null;
  isScanning: boolean;
}

export const AnomalySummaryCards: React.FC<AnomalySummaryCardsProps> = ({ summary, isScanning }) => {
  if (!summary) return null;

  const total = summary.anomaliesFound;
  const critical = summary.criticalCount;
  const high = summary.highCount;
  const medium = summary.mediumCount;
  const activeCount = summary.anomalies.filter((a) => a.status === 'active').length;
  const resolvedCount = summary.anomalies.filter((a) => a.status === 'resolved').length;

  // Compute max variance
  let maxDeviation = 0;
  summary.anomalies.forEach((a) => {
    if (Math.abs(a.deviationPercentage) > Math.abs(maxDeviation)) {
      maxDeviation = a.deviationPercentage;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Anomalies Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Anomalies
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isScanning ? '...' : total}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            across {summary.totalRowsScanned.toLocaleString()} rows
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px]">
          <span className="text-slate-500 font-medium">
            {activeCount} active · {resolvedCount} resolved
          </span>
        </div>
      </div>

      {/* 2. Critical & High Priority Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
            Critical Outliers
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">
            {isScanning ? '...' : critical}
          </span>
          <span className="text-xs text-rose-700/80 font-semibold">
            {critical > 0 ? 'High Impact' : 'No Critical Alerts'}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {high} High Severity
          </span>
          <span className="px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {medium} Medium
          </span>
        </div>
      </div>

      {/* 3. Max Volatility / Deviation Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Peak Deviation
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isScanning ? '...' : `${maxDeviation > 0 ? '+' : ''}${maxDeviation.toFixed(1)}%`}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            max variance
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Calculated via Z-Score & IQR</span>
        </div>
      </div>

      {/* 4. Engine Health & Status */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Surveillance Status
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            Statistical Engine Live
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Scan Time: {summary.scanDurationMs}ms</span>
          </span>
          <span className="capitalize font-medium text-slate-600">
            {summary.config.sensitivity} Mode
          </span>
        </div>
      </div>
    </div>
  );
};
