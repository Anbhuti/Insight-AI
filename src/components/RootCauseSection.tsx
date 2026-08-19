import React, { useState } from 'react';
import { 
  GitFork, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  Sparkles, 
  Target, 
  Layers, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';

export const RootCauseSection: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('productA');

  return (
    <section id="root-cause" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Causal Attribution Tree"
          badgeIcon={<GitFork className="w-3.5 h-3.5" />}
          title={
            <>
              Don't stop at <br />
              <span className="text-indigo-600">"something changed."</span>
            </>
          }
          subtitle="See where the change happened and what contributed most. InsightAI recursively breaks down every metric variance across regions, cohorts, and operations."
          className="mb-14"
        />

        {/* Large White Rounded Tree Container */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-14 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Visual Tree Hierarchy Visualizer (7 cols on lg) */}
            <div className="w-full lg:w-7/12 bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200/70">
              
              <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-200/60">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Multivariate Decomposition Tree
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Total Variance: -₹5.7L
                </span>
              </div>

              {/* Root Level 0: Revenue Drop */}
              <div className="flex flex-col items-start space-y-4">
                
                {/* Level 0: Root Node */}
                <div 
                  onClick={() => setSelectedNode('revenue')}
                  className={`w-full max-w-sm p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                    selectedNode === 'revenue' 
                      ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-indigo-500' 
                      : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide opacity-70">Top-Level Metric</span>
                    <span className="text-xs font-bold text-rose-500">Total Drag: 100%</span>
                  </div>
                  <div className="text-lg font-extrabold mt-1 flex items-center justify-between">
                    <span>Revenue</span>
                    <span className="text-rose-500 text-base font-bold">↓ 27%</span>
                  </div>
                </div>

                {/* Vertical Connector Line */}
                <div className="w-px h-6 bg-slate-300 ml-8" />

                {/* Level 1: Branches Container */}
                <div className="w-full pl-6 border-l-2 border-slate-300 space-y-5 ml-8">
                  
                  {/* Branch 1: North Region (Primary Driver) */}
                  <div className="relative">
                    {/* Horizontal Branch Pip */}
                    <div className="absolute -left-6 top-6 w-5 h-px bg-slate-300" />
                    
                    <div 
                      onClick={() => setSelectedNode('northRegion')}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        selectedNode === 'northRegion' || selectedNode === 'productA'
                          ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-md">
                          Primary Driver: 62% Share
                        </span>
                        <span className="text-xs font-bold text-rose-600">↓ 41%</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1.5">
                        North Region
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Fulfillment bottleneck in Delhi NCR & Chandigarh
                      </div>

                      {/* Level 2 Sub-Branch: Product A */}
                      <div className="mt-4 pt-3 border-t border-rose-200/60 pl-4 border-l-2 border-rose-300 space-y-2">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode('productA');
                          }}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            selectedNode === 'productA'
                              ? 'bg-white border-rose-400 shadow-sm'
                              : 'bg-white/80 border-rose-100 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">Product A Orders</span>
                            <span className="text-xs font-bold text-rose-600">↓ 48%</span>
                          </div>
                          <span className="text-[11px] text-rose-700 font-semibold block mt-0.5">
                            ★ Direct Root Cause: Stockout & transit delay
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branch 2: Orders */}
                  <div className="relative">
                    <div className="absolute -left-6 top-6 w-5 h-px bg-slate-300" />
                    <div 
                      onClick={() => setSelectedNode('orders')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedNode === 'orders'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Volume Impact: 24% Share</span>
                        <span className="text-xs font-bold text-rose-600">↓ 21%</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        Total Orders
                      </div>
                    </div>
                  </div>

                  {/* Branch 3: Cancellations */}
                  <div className="relative">
                    <div className="absolute -left-6 top-6 w-5 h-px bg-slate-300" />
                    <div 
                      onClick={() => setSelectedNode('cancellations')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedNode === 'cancellations'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Post-Order Churn: 14% Share</span>
                        <span className="text-xs font-bold text-rose-600">↑ 18%</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        Order Cancellations
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Right: Driver Attribution & Recommended Decision (5 cols on lg) */}
            <div className="w-full lg:w-5/12 flex flex-col gap-5">
              
              {/* Highlight Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 shadow-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white mb-3 shadow-xs">
                  <Target className="w-3.5 h-3.5" />
                  <span>Primary Driver Isolated</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  North Region → Product A
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  InsightAI traced 62% of the overall revenue shortfall directly to North Region’s 48% drop in Product A order volume, caused by local shipping lead times jumping to 92 hours.
                </p>

                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-indigo-100/80 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Attributed Revenue Loss:</span>
                    <strong className="text-slate-900">₹3.53 Lakhs</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Affected Customers:</span>
                    <strong className="text-slate-900">1,420 Shoppers</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Root Cause Category:</span>
                    <strong className="text-indigo-600">Logistics SLA Failure</strong>
                  </div>
                </div>
              </div>

              {/* Actionable Solution Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-lg shadow-slate-900/10">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Recommended Remediation</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-2">
                  1. Reroute 600 units from West Warehouse
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  West region holds 42 days of forward inventory. Transferring 600 units eliminates North stockouts in 36 hours.
                </p>
                <div className="text-[11px] font-semibold text-emerald-400 bg-slate-800/90 p-2.5 rounded-lg border border-slate-700 flex items-center justify-between">
                  <span>Projected Revenue Recovery:</span>
                  <span className="font-bold">+₹2.8L over 14 days</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
