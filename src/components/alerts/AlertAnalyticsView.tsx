import React from 'react';
import { AlertInstance, AlertStatistics } from '../../services/alerts/alertTypes';
import { SEVERITY_CONFIG, ALERT_TYPE_CONFIG } from '../../services/alerts/alertConstants';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Database,
} from 'lucide-react';

interface AlertAnalyticsViewProps {
  stats: AlertStatistics;
  alerts: AlertInstance[];
  onViewAlertDetails: (alert: AlertInstance) => void;
}

export const AlertAnalyticsView: React.FC<AlertAnalyticsViewProps> = ({
  stats,
  alerts,
  onViewAlertDetails,
}) => {
  // Compute distribution by severity
  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  // Compute distribution by type
  const typeCounts: Record<string, number> = {};

  alerts.forEach((a) => {
    if (severityCounts[a.severity] !== undefined) {
      severityCounts[a.severity]++;
    }
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });

  const total = alerts.length || 1;

  return (
    <div className="space-y-6">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Triggered
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">
              {stats.totalTriggered}
            </span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
            Critical Alerts
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-600">
              {stats.criticalCount}
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block mb-1">
            Active Unresolved
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-700">
              {stats.activeCount}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Resolved
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-700">
              {stats.resolvedCount}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Mean Time To Resolve
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-indigo-700">
              {stats.avgResolutionTimeMinutes > 0
                ? `${stats.avgResolutionTimeMinutes}m`
                : 'N/A'}
            </span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Alert Breakdown by Severity
          </h4>
          <div className="space-y-3">
            {Object.entries(SEVERITY_CONFIG).map(([sevKey, conf]) => {
              const count = severityCounts[sevKey] || 0;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={sevKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 capitalize text-slate-700">
                      <span className={`w-2 h-2 rounded-full ${conf.dotClass}`} />
                      {conf.label}
                    </span>
                    <span className="text-slate-500">
                      <strong>{count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${conf.dotClass} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Type Distribution */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Alert Breakdown by Rule Type
          </h4>
          <div className="space-y-3">
            {Object.entries(ALERT_TYPE_CONFIG).map(([typeKey, conf]) => {
              const count = typeCounts[typeKey] || 0;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={typeKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700 truncate max-w-[200px]">
                      {conf.label}
                    </span>
                    <span className="text-slate-500">
                      <strong>{count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Historical Incident Log */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Historical Incident Audit Trail
        </h4>

        {alerts.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No historical alert incidents recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 15).map((a) => {
              const sev = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.info;
              return (
                <div
                  key={a.alertId}
                  onClick={() => onViewAlertDetails(a)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all flex flex-wrap items-center justify-between gap-2 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sev.dotClass}`} />
                    <strong className="text-slate-800">{a.title}</strong>
                    <span className="text-slate-400 font-mono">({a.metric})</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="capitalize font-semibold text-slate-600">
                      {a.status}
                    </span>
                    <span>{new Date(a.triggeredAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
