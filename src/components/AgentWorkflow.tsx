import React, { useState } from 'react';
import { 
  MessageSquareText, 
  BrainCircuit, 
  Database, 
  BarChart3, 
  SearchCode, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  GitCommit,
  Cpu
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { WORKFLOW_STEPS } from '../data/mockData';

export const AgentWorkflow: React.FC = () => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquareText':
        return <MessageSquareText className="w-5 h-5" />;
      case 'BrainCircuit':
        return <BrainCircuit className="w-5 h-5" />;
      case 'Database':
        return <Database className="w-5 h-5" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5" />;
      case 'SearchCode':
        return <SearchCode className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <GitCommit className="w-5 h-5" />;
    }
  };

  return (
    <section id="workflow" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Autonomous Investigation Loop"
          badgeIcon={<Cpu className="w-3.5 h-3.5" />}
          title={
            <>
              It doesn't just answer. <br />
              <span className="text-indigo-600">It investigates.</span>
            </>
          }
          subtitle="InsightAI goes beyond generic chatbot text. It executes structured multidimensional queries, verifies statistical significance, and pinpoints precise root causes."
          className="mb-14"
        />

        {/* Large White Rounded Container for Workflow Cards */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-14 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          {/* Horizontal Sequential Stepper on Desktop / Vertical on Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 relative">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isHovered = hoveredStep === step.id;
              return (
                <div
                  key={step.id}
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-default min-h-[220px] ${
                    isHovered
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10 scale-105 z-20'
                      : 'bg-slate-50/70 hover:bg-white text-slate-900 border-slate-200/80 hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  {/* Step Number & Icon */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isHovered ? 'bg-indigo-500 text-white' : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        0{step.id}
                      </span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:rotate-6 ${
                        isHovered ? 'bg-white/10 text-white' : 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                      }`}>
                        {getStepIcon(step.iconName)}
                      </div>
                    </div>

                    <h3 className={`text-base font-bold mb-1 ${isHovered ? 'text-white' : 'text-slate-900'}`}>
                      {step.name}
                    </h3>
                    <div className={`text-[11px] font-semibold mb-2 ${isHovered ? 'text-indigo-300' : 'text-indigo-600'}`}>
                      {step.tagline}
                    </div>
                  </div>

                  {/* Step Description */}
                  <p className={`text-xs leading-relaxed transition-opacity duration-200 ${
                    isHovered ? 'text-slate-300 opacity-100' : 'text-slate-500 opacity-90'
                  }`}>
                    {step.description}
                  </p>

                  {/* Flow Arrow for non-last items */}
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Workflow Bottom Summary Quote */}
          <div className="mt-10 p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-700">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="font-medium">
                <strong>Closed-Loop Verification:</strong> Every recommendation is empirically tied to underlying database rows with full statistical auditability.
              </span>
            </div>
            <span className="font-bold text-indigo-700 whitespace-nowrap">
              Average Investigation Time: 1.4s
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};
