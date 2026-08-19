import React, { useState } from 'react';
import { 
  Sparkles, 
  MessageSquareText, 
  FileText, 
  BarChart3, 
  Search, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';

export const AIAnalystSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'chart' | 'analysis'>('evidence');

  return (
    <section id="ai-analyst" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Natural Language Reasoning"
          badgeIcon={<MessageSquareText className="w-3.5 h-3.5" />}
          title={
            <>
              Ask questions. <br />
              <span className="text-indigo-600">Get analysis, not guesses.</span>
            </>
          }
          subtitle="No syntax hurdles, no dashboards to configure. Ask in plain English and receive instant root-cause breakdowns with empirical evidence."
          className="mb-14"
        />

        {/* Large Chat Canvas */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto">
          
          {/* Chat Window Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">InsightAI Analyst Session</h3>
                <span className="text-xs text-slate-500">Autonomous context: Live ERP + Shopify sync</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Connected
            </span>
          </div>

          {/* Chat Thread */}
          <div className="flex flex-col gap-6">
            
            {/* User Message */}
            <div className="flex items-start gap-3 justify-end">
              <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl rounded-tr-xs text-sm sm:text-base font-medium max-w-md shadow-md">
                Which region is underperforming?
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                You
              </div>
            </div>

            {/* Agent Response */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="flex-1 bg-slate-50/90 rounded-2xl rounded-tl-xs p-5 sm:p-7 border border-slate-200/70 shadow-xs flex flex-col gap-5">
                
                {/* Agent Headline */}
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wide mb-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Regional Variance Alert</span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                    North Region is currently underperforming.
                  </h4>
                </div>

                {/* Key Metric Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <span className="text-xs text-slate-500 font-medium block">Revenue</span>
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-lg">
                      <ArrowDownRight className="w-4 h-4" />
                      <span>↓ 41%</span>
                    </div>
                    <span className="text-[11px] text-slate-400">₹4.2L vs ₹7.1L target</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <span className="text-xs text-slate-500 font-medium block">Orders</span>
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-lg">
                      <ArrowDownRight className="w-4 h-4" />
                      <span>↓ 28%</span>
                    </div>
                    <span className="text-[11px] text-slate-400">1,420 total units</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <span className="text-xs text-slate-500 font-medium block">Primary Contributor</span>
                    <div className="text-slate-900 font-bold text-lg">
                      Product A
                    </div>
                    <span className="text-[11px] text-rose-600 font-semibold">62% of regional drop</span>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => setActiveTab('evidence')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'evidence'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Evidence</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('chart')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'chart'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>View Chart</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'analysis'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>View Analysis</span>
                  </button>
                </div>

                {/* Sub-Panel for Selected Action Tab */}
                <div className="bg-white p-4 rounded-xl border border-indigo-100 text-xs text-slate-700 transition-all">
                  {activeTab === 'evidence' && (
                    <div className="space-y-2">
                      <div className="font-bold text-slate-900 mb-1">Empirical Evidence Trail:</div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Courier average transit time jumped from 36h to 92h in North districts.</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Checkout drop-off for Product A increased by 31% after shipping estimates updated.</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Customer support tickets regarding delivery in Delhi & Punjab rose 4.2x.</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'chart' && (
                    <div className="space-y-3">
                      <div className="flex justify-between font-bold text-slate-900 text-xs">
                        <span>Regional Revenue vs Target Comparison</span>
                        <span className="text-slate-400 font-normal">in ₹ Lakhs</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center pt-2">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-500 block">West</span>
                          <span className="font-bold text-emerald-600">₹14.2L</span>
                          <div className="text-[9px] text-emerald-700 font-semibold">+7.8%</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-500 block">South</span>
                          <span className="font-bold text-emerald-600">₹16.5L</span>
                          <div className="text-[9px] text-emerald-700 font-semibold">+5.1%</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-500 block">East</span>
                          <span className="font-bold text-emerald-600">₹9.1L</span>
                          <div className="text-[9px] text-emerald-700 font-semibold">+1.2%</div>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 p-2 rounded-lg">
                          <span className="text-[10px] text-rose-700 font-bold block">North</span>
                          <span className="font-bold text-rose-600">₹4.2L</span>
                          <div className="text-[9px] text-rose-700 font-semibold">-41.0%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'analysis' && (
                    <div className="space-y-2">
                      <div className="font-bold text-slate-900 mb-1">Causal Synthesis & Action Plan:</div>
                      <p className="text-slate-600 leading-relaxed">
                        The decline is not caused by macro market softness or pricing resistance. Other regional clusters are expanding above target. The entire drop is supply-chain localized.
                      </p>
                      <div className="p-2 bg-indigo-50/70 rounded-lg text-indigo-900 font-medium">
                        💡 <strong>Proposed Fix:</strong> Transfer 600 units from West warehouse and temporarily switch regional logistics partner for North pincodes.
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
