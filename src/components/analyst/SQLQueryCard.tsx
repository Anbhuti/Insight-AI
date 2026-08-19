import React, { useState } from 'react';
import {
  Code,
  Table,
  Check,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  AlertTriangle,
  Database,
  Layers,
} from 'lucide-react';
import { exportResultToCSV, downloadCSV } from '../../services/sql/queryService';

interface SQLQueryCardProps {
  sql: string;
  columns?: string[];
  rows?: (string | number | boolean | null)[][];
  rowCount?: number;
  executionTimeMs?: number;
  methodology?: string;
  columnsUsed?: string[];
  dataQualityNotes?: string[];
  repairAttempts?: number;
  datasetName?: string;
}

export const SQLQueryCard: React.FC<SQLQueryCardProps> = ({
  sql,
  columns = [],
  rows = [],
  rowCount = 0,
  executionTimeMs = 0,
  methodology,
  columnsUsed = [],
  dataQualityNotes = [],
  repairAttempts = 0,
  datasetName = 'dataset',
}) => {
  const [isSQLExpanded, setIsSQLExpanded] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'sql'>('results');

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const csv = exportResultToCSV({
      columns,
      rows,
      rowCount: rows.length,
      executionTimeMs,
      truncated: false,
    });
    downloadCSV(`${datasetName.toLowerCase().replace(/\s+/g, '_')}_query_result`, csv);
  };

  return (
    <div
      id="sql-query-card"
      className="my-3 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-900/95 text-slate-100 shadow-sm"
    >
      {/* Query Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-5 items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-300">
            <Database className="h-3 w-3" />
            SQL Engine
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="h-3 w-3" />
            {executionTimeMs}ms
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300 font-medium">
            {rowCount.toLocaleString()} {rowCount === 1 ? 'row' : 'rows'} calculated
          </span>
          {repairAttempts > 0 && (
            <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300">
              <Sparkles className="h-2.5 w-2.5" />
              Auto-repaired ({repairAttempts})
            </span>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5">
          <button
            id="tab-results-btn"
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
              activeTab === 'results'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Table className="h-3 w-3" />
            Results ({rowCount})
          </button>
          <button
            id="tab-sql-btn"
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
              activeTab === 'sql'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Code className="h-3 w-3" />
            SQL Query
          </button>
          {rows.length > 0 && (
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              title="Export query results as CSV"
              className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
          )}
        </div>
      </div>

      {/* SQL Tab Content */}
      {activeTab === 'sql' && (
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Executed SQL Statement
            </span>
            <button
              id="copy-sql-btn"
              onClick={handleCopySQL}
              className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy Query'}
            </button>
          </div>

          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs leading-relaxed text-indigo-200">
            <code>{sql}</code>
          </pre>

          {methodology && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-800/60 p-2.5 text-xs text-slate-300">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
              <div>
                <span className="font-medium text-slate-200">Methodology: </span>
                {methodology}
              </div>
            </div>
          )}

          {columnsUsed.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span className="text-slate-500">Columns used:</span>
              {columnsUsed.map((col, idx) => (
                <span
                  key={idx}
                  className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300"
                >
                  {col}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results Tab Content */}
      {activeTab === 'results' && (
        <div className="p-0">
          {rows.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching records returned by this query.
            </div>
          ) : (
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-950/90 text-slate-400 backdrop-blur-sm">
                  <tr>
                    <th className="w-8 border-b border-slate-800 px-3 py-2 text-center text-[10px] text-slate-500">
                      #
                    </th>
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        className="border-b border-slate-800 px-3 py-2 font-medium text-slate-300"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40">
                      <td className="px-3 py-1.5 text-center text-[10px] text-slate-500">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => {
                        const isNum = typeof cell === 'number';
                        return (
                          <td
                            key={cIdx}
                            className={`whitespace-nowrap px-3 py-1.5 ${
                              isNum ? 'text-right text-emerald-300' : 'text-left'
                            }`}
                          >
                            {cell === null || cell === undefined ? (
                              <span className="italic text-slate-500">null</span>
                            ) : isNum ? (
                              cell.toLocaleString(undefined, { maximumFractionDigits: 2 })
                            ) : (
                              String(cell)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Data Quality Notes if present */}
      {dataQualityNotes.length > 0 && (
        <div className="border-t border-slate-800 bg-amber-950/20 px-4 py-2 text-[11px] text-amber-200/90">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span>Dataset Quality Advisory:</span>
          </div>
          <p className="mt-0.5 text-amber-300/80">{dataQualityNotes[0]}</p>
        </div>
      )}
    </div>
  );
};
