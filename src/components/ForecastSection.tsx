import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  ArrowUpRight, 
  Sliders, 
  Info, 
  Calendar, 
  CheckCircle2,
  BarChart2
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';

export const ForecastSection: React.FC = () => {
  const [scenarioMultiplier, setScenarioMultiplier] = useState<number>(1.0); // 1.0 = base forecast (₹45.8L)

  const baseForecast = 45.8;
  const currentProjection = (baseForecast * scenarioMultiplier).toFixed(1);
  const growthRate = (((parseFloat(currentProjection) - 42.3) / 42.3) * 100).toFixed(1);

  return (
    <section id="forecast" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Predictive Time-Series Intelligence"
          badgeIcon={<TrendingUp className="w-3.5 h-3.5" />}
          title={
            <>
              Understand yesterday. <br />
              <span className="text-indigo-600">Prepare for tomorrow.</span>
            </>
          }
          subtitle="InsightAI trains ensemble seasonal models directly on your transactional history, giving you reliable revenue projections with calibrated confidence bands."
          className="mb-14"
        />

        {/* Large White Rounded Forecast Canvas */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-14 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Forecast Visual Chart Canvas (7 cols on lg) */}
            <div className="lg:col-span-7 bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200/70 flex flex-col gap-6">
              
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">30-Day Forward Forecast Model</h3>
                  <p className="text-xs text-slate-500">Historical Actuals (Solid) vs Forecast (Dashed) with P90 Confidence Band</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-indigo-600">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" /> Past (₹38L → ₹42L)
                  </span>
                  <span className="flex items-center gap-1 text-purple-600">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> Forecast (₹43L → ₹{currentProjection}L)
                  </span>
                </div>
              </div>

              {/* Confidence Band SVG Line Chart */}
              <div className="relative w-full h-56 sm:h-64 bg-white rounded-xl p-4 border border-slate-200/60 flex flex-col justify-end">
                
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#c084fc" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="actualsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />

                  {/* Shaded Confidence Band (P10 to P90) */}
                  <path
                    d="M 220 70 L 280 45 L 340 32 L 390 20 L 390 70 L 340 85 L 280 95 L 220 70 Z"
                    fill="url(#confidenceBand)"
                  />

                  {/* Historical Area Under Curve */}
                  <path
                    d="M 10 110 L 70 95 L 140 80 L 220 70 L 220 150 L 10 150 Z"
                    fill="url(#actualsGrad)"
                  />

                  {/* Historical Solid Line: ₹38L -> ₹40L -> ₹42L */}
                  <path
                    d="M 10 110 L 70 95 L 140 80 L 220 70"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Forecast Projection Curve: ₹43L -> ₹44L -> ₹45.8L */}
                  <path
                    d="M 220 70 L 280 58 L 340 46 L 390 32"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                  />

                  {/* Historical Points */}
                  <circle cx="10" cy="110" r="4" fill="#4f46e5" stroke="#fff" strokeWidth="2" />
                  <circle cx="70" cy="95" r="4" fill="#4f46e5" stroke="#fff" strokeWidth="2" />
                  <circle cx="140" cy="80" r="4" fill="#4f46e5" stroke="#fff" strokeWidth="2" />
                  <circle cx="220" cy="70" r="5" fill="#4f46e5" stroke="#fff" strokeWidth="2" />

                  {/* Forecast Points */}
                  <circle cx="280" cy="58" r="4" fill="#a855f7" stroke="#fff" strokeWidth="2" />
                  <circle cx="340" cy="46" r="4" fill="#a855f7" stroke="#fff" strokeWidth="2" />
                  <circle cx="390" cy="32" r="6" fill="#a855f7" stroke="#fff" strokeWidth="2.5" />
                </svg>

                {/* Milestone Step Values */}
                <div className="flex justify-between text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100">
                  <span>M-2: ₹38.0L</span>
                  <span>M-1: ₹40.2L</span>
                  <span className="text-indigo-600 font-bold">Now: ₹42.3L</span>
                  <span>W+2: ₹44.0L</span>
                  <span className="text-purple-600 font-bold">30d: ₹{currentProjection}L</span>
                </div>
              </div>

              {/* Model Confidence Metric */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Backtested accuracy: 94.2% across previous quarters
                </span>
                <span className="font-medium">P90 Confidence Interval: ₹43.5L – ₹48.2L</span>
              </div>

            </div>

            {/* Right: Key Forecast Metric Card & Scenario Slider (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              
              {/* Highlight Forecast Card */}
              <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/50 border border-purple-100 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 bg-purple-100/90 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    30-Day Forecast
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Auto-Refreshed</span>
                </div>

                <div className="my-2">
                  <span className="text-xs text-slate-500 font-medium block">Projected Revenue</span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                    ₹{currentProjection}L
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+{growthRate}% Expected Growth</span>
                  <span className="text-xs font-normal text-slate-400">vs current run-rate</span>
                </div>

                <p className="text-xs text-slate-600 pt-2 border-t border-purple-100 leading-relaxed">
                  Driven by enterprise renewals in Week 3 and scheduled marketing expansion for Pro Suite.
                </p>
              </div>

              {/* Interactive Scenario Adjustment */}
              <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Scenario Sensitivity Simulator
                  </span>
                  <span className="text-xs font-bold text-indigo-600">
                    {scenarioMultiplier === 1.0 ? 'Base Plan' : scenarioMultiplier > 1.0 ? 'Aggressive Growth' : 'Conservative'}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.9"
                  max="1.15"
                  step="0.05"
                  value={scenarioMultiplier}
                  onChange={(e) => setScenarioMultiplier(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>-10% Spend</span>
                  <span>Baseline (₹45.8L)</span>
                  <span>+15% Spend</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
