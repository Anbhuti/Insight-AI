import React from 'react';
import { Sparkles, ArrowRight, FileText, AlertCircle } from 'lucide-react';
import { KPICard } from './KPICard';
import { RevenueChart } from './RevenueChart';
import { BusinessHealthCard } from './BusinessHealthCard';
import { AISummaryCard } from './AISummaryCard';
import { RegionalPerformanceTable } from './RegionalPerformanceTable';
import { TopProducts } from './TopProducts';
import { RecentInsights } from './RecentInsights';
import { AnomalyPreview } from './AnomalyPreview';
import { ForecastPreview } from './ForecastPreview';
import { DatasetStatus } from './DatasetStatus';
import { QuickActions } from './QuickActions';
import {
  DASHBOARD_KPIS,
  REVENUE_CHART_DATA,
  REVENUE_SUMMARY,
  BUSINESS_HEALTH_DATA,
  AI_BUSINESS_SUMMARY,
  REGIONAL_PERFORMANCE_DATA,
  TOP_PRODUCTS_DATA,
  RECENT_INSIGHTS_DATA,
  ANOMALY_PREVIEW_DATA,
  FORECAST_PREVIEW_DATA,
  DATASET_STATUS_DATA,
} from '../../data/dashboardMockData';
import { AppSubRoute, RecentInsight } from '../../types/dashboard';

interface OverviewViewProps {
  onNavigateSubRoute: (route: AppSubRoute) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigateSubRoute }) => {
  const handleInsightClick = (insight: RecentInsight) => {
    onNavigateSubRoute('analyst');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Main Dashboard Header & CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Business Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            A quick view of what is happening across your business.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateSubRoute('reports')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>View Reports</span>
          </button>

          <button
            onClick={() => onNavigateSubRoute('analyst')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask InsightAI</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 2. Four Major KPI Cards */}
      <section aria-label="Key Performance Indicators">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DASHBOARD_KPIS.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </section>

      {/* 3. Large Revenue Analytics Performance Chart */}
      <section aria-label="Revenue Performance">
        <RevenueChart
          data={REVENUE_CHART_DATA}
          summary={REVENUE_SUMMARY}
        />
      </section>

      {/* 4. Business Health & AI Summary Dual Grid */}
      <section aria-label="Business Health and AI Summary">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BusinessHealthCard health={BUSINESS_HEALTH_DATA} />
          <AISummaryCard
            summary={AI_BUSINESS_SUMMARY}
            onInvestigate={() => onNavigateSubRoute('analyst')}
          />
        </div>
      </section>

      {/* 5. Regional Performance & Top Products Dual Grid */}
      <section aria-label="Breakdowns by Territory and Product">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RegionalPerformanceTable data={REGIONAL_PERFORMANCE_DATA} />
          </div>
          <div className="lg:col-span-1">
            <TopProducts products={TOP_PRODUCTS_DATA} />
          </div>
        </div>
      </section>

      {/* 6. Recent AI Insights */}
      <section aria-label="Recent Insights">
        <RecentInsights
          insights={RECENT_INSIGHTS_DATA}
          onViewAnalysis={handleInsightClick}
        />
      </section>

      {/* 7. Anomaly Preview, Forecast Preview & Connected Datasets Triple Grid */}
      <section aria-label="Surveillance and Pipelines">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnomalyPreview
            data={ANOMALY_PREVIEW_DATA}
            onViewAnomalies={() => onNavigateSubRoute('anomalies')}
          />
          <ForecastPreview
            data={FORECAST_PREVIEW_DATA}
            onViewForecasts={() => onNavigateSubRoute('forecasts')}
          />
          <DatasetStatus
            datasets={DATASET_STATUS_DATA}
            onViewDatasets={() => onNavigateSubRoute('datasets')}
          />
        </div>
      </section>

      {/* 8. Quick Actions Toolbar */}
      <section aria-label="Quick Actions">
        <QuickActions
          onAskInsightAI={() => onNavigateSubRoute('analyst')}
          onUploadDataset={() => onNavigateSubRoute('datasets')}
          onViewReports={() => onNavigateSubRoute('reports')}
          onViewAlerts={() => onNavigateSubRoute('alerts')}
        />
      </section>

    </div>
  );
};
