import React, { useState } from 'react';
import { DataIssue, IssueSeverity } from '../../types/dataProfile';
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Filter,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

interface DataIssuesListProps {
  issues: DataIssue[];
  onSelectColumn?: (columnName: string) => void;
}

export const DataIssuesList: React.FC<DataIssuesListProps> = ({
  issues,
  onSelectColumn,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredIssues = issues.filter((issue) => {
    if (filterSeverity === 'all') return true;
    return issue.severity === filterSeverity;
  });

  const getSeverityBadge = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
          label: 'Critical',
        };
      case 'high':
        return {
          badge: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          label: 'High',
        };
      case 'medium':
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
          label: 'Medium',
        };
      case 'low':
        return {
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Info className="w-4 h-4 text-blue-600" />,
          label: 'Low',
        };
      case 'info':
      default:
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          label: 'Info',
        };
    }
  };

  const counts = {
    all: issues.length,
    critical: issues.filter((i) => i.severity === 'critical').length,
    high: issues.filter((i) => i.severity === 'high').length,
    medium: issues.filter((i) => i.severity === 'medium').length,
    low: issues.filter((i) => i.severity === 'low').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Data Quality Findings & Recommendations</span>
            <span className="text-xs font-normal text-slate-400">({issues.length})</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Rule-based diagnostic signals evaluated during statistical profiling.
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterSeverity === 'all'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            All ({counts.all})
          </button>
          {counts.critical > 0 && (
            <button
              onClick={() => setFilterSeverity('critical')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterSeverity === 'critical'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              Critical ({counts.critical})
            </button>
          )}
          {counts.high > 0 && (
            <button
              onClick={() => setFilterSeverity('high')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterSeverity === 'high'
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'text-orange-600 hover:bg-orange-50'
              }`}
            >
              High ({counts.high})
            </button>
          )}
          {counts.medium > 0 && (
            <button
              onClick={() => setFilterSeverity('medium')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterSeverity === 'medium'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
            >
              Medium ({counts.medium})
            </button>
          )}
          {counts.low > 0 && (
            <button
              onClick={() => setFilterSeverity('low')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterSeverity === 'low'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              Low ({counts.low})
            </button>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-100">
            No issues matching the selected severity level.
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const badge = getSeverityBadge(issue.severity);
            return (
              <div
                key={issue.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{badge.icon}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.badge}`}
                        >
                          {badge.label}
                        </span>
                        {issue.column && (
                          <button
                            onClick={() => onSelectColumn?.(issue.column!)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline transition-colors cursor-pointer"
                          >
                            Column: {issue.column}
                          </button>
                        )}
                        <h4 className="text-xs font-bold text-slate-900">
                          {issue.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>
                  </div>

                  {issue.affectedPercentage !== undefined && (
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200/80 shrink-0">
                      {issue.affectedPercentage}% affected
                    </span>
                  )}
                </div>

                {/* Recommendation Box */}
                <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 flex items-start gap-2 text-xs">
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-indigo-950 font-medium">
                    <span className="font-bold text-indigo-900">Recommendation: </span>
                    {issue.recommendation}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
