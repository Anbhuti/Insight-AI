import React from 'react';
import {
  Anomaly,
  AnomalySeverity,
  AnomalyType,
  DetectionMethod,
} from '../../types/anomaly';
import {
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Bot,
  Terminal,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface AnomalyCardProps {
  anomaly: Anomaly;
  onInspect: (anomaly: Anomaly) => void;
  onInvestigateAI: (anomaly: Anomaly) => void;
  onInvestigateSQL?: (anomaly: Anomaly) => void;
  onToggleStatus?: (anomaly: Anomaly) => void;
}

export const AnomalyCard: React.FC<AnomalyCardProps> = ({
  anomaly,
  onInspect,
  onInvestigateAI,
  onInvestigateSQL,
  onToggleStatus,
}) => {
  const isSpike = anomaly.type === 'spike';
  const isCritical = anomaly.severity === 'critical';
  const isHigh = anomaly.severity === 'high';
  const isResolved = anomaly.status === 'resolved';

  const severityBadge = {
    critical: {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      dot: 'bg-rose-500 animate-pulse',
      label: 'Critical Priority',
    },
    high: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      dot: 'bg-amber-500',
      label: 'High Severity',
    },
    medium: {
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      dot: 'bg-blue-500',
      label: 'Medium Variance',
    },
    low: {
      bg: 'bg-slate-50 border-slate-200 text-slate-600',
      dot: 'bg-slate-400',
      label: 'Minor Outlier',
    },
  }[anomaly.severity];

  const methodLabel: Record<DetectionMethod, string> = {
    z_score: 'Z-Score (Gaussian)',
    iqr: 'IQR Quartile Bound',
    mad: 'MAD Robust',
    rolling_window: 'Rolling Moving Avg',
    pct_change: '% Period Variance',
    segment_variance: 'Segment Attribution',
  };

  const chartData = anomaly.historicalContext || [];

  return (
    <div
      className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
        isCritical
          ? 'border-rose-200/90 hover:border-rose-300 ring-1 ring-rose-100/50'
          : isHigh
          ? 'border-amber-200/80 hover:border-amber-300'
          : 'border-slate-200/80 hover:border-slate-300'
      } ${isResolved ? 'opacity-70 bg-slate-50/50' : ''}`}
    >
      <div>
        {/* Card Header: Severity & Method Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${severityBadge.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${severityBadge.dot}`} />
              <span>{severityBadge.label}</span>
            </span>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {methodLabel[anomaly.method]}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{anomaly.rowIdentifier || `Row #${(anomaly.rowIndex || 0) + 1}`}</span>
          </span>
        </div>

        {/* Anomaly Title */}
        <div className="mb-3">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug flex items-center gap-2">
            {isSpike ? (
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{anomaly.title}</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Metric: <strong className="text-slate-800 font-semibold">{anomaly.column}</strong>
            {anomaly.dimensionValue && (
              <span> · Segment: <strong className="text-indigo-600 font-semibold">{anomaly.dimensionValue}</strong></span>
            )}
          </p>
        </div>

        {/* Metric Comparison Ribbon */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 mb-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Observed Value
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {anomaly.actualValue.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Expected Baseline
            </span>
            <span className="text-sm sm:text-base font-semibold text-slate-600">
              {anomaly.expectedValue.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Variance
            </span>
            <span
              className={`text-sm sm:text-base font-extrabold flex items-center gap-0.5 ${
                anomaly.deviationPercentage > 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {anomaly.deviationPercentage > 0 ? '+' : ''}
              {anomaly.deviationPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Mini Sparkline Chart */}
        {chartData.length > 0 && (
          <div className="h-28 w-full mb-4 bg-white p-2 rounded-2xl border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="label" hide />
                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-lg">
                          <p className="font-bold">{d.label}</p>
                          <p>Value: {d.value?.toLocaleString()}</p>
                          {d.isAnomaly && <p className="text-rose-400 font-bold">⚠️ Anomaly Point</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={anomaly.expectedValue}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isAnomaly) {
                      return (
                        <circle
                          key={props.key || 'anomaly-dot'}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="#f43f5e"
                          stroke="#ffffff"
                          strokeWidth={2}
                          className="animate-pulse"
                        />
                      );
                    }
                    return <circle key={props.key || 'normal-dot'} cx={cx} cy={cy} r={2} fill="#6366f1" />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary Description */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
          {anomaly.summary}
        </p>

        {/* AI Insight Pill Preview if generated */}
        {anomaly.aiExplanation && (
          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs mb-4">
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[11px] mb-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>AI Business Analysis</span>
            </div>
            <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed">
              {anomaly.aiExplanation.businessImpact}
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onInspect(anomaly)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect Math</span>
          </button>

          {onToggleStatus && (
            <button
              onClick={() => onToggleStatus(anomaly)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isResolved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isResolved ? 'Resolved' : 'Resolve'}</span>
            </button>
          )}
        </div>

        <button
          onClick={() => onInvestigateAI(anomaly)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer group"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Ask AI Analyst</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
