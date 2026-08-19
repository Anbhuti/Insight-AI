import React, { useState, useEffect } from 'react';
import {
  AlertRule,
  AlertType,
  AlertOperator,
  AlertSeverity,
  ComparisonPeriod,
  EvaluationFrequency,
  TestRuleResult,
  DataQualityMetric,
} from '../../services/alerts/alertTypes';
import {
  ALERT_TYPE_CONFIG,
  OPERATOR_OPTIONS,
  COMPARISON_PERIOD_OPTIONS,
  FREQUENCY_OPTIONS,
  SEVERITY_CONFIG,
  PREBUILT_RULE_TEMPLATES,
  QuickRuleTemplate,
} from '../../services/alerts/alertConstants';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import AlertService from '../../services/alerts/alertsService';
import {
  X,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
  Sliders,
  Bell,
  Clock,
  Shield,
  Layers,
  Info,
  ChevronDown,
} from 'lucide-react';

interface CreateAlertRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  datasets: Dataset[];
  selectedDatasetId?: string;
  profiles: Record<string, DatasetProfile>;
  onRuleCreated: (rule: AlertRule) => void;
  initialRule?: AlertRule | null;
}

export const CreateAlertRuleModal: React.FC<CreateAlertRuleModalProps> = ({
  isOpen,
  onClose,
  userId,
  datasets,
  selectedDatasetId,
  profiles,
  onRuleCreated,
  initialRule,
}) => {
  if (!isOpen) return null;

  const defaultDsId = selectedDatasetId || (datasets.length > 0 ? datasets[0].datasetId : '');
  const [datasetId, setDatasetId] = useState<string>(initialRule?.datasetId || defaultDsId);
  const [name, setName] = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [type, setType] = useState<AlertType>(initialRule?.type || 'percentage_change');
  const [metric, setMetric] = useState(initialRule?.metric || '');
  const [severity, setSeverity] = useState<AlertSeverity>(initialRule?.severity || 'high');
  const [operator, setOperator] = useState<AlertOperator>(initialRule?.operator || '>');
  const [threshold, setThreshold] = useState<number | string>(initialRule?.threshold ?? 100);
  const [percentageChangeThreshold, setPercentageChangeThreshold] = useState<number | string>(
    initialRule?.percentageChangeThreshold ?? 20
  );
  const [changeDirection, setChangeDirection] = useState<'increase' | 'decrease' | 'any'>(
    initialRule?.changeDirection || 'decrease'
  );
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>(
    initialRule?.comparisonPeriod || 'previous_period'
  );
  const [trendDirection, setTrendDirection] = useState<'increasing' | 'decreasing'>(
    initialRule?.trendDirection || 'decreasing'
  );
  const [minConsecutivePeriods, setMinConsecutivePeriods] = useState<number>(
    initialRule?.minConsecutivePeriods || 7
  );
  const [minPercentageChange, setMinPercentageChange] = useState<number>(
    initialRule?.minPercentageChange || 10
  );
  const [anomalyMinSeverity, setAnomalyMinSeverity] = useState<AlertSeverity>(
    initialRule?.anomalyMinSeverity || 'high'
  );
  const [forecastTarget, setForecastTarget] = useState<number | string>(
    initialRule?.forecastTarget ?? 50000
  );
  const [forecastHorizon, setForecastHorizon] = useState<number>(initialRule?.forecastHorizon || 30);
  const [forecastCondition, setForecastCondition] = useState<
    'below_target' | 'above_target' | 'projected_decline' | 'low_confidence'
  >(initialRule?.forecastCondition || 'below_target');
  const [forecastVarianceThresholdPct, setForecastVarianceThresholdPct] = useState<number>(
    initialRule?.forecastVarianceThresholdPct || 25
  );
  const [dataQualityMetric, setDataQualityMetric] = useState<DataQualityMetric>(
    initialRule?.dataQualityMetric || 'missing_values_pct'
  );
  const [dataQualityThresholdPct, setDataQualityThresholdPct] = useState<number>(
    initialRule?.dataQualityThresholdPct || 10
  );
  const [frequency, setFrequency] = useState<EvaluationFrequency>(initialRule?.frequency || 'daily');
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(initialRule?.cooldownMinutes || 60);

  // Testing & Error states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestRuleResult | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentDataset = datasets.find((d) => d.datasetId === datasetId);
  const currentProfile = datasetId ? profiles[datasetId] : null;

  // Extract columns for dropdown
  const availableColumns = currentProfile?.columns || [];
  const numericColumns = availableColumns.filter((c) => {
    const t = c.inferredType?.toLowerCase() || '';
    return t === 'number' || t === 'integer' || t === 'float' || t === 'currency' || t === 'numeric';
  });

  // Auto-select first numeric metric if not selected
  useEffect(() => {
    if (!metric && numericColumns.length > 0) {
      setMetric(numericColumns[0].name);
    }
  }, [datasetId, numericColumns]);

  const applyTemplate = (tpl: QuickRuleTemplate) => {
    setName(tpl.name);
    setDescription(tpl.description);
    setType(tpl.type);
    setSeverity(tpl.defaultSeverity);

    if (tpl.suggestedConfig.operator) setOperator(tpl.suggestedConfig.operator);
    if (tpl.suggestedConfig.threshold !== undefined) setThreshold(tpl.suggestedConfig.threshold);
    if (tpl.suggestedConfig.percentageChangeThreshold !== undefined)
      setPercentageChangeThreshold(tpl.suggestedConfig.percentageChangeThreshold);
    if (tpl.suggestedConfig.changeDirection) setChangeDirection(tpl.suggestedConfig.changeDirection);
    if (tpl.suggestedConfig.comparisonPeriod) setComparisonPeriod(tpl.suggestedConfig.comparisonPeriod);
    if (tpl.suggestedConfig.trendDirection) setTrendDirection(tpl.suggestedConfig.trendDirection);
    if (tpl.suggestedConfig.minConsecutivePeriods)
      setMinConsecutivePeriods(tpl.suggestedConfig.minConsecutivePeriods);
    if (tpl.suggestedConfig.minPercentageChange)
      setMinPercentageChange(tpl.suggestedConfig.minPercentageChange);
    if (tpl.suggestedConfig.forecastCondition)
      setForecastCondition(tpl.suggestedConfig.forecastCondition);
    if (tpl.suggestedConfig.dataQualityMetric)
      setDataQualityMetric(tpl.suggestedConfig.dataQualityMetric);
    if (tpl.suggestedConfig.dataQualityThresholdPct !== undefined)
      setDataQualityThresholdPct(tpl.suggestedConfig.dataQualityThresholdPct);
    if (tpl.suggestedConfig.frequency) setFrequency(tpl.suggestedConfig.frequency);

    // Pick metric matching hint
    if (tpl.metricHint && availableColumns.length > 0) {
      const match = availableColumns.find((c) =>
        c.name.toLowerCase().includes(tpl.metricHint!.toLowerCase())
      );
      if (match) setMetric(match.name);
    }
  };

  // Construct draft rule object for testing / validation
  const constructDraftRule = (): Partial<AlertRule> => {
    return {
      name: name.trim() || 'Untitled Rule',
      description: description.trim(),
      datasetId,
      type,
      metric: type === 'data_quality' ? undefined : metric,
      severity,
      operator: type === 'threshold' ? operator : undefined,
      threshold: type === 'threshold' ? Number(threshold) : undefined,
      percentageChangeThreshold:
        type === 'percentage_change' ? Number(percentageChangeThreshold) : undefined,
      changeDirection: type === 'percentage_change' ? changeDirection : undefined,
      comparisonPeriod: type === 'percentage_change' ? comparisonPeriod : undefined,
      trendDirection: type === 'trend' ? trendDirection : undefined,
      minConsecutivePeriods: type === 'trend' ? minConsecutivePeriods : undefined,
      minPercentageChange: type === 'trend' ? minPercentageChange : undefined,
      anomalyMinSeverity: type === 'anomaly' ? anomalyMinSeverity : undefined,
      forecastTarget: type === 'forecast' ? Number(forecastTarget) : undefined,
      forecastHorizon: type === 'forecast' ? forecastHorizon : undefined,
      forecastCondition: type === 'forecast' ? forecastCondition : undefined,
      forecastVarianceThresholdPct:
        type === 'forecast_vs_actual' ? Number(forecastVarianceThresholdPct) : undefined,
      dataQualityMetric: type === 'data_quality' ? dataQualityMetric : undefined,
      dataQualityThresholdPct: type === 'data_quality' ? Number(dataQualityThresholdPct) : undefined,
      frequency,
      cooldownMinutes,
      notificationChannels: ['in_app'],
    };
  };

  const handleTestRule = async () => {
    setErrorBanner(null);
    if (!currentDataset) {
      setErrorBanner('Please select a valid dataset.');
      return;
    }

    const draft = constructDraftRule();
    const validation = AlertService.validateRule(draft, currentDataset, currentProfile);
    if (!validation.valid) {
      setErrorBanner(validation.error || 'Rule validation failed.');
      return;
    }

    setTesting(true);
    try {
      const testRuleObj: AlertRule = {
        ...(draft as AlertRule),
        ruleId: 'test_temp',
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enabled: true,
      };

      const result = await AlertService.testRule(testRuleObj, currentDataset, currentProfile);
      setTestResult(result);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error executing test evaluation.');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveRule = async () => {
    setErrorBanner(null);
    if (!currentDataset) {
      setErrorBanner('Please select a valid dataset.');
      return;
    }

    const draft = constructDraftRule();
    const validation = AlertService.validateRule(draft, currentDataset, currentProfile);
    if (!validation.valid) {
      setErrorBanner(validation.error || 'Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      if (initialRule?.ruleId) {
        await AlertService.updateRule(userId, initialRule.ruleId, draft);
        onRuleCreated({ ...initialRule, ...draft } as AlertRule);
      } else {
        const created = await AlertService.createRule(userId, draft as any);
        onRuleCreated(created);
      }
      onClose();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to save rule.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate natural language condition summary preview
  const generateConditionSummary = () => {
    const dsName = currentDataset?.name || 'Dataset';
    const met = metric || 'Metric';

    switch (type) {
      case 'threshold':
        return `Trigger an alert when ${met} in ${dsName} is ${operator} ${threshold}.`;
      case 'percentage_change':
        return `Trigger an alert when ${met} ${changeDirection === 'any' ? 'changes' : changeDirection + 's'} by > ${percentageChangeThreshold}% compared to ${comparisonPeriod.replace('_', ' ')}.`;
      case 'trend':
        return `Trigger an alert when ${met} exhibits a sustained ${trendDirection} trend for at least ${minConsecutivePeriods} consecutive periods with total change >= ${minPercentageChange}%.`;
      case 'anomaly':
        return `Trigger automatically when Phase 9 statistical anomaly engine detects a ${anomalyMinSeverity}+ outlier in ${met}.`;
      case 'forecast':
        return `Trigger an alert if predictive forecast models indicate ${met} falling ${forecastCondition.replace('_', ' ')} (Target: ${forecastTarget}) over the next ${forecastHorizon} intervals.`;
      case 'forecast_vs_actual':
        return `Trigger an alert when observed ${met} differs from forecast model expectation by more than ${forecastVarianceThresholdPct}%.`;
      case 'data_quality':
        return `Trigger an alert when ${dataQualityMetric.replace(/_/g, ' ')} exceeds ${dataQualityThresholdPct}%.`;
      default:
        return `Trigger an alert based on custom configuration.`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {initialRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure continuous, deterministic business metric monitoring
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorBanner && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorBanner}</span>
            </div>
          )}

          {/* Quick Rule Templates */}
          {!initialRule && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Quick Start Rule Templates
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PREBUILT_RULE_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/60 hover:border-indigo-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 mb-0.5 truncate">
                      {tpl.name}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                      {tpl.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dataset & Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Target Dataset *
              </label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {datasets.map((d) => (
                  <option key={d.datasetId} value={d.datasetId}>
                    {d.name} ({d.rowCount ? `${d.rowCount.toLocaleString()} rows` : 'Active'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Rule Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Critical Revenue Drop Alert"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Alert Type & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Alert Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AlertType)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {Object.entries(ALERT_TYPE_CONFIG).map(([key, conf]) => (
                  <option key={key} value={key}>
                    {conf.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                {ALERT_TYPE_CONFIG[type]?.description}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Severity Level *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {Object.entries(SEVERITY_CONFIG).map(([key, conf]) => (
                  <option key={key} value={key}>
                    {conf.label} Severity
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metric Selector (If not Data Quality) */}
          {type !== 'data_quality' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Monitored Metric / Column *
              </label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {availableColumns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.inferredType || 'text'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dynamic Condition Parameters */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              Condition Parameters
            </h4>

            {/* Threshold condition */}
            {type === 'threshold' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Operator
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as AlertOperator)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {OPERATOR_OPTIONS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Threshold Value
                  </label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Percentage Change condition */}
            {type === 'percentage_change' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Change % Threshold
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={percentageChangeThreshold}
                      onChange={(e) => setPercentageChangeThreshold(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full text-xs p-2.5 pr-7 rounded-xl border border-slate-300 bg-white"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-bold">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Direction
                  </label>
                  <select
                    value={changeDirection}
                    onChange={(e) => setChangeDirection(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="decrease">Decrease Only (-)</option>
                    <option value="increase">Increase Only (+)</option>
                    <option value="any">Any Direction (+/-)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Comparison Baseline
                  </label>
                  <select
                    value={comparisonPeriod}
                    onChange={(e) => setComparisonPeriod(e.target.value as ComparisonPeriod)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {COMPARISON_PERIOD_OPTIONS.map((cp) => (
                      <option key={cp.value} value={cp.value}>
                        {cp.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Trend condition */}
            {type === 'trend' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Trend Direction
                  </label>
                  <select
                    value={trendDirection}
                    onChange={(e) => setTrendDirection(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="decreasing">Downward (Continuous Decline)</option>
                    <option value="increasing">Upward (Continuous Growth)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Consecutive Periods
                  </label>
                  <input
                    type="number"
                    value={minConsecutivePeriods}
                    onChange={(e) => setMinConsecutivePeriods(Number(e.target.value))}
                    min={3}
                    max={60}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Min Cumulative %
                  </label>
                  <input
                    type="number"
                    value={minPercentageChange}
                    onChange={(e) => setMinPercentageChange(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Anomaly Guard condition */}
            {type === 'anomaly' && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Trigger on Anomaly Severity
                </label>
                <select
                  value={anomalyMinSeverity}
                  onChange={(e) => setAnomalyMinSeverity(e.target.value as AlertSeverity)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="critical">Critical Outliers Only (&gt; 4.0 Z-score)</option>
                  <option value="high">High &amp; Critical Outliers (&gt; 2.5 Z-score)</option>
                  <option value="medium">Medium, High &amp; Critical Outliers</option>
                </select>
              </div>
            )}

            {/* Forecast condition */}
            {type === 'forecast' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Forecast Condition
                  </label>
                  <select
                    value={forecastCondition}
                    onChange={(e) => setForecastCondition(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="below_target">Falls Below Target</option>
                    <option value="above_target">Exceeds Upper Bound</option>
                    <option value="projected_decline">Projected Downward Trajectory</option>
                    <option value="low_confidence">Low Model Confidence</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={forecastTarget}
                    onChange={(e) => setForecastTarget(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Horizon Periods
                  </label>
                  <input
                    type="number"
                    value={forecastHorizon}
                    onChange={(e) => setForecastHorizon(Number(e.target.value))}
                    min={1}
                    max={90}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Forecast vs Actual condition */}
            {type === 'forecast_vs_actual' && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Allowable Variance % Threshold
                </label>
                <input
                  type="number"
                  value={forecastVarianceThresholdPct}
                  onChange={(e) => setForecastVarianceThresholdPct(Number(e.target.value))}
                  placeholder="e.g. 25"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            )}

            {/* Data Quality condition */}
            {type === 'data_quality' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Data Hygiene Check
                  </label>
                  <select
                    value={dataQualityMetric}
                    onChange={(e) => setDataQualityMetric(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="missing_values_pct">Missing / Null Values %</option>
                    <option value="duplicate_records_pct">Duplicate Records %</option>
                    <option value="completeness_pct">Completeness Score &lt; %</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Tolerance Threshold %
                  </label>
                  <input
                    type="number"
                    value={dataQualityThresholdPct}
                    onChange={(e) => setDataQualityThresholdPct(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Schedule Frequency & Cooldown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Evaluation Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as EvaluationFrequency)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Cooldown Window (Minutes)
              </label>
              <input
                type="number"
                value={cooldownMinutes}
                onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                min={5}
                max={1440}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              />
              <span className="text-[10px] text-slate-400">
                Prevents duplicate alerts from firing repeatedly within this window.
              </span>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
              Deterministic Logic Preview
            </span>
            <p className="font-medium leading-relaxed">{generateConditionSummary()}</p>
          </div>

          {/* Real-time Dry Run / Diagnostic Tester */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Diagnostic Dry-Run
                </h4>
                <p className="text-[10px] text-slate-500">
                  Evaluate this rule right now against loaded dataset rows without creating an alert.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestRule}
                disabled={testing}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                    <span>Test Rule</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-150 ${
                  testResult.wouldTrigger
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {testResult.wouldTrigger ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Condition WOULD Trigger an Alert</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Condition WOULD NOT Trigger (Within Normal Limits)</span>
                    </>
                  )}
                </div>
                <p className="text-xs opacity-90">{testResult.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveRule}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{initialRule ? 'Save Changes' : 'Activate Rule'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
