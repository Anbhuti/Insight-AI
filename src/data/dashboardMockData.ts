import {
  DashboardKPI,
  RevenueDataPoint,
  RevenueSummaryData,
  BusinessHealthData,
  AISummaryData,
  RegionalPerformance,
  ProductPerformance,
  RecentInsight,
  AnomalyPreviewData,
  ForecastPreviewData,
  DatasetSummaryItem,
} from '../types/dashboard';

export const DASHBOARD_KPIS: DashboardKPI[] = [
  {
    id: 'kpi-revenue',
    title: 'Revenue',
    value: '₹42.3L',
    change: '+8.2%',
    isPositive: true,
    comparisonLabel: 'vs previous period',
    sparkline: [32, 34, 33, 37, 36, 39, 41, 40, 42.3],
  },
  {
    id: 'kpi-orders',
    title: 'Orders',
    value: '18,421',
    change: '+4.7%',
    isPositive: true,
    comparisonLabel: 'vs previous period',
    sparkline: [16800, 17100, 17050, 17400, 17600, 17900, 18100, 18350, 18421],
  },
  {
    id: 'kpi-customers',
    title: 'Customers',
    value: '7,892',
    change: '+6.3%',
    isPositive: true,
    comparisonLabel: 'vs previous period',
    sparkline: [7100, 7250, 7300, 7420, 7500, 7650, 7720, 7810, 7892],
  },
  {
    id: 'kpi-profit',
    title: 'Profit',
    value: '₹8.4L',
    change: '+5.2%',
    isPositive: true,
    comparisonLabel: 'vs previous period',
    sparkline: [7.2, 7.4, 7.3, 7.6, 7.8, 7.9, 8.1, 8.2, 8.4],
  },
];

export const REVENUE_CHART_DATA: RevenueDataPoint[] = [
  { date: 'Jul 15', currentRevenue: 1.12, currentRevenueFormatted: '₹1.12L', previousRevenue: 1.05, previousRevenueFormatted: '₹1.05L', orders: 480 },
  { date: 'Jul 18', currentRevenue: 1.25, currentRevenueFormatted: '₹1.25L', previousRevenue: 1.10, previousRevenueFormatted: '₹1.10L', orders: 512 },
  { date: 'Jul 21', currentRevenue: 1.18, currentRevenueFormatted: '₹1.18L', previousRevenue: 1.15, previousRevenueFormatted: '₹1.15L', orders: 495 },
  { date: 'Jul 24', currentRevenue: 1.34, currentRevenueFormatted: '₹1.34L', previousRevenue: 1.22, previousRevenueFormatted: '₹1.22L', orders: 560 },
  { date: 'Jul 27', currentRevenue: 1.42, currentRevenueFormatted: '₹1.42L', previousRevenue: 1.28, previousRevenueFormatted: '₹1.28L', orders: 590 },
  { date: 'Jul 30', currentRevenue: 1.39, currentRevenueFormatted: '₹1.39L', previousRevenue: 1.31, previousRevenueFormatted: '₹1.31L', orders: 580 },
  { date: 'Aug 02', currentRevenue: 1.55, currentRevenueFormatted: '₹1.55L', previousRevenue: 1.34, previousRevenueFormatted: '₹1.34L', orders: 630 },
  { date: 'Aug 05', currentRevenue: 1.62, currentRevenueFormatted: '₹1.62L', previousRevenue: 1.41, previousRevenueFormatted: '₹1.41L', orders: 672 },
  { date: 'Aug 08', currentRevenue: 1.58, currentRevenueFormatted: '₹1.58L', previousRevenue: 1.45, previousRevenueFormatted: '₹1.45L', orders: 650 },
  { date: 'Aug 11', currentRevenue: 1.76, currentRevenueFormatted: '₹1.76L', previousRevenue: 1.50, previousRevenueFormatted: '₹1.50L', orders: 710 },
  { date: 'Aug 12', currentRevenue: 1.82, currentRevenueFormatted: '₹1.82L', previousRevenue: 1.52, previousRevenueFormatted: '₹1.52L', orders: 742 },
  { date: 'Aug 14', currentRevenue: 1.89, currentRevenueFormatted: '₹1.89L', previousRevenue: 1.55, previousRevenueFormatted: '₹1.55L', orders: 765 },
];

export const REVENUE_SUMMARY: RevenueSummaryData = {
  currentTotal: '₹42.3L',
  previousTotal: '₹39.1L',
  growthPct: '+8.2%',
  observation: 'Revenue is trending upward, with the strongest growth occurring during the second half of the period.',
};

export const BUSINESS_HEALTH_DATA: BusinessHealthData = {
  score: 74,
  maxScore: 100,
  status: 'Needs Attention',
  metrics: [
    { name: 'Revenue', score: 82, maxScore: 100, color: 'bg-indigo-600' },
    { name: 'Customers', score: 78, maxScore: 100, color: 'bg-emerald-500' },
    { name: 'Orders', score: 69, maxScore: 100, color: 'bg-amber-500' },
    { name: 'Profit', score: 72, maxScore: 100, color: 'bg-blue-500' },
  ],
};

export const AI_BUSINESS_SUMMARY: AISummaryData = {
  headline: 'Revenue is growing 8.2% compared with the previous period.',
  paragraphs: [
    'Revenue is growing 8.2% compared with the previous period, driven primarily by strong adoption of Product A in the South and West territories.',
    'However, order volume in the North Region has declined 4.1% due to logistical delays and may require immediate operational investigation.',
  ],
  recommendation: 'Audit North regional dispatch fulfillment latency and reinforce regional customer loyalty perks.',
  confidenceScore: 94,
};

export const REGIONAL_PERFORMANCE_DATA: RegionalPerformance[] = [
  { region: 'North', revenue: '₹8.2L', growth: '-4.1%', isPositive: false, orders: '3,421', status: 'Attention' },
  { region: 'South', revenue: '₹12.4L', growth: '+11.8%', isPositive: true, orders: '5,231', status: 'Healthy' },
  { region: 'East', revenue: '₹9.8L', growth: '+7.4%', isPositive: true, orders: '4,120', status: 'Healthy' },
  { region: 'West', revenue: '₹11.9L', growth: '+9.2%', isPositive: true, orders: '5,649', status: 'Healthy' },
];

export const TOP_PRODUCTS_DATA: ProductPerformance[] = [
  { name: 'Product A', revenue: '₹8.4L', growth: '+12.4%', isPositive: true, sharePct: 35 },
  { name: 'Product B', revenue: '₹6.9L', growth: '+8.1%', isPositive: true, sharePct: 28 },
  { name: 'Product C', revenue: '₹5.8L', growth: '+5.7%', isPositive: true, sharePct: 22 },
  { name: 'Product D', revenue: '₹4.3L', growth: '-2.4%', isPositive: false, sharePct: 15 },
];

export const RECENT_INSIGHTS_DATA: RecentInsight[] = [
  {
    id: 'ins-1',
    category: 'Revenue',
    title: 'Revenue Growth',
    description: 'Revenue increased 8.2% this period, outperforming the quarterly target baseline.',
    timestamp: '2 hours ago',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'ins-2',
    category: 'Operations',
    title: 'Regional Decline',
    description: 'North Region performance declined 4.1% across second-week order batch processing.',
    timestamp: '4 hours ago',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'ins-3',
    category: 'Product',
    title: 'Product Opportunity',
    description: 'Product A has the strongest growth (+12.4%) with increasing gross basket size.',
    timestamp: '1 day ago',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'ins-4',
    category: 'Customer',
    title: 'Customer Trend',
    description: 'Repeat customers increased 6.3% following the updated loyalty checkout incentive.',
    timestamp: '2 days ago',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

export const ANOMALY_PREVIEW_DATA: AnomalyPreviewData = {
  metric: 'Revenue',
  dimension: 'North Region',
  deviation: '31% below expected',
  detectedTime: 'Detected 2 hours ago',
  severity: 'high',
};

export const FORECAST_PREVIEW_DATA: ForecastPreviewData = {
  currentValue: '₹42.3L',
  forecastValue: '₹45.8L',
  expectedGrowth: '+8.3%',
  confidenceInterval: '95% CI (₹44.1L - ₹47.2L)',
  historicalPoints: [34, 36, 38, 40, 42.3],
  forecastPoints: [42.3, 43.4, 44.5, 45.2, 45.8],
};

export const DATASET_STATUS_DATA: DatasetSummaryItem[] = [
  {
    id: 'ds-sales',
    name: 'Sales Data',
    type: 'CSV',
    lastUpdated: 'Today',
    status: 'Ready',
    rowCount: '48,250 rows',
  },
  {
    id: 'ds-customers',
    name: 'Customer Data',
    type: 'Excel',
    lastUpdated: 'Yesterday',
    status: 'Ready',
    rowCount: '12,900 rows',
  },
  {
    id: 'ds-orders',
    name: 'Orders',
    type: 'Database',
    lastUpdated: '2 days ago',
    status: 'Ready',
    rowCount: '184,200 rows',
  },
];
