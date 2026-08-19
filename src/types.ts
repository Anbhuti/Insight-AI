export * from './types/database';

export interface NavItem {
  label: string;
  href: string;
}

export interface MetricCardData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtitle?: string;
  badge?: string;
}

export interface AnomalyItem {
  metric: string;
  actual: string;
  expected: string;
  variance: string;
  status: 'critical' | 'warning' | 'healthy';
  region: string;
  driver: string;
}

export interface WorkflowStep {
  id: number;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
}

export interface DemoQuestion {
  id: string;
  question: string;
  category: string;
  answer: {
    headline: string;
    summary: string;
    metrics: { label: string; value: string; trend?: string; isPositive?: boolean }[];
    rootCause?: string;
    recommendation: string;
    confidence: number;
    evidenceItems: string[];
    chartData?: { label: string; value: number; benchmark?: number }[];
  };
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface UseCaseData {
  id: string;
  title: string;
  category: string;
  description: string;
  metrics: string[];
  sampleQuery: string;
  insightPreview: string;
  chartType: 'bar' | 'line' | 'funnel' | 'gauge';
}
