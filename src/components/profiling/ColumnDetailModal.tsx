import React, { useState } from 'react';
import { ColumnProfile } from '../../types/dataProfile';
import {
  X,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Key,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  Percent,
  Layers,
  HelpCircle,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ColumnDetailModalProps {
  column: ColumnProfile | null;
  onClose: () => void;
}

export const ColumnDetailModal: React.FC<ColumnDetailModalProps> = ({
  column,
  onClose,
}) => {
  if (!column) return null;

  const isNumeric =
    column.logicalType === 'numeric' ||
    column.logicalType === 'integer' ||
    column.logicalType === 'decimal';
  const isCategorical = column.logicalType === 'categorical';
  const isText = column.logicalType === 'text';
  const isBoolean = column.logicalType === 'boolean';
  const isDate = column.logicalType === 'date' || column.logicalType === 'datetime';

  const getTypeIcon = () => {
    if (isNumeric) return <Hash className="w-4 h-4 text-blue-600" />;
    if (isDate) return <Calendar className="w-4 h-4 text-purple-600" />;
    if (isBoolean) return <ToggleLeft className="w-4 h-4 text-emerald-600" />;
    return <Type className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
              {getTypeIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {column.logicalType}
                </span>
                {column.isPotentialId && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    <span>Potential ID</span>
                  </span>
                )}
                {column.isConstant && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    Constant
                  </span>
                )}
                {column.isHighCardinality && !column.isPotentialId && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                    High Cardinality
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                {column.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="text-slate-400 text-[10px] font-semibold block">Total Rows</span>
              <span className="text-sm font-extrabold text-slate-900">
                {column.totalRows.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="text-slate-400 text-[10px] font-semibold block">Missing Values</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-extrabold text-slate-900">
                  {column.missingCount.toLocaleString()}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    column.missingPercentage === 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : column.missingPercentage > 20
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {column.missingPercentage}%
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="text-slate-400 text-[10px] font-semibold block">Distinct Values</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-extrabold text-slate-900">
                  {column.uniqueCount.toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  ({column.uniquePercentage}%)
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="text-slate-400 text-[10px] font-semibold block">Quality Rating</span>
              <span
                className={`inline-block text-xs font-bold capitalize mt-0.5 px-2 py-0.5 rounded-md ${
                  column.qualityRating === 'good'
                    ? 'bg-emerald-50 text-emerald-700'
                    : column.qualityRating === 'fair'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {column.qualityRating}
              </span>
            </div>
          </div>

          {/* 1. NUMERIC SPECIFIC VIEW */}
          {isNumeric && column.numericStats && (
            <div className="space-y-6">
              
              {/* 5-Number Summary & Statistics */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Five-Number Summary & Moments</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block">Minimum</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {column.numericStats.min ?? 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block">25th Percentile (Q1)</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {column.numericStats.percentile25 ?? 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <span className="text-[10px] font-semibold text-indigo-600 block">Median (50th)</span>
                    <span className="font-bold text-indigo-900 text-sm">
                      {column.numericStats.median ?? 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block">75th Percentile (Q3)</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {column.numericStats.percentile75 ?? 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block">Maximum</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {column.numericStats.max ?? 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block">Mean (Average)</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {column.numericStats.mean ?? 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block">Std. Deviation</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {column.numericStats.standardDeviation ?? 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block">IQR (Q3 - Q1)</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {column.numericStats.iqr ?? 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* IQR Outlier Analysis */}
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h5 className="font-bold text-amber-900">
                      1.5× IQR Outlier Detection (Tukey Method)
                    </h5>
                    <p className="text-amber-800 font-medium">
                      Lower Boundary: <span className="font-bold">{column.numericStats.lowerOutlierBound ?? 'N/A'}</span> |
                      Upper Boundary: <span className="font-bold">{column.numericStats.upperOutlierBound ?? 'N/A'}</span>
                    </p>
                    <p className="text-amber-700 text-[11px]">
                      {column.numericStats.outlierCount > 0
                        ? `${column.numericStats.outlierCount.toLocaleString()} values (${column.numericStats.outlierPercentage}%) fall outside standard IQR boundaries.`
                        : 'No statistical outliers detected within standard boundaries.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Histogram Chart */}
              {column.numericStats.histogram && column.numericStats.histogram.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Value Distribution Histogram
                  </h4>
                  <div className="h-48 w-full bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={column.numericStats.histogram}>
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-2 rounded-xl text-xs shadow-xl">
                                  <span className="font-semibold block">{data.label}</span>
                                  <span className="text-indigo-300 font-bold">{data.count} records</span>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 2. CATEGORICAL SPECIFIC VIEW */}
          {isCategorical && column.categoricalStats && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Top Categories & Frequencies
              </h4>

              <div className="space-y-2.5">
                {column.categoricalStats.topValues.map((val, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-800 font-semibold truncate max-w-md">
                        {val.value === '' ? '(Empty String)' : val.value}
                      </span>
                      <span className="text-slate-500 shrink-0">
                        {val.count.toLocaleString()} ({val.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(2, val.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. DATE SPECIFIC VIEW */}
          {isDate && column.dateStats && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Temporal Range & Span
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block">Earliest Timestamp</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {column.dateStats.earliestFormatted || column.dateStats.minDate || 'N/A'}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 block">Latest Timestamp</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {column.dateStats.latestFormatted || column.dateStats.maxDate || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. TEXT SPECIFIC VIEW */}
          {isText && column.textStats && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Text Character Metrics
              </h4>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 block">Avg Length</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {column.textStats.averageLength} chars
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 block">Min Length</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {column.textStats.minLength} chars
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 block">Max Length</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {column.textStats.maxLength} chars
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. BOOLEAN SPECIFIC VIEW */}
          {isBoolean && column.booleanStats && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Boolean Split
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-semibold text-emerald-600 block">True / Yes / 1</span>
                  <span className="font-bold text-emerald-950 text-base">
                    {column.booleanStats.trueCount.toLocaleString()} ({column.booleanStats.truePercentage}%)
                  </span>
                </div>
                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="text-[10px] font-semibold text-rose-600 block">False / No / 0</span>
                  <span className="font-bold text-rose-950 text-base">
                    {column.booleanStats.falseCount.toLocaleString()} ({column.booleanStats.falsePercentage}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sample Values */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Sample Values
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {column.sampleValues && column.sampleValues.length > 0 ? (
                column.sampleValues.map((val, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-mono rounded-lg max-w-xs truncate border border-slate-200/60"
                  >
                    {String(val)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No non-null sample values available</span>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Column Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
