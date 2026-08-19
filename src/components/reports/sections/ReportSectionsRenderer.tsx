import React from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Compass,
  LineChart,
  ShieldCheck,
  CheckSquare,
  Info,
  Table as TableIcon,
  PieChart,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ReportSection } from '../../../services/reports/reportTypes';

interface SectionRendererProps {
  section: ReportSection;
  isEditing?: boolean;
  onUpdateSection?: (updated: ReportSection) => void;
}

export const ReportSectionsRenderer: React.FC<SectionRendererProps> = ({
  section,
  isEditing = false,
  onUpdateSection,
}) => {
  const { type, content, title, subtitle, userNotes } = section;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs transition-all hover:border-slate-300">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>

        {section.sourceTracking && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/70 shrink-0">
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            <span>Verified Grounded</span>
          </span>
        )}
      </div>

      {/* Section Body */}
      {renderSectionBody(type, content)}

      {/* Custom User Notes / Annotations */}
      {(userNotes || isEditing) && (
        <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Analyst Commentary & Context
          </span>
          {isEditing ? (
            <textarea
              value={userNotes || ''}
              onChange={(e) => {
                if (onUpdateSection) {
                  onUpdateSection({ ...section, userNotes: e.target.value });
                }
              }}
              placeholder="Add custom notes, executive context, or instructions for stakeholders..."
              rows={2}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          ) : (
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "{userNotes}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

function renderSectionBody(type: string, content: any) {
  switch (type) {
    case 'executive_summary': {
      const summary = content?.executiveSummary;
      if (!summary) return <p className="text-xs text-slate-400">No summary content.</p>;

      return (
        <div className="space-y-5">
          {/* Main Headline */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-100/80 shadow-2xs">
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Core Strategic Finding</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {summary.headline}
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {summary.overviewNarrative}
            </p>
          </div>

          {/* Key Takeaways & Strategic Implications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Key Takeaways</span>
              </span>
              <ul className="space-y-2 text-xs text-slate-700">
                {summary.keyTakeaways?.map((takeaway: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Strategic Implications</span>
              </span>
              <ul className="space-y-2 text-xs text-slate-700">
                {summary.strategicImplications?.map((imp: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    case 'kpi_overview': {
      const kpis = content?.kpis || [];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi: any) => (
            <div
              key={kpi.id}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 truncate">
                  {kpi.label}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-600 border border-slate-200 shadow-2xs">
                  {kpi.aggregation}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {kpi.formattedValue}
                </span>
                {kpi.percentageChange !== undefined && (
                  <span
                    className={`flex items-center text-xs font-bold ${
                      kpi.percentageChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {kpi.percentageChange >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>{Math.abs(kpi.percentageChange)}%</span>
                  </span>
                )}
              </div>
              {kpi.description && (
                <p className="text-[11px] text-slate-500 truncate">{kpi.description}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    case 'trend_charts': {
      const charts = content?.charts || [];
      if (charts.length === 0) return <p className="text-xs text-slate-400">No chart data.</p>;

      const chart = charts[0];
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{chart.description}</span>
            <span className="font-semibold text-slate-700">{chart.title}</span>
          </div>
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart.data}>
                <defs>
                  <linearGradient id="reportTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey={chart.xAxisKey}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={chart.yAxisKey}
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#reportTrendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    case 'category_breakdown': {
      const charts = content?.charts || [];
      if (charts.length === 0) return <p className="text-xs text-slate-400">No category data.</p>;

      const chart = charts[0];
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{chart.description}</span>
            <span className="font-semibold text-slate-700">{chart.title}</span>
          </div>
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey={chart.xAxisKey}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey={chart.yAxisKey} fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    case 'anomaly_deep_dive': {
      const anom = content?.anomalies;
      if (!anom || !anom.items || anom.items.length === 0) {
        return (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No severe statistical anomalies detected across evaluated baseline periods.</span>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Flagged</span>
              <span className="text-lg font-black text-slate-900">{anom.totalDetected}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/70">
              <span className="text-[10px] font-bold text-rose-600 uppercase block">High Severity</span>
              <span className="text-lg font-black text-rose-700">{anom.highRiskCount}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Metric Column</th>
                  <th className="py-2.5 px-3">Actual Value</th>
                  <th className="py-2.5 px-3">Deviation %</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anom.items.slice(0, 6).map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.column}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.actualValue?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">
                      {item.deviationPercentage > 0 ? `+${item.deviationPercentage}%` : `${item.deviationPercentage}%`}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 uppercase font-mono text-[10px]">{item.method}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.severity === 'critical' || item.severity === 'high'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case 'root_cause_analysis': {
      const rca = content?.rootCause;
      if (!rca) return <p className="text-xs text-slate-400">No root cause data available.</p>;

      return (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs">
            <h4 className="font-bold text-slate-900 mb-1">{rca.headline}</h4>
            <p className="text-slate-600 leading-relaxed">{rca.summary}</p>
          </div>

          {rca.topDrivers && rca.topDrivers.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Top Contributing Dimension Segments
              </span>
              <div className="space-y-2">
                {rca.topDrivers.map((driver: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{driver.segment}</span>
                      <span className="text-slate-400 text-[11px] ml-2">({driver.dimension})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-indigo-600">
                        {driver.contributionPct}% Contribution
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Δ {driver.delta > 0 ? `+${driver.delta.toLocaleString()}` : driver.delta.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    case 'forecast_outlook': {
      const fc = content?.forecast;
      if (!fc) return <p className="text-xs text-slate-400">No forecast data available.</p>;

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Metric</span>
              <span className="text-xs font-bold text-slate-800 truncate block">{fc.targetMetric}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Winning Model</span>
              <span className="text-xs font-bold text-indigo-600 truncate block">{fc.selectedModel}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/70">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Projected Growth</span>
              <span className="text-sm font-black text-emerald-700">
                {fc.expectedGrowthPct >= 0 ? `+${fc.expectedGrowthPct}%` : `${fc.expectedGrowthPct}%`}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Forecast Horizon</span>
              <span className="text-xs font-bold text-slate-800">{fc.horizon} periods</span>
            </div>
          </div>

          {/* Model Cross-Validation Scorecard */}
          {fc.modelScorecard && fc.modelScorecard.length > 0 && (
            <div className="overflow-x-auto pt-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Algorithm Backtesting Validation Scorecard
              </span>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 px-3">Model Name</th>
                    <th className="py-2 px-3">sMAPE %</th>
                    <th className="py-2 px-3">MAE</th>
                    <th className="py-2 px-3">RMSE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fc.modelScorecard.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{row.modelName}</td>
                      <td className="py-2 px-3 font-bold text-indigo-600">{row.smape}%</td>
                      <td className="py-2 px-3 text-slate-600">{row.mae}</td>
                      <td className="py-2 px-3 text-slate-600">{row.rmse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    case 'data_quality_audit': {
      const q = content?.quality;
      if (!q) return <p className="text-xs text-slate-400">No quality scorecard available.</p>;

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Hygiene Score</span>
              <span className="text-xl font-black text-slate-900">{q.qualityScore}/100</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Clean Columns</span>
              <span className="text-sm font-bold text-slate-800">{q.cleanColumnsCount} of {q.totalColumns}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Missing Cells %</span>
              <span className="text-sm font-bold text-slate-800">{q.missingCellsPct}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Duplicate Rows %</span>
              <span className="text-sm font-bold text-slate-800">{q.duplicateRowsPct}%</span>
            </div>
          </div>

          {q.criticalIssues && q.criticalIssues.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Governance Audit Findings
              </span>
              <div className="space-y-2">
                {q.criticalIssues.map((iss: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{iss.description}</p>
                      <p className="text-amber-800 text-[11px] mt-0.5">{iss.recommendation}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 shrink-0">
                      {iss.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    case 'recommendations': {
      const recs = content?.recommendations || [];
      if (recs.length === 0) return <p className="text-xs text-slate-400">No recommendations recorded.</p>;

      return (
        <div className="space-y-3">
          {recs.map((rec: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      rec.priority === 'high'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : rec.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {rec.priority} Priority
                  </span>
                  <span className="text-xs font-bold text-slate-500">[{rec.category}]</span>
                </div>
                {rec.timeframe && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{rec.timeframe}</span>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">{rec.action}</p>
              {rec.expectedImpact && (
                <p className="text-xs text-slate-600">
                  <strong>Expected Impact:</strong> {rec.expectedImpact}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    case 'limitations_methodology': {
      const lims = content?.limitations || [];
      if (lims.length === 0) return <p className="text-xs text-slate-400">No caveats specified.</p>;

      return (
        <div className="space-y-3">
          {lims.map((lim: any, idx: number) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-1"
            >
              <span className="font-bold text-slate-800">{lim.type}</span>
              <p className="text-slate-600">
                <strong>Caveat:</strong> {lim.caveat}
              </p>
              {lim.mitigation && (
                <p className="text-indigo-700">
                  <strong>Mitigation:</strong> {lim.mitigation}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    case 'data_table': {
      const tbl = content?.table;
      if (!tbl || !tbl.rows || tbl.rows.length === 0) return <p className="text-xs text-slate-400">No table records.</p>;

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{tbl.description}</span>
            <span>Total: {tbl.totalRowCount?.toLocaleString()} rows</span>
          </div>
          <div className="overflow-x-auto max-h-80 border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  {tbl.columns.map((c: any) => (
                    <th key={c.key} className="py-2.5 px-3 border-b border-slate-200">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tbl.rows.slice(0, 15).map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    {tbl.columns.map((c: any) => (
                      <td key={c.key} className="py-2 px-3 text-slate-700 font-mono text-[11px] truncate max-w-[150px]">
                        {String(row[c.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    default:
      return <p className="text-xs text-slate-400">Section content renderer.</p>;
  }
}
