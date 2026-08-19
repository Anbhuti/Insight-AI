export type AlertType =
  | 'threshold'
  | 'percentage_change'
  | 'trend'
  | 'anomaly'
  | 'forecast'
  | 'forecast_vs_actual'
  | 'data_quality'
  | 'kpi_change'
  | 'scheduled_summary';

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'triggered' | 'acknowledged' | 'snoozed' | 'resolved';

export type AlertOperator = '>' | '<' | '>=' | '<=' | '=' | '!=';

export type ComparisonPeriod =
  | 'previous_period'
  | 'previous_day'
  | 'previous_week'
  | 'previous_month'
  | 'previous_year';

export type EvaluationFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';

export type NotificationChannel = 'in_app' | 'email' | 'slack' | 'webhook';

export type ChangeDirection = 'increase' | 'decrease' | 'any';

export type TrendDirection = 'increasing' | 'decreasing';

export type ForecastCondition =
  | 'below_target'
  | 'above_target'
  | 'projected_decline'
  | 'low_confidence';

export type DataQualityMetric =
  | 'missing_values_pct'
  | 'duplicate_records_pct'
  | 'completeness_pct'
  | 'invalid_type_pct'
  | 'schema_mismatch';

/**
 * Configuration for an Alert Rule created by the user or pre-configured
 */
export interface AlertRule {
  ruleId: string;
  userId: string;
  datasetId: string;
  datasetName: string;
  datasetVersion?: number | string;
  name: string;
  description?: string;
  type: AlertType;
  
  // Numerical & threshold properties
  metric?: string; // column or KPI name
  operator?: AlertOperator;
  threshold?: number;

  // Percentage change properties
  percentageChangeThreshold?: number; // e.g. 20 (for 20%)
  changeDirection?: ChangeDirection;
  comparisonPeriod?: ComparisonPeriod;

  // Trend properties
  trendDirection?: TrendDirection;
  minConsecutivePeriods?: number; // e.g. 7
  minPercentageChange?: number; // e.g. 10

  // Anomaly properties
  anomalyMinSeverity?: AlertSeverity;
  
  // Forecast properties
  forecastHorizon?: number;
  forecastTarget?: number;
  forecastCondition?: ForecastCondition;

  // Forecast vs Actual properties
  forecastVarianceThresholdPct?: number;

  // Data quality properties
  dataQualityMetric?: DataQualityMetric;
  dataQualityThresholdPct?: number;

  // Operational metadata
  severity: AlertSeverity;
  frequency: EvaluationFrequency;
  notificationChannels: NotificationChannel[];
  enabled: boolean;
  cooldownMinutes: number; // default 60
  
  createdAt: string;
  updatedAt: string;
  lastEvaluatedAt?: string;
  lastEvaluatedStatus?: 'success' | 'failed' | 'not_triggered';
  lastEvaluatedError?: string;
  lastTriggeredAt?: string;
  triggerCount?: number;
}

/**
 * Structured evidence backing an alert instance
 */
export interface AlertEvidence {
  metric?: string;
  actualValue?: number;
  actualValueFormatted?: string;
  expectedValue?: number;
  expectedValueFormatted?: string;
  threshold?: number;
  thresholdFormatted?: string;
  deviationPct?: number;
  consecutivePeriodsCount?: number;
  comparisonPeriod?: string;
  timestamp?: string;
  dateValue?: string;
  historicalValues?: { date: string; value: number }[];
  
  // Cross-module linkages
  relatedAnomalyId?: string;
  relatedAnomalySeverity?: string;
  relatedRCAContributor?: string;
  relatedRCAConfidence?: number;
  relatedForecastSelectedModel?: string;
  relatedForecastExpectedGrowth?: number;
  dataQualityDetails?: {
    metricName: string;
    currentPct: number;
    thresholdPct: number;
    affectedColumns?: string[];
  };
  summaryText: string;
}

/**
 * An individual triggered Alert Instance
 */
export interface AlertInstance {
  alertId: string;
  userId: string;
  ruleId: string;
  ruleName: string;
  datasetId: string;
  datasetName: string;
  datasetVersion: number | string;
  type: AlertType;
  metric: string;
  severity: AlertSeverity;
  status: AlertStatus;
  fingerprint: string;
  title: string;
  message: string;
  evidence: AlertEvidence;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  snoozedUntil?: string;
  snoozeDurationMinutes?: number;
  resolvedAt?: string;
  resolvedReason?: string;
  notificationStatus: 'pending' | 'sent' | 'failed' | 'suppressed_quiet_hours';
  notificationSentAt?: string;
  notificationError?: string;
  aiExplanation?: string;
  aiExplanationRequestedAt?: string;
  relatedLinks?: {
    anomalyDocId?: string;
    rcaDocId?: string;
    forecastDocId?: string;
    reportDocId?: string;
  };
}

/**
 * In-app Notification document
 */
export interface InAppNotification {
  notificationId: string;
  userId: string;
  alertId: string;
  ruleId: string;
  datasetId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

/**
 * User's Notification Channel Preferences & Quiet Hours
 */
export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  emailAddress?: string;
  inAppEnabled: boolean;
  minSeverity: AlertSeverity;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string; // e.g. "07:00"
  quietHoursBypassCritical: boolean;
  updatedAt: string;
}

/**
 * Result of testing a rule against data without persisting alerts
 */
export interface TestRuleResult {
  wouldTrigger: boolean;
  currentCalculatedValue?: number;
  expectedValue?: number;
  deviationPct?: number;
  evidence?: AlertEvidence;
  message: string;
  evaluatedAt: string;
}

/**
 * Aggregated Alert Statistics
 */
export interface AlertStatistics {
  totalTriggered: number;
  activeCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  acknowledgedCount: number;
  snoozedCount: number;
  resolvedCount: number;
  avgResolutionTimeMinutes: number; // calculated from real resolvedAt - triggeredAt
}
