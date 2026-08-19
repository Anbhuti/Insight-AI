import React from 'react';
import {
  Sparkles,
  Bot,
  Database,
  Terminal,
  AlertCircle,
  TrendingUp,
  Bell,
  FileText,
  PlugZap,
  Settings,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  ArrowLeft,
} from 'lucide-react';
import { AppSubRoute } from '../../types/dashboard';

interface SubRoutePlaceholderProps {
  route: AppSubRoute;
  onNavigateToOverview: () => void;
  onNavigateSubRoute: (route: AppSubRoute) => void;
}

interface PlaceholderConfig {
  title: string;
  subtitle: string;
  badge: string;
  phase: string;
  description: string;
  highlights: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const CONFIGS: Record<AppSubRoute, PlaceholderConfig> = {
  overview: {
    title: 'Business Overview',
    subtitle: 'Consolidated dashboard and executive KPIs',
    badge: 'Phase 4',
    phase: 'Active',
    description: 'Real-time metrics, regional revenue performance, top products, and AI business observations.',
    highlights: ['Revenue & Profit Sparklines', 'Regional Performance Matrix', 'Automated Anomaly Previews'],
    icon: Sparkles,
  },
  analyst: {
    title: 'AI Data Analyst Workspace',
    subtitle: 'Conversational natural language business intelligence agent',
    badge: 'Phase 6',
    phase: 'AI Agent Engine',
    description: 'Ask deep diagnostic questions about your business in plain English. The agent formulates hypotheses, queries underlying datasets, detects variance drivers, and produces structured visual evidence.',
    highlights: [
      'Multi-step Autonomous Reasoning Loop',
      'Multivariate Root-Cause Attribution',
      'Automated Executive Action Summaries',
    ],
    icon: Bot,
  },
  datasets: {
    title: 'Dataset Management',
    subtitle: 'Ingestion pipelines, schemas & data profiling',
    badge: 'Phase 5',
    phase: 'Data Ingestion',
    description: 'Upload and connect tabular datasets via CSV, Excel, Google Sheets, or direct SQL database connections with automated type inference and statistical profiling.',
    highlights: [
      'Instant CSV & Excel File Parsing',
      'Automated Data Profiling & Null Detection',
      'Semantic Column Type Classification',
    ],
    icon: Database,
  },
  sql: {
    title: 'SQL Analytics Workspace',
    subtitle: 'Integrated query editor with AI semantic assistant',
    badge: 'Phase 7',
    phase: 'SQL Intelligence',
    description: 'Write, debug, and optimize complex SQL queries directly against your data warehouse with AI schema-aware syntax auto-completion and performance hints.',
    highlights: [
      'Schema-Aware Query Auto-Generation',
      'Execution Plan Performance Diagnostics',
      'One-Click Table & Chart Visualizer',
    ],
    icon: Terminal,
  },
  anomalies: {
    title: 'Autonomous Anomaly Surveillance',
    subtitle: 'Statistical outlier detection & early alerts',
    badge: 'Phase 8',
    phase: 'Surveillance Engine',
    description: 'Continuous background monitoring across all your business dimensions. Catch sudden margin drops, regional dips, or conversion bottlenecks before they impact revenue.',
    highlights: [
      'Dynamic Standard-Deviation Bands',
      'Multivariate Contextual Isolation',
      'Automated Root-Cause Hypothesis Generation',
    ],
    icon: AlertCircle,
  },
  forecasts: {
    title: 'Predictive Forecasting & Scenarios',
    subtitle: 'Machine learning time-series projections',
    badge: 'Phase 9',
    phase: 'Predictive Modeling',
    description: 'Prophet and ARIMA-based predictive forecasting with configurable seasonality, confidence intervals, and what-if scenario simulations.',
    highlights: [
      '30-to-90 Day Revenue & Demand Projections',
      'Scenario Multipliers & Price Elasticity Simulation',
      'Confidence Band Intervals (95% CI)',
    ],
    icon: TrendingUp,
  },
  alerts: {
    title: 'Real-Time Alert Channels',
    subtitle: 'Automated notification rules & webhooks',
    badge: 'Phase 8',
    phase: 'Alert Management',
    description: 'Configure intelligent alert triggers via Slack, Microsoft Teams, Webhooks, or Email with threshold condition rules and automated diagnostic snapshots.',
    highlights: [
      'Slack & Email Real-Time Webhooks',
      'Custom KPI Threshold Trigger Rules',
      'AI Incident Briefs Attached to Alerts',
    ],
    icon: Bell,
  },
  reports: {
    title: 'Executive PDF & Slide Reports',
    subtitle: 'Automated periodic intelligence briefings',
    badge: 'Phase 10',
    phase: 'Report Studio',
    description: 'Generate polished executive briefings, board presentations, and weekly departmental reports with rich visual charts and AI narrative summaries with one click.',
    highlights: [
      'One-Click Board-Ready PDF Exports',
      'Weekly Automated Email Digests',
      'Custom White-Label Corporate Branding',
    ],
    icon: FileText,
  },
  'data-sources': {
    title: 'Data Sources & Connectors',
    subtitle: 'Direct cloud warehouse & SaaS integrations',
    badge: 'Phase 5',
    phase: 'Ecosystem Connectors',
    description: 'Native zero-ETL connectors for PostgreSQL, MySQL, Snowflake, BigQuery, Google Sheets, Stripe, and Shopify.',
    highlights: [
      'Secure Read-Only Credential Vault',
      'Scheduled Automatic Sync Cadence',
      'Real-Time CDC (Change Data Capture)',
    ],
    icon: PlugZap,
  },
  'root-cause': {
    title: 'Root Cause Analysis Engine',
    subtitle: 'Mathematical driver attribution & hypothesis testing',
    badge: 'Phase 10',
    phase: 'RCA Engine',
    description: 'Investigate why business metrics shift using dimension contribution analysis, waterfall charts, metric decomposition, and evidence-grounded hypotheses.',
    highlights: [
      'Mathematical Period Comparison & Drivers',
      'Segment Contribution Waterfall Visuals',
      'Verified Facts & AI Evidence Synthesis',
    ],
    icon: Layers,
  },
  audit: {
    title: 'Enterprise Audit Logs & Compliance',
    subtitle: 'Immutable, tamper-evident security tracking and compliance review',
    badge: 'Phase 15',
    phase: 'Security & Compliance',
    description: 'Full-spectrum server-side audit logging with SHA-256 chained hash integrity verification, advanced filtering, and export controls for SOC2/ISO compliance.',
    highlights: [
      'Server-Authoritative Tamper-Proof Audit Trail',
      'Cryptographic SHA-256 Integrity Verification',
      'SOC2 / ISO 27001 Compliance Export Studio',
    ],
    icon: Shield,
  },
  settings: {
    title: 'Workspace Settings & Profile',
    subtitle: 'Organization preferences, team members & security',
    badge: 'Phase 4',
    phase: 'Workspace Management',
    description: 'Configure your organization profile, manage authentication preferences, security audit controls, and platform billing.',
    highlights: [
      'Firebase Authentication & SSO Profile',
      'Role-Based Workspace Access Controls',
      'Security & Audit Logging Compliance',
    ],
    icon: Settings,
  },
};

export const SubRoutePlaceholder: React.FC<SubRoutePlaceholderProps> = ({
  route,
  onNavigateToOverview,
  onNavigateSubRoute,
}) => {
  const config = CONFIGS[route] || CONFIGS.analyst;
  const Icon = config.icon;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-50/80 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
                  {config.phase}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {config.badge}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {config.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onNavigateToOverview}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mb-8">
          {config.description}
        </p>

        {/* Feature Highlights Grid */}
        <div className="border-t border-slate-100 pt-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Planned Capabilities in this Workspace
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {config.highlights.map((highlight, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs font-semibold text-slate-800 flex items-start gap-2.5"
              >
                <div className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span className="leading-snug">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Notice Card */}
      <div className="bg-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold mb-2">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span>InsightAI Architecture Roadmap</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Currently Operating in Phase 4 (Dashboard & Shell Architecture)
          </h3>
          <p className="text-xs text-indigo-200/80 max-w-xl">
            This module will be activated with live datasets and full AI reasoning capabilities in future phases.
          </p>
        </div>

        <button
          onClick={onNavigateToOverview}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
        >
          Explore Live Dashboard
        </button>
      </div>

    </div>
  );
};
