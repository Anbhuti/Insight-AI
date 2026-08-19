import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  ArrowRight, 
  Search, 
  BarChart3, 
  Layers, 
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Clock,
  Compass
} from 'lucide-react';
import { FloatingMetricCard } from './FloatingMetricCard';

interface HeroProductPreviewProps {
  onOpenExplore?: () => void;
}

export const HeroProductPreview: React.FC<HeroProductPreviewProps> = ({ onOpenExplore }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(4); // default full complete
  const [isPlayingInvestigation, setIsPlayingInvestigation] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'conversation' | 'breakdown' | 'driverTree'>('conversation');

  const steps = [
    { label: 'Revenue comparison', detail: 'Checked vs last month baseline (₹18.2L expected)' },
    { label: 'Regional analysis', detail: 'Isolated North vs South, East, West cohorts' },
    { label: 'Product analysis', detail: 'Scanned 14 active SKUs and inventory velocity' },
    { label: 'Anomaly detection', detail: 'Flagged 3.4σ deviation on checkout conversions' },
    { label: 'Root-cause analysis', detail: 'Attributed 62% variance to North delivery delay' },
  ];

  // Replay demo with proper cleanup
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingInvestigation) {
      interval = setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlayingInvestigation(false);
            return steps.length - 1;
          }
          return prev + 1;
        });
      }, 600);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingInvestigation, steps.length]);

  const triggerReplay = () => {
    setActiveStepIndex(0);
    setIsPlayingInvestigation(true);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-0">
      {/* Floating Cards (Responsive Positioned) */}
      
      {/* Top Left: Revenue Card */}
      <div className="hidden lg:block absolute -top-8 -left-8 z-30 animate-float pointer-events-auto">
        <FloatingMetricCard type="revenue" />
      </div>

      {/* Top Right: Anomaly Detected Card */}
      <div className="hidden lg:block absolute -top-6 -right-6 z-30 animate-float-delayed pointer-events-auto">
        <FloatingMetricCard type="anomaly" />
      </div>

      {/* Bottom Left: Data Quality Card */}
      <div className="hidden lg:block absolute -bottom-6 -left-6 z-30 animate-float-delayed pointer-events-auto">
        <FloatingMetricCard type="quality" />
      </div>

      {/* Bottom Right: 30-Day Forecast Card */}
      <div className="hidden lg:block absolute -bottom-8 -right-8 z-30 animate-float pointer-events-auto">
        <FloatingMetricCard type="forecast" />
      </div>

      {/* Main White Rounded Product Canvas */}
      <div
        id="hero-product-canvas"
        className="relative z-10 bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-[36px] shadow-2xl shadow-indigo-500/10 border border-slate-200/80 p-4 sm:p-7 md:p-9 transition-all duration-300"
      >
        {/* Top Product Window Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400/80" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>Workspace: Q2 Revenue & Growth</span>
            </div>
          </div>

          {/* Interactive Modes */}
          <div className="flex items-center gap-2">
            <button
              onClick={triggerReplay}
              disabled={isPlayingInvestigation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors disabled:opacity-50 cursor-pointer"
              title="Replay Agent Investigation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPlayingInvestigation ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isPlayingInvestigation ? 'Investigating...' : 'Replay Analysis'}</span>
            </button>
            <div className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/60">
              <span>Model: Insight Reasoning Engine v3</span>
            </div>
          </div>
        </div>

        {/* Product Inner Grid: Left AI Agent Investigation & Right Analytics Chart Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: AI Conversation & Root Cause Deduction Panel (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* User Chat Query Bubble */}
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-md bg-indigo-600 text-white p-3.5 sm:p-4 rounded-2xl rounded-tr-xs shadow-md shadow-indigo-600/10 text-sm font-medium leading-relaxed">
                Why did revenue decline this month?
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                You
              </div>
            </div>

            {/* Agent Investigation Stream */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Sparkles className="w-4 h-4" />
              </div>
              
              <div className="flex-1 bg-slate-50/90 rounded-2xl rounded-tl-xs p-4 sm:p-5 border border-slate-200/70 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 tracking-tight">InsightAI Agent</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100/70 text-indigo-700">
                      Automated Investigation
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Just now</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {isPlayingInvestigation ? (
                    <span className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      I'm investigating your business data across 5 dimensions...
                    </span>
                  ) : (
                    "I investigated your sales ledger, regional fulfillment logs, and product performance. Here is the verified breakdown:"
                  )}
                </p>

                {/* Checklist of investigation steps */}
                <div className="bg-white rounded-xl p-3 border border-slate-200/60 flex flex-col gap-2">
                  {steps.map((step, idx) => {
                    const isCompleted = idx <= activeStepIndex;
                    return (
                      <div
                        key={step.label}
                        className={`flex items-start gap-2 text-xs transition-all duration-300 ${
                          isCompleted ? 'text-slate-800' : 'text-slate-400 opacity-60'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isCompleted ? 'text-emerald-600 fill-emerald-100' : 'text-slate-300'
                          }`}
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="font-semibold">{step.label}</span>
                          <span className="text-[11px] text-slate-500 hidden sm:inline">{step.detail}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Final Insight Findings Box */}
                {activeStepIndex >= 4 && (
                  <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/50 rounded-xl p-4 border border-indigo-100/90 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                        <TrendingDown className="w-4 h-4" />
                        <span>Revenue declined 27%</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-100/80 text-rose-700">
                        ₹12.5L vs ₹18.2L
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                        <span className="text-[11px] text-slate-500 block">Primary Driver</span>
                        <span className="text-xs font-bold text-slate-900">North Region</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                        <span className="text-[11px] text-slate-500 block">Product A Orders</span>
                        <span className="text-xs font-bold text-rose-600">↓ 48% Drop</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                        <span className="text-[11px] text-slate-500 block">Variance Impact</span>
                        <span className="text-xs font-bold text-indigo-600">62% Contribution</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-indigo-100/60 font-medium">
                      💡 <strong>Recommended Action:</strong> Reallocate 800 units of Product A from West Hub to resolve North fulfillment backlog and stem cancellation rates.
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Right: Interactive Line Chart & Diagnostic Visual (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Chart Container */}
            <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Revenue Trend & Forecast</h3>
                  <p className="text-[11px] text-slate-500">Weekly cadence (in ₹ Lakhs)</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-indigo-600">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" /> Historical
                  </span>
                  <span className="flex items-center gap-1 text-indigo-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-300" /> Forecast
                  </span>
                </div>
              </div>

              {/* Custom SVG Line Chart with Gradient Shading & Data Points */}
              <div className="relative w-full h-44 sm:h-52 bg-white rounded-xl p-3 border border-slate-200/60 flex flex-col justify-end">
                {/* SVG Curve Canvas */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="100" x2="300" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />

                  {/* Historical Fill Area */}
                  <path
                    d="M 10 70 L 60 55 L 120 40 L 170 85 L 210 50 L 210 115 L 10 115 Z"
                    fill="url(#heroChartGrad)"
                  />

                  {/* Forecast Fill Area */}
                  <path
                    d="M 210 50 L 255 35 L 290 22 L 290 115 L 210 115 Z"
                    fill="url(#forecastGrad)"
                  />

                  {/* Historical Solid Line */}
                  <path
                    d="M 10 70 L 60 55 L 120 40 L 170 85 L 210 50"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Anomaly Dip Circle */}
                  <circle cx="170" cy="85" r="5" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                  
                  {/* Forecast Dashed Line */}
                  <path
                    d="M 210 50 L 255 35 L 290 22"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />

                  {/* Target Goal benchmark line */}
                  <line x1="10" y1="35" x2="290" y2="35" stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="1.5" />

                  {/* Interactive Highlight Nodes */}
                  <circle cx="10" cy="70" r="3.5" fill="#4f46e5" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="60" cy="55" r="3.5" fill="#4f46e5" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="120" cy="40" r="3.5" fill="#4f46e5" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="210" cy="50" r="3.5" fill="#4f46e5" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="255" cy="35" r="3.5" fill="#8b5cf6" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="290" cy="22" r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="2" />
                </svg>

                {/* Anomaly Marker Tag */}
                <div className="absolute top-16 left-[50%] -translate-x-1/2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  <span>-27% Dip</span>
                </div>

                {/* X Axis Labels */}
                <div className="flex justify-between text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-100">
                  <span>W1 (₹38L)</span>
                  <span>W2 (₹40L)</span>
                  <span>W3 (₹42L)</span>
                  <span className="text-rose-600 font-bold">W4 (₹12.5L)</span>
                  <span>Next (₹45.8L)</span>
                </div>
              </div>

              {/* Regional Breakdown Mini Matrix */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Regional Impact Matrix</span>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">West Region</span>
                    <span className="font-semibold text-emerald-600">+7.8% (₹14.2L)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-medium">South Region</span>
                    <span className="font-semibold text-emerald-600">+5.1% (₹16.5L)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '92%' }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-900 font-bold flex items-center gap-1 text-rose-600">
                      <ShieldAlert className="w-3.5 h-3.5" /> North Region (Primary Drag)
                    </span>
                    <span className="font-bold text-rose-600">-41.0% (₹4.2L)</span>
                  </div>
                  <div className="w-full bg-rose-100 rounded-full h-1.5">
                    <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Mobile Floating Card Grid (Shown on smaller screens below canvas) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 lg:hidden">
        <FloatingMetricCard type="revenue" />
        <FloatingMetricCard type="anomaly" />
        <FloatingMetricCard type="forecast" />
        <FloatingMetricCard type="quality" />
      </div>

    </div>
  );
};
