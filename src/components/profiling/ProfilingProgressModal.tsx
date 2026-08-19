import React from 'react';
import { ProfilingProgressUpdate } from '../../types/dataProfile';
import {
  Sparkles,
  Search,
  Sliders,
  AlertCircle,
  Database,
  CheckCircle2,
  Cpu,
  Layers,
  Loader2,
} from 'lucide-react';

interface ProfilingProgressModalProps {
  isOpen: boolean;
  progress: ProfilingProgressUpdate;
  datasetName: string;
}

export const ProfilingProgressModal: React.FC<ProfilingProgressModalProps> = ({
  isOpen,
  progress,
  datasetName,
}) => {
  if (!isOpen) return null;

  const steps = [
    { key: 'reading', label: '1. Ingesting Records', desc: 'Parsing rows and headers' },
    { key: 'detecting_types', label: '2. Schema Inferences', desc: 'Detecting data types & formats' },
    { key: 'calculating_stats', label: '3. Statistical Distributions', desc: 'Mean, median, percentiles & ranges' },
    { key: 'checking_missing', label: '4. Cell Completeness', desc: 'Analyzing nulls & empty cells' },
    { key: 'checking_duplicates', label: '5. Row Duplications', desc: 'Detecting repeated records' },
    { key: 'detecting_outliers', label: '6. Outlier Boundaries', desc: '1.5× IQR boundary analysis' },
    { key: 'evaluating_quality', label: '7. Quality Scoring', desc: 'Generating 0–100 composite score' },
  ];

  const getStepStatus = (index: number) => {
    const currentPercent = progress.percentage;
    const stepThresholds = [15, 35, 50, 65, 75, 85, 95];
    if (currentPercent >= stepThresholds[index] + 10) return 'completed';
    if (currentPercent >= stepThresholds[index] - 15) return 'active';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              InsightAI Data Profiling Engine
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Profiling Dataset
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate max-w-xs">
              {datasetName}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>{progress.message || 'Analyzing data structures...'}</span>
            <span className="text-indigo-600 font-extrabold">{progress.percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Multi-step list */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2.5">
          {steps.map((s, idx) => {
            const status = getStepStatus(idx);
            return (
              <div
                key={s.key}
                className={`flex items-center justify-between text-xs transition-opacity duration-200 ${
                  status === 'completed'
                    ? 'text-slate-800'
                    : status === 'active'
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : status === 'active' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span>{s.label}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                  {s.desc}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <p className="text-[11px] text-slate-400 text-center font-medium">
          Profiling executes deterministically and is read-only. Your raw dataset is never altered.
        </p>

      </div>
    </div>
  );
};
