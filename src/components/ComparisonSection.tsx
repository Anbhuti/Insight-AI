import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';

export const ComparisonSection: React.FC = () => {
  const comparisonRows = [
    {
      capability: 'Understands business schemas & tabular data',
      traditionalBI: 'Requires manual dashboard query setup',
      chatbot: 'Generic text with no schema awareness',
      insightAI: 'Autonomous semantic schema mapping',
    },
    {
      capability: 'Deep multivariate root-cause investigation',
      traditionalBI: 'Manual drill-downs by data team',
      chatbot: 'Surface-level speculation / hallucinations',
      insightAI: 'Recursive statistical attribution tree',
    },
    {
      capability: 'Identifies primary variance drivers',
      traditionalBI: 'Passive static charts without attribution',
      chatbot: 'Cannot calculate percentage contributions',
      insightAI: 'Exact percentage driver share (e.g. 62%)',
    },
    {
      capability: 'Provides empirical evidence trails',
      traditionalBI: 'Requires cross-referencing multiple dashboards',
      chatbot: 'Opaque black-box responses',
      insightAI: 'Verifiable database citations & row proofs',
    },
    {
      capability: 'Actionable operational recommendations',
      traditionalBI: 'Leaves decisions entirely to the user',
      chatbot: 'Generic, ungrounded advice',
      insightAI: 'Specific inventory/marketing interventions',
    },
    {
      capability: 'Autonomous 24/7 background monitoring',
      traditionalBI: 'Static scheduled emails with no diagnosis',
      chatbot: 'Passive, only responds when prompted',
      insightAI: 'Proactive surveillance & diagnosed alerts',
    },
  ];

  return (
    <section id="comparison" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="The Architectural Difference"
          badgeIcon={<Layers className="w-3.5 h-3.5" />}
          title={
            <>
              More than a <br />
              <span className="text-indigo-600">dashboard.</span>
            </>
          }
          subtitle="See how an autonomous AI Data Analyst Agent fundamentally outperforms passive dashboards and generic conversational chatbots."
          className="mb-14"
        />

        {/* 3-Column Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Column 1: Traditional BI */}
          <div className="bg-white rounded-[28px] p-7 border border-slate-200/80 shadow-md shadow-slate-200/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Legacy Approach
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Traditional BI
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Requires dedicated analytics engineers, complex SQL queries, and produces passive charts that don't explain why metrics moved.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Manual report writing</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Days of lag waiting for data team</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Shows what happened, not why</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-400">
              Outcome: Dashboard overload & slow decisions
            </div>
          </div>

          {/* Column 2: Generic AI Chatbots */}
          <div className="bg-white rounded-[28px] p-7 border border-slate-200/80 shadow-md shadow-slate-200/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Generic LLMs
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Generic AI Chatbots
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Answers surface queries but lacks mathematical rigor, schema grounding, multi-series aggregation, and autonomous investigation.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Hallucinates numerical calculations</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Zero statistical root-cause slicing</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Cannot monitor data continuously</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-400">
              Outcome: Unverifiable guesses
            </div>
          </div>

          {/* Column 3: InsightAI (Highlighted) */}
          <div className="bg-slate-900 text-white rounded-[28px] p-7 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 flex flex-col justify-between relative transform lg:-translate-y-2">
            
            {/* Top Badge */}
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
              ✦ Autonomous Agent
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Autonomous Intelligence
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-3">
                ✦ InsightAI
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Connects directly to your operational databases, runs verified statistical attribution, explains causality with evidence, and monitors 24/7.
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-start gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Understands business schema semantics</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Pinpoints exact percentage driver attribution</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Generates executive briefs & recommendations</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Proactive anomaly detection before you ask</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 text-xs font-bold text-emerald-400 flex items-center justify-between">
              <span>Decision-ready in seconds</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
