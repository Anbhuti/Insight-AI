import React, { useState } from 'react';
import {
  AlertInstance,
  AlertSeverity,
  AlertStatus,
} from '../../services/alerts/alertTypes';
import { SEVERITY_CONFIG, ALERT_CONSTANTS } from '../../services/alerts/alertConstants';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  BellOff,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Database,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Activity,
  Compass,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface AlertCardProps {
  alert: AlertInstance;
  onAcknowledge: (alertId: string) => void;
  onSnooze: (alertId: string, durationMinutes: number) => void;
  onResolve: (alertId: string) => void;
  onViewDetails: (alert: AlertInstance) => void;
  onNavigateToAnomaly?: (datasetId: string, anomalyId?: string) => void;
  onNavigateToRCA?: (datasetId: string) => void;
  onNavigateToForecast?: (datasetId: string) => void;
  onNavigateToAnalyst?: (datasetId: string, prompt: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onSnooze,
  onResolve,
  onViewDetails,
  onNavigateToAnomaly,
  onNavigateToRCA,
  onNavigateToForecast,
  onNavigateToAnalyst,
}) => {
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false);
  const severityStyle = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 bg-white hover:shadow-md ${
        alert.status === 'resolved'
          ? 'border-slate-200 opacity-80'
          : alert.severity === 'critical'
          ? 'border-rose-300 shadow-xs ring-1 ring-rose-200'
          : alert.severity === 'high'
          ? 'border-amber-300 shadow-xs'
          : 'border-slate-200/90'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Header: Severity, Type, Dataset, Status, Time */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Severity Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border uppercase tracking-wider ${severityStyle.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${severityStyle.dotClass} ${alert.severity === 'critical' ? 'animate-pulse' : ''}`} />
              {alert.severity}
            </span>

            {/* Type badge */}
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {alert.type.replace(/_/g, ' ')}
            </span>

            {/* Dataset Tag */}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
              <Database className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[140px]">{alert.datasetName}</span>
            </span>
          </div>

          {/* Status Indicator & Time */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {alert.status === 'acknowledged' && (
              <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold text-[11px] border border-indigo-100">
                <CheckCircle2 className="w-3 h-3" /> Acknowledged
              </span>
            )}
            {alert.status === 'snoozed' && (
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold text-[11px] border border-amber-200">
                <BellOff className="w-3 h-3" /> Snoozed
              </span>
            )}
            {alert.status === 'resolved' && (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px] border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Resolved
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3 h-3" />
              {formatDate(alert.triggeredAt)}
            </span>
          </div>
        </div>

        {/* Title and Summary */}
        <div className="mb-4">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {alert.title}
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            {alert.message}
          </p>
        </div>

        {/* Structured Evidence Pillbox */}
        {alert.evidence && (
          <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Observed Value
              </span>
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                {alert.evidence.actualValueFormatted ?? alert.evidence.actualValue ?? 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {alert.evidence.expectedValueFormatted ? 'Expected Baseline' : 'Threshold'}
              </span>
              <span className="font-semibold text-slate-700 text-xs sm:text-sm">
                {alert.evidence.expectedValueFormatted ?? alert.evidence.thresholdFormatted ?? 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Deviation
              </span>
              <span
                className={`font-bold text-xs sm:text-sm ${
                  (alert.evidence.deviationPct || 0) < 0
                    ? 'text-rose-600'
                    : (alert.evidence.deviationPct || 0) > 0
                    ? 'text-amber-600'
                    : 'text-slate-700'
                }`}
              >
                {alert.evidence.deviationPct !== undefined
                  ? `${alert.evidence.deviationPct >= 0 ? '+' : ''}${alert.evidence.deviationPct.toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Metric Target
              </span>
              <span className="font-mono text-slate-600 text-xs truncate block">
                {alert.metric}
              </span>
            </div>
          </div>
        )}

        {/* Source Navigation Links */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {alert.evidence?.relatedAnomalyId && onNavigateToAnomaly && (
            <button
              onClick={() => onNavigateToAnomaly(alert.datasetId, alert.evidence?.relatedAnomalyId)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
            >
              <Activity className="w-3 h-3" />
              <span>View Anomaly (Phase 9)</span>
            </button>
          )}

          {onNavigateToRCA && (
            <button
              onClick={() => onNavigateToRCA(alert.datasetId)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            >
              <Compass className="w-3 h-3" />
              <span>View RCA (Phase 10)</span>
            </button>
          )}

          {alert.type.includes('forecast') && onNavigateToForecast && (
            <button
              onClick={() => onNavigateToForecast(alert.datasetId)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3 h-3" />
              <span>View Forecast (Phase 11)</span>
            </button>
          )}

          {onNavigateToAnalyst && (
            <button
              onClick={() =>
                onNavigateToAnalyst(
                  alert.datasetId,
                  `Explain the verified factors behind alert '${alert.title}' on metric ${alert.metric} with observed value ${alert.evidence?.actualValueFormatted || 'N/A'}`
                )
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ask AI Analyst</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {alert.status === 'triggered' && (
              <button
                onClick={() => onAcknowledge(alert.alertId)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Acknowledge</span>
              </button>
            )}

            {alert.status !== 'resolved' && (
              <div className="relative">
                <button
                  onClick={() => setSnoozeMenuOpen(!snoozeMenuOpen)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <BellOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Snooze</span>
                </button>

                {snoozeMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">
                      Snooze Duration
                    </p>
                    {ALERT_CONSTANTS.SNOOZE_DURATIONS.map((dur) => (
                      <button
                        key={dur.minutes}
                        onClick={() => {
                          setSnoozeMenuOpen(false);
                          onSnooze(alert.alertId, dur.minutes);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {alert.status !== 'resolved' && (
              <button
                onClick={() => onResolve(alert.alertId)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve</span>
              </button>
            )}
          </div>

          <button
            onClick={() => onViewDetails(alert)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Full Evidence</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
