import React, { useState } from 'react';
import { Database, Binary, Lightbulb, Compass, ArrowRight, Check, Sparkles } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

export const IntroductionSection: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(2); // Default 'Insight' active

  const stages = [
    {
      id: 0,
      title: 'Raw Data',
      badge: 'Inputs',
      icon: Database,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200',
      activeColor: 'bg-blue-600 text-white ring-4 ring-blue-100',
      description: 'Tables, CSVs, SQL queries, transaction logs, and customer records scattered across tools.',
      stat: '10M+ rows ingested',
    },
    {
      id: 1,
      title: 'Analysis',
      badge: 'Processing',
      icon: Binary,
      color: 'from-purple-500/10 to-indigo-500/10 text-purple-600 border-purple-200',
      activeColor: 'bg-purple-600 text-white ring-4 ring-purple-100',
      description: 'Multi-dimensional slicing, variance attribution, statistical anomaly detection, and correlation.',
      stat: '5 dimensions checked',
    },
    {
      id: 2,
      title: 'Insight',
      badge: 'Understanding',
      icon: Lightbulb,
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200',
      activeColor: 'bg-amber-600 text-white ring-4 ring-amber-100',
      description: 'Clear narrative explanation of what happened, why it happened, and which segment drove 62% of the drop.',
      stat: 'Root cause isolated',
    },
    {
      id: 3,
      title: 'Decision',
      badge: 'Execution',
      icon: Compass,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200',
      activeColor: 'bg-emerald-600 text-white ring-4 ring-emerald-100',
      description: 'Concrete operational recommendations that recover lost revenue, prevent stockouts, and grow LTV.',
      stat: '+8.3% recovery plan',
    },
  ];

  return (
    <section id="introduction" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-indigo-700 border border-indigo-100 shadow-xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>The Intelligence Transformation</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15] mb-5">
            Your data is talking. <br />
            <span className="text-indigo-600">InsightAI listens.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Modern businesses generate more data than teams can manually analyze. InsightAI turns that data into understandable insights, investigations, and decisions.
          </p>
        </div>

        {/* Large White Rounded Container with Interactive Transformation Flow */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              The 4-Stage Decision Engine
            </span>
          </div>

          {/* Stepper Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isSelected = activeStage === stage.id;
              
              return (
                <div
                  key={stage.id}
                  onClick={() => setActiveStage(stage.id)}
                  className={`group relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10 scale-[1.02]'
                      : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-900 border-slate-200/80'
                  }`}
                >
                  {/* Top Row */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200/60'
                    }`}>
                      Stage 0{idx + 1} • {stage.badge}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-white text-slate-700 border border-slate-200/60 shadow-xs'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {stage.title}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {stage.description}
                    </p>
                  </div>

                  {/* Bottom Stat Tag */}
                  <div className={`pt-3 border-t text-xs font-semibold flex items-center justify-between ${
                    isSelected ? 'border-slate-800 text-indigo-300' : 'border-slate-200/60 text-indigo-600'
                  }`}>
                    <span>{stage.stat}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${
                      isSelected ? 'text-indigo-300' : 'text-slate-400'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Deep Dive Detail of Selected Stage */}
          <div className="mt-8 pt-8 border-t border-slate-100 bg-slate-50/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-indigo-600 animate-ping" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Active Focus: {stages[activeStage].title}
                </h4>
                <p className="text-xs text-slate-500">
                  {stages[activeStage].description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Zero SQL required</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-emerald-600">100% Explainable</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
