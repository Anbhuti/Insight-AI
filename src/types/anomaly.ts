import { FirestoreDate } from './dataset';

export type AnomalyType =
  | 'spike'
  | 'drop'
  | 'statistical_outlier'
  | 'trend_shift'
  | 'zero_value'
  | 'negative_value'
  | 'dimension_deviation';

export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

export type DetectionMethod =
  | 'z_score'
  | 'iqr'
  | 'mad'
  | 'rolling_window'
  | 'pct_change'
  | 'segment_variance';

export type AnomalyStatus = 'active' | 'investigated' | 'resolved' | 'dismissed';

export interface AnomalyContextPoint {
  label: string;
  value: number;
  expected?: number;
  isAnomaly?: boolean;
  lowerBound?: number;
  upperBound?: number;
}

export interface AnomalyAIExplanation {
  headline: string;
  businessImpact: string;
  potentialDrivers: string[];
  recommendedActions: string[];
  confidence: number;
  generatedAt: string;
}

export interface Anomaly {
  id: string;
  datasetId: string;
  datasetName: string;
  userId: string;
  column: string;
  dimensionColumn?: string;
  dimensionValue?: string;
  dateColumn?: string;
  dateValue?: string;
  rowIndex?: number;
  rowIdentifier?: string; // e.g. "Row #142 (Jan 2026)"
  
  // Mathematical Evidence
  actualValue: number;
  expectedValue: number;
  baselineValue: number;
  deviation: number;
  deviationPercentage: number;
  score: number; // e.g. Z-score (3.4), IQR multiple (2.8), or % change
  scoreLabel: string; // e.g. "Z-Score: +3.4σ" or "3.2× IQR"
  
  // Classification
  severity: AnomalySeverity;
  type: AnomalyType;
  method: DetectionMethod;
  
  // Narrative
  title: string;
  summary: string;
  statisticalEvidence: string;
  
  // AI-generated business context
  aiExplanation?: AnomalyAIExplanation;
  
  // Interactive Sparkline / Timeline Context
  historicalContext?: AnomalyContextPoint[];
  
  // Full Row Record for Inspection
  rowData?: Record<string, string | number | boolean | null>;
  
  // Status Tracking
  status: AnomalyStatus;
  detectedAt: FirestoreDate;
  resolvedAt?: FirestoreDate;
  investigationNotes?: string;
}

export type AnomalySensitivity = 'conservative' | 'standard' | 'aggressive';

export interface AnomalyDetectionConfig {
  sensitivity: AnomalySensitivity;
  zScoreThreshold: number; // default 3.0 (standard), 2.3 (aggressive), 3.8 (conservative)
  iqrMultiplier: number; // default 1.5 (standard), 1.2 (aggressive), 2.5 (conservative)
  madThreshold: number; // default 3.5 (standard), 2.5 (aggressive), 4.5 (conservative)
  pctChangeThreshold: number; // default 40% (standard), 25% (aggressive), 75% (conservative)
  windowSize: number; // default 7 (or 10% of records)
  selectedColumns?: string[];
  dateColumn?: string;
  dimensionColumns?: string[];
  maxAnomaliesPerColumn: number;
  totalMaxAnomalies: number;
  enabledMethods: DetectionMethod[];
}

export interface AnomalyScanSummary {
  id: string;
  datasetId: string;
  datasetName: string;
  userId: string;
  totalRowsScanned: number;
  columnsScanned: number;
  anomaliesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  config: AnomalyDetectionConfig;
  scannedAt: FirestoreDate;
  scanDurationMs: number;
  anomalies: Anomaly[];
}

export interface AnomalyFilterOptions {
  searchQuery: string;
  severity: AnomalySeverity | 'all';
  type: AnomalyType | 'all';
  method: DetectionMethod | 'all';
  column: string | 'all';
  status: AnomalyStatus | 'all';
  sortBy: 'severity' | 'score' | 'deviation' | 'date';
  sortOrder: 'asc' | 'desc';
}
