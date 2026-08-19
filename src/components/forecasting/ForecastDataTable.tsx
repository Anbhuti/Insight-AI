import React, { useState } from 'react';
import {
  Download,
  Calendar,
  Table,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { ForecastResult } from '../../services/forecasting/forecastTypes';
import { exportForecastToCSV } from '../../services/forecasting/forecastingService';

interface ForecastDataTableProps {
  forecast: ForecastResult;
}

export const ForecastDataTable: React.FC<ForecastDataTableProps> = ({ forecast }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'forecast_only' | 'historical_only'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { historicalSeries, forecastSeries, config } = forecast;

  // Flatten table items
  const allRows = [
    ...historicalSeries.map((h) => ({
      date: h.date,
      type: 'Historical' as const,
      value: h.value,
      lower: null as number | null,
      upper: null as number | null,
      optimistic: null as number | null,
      conservative: null as number | null,
      isImputed: h.isImputed,
      isOutlier: h.isOutlier,
    })),
    ...forecastSeries.map((f) => ({
      date: f.date,
      type: 'Forecast' as const,
      value: f.prediction,
      lower: f.lowerBound,
      upper: f.upperBound,
      optimistic: f.optimisticScenario || null,
      conservative: f.conservativeScenario || null,
      isImputed: false,
      isOutlier: false,
    })),
  ];

  const filteredRows = allRows.filter((r) => {
    if (filterMode === 'forecast_only') return r.type === 'Forecast';
    if (filterMode === 'historical_only') return r.type === 'Historical';
    return true;
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCSV = () => {
    const csvContent = exportForecastToCSV(forecast);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `forecast_${forecast.config.metricColumn.toLowerCase()}_${forecast.config.horizon}${forecast.config.frequency}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Detailed Data Points & Projections
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full record of historical actuals and generated prediction intervals
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Filter tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
            <button
              onClick={() => {
                setFilterMode('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allRows.length})
            </button>
            <button
              onClick={() => {
                setFilterMode('forecast_only');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                filterMode === 'forecast_only'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Forecast ({forecastSeries.length})
            </button>
            <button
              onClick={() => {
                setFilterMode('historical_only');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                filterMode === 'historical_only'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Historical ({historicalSeries.length})
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3.5 rounded-l-xl">Period / Date</th>
              <th className="py-3 px-3.5">Record Type</th>
              <th className="py-3 px-3.5 text-right">{config.metricColumn} Value</th>
              <th className="py-3 px-3.5 text-right">Lower Bound ({config.confidenceLevel}%)</th>
              <th className="py-3 px-3.5 text-right">Upper Bound ({config.confidenceLevel}%)</th>
              <th className="py-3 px-3.5 text-right">Optimistic</th>
              <th className="py-3 px-3.5 text-right rounded-r-xl">Conservative</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {paginatedRows.map((row, idx) => {
              const isForecast = row.type === 'Forecast';
              return (
                <tr
                  key={`${row.date}_${idx}`}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isForecast ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{row.date}</span>
                    {row.isImputed && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Imputed
                      </span>
                    )}
                    {row.isOutlier && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Outlier
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        isForecast
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                    {row.value.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-500">
                    {row.lower !== null ? row.lower.toLocaleString() : '—'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-500">
                    {row.upper !== null ? row.upper.toLocaleString() : '—'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-emerald-600">
                    {row.optimistic !== null ? row.optimistic.toLocaleString() : '—'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-amber-600">
                    {row.conservative !== null ? row.conservative.toLocaleString() : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} points
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
