import { FirestoreDate } from './dataset';

export type ProfilingStatus = 'not_profiled' | 'profiling' | 'profiled' | 'failed';

export type ColumnLogicalType =
  | 'numeric'
  | 'integer'
  | 'decimal'
  | 'categorical'
  | 'text'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'unknown';

export type IssueSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type IssueCategory =
  | 'missing_values'
  | 'duplicates'
  | 'outliers'
  | 'data_type'
  | 'cardinality'
  | 'constant_column'
  | 'general';

export interface DataIssue {
  id: string;
  column?: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  recommendation: string;
  affectedCount?: number;
  affectedPercentage?: number;
}

export interface NumericStatistics {
  count: number;
  missingCount: number;
  uniqueCount: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  standardDeviation: number | null;
  percentile25: number | null; // Q1
  percentile50: number | null; // Q2 / Median
  percentile75: number | null; // Q3
  iqr: number | null;
  outlierCount: number;
  outlierPercentage: number;
  lowerOutlierBound: number | null;
  upperOutlierBound: number | null;
  isInteger: boolean;
  zerosCount: number;
  negativeCount: number;
  histogram?: { binStart: number; binEnd: number; count: number; label: string }[];
}

export interface CategoricalValueFrequency {
  value: string;
  count: number;
  percentage: number;
}

export interface CategoricalStatistics {
  count: number;
  missingCount: number;
  uniqueCount: number;
  uniquenessPercentage: number;
  topValues: CategoricalValueFrequency[]; // Top 10 max
  isPotentialId: boolean;
  isHighCardinality: boolean;
  isConstant: boolean;
}

export interface TextStatistics {
  count: number;
  missingCount: number;
  uniqueCount: number;
  uniquenessPercentage: number;
  averageLength: number;
  minLength: number;
  maxLength: number;
  isPotentialId: boolean;
  isConstant: boolean;
}

export interface BooleanStatistics {
  count: number;
  missingCount: number;
  trueCount: number;
  falseCount: number;
  truePercentage: number;
  falsePercentage: number;
}

export interface DateStatistics {
  count: number;
  missingCount: number;
  uniqueDateCount: number;
  minDate: string | null;
  maxDate: string | null;
  earliestFormatted?: string;
  latestFormatted?: string;
  timelineBins?: { period: string; count: number }[];
}

export interface ColumnProfile {
  name: string;
  originalIndex: number;
  logicalType: ColumnLogicalType;
  inferredType: ColumnLogicalType;
  totalRows: number;
  missingCount: number;
  missingPercentage: number;
  missingSeverity: 'good' | 'low' | 'medium' | 'high' | 'critical';
  uniqueCount: number;
  uniquePercentage: number;
  isPotentialId: boolean;
  isConstant: boolean;
  isHighCardinality: boolean;
  qualityRating: 'good' | 'fair' | 'poor' | 'critical';
  numericStats?: NumericStatistics;
  categoricalStats?: CategoricalStatistics;
  textStats?: TextStatistics;
  booleanStats?: BooleanStatistics;
  dateStats?: DateStatistics;
  sampleValues: (string | number | boolean | null)[];
}

export interface QualityScoreBreakdown {
  missingValuesScore: number;     // 35% weight
  duplicatesScore: number;        // 20% weight
  typeConsistencyScore: number;   // 20% weight
  criticalIssuesScore: number;    // 15% weight
  usabilityScore: number;         // 10% weight
}

export type QualityGrade = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';

export interface DataQualitySummary {
  overallScore: number; // 0 - 100
  grade: QualityGrade;
  breakdown: QualityScoreBreakdown;
  missingCellsTotal: number;
  missingCellsPercentage: number;
  duplicateRowsTotal: number;
  duplicateRowsPercentage: number;
  totalColumns: number;
  cleanColumnsCount: number;
  issuesCountBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export interface DuplicateRowPreview {
  rowIndex: number;
  values: (string | number | boolean | null)[];
  duplicateCount: number;
}

export interface DatasetProfile {
  datasetId: string;
  userId: string;
  profileVersion: number;
  profiledAt: FirestoreDate;
  rowCount: number;
  columnCount: number;
  duplicateRowCount: number;
  duplicateRowPercentage: number;
  missingCellCount: number;
  missingCellPercentage: number;
  qualityScore: number;
  qualitySummary: DataQualitySummary;
  columns: ColumnProfile[];
  issues: DataIssue[];
  duplicatePreview?: DuplicateRowPreview[];
  status: ProfilingStatus;
  errorMessage?: string;
}

export interface ProfilingProgressUpdate {
  stage:
    | 'initializing'
    | 'reading'
    | 'detecting_types'
    | 'calculating_stats'
    | 'checking_missing'
    | 'checking_duplicates'
    | 'detecting_outliers'
    | 'evaluating_quality'
    | 'saving'
    | 'completed'
    | 'error';
  message: string;
  percentage: number; // 0 - 100
}

// Configurable Scoring Constants
export const QUALITY_WEIGHTS = {
  missingValues: 0.35,
  duplicates: 0.20,
  typeConsistency: 0.20,
  criticalIssues: 0.15,
  usability: 0.10,
} as const;

export const MISSING_SEVERITY_THRESHOLDS = {
  good: 0,
  low: 5,       // >0 to 5%
  medium: 20,   // >5 to 20%
  high: 50,     // >20 to 50%
  critical: 100 // >50%
} as const;

export const QUALITY_SCORE_RANGES = {
  excellent: { min: 90, max: 100, label: 'Excellent' as QualityGrade },
  good: { min: 75, max: 89, label: 'Good' as QualityGrade },
  fair: { min: 60, max: 74, label: 'Fair' as QualityGrade },
  poor: { min: 40, max: 59, label: 'Poor' as QualityGrade },
  critical: { min: 0, max: 39, label: 'Critical' as QualityGrade },
} as const;
