import React from 'react';
import { 
  BellRing, 
  ArrowDownRight, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Smartphone,
  Cpu
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface AutomatedMonitoringProps {
  onOpenAnalysis?: () => void;
}

export const AutomatedMonitoring: React.FC<AutomatedMonitoringProps> = ({ onOpenAnalysis }) => {
  const pipelineSteps = [
    { label: 'New Data', desc: 'Syncs every 15 mins' },
    { label: 'Check KPIs', desc: 'Evaluates 80+ metrics' },
    { label: 'Detect Changes', desc: 'Flags >2.5σ shifts' },
    { label: 'Investigate', desc: 'Runs driver attribution' },
    { label: 'Alert', desc: 'Slack, Email, Webhook' },
  ];

  return (
    <section id="monitoring" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Proactive Surveillance"
          badgeIcon={<BellRing className="w-3.5 h-3.5" />}
          title={
            <>
              Your analyst shouldn't <br />
              <span className="text-indigo-600">wait for you to ask.</span>
            </>
          }
          subtitle="InsightAI works continuously in the background. When anomalies occur, it doesn't just ping you with a broken chart — it investigates the root cause before sending the alert."
          className="mb-14"
        />

        {/* Large White Rounded Container */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-14 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Continuous Surveillance Pipeline (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Continuous Autonomous Pipeline
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  How Proactive Surveillance Works
                </h3>
              </div>

              {/* 5-Step Pipeline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
                {pipelineSteps.map((step, idx) => (
                  <div 
                    key={step.label} 
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between text-left relative group hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-700 block w-max mb-2">
                        0{idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mb-1">{step.label}</h4>
                      <p className="text-[11px] text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail benefits list */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Eliminates alert fatigue by filtering noise and only dispatching actionable breaches.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Arrives with pre-investigated root causes and immediate remediation steps.</span>
                </div>
              </div>
            </div>

            {/* Right: Realistic Push Notification / Alert Card Preview (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              
              <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl shadow-slate-900/20 flex flex-col gap-4">
                
                {/* Alert Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-rose-400">🔴 Revenue anomaly detected</span>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 2m ago
                  </span>
                </div>

                {/* Alert Body */}
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white tracking-tight">
                    Revenue is 31% below expected levels.
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Statistical threshold breached on Q2 Sales Ledger. The agent isolated the variance contribution across all active sales channels.
                  </p>
                </div>

                {/* Primary Driver Pill */}
                <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Primary driver:</span>
                  <strong className="text-rose-400 font-bold">North Region (62% Impact)</strong>
                </div>

                {/* Action CTA Button */}
                <button
                  onClick={onOpenAnalysis}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-md shadow-indigo-600/20"
                >
                  <span>View Analysis →</span>
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
