import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Megaphone, 
  IndianRupee, 
  Truck, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { USE_CASES } from '../data/mockData';

export const UseCasesSection: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('sales');

  const activeCase = USE_CASES.find((c) => c.id === selectedCaseId) || USE_CASES[0];

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'sales':
        return <TrendingUp className="w-4 h-4" />;
      case 'marketing':
        return <Megaphone className="w-4 h-4" />;
      case 'finance':
        return <IndianRupee className="w-4 h-4" />;
      case 'operations':
        return <Truck className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  return (
    <section id="use-cases" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Tailored Departmental Solutions"
          badgeIcon={<Users className="w-3.5 h-3.5" />}
          title={
            <>
              One intelligent analyst. <br />
              <span className="text-indigo-600">Every team.</span>
            </>
          }
          subtitle="InsightAI speaks the domain language of every business function, eliminating friction between data engineering and commercial decision-makers."
          className="mb-14"
        />

        {/* Department Tab Switcher */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {USE_CASES.map((uc) => {
            const isSelected = selectedCaseId === uc.id;
            return (
              <button
                key={uc.id}
                onClick={() => setSelectedCaseId(uc.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-102'
                    : 'bg-white text-slate-600 hover:bg-slate-100/80 border border-slate-200/80'
                }`}
              >
                {getCategoryIcon(uc.id)}
                <span>{uc.title}</span>
              </button>
            );
          })}
        </div>

        {/* Large White Rounded Container for Active Use Case Experience */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-14 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Department Detail & Capabilities (6 cols on lg) */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 w-max border border-indigo-100">
                <Sparkles className="w-3 h-3" />
                <span>{activeCase.category} Intelligence</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeCase.title}
              </h3>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {activeCase.description}
              </p>

              {/* Sample Natural Language Query */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Example Executive Query:
                </span>
                <div className="text-sm font-semibold text-slate-900 italic">
                  "{activeCase.sampleQuery}"
                </div>
              </div>

              {/* Verified Key Metrics Pill Matrix */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Core Tracked Benchmarks:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeCase.metrics.map((metric) => (
                    <span
                      key={metric}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {metric}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Miniature Interactive Dashboard Visualization (6 cols on lg) */}
            <div className="lg:col-span-6 bg-slate-50/90 rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col gap-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {activeCase.title} Diagnostic Panel
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  ● Realtime Stream
                </span>
              </div>

              {/* Synthetic Visual Representation */}
              {activeCase.id === 'sales' && (
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Pipeline Velocity</span>
                      <div className="text-lg font-bold text-slate-900">18.2 Days</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">↑ 14% Faster</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Enterprise Win Rate</span>
                      <div className="text-lg font-bold text-slate-900">48.4%</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">↑ +6.2% QoQ</span>
                  </div>
                </div>
              )}

              {activeCase.id === 'marketing' && (
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Blended CAC</span>
                      <div className="text-lg font-bold text-slate-900">₹420 / Acquired</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">↓ 18% Lower</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">ROAS on Paid Channels</span>
                      <div className="text-lg font-bold text-slate-900">4.8x Return</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Top Quartile</span>
                  </div>
                </div>
              )}

              {activeCase.id === 'finance' && (
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Gross Margin</span>
                      <div className="text-lg font-bold text-slate-900">72.4%</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">↑ +1.2% MoM</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Net Runway</span>
                      <div className="text-lg font-bold text-slate-900">18.5 Months</div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600">Capital Efficient</span>
                  </div>
                </div>
              )}

              {activeCase.id === 'operations' && (
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">On-Time SLA Delivery</span>
                      <div className="text-lg font-bold text-slate-900">96.2%</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">✓ In Target</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Predicted Stockouts</span>
                      <div className="text-lg font-bold text-rose-600">1 SKU Alert</div>
                    </div>
                    <span className="text-xs font-bold text-rose-600">Auto Reorder Active</span>
                  </div>
                </div>
              )}

              {activeCase.id === 'leadership' && (
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Consolidated Vital Health</span>
                      <div className="text-lg font-bold text-slate-900">74 / 100</div>
                    </div>
                    <span className="text-xs font-bold text-amber-600">Needs Attention</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Net Revenue Retention (NRR)</span>
                      <div className="text-lg font-bold text-slate-900">116%</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Expansion Strong</span>
                  </div>
                </div>
              )}

              {/* Insight AI Response Callout */}
              <div className="p-3.5 rounded-xl bg-indigo-50/90 border border-indigo-100 text-xs text-indigo-950 font-medium">
                <strong>InsightAI Finding:</strong> {activeCase.insightPreview}
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
