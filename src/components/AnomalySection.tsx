import React, { useState } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  ArrowDownRight, 
  ArrowUpRight, 
  ShieldAlert, 
  Sparkles, 
  Filter, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';

export const AnomalySection: React.FC = () => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<'revenue' | 'conversion' | 'cancellation'>('revenue');

  return (
    <section id="anomalies" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Automated Pattern & Outlier Detection"
          badgeIcon={<AlertTriangle className="w-3.5 h-3.5" />}
          title={
            <>
              What changed? <br />
              <span className="text-indigo-600">InsightAI finds out.</span>
            </>
          }
          subtitle="Continuous multi-series statistical monitoring catches revenue dips, margin compression, and checkout failures the moment they deviate from seasonal baselines."
          className="mb-14"
        />

        {/* Large Anomaly Dashboard Container */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          {/* Top Bar with Anomaly Alert Pill */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-sm font-bold text-slate-900">
                Live Anomaly Detector
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                1 Critical Alert
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Baseline Window:</span>
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Last 30 Rolling Days</span>
              </div>
            </div>
          </div>

          {/* Main Anomaly Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left: Top-Level Critical Breach Card (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-rose-50/70 via-white to-orange-50/40 rounded-2xl p-6 sm:p-8 border border-rose-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100/90 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Critical Metric Variance
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Confidence: 98.4%</span>
                </div>

                <h3 className="text-sm font-medium text-slate-600 mb-1">Total Monitored Revenue</h3>
                
                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                    ₹12.5L
                  </span>
                  <span className="text-lg font-bold text-rose-600 flex items-center">
                    <ArrowDownRight className="w-5 h-5" /> -31.3%
                  </span>
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-rose-100 text-xs text-slate-600 space-y-1.5 my-4">
                  <div className="flex justify-between">
                    <span>Expected Seasonal Range:</span>
                    <strong className="text-slate-900">₹17.8L – ₹18.5L</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Statistical Deviation:</span>
                    <strong className="text-rose-600">-3.4σ from moving mean</strong>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-medium pt-4 border-t border-rose-100 flex items-center justify-between">
                <span>Triggered: 14 mins ago</span>
                <span className="text-indigo-600 font-bold">Investigation Complete ✓</span>
              </div>
            </div>

            {/* Right: AI Investigation Breakdown (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    AI Investigation Findings
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Factor 1: North Region */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-indigo-300 transition-colors">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Primary Region</span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">North Region</h4>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Revenue</span>
                      <span className="text-sm font-bold text-rose-600">↓ 41%</span>
                    </div>
                  </div>

                  {/* Factor 2: Product A */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-indigo-300 transition-colors">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Primary SKU</span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">Product A</h4>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Orders</span>
                      <span className="text-sm font-bold text-rose-600">↓ 48%</span>
                    </div>
                  </div>

                  {/* Factor 3: Cancellation Rate */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-indigo-300 transition-colors">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Operational Friction</span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">Cancellations</h4>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Rate Spike</span>
                      <span className="text-sm font-bold text-rose-600">↑ 18%</span>
                    </div>
                  </div>

                </div>

                {/* Synthesis Banner */}
                <div className="mt-5 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="text-indigo-900 font-bold">Insight Synthesis:</strong> The anomaly is not widespread across your catalog. It is isolated specifically to Product A delivery delays in Northern zip codes, allowing targeted intervention without changing global ad campaigns.
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> 14 other metric streams operating within normal limits
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
