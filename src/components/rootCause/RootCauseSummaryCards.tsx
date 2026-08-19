import React from 'react';
import { RCAResult } from '../../services/rootCause/types';
import {
  TrendingDown,
  TrendingUp,
  Target,
  Layers,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface RootCauseSummaryCardsProps {
  rca: RCAResult | null;
  isAnalyzing: boolean;
}

export const RootCauseSummaryCards: React.FC<RootCauseSummaryCardsProps> = ({
  rca,
  isAnalyzing,
}) => {
  if (isAnalyzing) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs animate-pulse space-y-3"
          >
            <div className="h-4 bg-slate-100 rounded w-1/2" />
            <div className="h-7 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!rca) return null;

  const p = rca.periodComparison;
  const isDecline = p.percentageChange < 0;
  const top = rca.topDrivers[0];

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ShieldCheck,
          label: 'High Confidence',
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: ShieldCheck,
          label: 'Moderate Evidence',
        };
      case 'low':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: ShieldAlert,
          label: 'Low Sample Size',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: HelpCircle,
          label: 'Insufficient Evidence',
        };
    }
  };

  const conf = getConfidenceBadge(rca.overallConfidenceLevel);
  const ConfIcon = conf.icon;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Target Metric Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Target Metric
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-extrabold text-slate-900 truncate">
            {rca.targetMetricLabel || rca.targetMetric}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            Dataset: <span className="font-semibold text-slate-700">{rca.datasetName}</span>
          </p>
        </div>
      </div>

      {/* 2. Observed Shift Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Observed Shift
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDecline ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {isDecline ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                isDecline ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {p.percentageChange > 0 ? '+' : ''}
              {p.percentageChange}%
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({p.absoluteChange > 0 ? '+' : ''}
              {p.absoluteChange.toLocaleString()})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {p.sampleSizeBefore + p.sampleSizeAfter} total baseline records
          </p>
        </div>
      </div>

      {/* 3. Top Observed Driver */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Top Observed Driver
          </span>
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          {top ? (
            <>
              <div className="text-lg font-extrabold text-slate-900 truncate">
                {top.segment}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-bold">
                  {top.contributionPct}% Contrib
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  in {top.dimension}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">No dominant single driver</p>
          )}
        </div>
      </div>

      {/* 4. Evidence Confidence */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Evidence Confidence
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <ConfIcon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-black border ${conf.bg}`}
            >
              {conf.label}
            </span>
            <span className="text-xs font-bold text-slate-600">
              {Math.round(rca.overallConfidenceScore * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 truncate">
            Based on data completeness & bounds
          </p>
        </div>
      </div>
    </div>
  );
};
