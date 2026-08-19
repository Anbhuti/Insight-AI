import {
  AlertSeverity,
  AlertType,
  AlertOperator,
  ComparisonPeriod,
  EvaluationFrequency,
  NotificationPreferences,
} from './alertTypes';

export const ALERT_CONSTANTS = {
  DEFAULT_COOLDOWN_MINUTES: 60,
  MAX_ACTIVE_ALERTS_PER_DATASET: 50,
  DEFAULT_QUIET_HOURS_START: '22:00',
  DEFAULT_QUIET_HOURS_END: '07:00',
  SNOOZE_DURATIONS: [
    { label: '15 Minutes', minutes: 15 },
    { label: '1 Hour', minutes: 60 },
    { label: '4 Hours', minutes: 240 },
    { label: '1 Day', minutes: 1440 },
    { label: '1 Week', minutes: 10080 },
  ],
};

export const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    label: string;
    badgeClass: string;
    borderClass: string;
    bgClass: string;
    textClass: string;
    dotClass: string;
    order: number;
  }
> = {
  critical: {
    label: 'Critical',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    borderClass: 'border-rose-300',
    bgClass: 'bg-rose-50/50',
    textClass: 'text-rose-700',
    dotClass: 'bg-rose-500',
    order: 5,
  },
  high: {
    label: 'High',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    borderClass: 'border-amber-300',
    bgClass: 'bg-amber-50/50',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
    order: 4,
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-200',
    borderClass: 'border-yellow-300',
    bgClass: 'bg-yellow-50/50',
    textClass: 'text-yellow-700',
    dotClass: 'bg-yellow-500',
    order: 3,
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    borderClass: 'border-blue-200',
    bgClass: 'bg-blue-50/40',
    textClass: 'text-blue-700',
    dotClass: 'bg-blue-500',
    order: 2,
  },
  info: {
    label: 'Info',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    borderClass: 'border-slate-200',
    bgClass: 'bg-slate-50/50',
    textClass: 'text-slate-600',
    dotClass: 'bg-slate-400',
    order: 1,
  },
};

export const ALERT_TYPE_CONFIG: Record<
  AlertType,
  {
    label: string;
    description: string;
    badge: string;
    color: string;
  }
> = {
  threshold: {
    label: 'Threshold Alert',
    description: 'Trigger when a metric value crosses an absolute boundary (e.g. Revenue < $100k, Profit < 0).',
    badge: 'Threshold',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  percentage_change: {
    label: 'Percentage Change',
    description: 'Trigger when a metric changes by more than X% relative to previous period, week, or month.',
    badge: '% Change',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  trend: {
    label: 'Sustained Trend',
    description: 'Trigger when a metric increases or decreases for consecutive periods with cumulative delta.',
    badge: 'Trend',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  },
  anomaly: {
    label: 'Anomaly Detection Guard',
    description: 'Trigger automatically when Phase 9 statistical anomaly engine detects severe outlier spikes or dips.',
    badge: 'Anomaly',
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  forecast: {
    label: 'Forecast Horizon Target',
    description: 'Trigger when predictive time-series projection indicates future metrics falling below goal.',
    badge: 'Forecast Target',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  forecast_vs_actual: {
    label: 'Forecast vs Actual Variance',
    description: 'Trigger when real observed metrics diverge from backtested predictive models by more than threshold %.',
    badge: 'Forecast Variance',
    color: 'text-teal-600 bg-teal-50 border-teal-200',
  },
  data_quality: {
    label: 'Data Quality & Hygiene',
    description: 'Trigger when missing values, duplicates, or schema changes exceed allowable data integrity tolerance.',
    badge: 'Data Hygiene',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  kpi_change: {
    label: 'Executive KPI Monitor',
    description: 'Track core business performance indicators like AOV, Conversion Rate, or Operating Margins.',
    badge: 'KPI Monitor',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  scheduled_summary: {
    label: 'Scheduled Summary',
    description: 'Periodic pulse check summarizing current operational health and detected metrics.',
    badge: 'Summary',
    color: 'text-slate-600 bg-slate-50 border-slate-200',
  },
};

export const OPERATOR_OPTIONS: { label: string; value: AlertOperator; symbol: string }[] = [
  { label: 'Greater Than (>)', value: '>', symbol: '>' },
  { label: 'Less Than (<)', value: '<', symbol: '<' },
  { label: 'Greater Than or Equal (>=)', value: '>=', symbol: '>=' },
  { label: 'Less Than or Equal (<=)', value: '<=', symbol: '<=' },
  { label: 'Equal To (=)', value: '=', symbol: '=' },
  { label: 'Not Equal To (!=)', value: '!=', symbol: '!=' },
];

export const COMPARISON_PERIOD_OPTIONS: { label: string; value: ComparisonPeriod }[] = [
  { label: 'Previous Period (Consecutive)', value: 'previous_period' },
  { label: 'Previous Day (24h)', value: 'previous_day' },
  { label: 'Previous Week (7d)', value: 'previous_week' },
  { label: 'Previous Month (30d)', value: 'previous_month' },
  { label: 'Previous Year (365d)', value: 'previous_year' },
];

export const FREQUENCY_OPTIONS: { label: string; value: EvaluationFrequency }[] = [
  { label: 'Real-time / On Ingestion', value: 'realtime' },
  { label: 'Hourly Evaluation', value: 'hourly' },
  { label: 'Daily Evaluation', value: 'daily' },
  { label: 'Weekly Evaluation', value: 'weekly' },
];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  userId: '',
  emailEnabled: false,
  emailAddress: '',
  inAppEnabled: true,
  minSeverity: 'low',
  quietHoursEnabled: false,
  quietHoursStart: ALERT_CONSTANTS.DEFAULT_QUIET_HOURS_START,
  quietHoursEnd: ALERT_CONSTANTS.DEFAULT_QUIET_HOURS_END,
  quietHoursBypassCritical: true,
  updatedAt: new Date().toISOString(),
};

export interface QuickRuleTemplate {
  name: string;
  description: string;
  type: AlertType;
  defaultSeverity: AlertSeverity;
  metricHint?: string;
  suggestedConfig: Partial<{
    operator: AlertOperator;
    threshold: number;
    percentageChangeThreshold: number;
    changeDirection: 'increase' | 'decrease' | 'any';
    comparisonPeriod: ComparisonPeriod;
    trendDirection: 'increasing' | 'decreasing';
    minConsecutivePeriods: number;
    minPercentageChange: number;
    forecastCondition: 'below_target' | 'above_target' | 'projected_decline' | 'low_confidence';
    dataQualityMetric: 'missing_values_pct' | 'duplicate_records_pct' | 'completeness_pct';
    dataQualityThresholdPct: number;
    frequency: EvaluationFrequency;
  }>;
}

export const PREBUILT_RULE_TEMPLATES: QuickRuleTemplate[] = [
  {
    name: 'Severe Revenue Drop Alert',
    description: 'Triggers when revenue drops by > 20% compared to previous period.',
    type: 'percentage_change',
    defaultSeverity: 'high',
    metricHint: 'revenue',
    suggestedConfig: {
      percentageChangeThreshold: 20,
      changeDirection: 'decrease',
      comparisonPeriod: 'previous_period',
      frequency: 'daily',
    },
  },
  {
    name: 'Negative Profit Guard',
    description: 'Triggers immediately if net profit falls below zero.',
    type: 'threshold',
    defaultSeverity: 'critical',
    metricHint: 'profit',
    suggestedConfig: {
      operator: '<',
      threshold: 0,
      frequency: 'realtime',
    },
  },
  {
    name: 'Critical Statistical Anomaly Guard',
    description: 'Alerts when Phase 9 statistical anomaly scan flags severe outliers.',
    type: 'anomaly',
    defaultSeverity: 'critical',
    suggestedConfig: {
      frequency: 'realtime',
    },
  },
  {
    name: '7-Day Sustained Metric Decline',
    description: 'Detects continuous downward trend across 7 consecutive intervals (>10% drop).',
    type: 'trend',
    defaultSeverity: 'medium',
    metricHint: 'orders',
    suggestedConfig: {
      trendDirection: 'decreasing',
      minConsecutivePeriods: 7,
      minPercentageChange: 10,
      frequency: 'daily',
    },
  },
  {
    name: 'Data Hygiene & Completeness Drop',
    description: 'Triggers if dataset missing or null values exceed 10%.',
    type: 'data_quality',
    defaultSeverity: 'high',
    suggestedConfig: {
      dataQualityMetric: 'missing_values_pct',
      dataQualityThresholdPct: 10,
      frequency: 'realtime',
    },
  },
  {
    name: 'Predictive Horizon Target Miss',
    description: 'Alerts when forecast engine projects metric falling short of target.',
    type: 'forecast',
    defaultSeverity: 'high',
    metricHint: 'revenue',
    suggestedConfig: {
      forecastCondition: 'below_target',
      frequency: 'daily',
    },
  },
];
