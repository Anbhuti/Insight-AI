import React from 'react';
import { DataQualitySummary, QualityGrade } from '../../types/dataProfile';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface QualityScoreGaugeProps {
  quality: DataQualitySummary;
  onViewIssues?: () => void;
}

export const QualityScoreGauge: React.FC<QualityScoreGaugeProps> = ({
  quality,
  onViewIssues,
}) => {
  const getGradeColor = (grade: QualityGrade) => {
    switch (grade) {
      case 'Excellent':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badge: 'bg-emerald-500 text-white',
          ring: 'text-emerald-500',
          gradient: 'from-emerald-500 to-teal-600',
          text: 'text-emerald-600',
        };
      case 'Good':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          badge: 'bg-indigo-600 text-white',
          ring: 'text-indigo-600',
          gradient: 'from-indigo-500 to-blue-600',
          text: 'text-indigo-600',
        };
      case 'Fair':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'bg-amber-500 text-white',
          ring: 'text-amber-500',
          gradient: 'from-amber-400 to-orange-500',
          text: 'text-amber-600',
        };
      case 'Poor':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          badge: 'bg-orange-600 text-white',
          ring: 'text-orange-600',
          gradient: 'from-orange-500 to-rose-500',
          text: 'text-orange-600',
        };
      case 'Critical':
      default:
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          badge: 'bg-rose-600 text-white',
          ring: 'text-rose-600',
          gradient: 'from-rose-500 to-red-600',
          text: 'text-rose-600',
        };
    }
  };

  const colors = getGradeColor(quality.grade);
  const score = quality.overallScore;

  // SVG circular gauge math
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        
        {/* Left: Big Score & Gauge */}
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 110 110">
              <circle
                cx="55"
                cy="55"
                r={radius}
                className="text-slate-100"
                strokeWidth="9"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="55"
                cy="55"
                r={radius}
                className={`${colors.ring} transition-all duration-1000 ease-out`}
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                {score}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Score / 100
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${colors.badge}`}
              >
                {quality.grade} Quality
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {quality.cleanColumnsCount} of {quality.totalColumns} clean columns
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {score >= 90
                ? 'Production-Ready Dataset'
                : score >= 75
                ? 'High Quality with Minor Discrepancies'
                : score >= 60
                ? 'Moderate Quality — Review Recommended'
                : 'Attention Required Prior to Modeling'}
            </h3>

            <p className="text-xs text-slate-500 font-medium max-w-md leading-relaxed">
              {score >= 85
                ? 'This dataset exhibits high cell completeness, consistent inferred types, and low duplication.'
                : 'Identified areas for data quality improvement across missingness, formatting, or potential outliers.'}
            </p>
          </div>
        </div>

        {/* Right: Dimension Breakdown Bars */}
        <div className="flex-1 max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          
          {/* Missing Values Score (35%) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Completeness</span>
                <span className="text-[10px] text-slate-400 font-normal">(35%)</span>
              </span>
              <span className="font-bold text-slate-900">{quality.breakdown.missingValuesScore}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${quality.breakdown.missingValuesScore}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              {quality.missingCellsPercentage}% cells missing ({quality.missingCellsTotal.toLocaleString()})
            </span>
          </div>

          {/* Duplicates Score (20%) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Uniqueness</span>
                <span className="text-[10px] text-slate-400 font-normal">(20%)</span>
              </span>
              <span className="font-bold text-slate-900">{quality.breakdown.duplicatesScore}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${quality.breakdown.duplicatesScore}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              {quality.duplicateRowsPercentage}% duplicate rows ({quality.duplicateRowsTotal.toLocaleString()})
            </span>
          </div>

          {/* Type Consistency (20%) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Type Consistency</span>
                <span className="text-[10px] text-slate-400 font-normal">(20%)</span>
              </span>
              <span className="font-bold text-slate-900">{quality.breakdown.typeConsistencyScore}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${quality.breakdown.typeConsistencyScore}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              Deterministic schema resolution
            </span>
          </div>

          {/* Critical Issues & Usability (25%) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Usability & Outliers</span>
                <span className="text-[10px] text-slate-400 font-normal">(25%)</span>
              </span>
              <span className="font-bold text-slate-900">{quality.breakdown.criticalIssuesScore}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${quality.breakdown.criticalIssuesScore}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">
              {quality.issuesCountBySeverity.critical} critical / {quality.issuesCountBySeverity.high} high issues
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
