import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { Anomaly } from '../../types/anomaly';
import { RCAResult } from '../rootCause/types';
import { ForecastResult } from '../forecasting/forecastTypes';

export type ReportTemplateId =
  | 'executive_briefing'
  | 'comprehensive_bi'
  | 'anomaly_risk'
  | 'forecast_outlook'
  | 'data_quality_audit'
  | 'custom_modular';

export type ReportSectionType =
  | 'executive_summary'
  | 'kpi_overview'
  | 'trend_charts'
  | 'category_breakdown'
  | 'data_table'
  | 'anomaly_deep_dive'
  | 'root_cause_analysis'
  | 'forecast_outlook'
  | 'data_quality_audit'
  | 'recommendations'
  | 'limitations_methodology'
  | 'custom_markdown';

export type ReportStatus = 'draft' | 'published' | 'archived';

export interface ReportKPIItem {
  id: string;
  label: string;
  metricColumn: string;
  currentValue: number;
  formattedValue: string;
  comparisonValue?: number;
  formattedComparison?: string;
  percentageChange?: number;
  isPositive?: boolean;
  aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  sparkline?: number[];
  statusColor?: string;
  description?: string;
}

export interface ReportChartItem {
  id: string;
  title: string;
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'composed';
  description?: string;
  xAxisKey: string;
  yAxisKey: string;
  secondaryYAxisKey?: string;
  data: Record<string, any>[];
  colors?: string[];
  unit?: string;
}

export interface ReportTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: 'number' | 'currency' | 'percent' | 'date' | 'string';
}

export interface ReportTableItem {
  id: string;
  title: string;
  description?: string;
  columns: ReportTableColumn[];
  rows: Record<string, any>[];
  totalRowCount: number;
  maxDisplayRows: number;
}

export interface ReportExecutiveSummaryContent {
  headline: string;
  overviewNarrative: string;
  keyTakeaways: string[];
  strategicImplications: string[];
  confidenceScore: number;
  generatedWithAI: boolean;
  reviewedByHuman: boolean;
}

export interface ReportQualityContent {
  qualityScore: number;
  grade: string;
  cleanColumnsCount: number;
  totalColumns: number;
  missingCellsPct: number;
  duplicateRowsPct: number;
  criticalIssues: {
    category: string;
    severity: string;
    description: string;
    recommendation: string;
  }[];
  hygieneStatus: 'Optimal' | 'Acceptable' | 'Needs Remediation';
}

export interface ReportSection {
  id: string;
  type: ReportSectionType;
  title: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  content: {
    executiveSummary?: ReportExecutiveSummaryContent;
    kpis?: ReportKPIItem[];
    charts?: ReportChartItem[];
    table?: ReportTableItem;
    anomalies?: {
      totalDetected: number;
      highRiskCount: number;
      scannedDate: string;
      items: Anomaly[];
    };
    rootCause?: {
      targetMetric: string;
      headline: string;
      summary: string;
      topDrivers: {
        dimension: string;
        segment: string;
        contributionPct: number;
        delta: number;
      }[];
      hypotheses: {
        statement: string;
        confidence: string;
        classification: string;
      }[];
      overallConfidence: string;
    };
    forecast?: {
      targetMetric: string;
      horizon: number;
      frequency: string;
      selectedModel: string;
      expectedGrowthPct: number;
      latestActual: number;
      projectedEnd: number;
      summaryPoints: {
        date: string;
        actual?: number;
        prediction?: number;
        lowerBound?: number;
        upperBound?: number;
      }[];
      modelScorecard?: {
        modelName: string;
        smape: number;
        mae: number;
        rmse: number;
      }[];
    };
    quality?: ReportQualityContent;
    recommendations?: {
      priority: 'high' | 'medium' | 'low';
      category: string;
      action: string;
      expectedImpact: string;
      timeframe: string;
    }[];
    limitations?: {
      type: string;
      caveat: string;
      mitigation: string;
    }[];
    customMarkdown?: string;
  };
  aiNarrative?: string;
  userNotes?: string;
  sourceTracking?: {
    sourceType: 'profiler' | 'sql' | 'anomaly' | 'rca' | 'forecast' | 'manual';
    sourceId?: string;
    calculatedAt: string;
  };
}

export interface ReportSharingConfig {
  isShared: boolean;
  shareToken?: string;
  shareUrl?: string;
  expiresAt?: string | null; // ISO string or null for indefinite
  allowExport: boolean;
  viewCount: number;
  lastViewedAt?: string;
  revoked: boolean;
  creatorUserId: string;
}

export interface ReportMetadata {
  reportId: string;
  userId: string;
  datasetId: string;
  datasetName: string;
  datasetVersion?: string;
  title: string;
  subtitle?: string;
  authorName: string;
  authorEmail?: string;
  templateId: ReportTemplateId;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  filtersApplied?: {
    dateRange?: string;
    selectedDimensions?: Record<string, string[]>;
    metricFocus?: string[];
  };
}

export interface Report {
  metadata: ReportMetadata;
  sections: ReportSection[];
  sharing: ReportSharingConfig;
  provenance: {
    systemVersion: string;
    generationEngine: 'InsightAI Analytical Pipeline';
    generatedAt: string;
    groundedInActualData: boolean;
    dataHash?: string;
  };
}

export interface ReportTemplateDefinition {
  id: ReportTemplateId;
  name: string;
  description: string;
  badge: string;
  iconName: string;
  defaultSections: ReportSectionType[];
  targetAudience: string;
  estimatedPages: number;
}
