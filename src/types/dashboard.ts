export type AppSubRoute =
  | 'overview'
  | 'analyst'
  | 'datasets'
  | 'sql'
  | 'anomalies'
  | 'root-cause'
  | 'forecasts'
  | 'alerts'
  | 'reports'
  | 'data-sources'
  | 'audit'
  | 'settings';

export interface DashboardKPI {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  comparisonLabel: string;
  sparkline: number[];
  statusColor?: string;
}

export interface RevenueDataPoint {
  date: string;
  currentRevenue: number; // in thousands/Lakhs
  currentRevenueFormatted: string;
  previousRevenue: number;
  previousRevenueFormatted: string;
  orders: number;
}

export interface RevenueSummaryData {
  currentTotal: string;
  previousTotal: string;
  growthPct: string;
  observation: string;
}

export interface HealthMetric {
  name: string;
  score: number;
  maxScore: number;
  color: string;
}

export interface BusinessHealthData {
  score: number;
  maxScore: number;
  status: 'Healthy' | 'Needs Attention' | 'Critical';
  metrics: HealthMetric[];
}

export interface AISummaryData {
  headline: string;
  paragraphs: string[];
  recommendation: string;
  confidenceScore: number;
}

export interface RegionalPerformance {
  region: string;
  revenue: string;
  growth: string;
  isPositive: boolean;
  orders: string;
  status: 'Healthy' | 'Attention' | 'Critical';
}

export interface ProductPerformance {
  name: string;
  revenue: string;
  growth: string;
  isPositive: boolean;
  sharePct: number;
}

export interface RecentInsight {
  id: string;
  category: 'Revenue' | 'Operations' | 'Product' | 'Customer';
  title: string;
  description: string;
  timestamp: string;
  badgeColor: string;
}

export interface AnomalyPreviewData {
  metric: string;
  dimension: string;
  deviation: string;
  detectedTime: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ForecastPreviewData {
  currentValue: string;
  forecastValue: string;
  expectedGrowth: string;
  confidenceInterval: string;
  historicalPoints: number[];
  forecastPoints: number[];
}

export interface DatasetSummaryItem {
  id: string;
  name: string;
  type: 'CSV' | 'Excel' | 'Database' | 'Google Sheets' | 'API';
  lastUpdated: string;
  status: 'Ready' | 'Syncing' | 'Error';
  rowCount: string;
}

export type DateRange =
  | 'Today'
  | 'Last 7 days'
  | 'Last 30 days'
  | 'Last 90 days'
  | 'This year'
  | 'Custom range';
