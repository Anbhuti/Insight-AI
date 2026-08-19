import React from 'react';
import { 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  TrendingUp,
  Users,
  ShoppingBag,
  IndianRupee,
  PieChart
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';

export const BusinessHealth: React.FC = () => {
  return (
    <section id="business-health" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Executive Synthesis"
          badgeIcon={<Activity className="w-3.5 h-3.5" />}
          title={
            <>
              Know your business <br />
              <span className="text-indigo-600">at a glance.</span>
            </>
          }
          subtitle="InsightAI continuously scores overall organizational vitals, combining growth metrics, margins, and operational risk into a single health index."
          className="mb-14"
        />

        {/* Large White Rounded Dashboard Card */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-14 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Overall Health Score Circular Index (4 cols on lg) */}
            <div className="lg:col-span-4 bg-gradient-to-b from-amber-50/60 via-white to-slate-50 p-6 sm:p-8 rounded-3xl border border-amber-200/60 shadow-sm flex flex-col items-center text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full mb-6">
                Composite Vital Score
              </span>

              {/* Gauge Meter */}
              <div className="relative w-40 h-40 flex items-center justify-center my-2">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Track Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                  />
                  {/* Active Arc (74%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - 0.74)}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">74</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">/ 100</span>
                </div>
              </div>

              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Needs Attention
                </span>
                <p className="text-xs text-slate-500 mt-2">
                  Moderate vital score: 3 healthy pillars, 1 logistical drag in North region.
                </p>
              </div>
            </div>

            {/* Right: 4 KPI Cards + AI Summary Box (8 cols on lg) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* 4 Core KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                
                {/* KPI 1: Revenue */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>Revenue</span>
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    ₹42.3L
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>↑ 8.2%</span>
                  </div>
                </div>

                {/* KPI 2: Orders */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>Orders</span>
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    18,421
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-rose-600 mt-2">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>↓ 3.1%</span>
                  </div>
                </div>

                {/* KPI 3: Customers */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>Customers</span>
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    7,892
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>↑ 4.7%</span>
                  </div>
                </div>

                {/* KPI 4: Profit */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>Profit</span>
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    ₹8.4L
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>↑ 5.2%</span>
                  </div>
                </div>

              </div>

              {/* AI Summary Quote Callout */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/70 border border-indigo-100 shadow-xs flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                      AI Executive Summary
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Daily Briefing</span>
                  </div>
                  <blockquote className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed italic">
                    "Revenue remains healthy overall, but North Region performance requires attention due to declining Product A orders."
                  </blockquote>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="text-emerald-700 font-semibold">✓ West & South over-indexing</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-rose-600 font-semibold">⚠ Courier SLA alert active</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
