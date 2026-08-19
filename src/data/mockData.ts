import { DemoQuestion, FAQItem, UseCaseData, WorkflowStep } from '../types';

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    name: 'Ask',
    tagline: 'Natural Language Query',
    description: 'Ask any business question in plain English or conversational dialogue.',
    iconName: 'MessageSquareText',
  },
  {
    id: 2,
    name: 'Understand',
    tagline: 'Semantic Intent Mapping',
    description: 'Maps semantic intent against your business schema, timeframes, and KPI definitions.',
    iconName: 'BrainCircuit',
  },
  {
    id: 3,
    name: 'Query',
    tagline: 'Optimized Data Retrieval',
    description: 'Generates optimized queries across SQL, warehouses, sheets, and APIs automatically.',
    iconName: 'Database',
  },
  {
    id: 4,
    name: 'Analyze',
    tagline: 'Multidimensional Slicing',
    description: 'Slices data across regions, product lines, cohorts, and temporal baselines.',
    iconName: 'BarChart3',
  },
  {
    id: 5,
    name: 'Investigate',
    tagline: 'Deep Driver Attribution',
    description: 'Traces statistical variance to isolate primary drivers and downstream effects.',
    iconName: 'SearchCode',
  },
  {
    id: 6,
    name: 'Explain',
    tagline: 'Clear Narrative Synthesis',
    description: 'Converts complex statistical correlations into clear, executive-ready narratives.',
    iconName: 'Sparkles',
  },
  {
    id: 7,
    name: 'Recommend',
    tagline: 'Actionable Next Steps',
    description: 'Suggests concrete operational adjustments to recover metrics and capture growth.',
    iconName: 'CheckCircle2',
  },
];

export const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: 'q1',
    question: 'Why did revenue fall?',
    category: 'Root Cause',
    answer: {
      headline: 'Revenue declined 27% (₹12.5L vs ₹18.2L Expected)',
      summary: 'The primary drag was concentrated in North Region, where Product A orders dropped by 48% due to stockout delays and increased checkout drop-offs.',
      metrics: [
        { label: 'Total Revenue', value: '₹12.5L', trend: '↓ 27%', isPositive: false },
        { label: 'North Region', value: '₹4.2L', trend: '↓ 41%', isPositive: false },
        { label: 'Product A Orders', value: '1,420', trend: '↓ 48%', isPositive: false },
        { label: 'Driver Share', value: '62%', trend: 'Primary', isPositive: false },
      ],
      rootCause: 'North Region fulfillment hub faced 4-day delivery delays, driving an 18% cancellation spike for Product A.',
      recommendation: 'Re-route upcoming northern shipments through West Hub and initiate targeted re-engagement email campaign for affected cart abandoners.',
      confidence: 96,
      evidenceItems: [
        'North Region revenue contribution dropped from 38% to 24%',
        'Product A conversion rate dropped from 3.8% to 1.9% following logistics lag',
        'Customer satisfaction score in North fell by 1.4 points',
      ],
      chartData: [
        { label: 'Week 1', value: 4.8, benchmark: 4.5 },
        { label: 'Week 2', value: 4.6, benchmark: 4.5 },
        { label: 'Week 3', value: 3.1, benchmark: 4.6 },
        { label: 'Week 4', value: 2.8, benchmark: 4.6 },
      ],
    },
  },
  {
    id: 'q2',
    question: 'Which region needs attention?',
    category: 'Regional Health',
    answer: {
      headline: 'North Region requires immediate operational triage',
      summary: 'While South and West regions exceeded target by +6.4%, North posted a ₹3.1L shortfall with rising refund rates.',
      metrics: [
        { label: 'North Region Gap', value: '-₹3.1L', trend: 'Critical', isPositive: false },
        { label: 'West Region', value: '₹14.2L', trend: '↑ 7.8%', isPositive: true },
        { label: 'South Region', value: '₹16.5L', trend: '↑ 5.1%', isPositive: true },
        { label: 'East Region', value: '₹9.1L', trend: '↑ 1.2%', isPositive: true },
      ],
      rootCause: 'Regional supply bottleneck and local courier SLA breaches in 3 metropolitan districts.',
      recommendation: 'Activate secondary carrier in Delhi NCR & Chandigarh; adjust estimated delivery times on product detail pages.',
      confidence: 94,
      evidenceItems: [
        'Courier transit times increased from 36h to 92h',
        'Return-to-origin (RTO) rate surged from 4.1% to 11.8%',
      ],
      chartData: [
        { label: 'West', value: 14.2, benchmark: 13.2 },
        { label: 'South', value: 16.5, benchmark: 15.7 },
        { label: 'East', value: 9.1, benchmark: 9.0 },
        { label: 'North', value: 7.3, benchmark: 10.4 },
      ],
    },
  },
  {
    id: 'q3',
    question: 'What is our best product?',
    category: 'Product Performance',
    answer: {
      headline: 'Product Pro Suite generated ₹24.8L with 42% margin',
      summary: 'Product Pro Suite is outperforming all cohorts, showing high 78% 30-day retention and a 3.2x LTV/CAC ratio.',
      metrics: [
        { label: 'Pro Suite Revenue', value: '₹24.8L', trend: '↑ 34%', isPositive: true },
        { label: 'Gross Margin', value: '42.4%', trend: '↑ 3.2%', isPositive: true },
        { label: 'Repeat Purchase', value: '68%', trend: '↑ 12%', isPositive: true },
        { label: 'NPS Score', value: '76', trend: 'Leader', isPositive: true },
      ],
      rootCause: 'Recent onboarding enhancement increased feature adoption within day 3 by 44%.',
      recommendation: 'Increase paid acquisition budget for Pro Suite by 25% while testing cross-sell prompts for Standard tier users.',
      confidence: 98,
      evidenceItems: [
        'Expansion revenue grew by 22% quarter-over-quarter',
        'Top 100 enterprise customers all have active Pro Suite seats',
      ],
      chartData: [
        { label: 'Jan', value: 14.5, benchmark: 12.0 },
        { label: 'Feb', value: 17.8, benchmark: 14.0 },
        { label: 'Mar', value: 21.2, benchmark: 16.5 },
        { label: 'Apr', value: 24.8, benchmark: 19.0 },
      ],
    },
  },
  {
    id: 'q4',
    question: 'Forecast next month.',
    category: 'Predictive Modeling',
    answer: {
      headline: 'Next month projected at ₹45.8L (+8.3% MoM growth)',
      summary: 'Baseline seasonal trends combined with incoming pipeline suggest accelerated momentum, with an 80% confidence interval of ₹43.5L to ₹48.2L.',
      metrics: [
        { label: 'Projected Total', value: '₹45.8L', trend: '+8.3%', isPositive: true },
        { label: 'Conservative Base', value: '₹43.5L', trend: '+3.1%', isPositive: true },
        { label: 'Optimistic High', value: '₹48.2L', trend: '+14.0%', isPositive: true },
        { label: 'Forecast Accuracy', value: '94.2%', trend: 'Historical', isPositive: true },
      ],
      rootCause: 'Strong retention curve and anticipated enterprise contract renewals closing in week 3.',
      recommendation: 'Lock inventory requirements early for mid-month promotional surge to avoid stockouts.',
      confidence: 91,
      evidenceItems: [
        'Historical backtesting against past 12 months demonstrates 2.8% mean absolute error',
        'Qualified enterprise pipeline up 28% compared to same period last year',
      ],
      chartData: [
        { label: 'M-2', value: 38.0, benchmark: 38.0 },
        { label: 'M-1', value: 40.2, benchmark: 40.2 },
        { label: 'Current', value: 42.3, benchmark: 42.3 },
        { label: 'Next Mo (FC)', value: 45.8, benchmark: 43.5 },
      ],
    },
  },
  {
    id: 'q5',
    question: 'Find unusual patterns.',
    category: 'Anomaly Detection',
    answer: {
      headline: '2 statistical anomalies detected in the last 72 hours',
      summary: '1) Weekend mobile checkout failure rate spiked to 8.4% (normal: 1.2%). 2) Tier-2 cities showed an unexpected 3.4x surge in Organic Signups.',
      metrics: [
        { label: 'Mobile Drop-off', value: '8.4%', trend: '⚠ Alert', isPositive: false },
        { label: 'Tier-2 Organic Surge', value: '+240%', trend: '↑ Opportunity', isPositive: true },
        { label: 'Payment Gateway B', value: '71% Fail', trend: 'Critical', isPositive: false },
        { label: 'Est. Lost Rev', value: '₹1.8L', trend: 'Preventable', isPositive: false },
      ],
      rootCause: 'Gateway B iOS SDK v4.2 update created an unhandled token timeout on Safari browsers.',
      recommendation: 'Temporarily reroute iOS payment traffic to Gateway A and deploy patched SDK build.',
      confidence: 97,
      evidenceItems: [
        'Error logs show 412 Gateway Timeout events on iOS webview',
        'Viral creator mention in Pune & Jaipur drove unassisted tier-2 signups',
      ],
      chartData: [
        { label: 'Thu', value: 1.1, benchmark: 1.2 },
        { label: 'Fri', value: 1.3, benchmark: 1.2 },
        { label: 'Sat', value: 6.8, benchmark: 1.2 },
        { label: 'Sun', value: 8.4, benchmark: 1.2 },
      ],
    },
  },
  {
    id: 'q6',
    question: 'Give me an executive summary.',
    category: 'Executive Overview',
    answer: {
      headline: 'Executive Brief: Q2 Steady Growth with Targeted Operational Focus',
      summary: 'Overall company ARR reached ₹42.3L (+8.2% MoM). Key growth drivers remain West Region enterprise sales and Pro Suite expansion. Primary risk is North logistics.',
      metrics: [
        { label: 'Monthly Run-Rate', value: '₹42.3L', trend: '↑ 8.2%', isPositive: true },
        { label: 'Active Customers', value: '7,892', trend: '↑ 4.7%', isPositive: true },
        { label: 'Health Score', value: '74/100', trend: 'Moderate', isPositive: true },
        { label: 'Operating Profit', value: '₹8.4L', trend: '↑ 5.2%', isPositive: true },
      ],
      rootCause: 'Diversified customer base offsets regional supply chain friction.',
      recommendation: '1. Resolve North carrier bottlenecks. 2. Scale marketing on Pro Suite. 3. Finalize Q3 inventory buffer.',
      confidence: 99,
      evidenceItems: [
        'EBITDA margin maintained at 19.8%',
        'Net Revenue Retention (NRR) holds strong at 116%',
        'Cash runway extended by 4 months',
      ],
      chartData: [
        { label: 'Target', value: 40.0, benchmark: 40.0 },
        { label: 'Actual', value: 42.3, benchmark: 40.0 },
        { label: 'Forecast', value: 45.8, benchmark: 42.0 },
      ],
    },
  },
];

export const USE_CASES: UseCaseData[] = [
  {
    id: 'sales',
    title: 'Sales & Revenue',
    category: 'Commercial',
    description: 'Track pipeline velocities, regional quotas, discount leakages, and high-margin product adoption in real time.',
    metrics: ['Regional Win Rate: 48%', 'Discount Leakage: -2.1%', 'Pipeline Velocity: 18d'],
    sampleQuery: 'Why is Deal Cycle in Enterprise segment 14 days longer this quarter?',
    insightPreview: 'Enterprise deals stalling in Legal Review due to new compliance checkbox requirement.',
    chartType: 'bar',
  },
  {
    id: 'marketing',
    title: 'Marketing & Growth',
    category: 'Acquisition',
    description: 'Diagnose campaign ROI, channel CAC spikes, funnel drop-offs, and multi-touch attribution without SQL scripts.',
    metrics: ['Blended CAC: ₹420', 'ROAS: 4.8x', 'Organic Share: 44%'],
    sampleQuery: 'Which ad creative is driving the highest LTV subscribers?',
    insightPreview: 'Creative #4 ("Workflow Automation") produces 2.4x higher 6-month retention.',
    chartType: 'funnel',
  },
  {
    id: 'finance',
    title: 'Finance & Planning',
    category: 'Financial Operations',
    description: 'Automate revenue recognition breakdowns, OPEX variance analysis, cash runway simulations, and unit economics.',
    metrics: ['Gross Margin: 72%', 'Runway: 18 Months', 'Burn Multiple: 1.1x'],
    sampleQuery: 'What caused our gross margin to compress by 1.8% last month?',
    insightPreview: 'Cloud compute surge in EU cluster alongside increased third-party SMS verification costs.',
    chartType: 'line',
  },
  {
    id: 'operations',
    title: 'Supply Chain & Ops',
    category: 'Logistics',
    description: 'Predict stockouts, monitor carrier SLA compliance, identify return spikes, and pinpoint warehouse bottlenecks.',
    metrics: ['On-Time Delivery: 96.2%', 'RTO Rate: 3.8%', 'Fill Rate: 99.1%'],
    sampleQuery: 'Which SKU is at risk of stockout within the next 14 days?',
    insightPreview: 'SKU-882 (Airflow Core) will deplete in 9 days at current velocity without reorder.',
    chartType: 'gauge',
  },
  {
    id: 'leadership',
    title: 'Executive Leadership',
    category: 'Strategic',
    description: 'Receive synthesized morning briefings, unified KPI health scores, proactive alerts, and board-ready reports.',
    metrics: ['Company Health: 74/100', 'MoM Growth: +8.2%', 'Net Retention: 116%'],
    sampleQuery: 'Summarize the 3 biggest risks and 3 biggest opportunities for our board meeting.',
    insightPreview: 'Risks: North supply lag, EU hosting costs, Carrier B SLA. Opportunities: Pro Suite upgrade, Tier-2 organic, Q3 pipeline.',
    chartType: 'bar',
  },
];

export const FAQS: FAQItem[] = [
  {
    question: 'What is InsightAI?',
    answer: 'InsightAI is an autonomous AI Data Analyst Agent built for business teams. Rather than just rendering passive charts, InsightAI actively monitors your data, investigates why metrics change, pinpoints root causes, and recommends high-impact operational decisions.',
  },
  {
    question: 'What data can it analyze?',
    answer: 'InsightAI is architected to connect with tabular and relational business data, including sales orders, marketing campaigns, customer cohorts, financial ledgers, inventory logs, and product analytics tables.',
  },
  {
    question: 'Can it work with Excel & CSV files?',
    answer: 'Yes! You will be able to simply drag-and-drop your Excel workbooks (.xlsx, .xls) and CSV exports directly into InsightAI for instant multi-sheet cross-correlation and analysis.',
  },
  {
    question: 'Can it connect directly to databases and warehouses?',
    answer: 'InsightAI is designed to integrate with major data sources including PostgreSQL, MySQL, Google Sheets, Snowflake, BigQuery, and custom REST API webhooks through secure, read-only connectors.',
  },
  {
    question: 'How does anomaly detection work?',
    answer: 'InsightAI establishes rolling seasonal baselines, moving average confidence intervals, and multi-dimensional variance thresholds. When a metric breaches expected statistical boundaries, the agent flags it immediately.',
  },
  {
    question: 'Can it forecast future metrics?',
    answer: 'Yes. InsightAI uses ensemble time-series modeling with confidence bands (P10, P50, P90) to project upcoming 30-day, 60-day, and quarterly metrics based on historical seasonality and underlying pipeline drivers.',
  },
  {
    question: 'How does root-cause analysis work?',
    answer: 'When a top-level metric (e.g. Revenue) changes, InsightAI recursively decomposes the change across all dimensional hierarchies (regions, channels, cohorts, SKUs, delivery SLAs) to isolate the single highest contributor.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Security and privacy are fundamental. In our enterprise architecture, your raw business data is processed through strictly isolated, read-only scopes with zero training on customer proprietary data.',
  },
  {
    question: 'Can teams have different permissions and role-based access?',
    answer: 'Yes. Granular Role-Based Access Control (RBAC) allows administrators to restrict access by department (e.g., Sales, Finance, Executive), mask sensitive PII, and maintain comprehensive audit logs.',
  },
  {
    question: 'Can InsightAI generate executive reports?',
    answer: 'Yes. InsightAI can compile any investigation or periodic health review into a clean, executive-ready PDF or shareable interactive briefing complete with summaries, charts, evidence, and next steps.',
  },
];

export const DATA_SOURCES = [
  { name: 'CSV & Spreadsheets', type: 'Flat Files', icon: 'FileSpreadsheet', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', tag: 'Instant Import' },
  { name: 'Microsoft Excel', type: 'Workbooks', icon: 'Table2', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', tag: '.xlsx / .xls' },
  { name: 'PostgreSQL', type: 'Relational DB', icon: 'Database', color: 'bg-blue-50 text-blue-700 border-blue-200', tag: 'Live Sync' },
  { name: 'MySQL', type: 'Relational DB', icon: 'HardDrive', color: 'bg-amber-50 text-amber-700 border-amber-200', tag: 'Live Sync' },
  { name: 'Google Sheets', type: 'Cloud Sheets', icon: 'Sheet', color: 'bg-teal-50 text-teal-700 border-teal-200', tag: 'Realtime Webhook' },
  { name: 'REST & GraphQL API', type: 'Data Streams', icon: 'Webhook', color: 'bg-purple-50 text-purple-700 border-purple-200', tag: 'Custom Feeds' },
];
