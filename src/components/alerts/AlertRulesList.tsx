import React, { useState } from 'react';
import { AlertRule, TestRuleResult } from '../../services/alerts/alertTypes';
import { SEVERITY_CONFIG, ALERT_TYPE_CONFIG } from '../../services/alerts/alertConstants';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import AlertService from '../../services/alerts/alertsService';
import {
  Sliders,
  Play,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Layers,
  Power,
  ChevronRight,
  Info,
} from 'lucide-react';

interface AlertRulesListProps {
  rules: AlertRule[];
  datasets: Dataset[];
  profiles: Record<string, DatasetProfile>;
  userId: string;
  onToggleRule: (ruleId: string, currentEnabled: boolean) => void;
  onEditRule: (rule: AlertRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onOpenCreateModal: () => void;
}

export const AlertRulesList: React.FC<AlertRulesListProps> = ({
  rules,
  datasets,
  profiles,
  userId,
  onToggleRule,
  onEditRule,
  onDeleteRule,
  onOpenCreateModal,
}) => {
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestRuleResult>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleTestRule = async (rule: AlertRule) => {
    const dataset = datasets.find((d) => d.datasetId === rule.datasetId);
    if (!dataset) return;

    setTestingRuleId(rule.ruleId);
    try {
      const profile = profiles[rule.datasetId] || null;
      const res = await AlertService.testRule(rule, dataset, profile);
      setTestResults((prev) => ({ ...prev, [rule.ruleId]: res }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [rule.ruleId]: {
          wouldTrigger: false,
          message: err.message || 'Evaluation error',
          evaluatedAt: new Date().toISOString(),
        },
      }));
    } finally {
      setTestingRuleId(null);
    }
  };

  const getDatasetName = (datasetId: string) => {
    const d = datasets.find((ds) => ds.datasetId === datasetId);
    return d?.name || 'Dataset';
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    try {
      const ms = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(ms / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch {
      return isoString;
    }
  };

  if (rules.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-slate-50/50">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Sliders className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800 mb-1">
          No Monitoring Rules Configured
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
          Define automated threshold, trend, percentage change, or anomaly monitoring rules to get alerted when critical conditions occur in your business metrics.
        </p>
        <button
          onClick={onOpenCreateModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
        >
          <Sliders className="w-4 h-4" />
          <span>Create First Alert Rule</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => {
        const severityStyle = SEVERITY_CONFIG[rule.severity] || SEVERITY_CONFIG.info;
        const typeConfig = ALERT_TYPE_CONFIG[rule.type];
        const testRes = testResults[rule.ruleId];
        const isTesting = testingRuleId === rule.ruleId;

        return (
          <div
            key={rule.ruleId}
            className={`rounded-2xl border transition-all duration-200 bg-white p-4 sm:p-5 ${
              rule.enabled ? 'border-slate-200/90 shadow-2xs' : 'border-slate-200 opacity-60 bg-slate-50/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left Side: Rule details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider ${severityStyle.badgeClass}`}
                  >
                    {rule.severity}
                  </span>

                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {typeConfig?.label || rule.type}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                    <Database className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[130px]">
                      {getDatasetName(rule.datasetId)}
                    </span>
                  </span>

                  {rule.metric && (
                    <span className="font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {rule.metric}
                    </span>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {rule.name}
                </h4>

                {rule.description && (
                  <p className="text-xs text-slate-500">{rule.description}</p>
                )}

                {/* Rule diagnostic stats */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last evaluated: {formatRelativeTime(rule.lastEvaluatedAt)}
                  </span>
                  <span>•</span>
                  <span>
                    Status:{' '}
                    <strong
                      className={
                        rule.lastEvaluatedStatus === 'success'
                          ? 'text-rose-600 font-bold'
                          : rule.lastEvaluatedStatus === 'failed'
                          ? 'text-amber-600 font-bold'
                          : 'text-emerald-600 font-semibold'
                      }
                    >
                      {rule.lastEvaluatedStatus === 'success'
                        ? 'Triggered'
                        : rule.lastEvaluatedStatus === 'failed'
                        ? 'Failed'
                        : 'Normal'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Triggers: {rule.triggerCount || 0}</span>
                </div>
              </div>

              {/* Right Side: Action Controls */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {/* Diagnostic Test Button */}
                <button
                  onClick={() => handleTestRule(rule)}
                  disabled={isTesting}
                  title="Run real-time diagnostic evaluation against dataset"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  {isTesting ? (
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                  )}
                  <span>Test</span>
                </button>

                {/* Edit */}
                <button
                  onClick={() => onEditRule(rule)}
                  title="Edit Rule"
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Enable / Disable Toggle */}
                <button
                  onClick={() => onToggleRule(rule.ruleId, rule.enabled)}
                  title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    rule.enabled
                      ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <Power className="w-4 h-4" />
                </button>

                {/* Delete */}
                {confirmDeleteId === rule.ruleId ? (
                  <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                    <button
                      onClick={() => {
                        onDeleteRule(rule.ruleId);
                        setConfirmDeleteId(null);
                      }}
                      className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 text-slate-600 rounded-lg text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(rule.ruleId)}
                    title="Delete Rule"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Test result inline pill */}
            {testRes && (
              <div
                className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
                  testRes.wouldTrigger
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testRes.wouldTrigger ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-medium">{testRes.message}</span>
                </div>
                <button
                  onClick={() =>
                    setTestResults((prev) => {
                      const next = { ...prev };
                      delete next[rule.ruleId];
                      return next;
                    })
                  }
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
