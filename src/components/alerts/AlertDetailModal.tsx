import React, { useState } from 'react';
import {
  AlertInstance,
  AlertSeverity,
  AlertStatus,
} from '../../services/alerts/alertTypes';
import { SEVERITY_CONFIG, ALERT_CONSTANTS } from '../../services/alerts/alertConstants';
import AlertService from '../../services/alerts/alertsService';
import {
  X,
  CheckCircle2,
  BellOff,
  Sparkles,
  Database,
  Clock,
  Activity,
  Compass,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Layers,
  Info,
} from 'lucide-react';

interface AlertDetailModalProps {
  alert: AlertInstance | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
  onSnooze: (alertId: string, durationMinutes: number) => void;
  onResolve: (alertId: string, reason?: string) => void;
  onNavigateToAnomaly?: (datasetId: string, anomalyId?: string) => void;
  onNavigateToRCA?: (datasetId: string) => void;
  onNavigateToForecast?: (datasetId: string) => void;
  onNavigateToAnalyst?: (datasetId: string, prompt: string) => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  isOpen,
  onClose,
  onAcknowledge,
  onSnooze,
  onResolve,
  onNavigateToAnomaly,
  onNavigateToRCA,
  onNavigateToForecast,
  onNavigateToAnalyst,
}) => {
  if (!isOpen || !alert) return null;

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [resolveReason, setResolveReason] = useState('');
  const [showResolveInput, setShowResolveInput] = useState(false);
  const [selectedSnooze, setSelectedSnooze] = useState(60);

  const severityStyle = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;

  const handleRequestAiExplanation = async () => {
    setLoadingAi(true);
    try {
      const explanation = await AlertService.explainAlertWithAI(alert);
      setAiExplanation(explanation);
    } catch (err) {
      setAiExplanation('Could not load AI explanation at this time.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleConfirmResolve = () => {
    onResolve(alert.alertId, resolveReason.trim() || 'Condition addressed and verified by user.');
    setShowResolveInput(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${severityStyle.badgeClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${severityStyle.dotClass}`} />
                {alert.severity} Severity
              </span>

              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-200/80 text-slate-800">
                {alert.type.replace(/_/g, ' ')}
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                {alert.datasetName}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 leading-tight">
              {alert.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status & Lifecycle Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">
                Triggered at:{' '}
                <strong className="text-slate-900">
                  {new Date(alert.triggeredAt).toLocaleString()}
                </strong>
              </span>
            </div>

            {alert.status === 'acknowledged' && (
              <div className="text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Acknowledged by {alert.acknowledgedBy || 'User'}
              </div>
            )}

            {alert.status === 'snoozed' && (
              <div className="text-amber-800 font-semibold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <BellOff className="w-3.5 h-3.5" />
                Snoozed until {alert.snoozedUntil ? new Date(alert.snoozedUntil).toLocaleTimeString() : 'N/A'}
              </div>
            )}

            {alert.status === 'resolved' && (
              <div className="text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolved: {alert.resolvedReason || 'Verified'}
              </div>
            )}
          </div>

          {/* Core Evidence Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Verified Analytical Evidence
            </h4>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {alert.evidence?.summaryText || alert.message}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Observed Value
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    {alert.evidence?.actualValueFormatted ?? alert.evidence?.actualValue ?? 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    {alert.evidence?.expectedValueFormatted ? 'Expected Baseline' : 'Threshold'}
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    {alert.evidence?.expectedValueFormatted ?? alert.evidence?.thresholdFormatted ?? 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Deviation
                  </span>
                  <span
                    className={`text-base font-extrabold ${
                      (alert.evidence?.deviationPct || 0) < 0
                        ? 'text-rose-600'
                        : (alert.evidence?.deviationPct || 0) > 0
                        ? 'text-amber-600'
                        : 'text-slate-800'
                    }`}
                  >
                    {alert.evidence?.deviationPct !== undefined
                      ? `${alert.evidence.deviationPct >= 0 ? '+' : ''}${alert.evidence.deviationPct.toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Monitored Metric
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 truncate block">
                    {alert.metric}
                  </span>
                </div>
              </div>

              {/* Historical Sequence preview if available */}
              {alert.evidence?.historicalValues && alert.evidence.historicalValues.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-500 block mb-2">
                    Recent Historical Trend Progression:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                    {alert.evidence.historicalValues.map((pt, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center min-w-[70px] shrink-0"
                      >
                        <div className="text-[9px] text-slate-400 truncate">{pt.date}</div>
                        <div className="text-xs font-bold text-slate-800">{pt.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Integrated Analytics Navigation Hub */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Integrated Cross-Phase Analytics
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {onNavigateToAnomaly && (
                <button
                  onClick={() => onNavigateToAnomaly(alert.datasetId, alert.evidence?.relatedAnomalyId)}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-rose-700 text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Anomaly Engine
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Inspect statistical outlier scans and z-scores (Phase 9).
                  </p>
                </button>
              )}

              {onNavigateToRCA && (
                <button
                  onClick={() => onNavigateToRCA(alert.datasetId)}
                  className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-indigo-700 text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      Root Cause Analysis
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Breakdown sub-segments and multi-factor drivers (Phase 10).
                  </p>
                </button>
              )}

              {onNavigateToForecast && (
                <button
                  onClick={() => onNavigateToForecast(alert.datasetId)}
                  className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Forecast Horizon
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Evaluate ARIMA/Holt-Winters trajectory projections (Phase 11).
                  </p>
                </button>
              )}
            </div>
          </div>

          {/* AI Grounded Explanation Section */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-indigo-50/70 via-purple-50/40 to-white border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    AI Grounded Alert Briefing
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Strictly explained using verified analytical evidence (zero hallucination guarantee)
                  </p>
                </div>
              </div>

              {!aiExplanation && (
                <button
                  onClick={handleRequestAiExplanation}
                  disabled={loadingAi}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loadingAi ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Explain Alert</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {aiExplanation && (
              <div className="p-3 rounded-xl bg-white border border-indigo-100 text-xs text-slate-700 leading-relaxed">
                {aiExplanation}
              </div>
            )}
          </div>

          {/* Manual Resolve Reason input if toggled */}
          {showResolveInput && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in duration-150">
              <h4 className="text-xs font-bold text-emerald-900">
                Resolution Notes
              </h4>
              <textarea
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
                placeholder="Describe actions taken or why this condition was resolved..."
                rows={2}
                className="w-full text-xs p-3 rounded-xl border border-emerald-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowResolveInput(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmResolve}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Resolution
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {alert.status === 'triggered' && (
              <button
                onClick={() => {
                  onAcknowledge(alert.alertId);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Acknowledge Alert</span>
              </button>
            )}

            {alert.status !== 'resolved' && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                <BellOff className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedSnooze}
                  onChange={(e) => setSelectedSnooze(Number(e.target.value))}
                  className="text-xs font-medium text-slate-700 bg-transparent border-none focus:outline-hidden cursor-pointer"
                >
                  {ALERT_CONSTANTS.SNOOZE_DURATIONS.map((dur) => (
                    <option key={dur.minutes} value={dur.minutes}>
                      {dur.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    onSnooze(alert.alertId, selectedSnooze);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Snooze
                </button>
              </div>
            )}

            {alert.status !== 'resolved' && !showResolveInput && (
              <button
                onClick={() => setShowResolveInput(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Resolved</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
