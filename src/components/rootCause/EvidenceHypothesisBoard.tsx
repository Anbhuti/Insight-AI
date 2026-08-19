import React, { useState } from 'react';
import {
  RCAEvidence,
  RCAHypothesis,
  AIExecutiveSummary,
} from '../../services/rootCause/types';
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowRight,
  Database,
  ExternalLink,
  ShieldCheck,
  Brain,
  Lightbulb,
} from 'lucide-react';
import { SupportingDataModal } from './SupportingDataModal';

interface EvidenceHypothesisBoardProps {
  facts: string[];
  hypotheses: RCAHypothesis[];
  evidence: RCAEvidence[];
  aiSummary?: AIExecutiveSummary;
  targetMetric: string;
}

export const EvidenceHypothesisBoard: React.FC<EvidenceHypothesisBoardProps> = ({
  facts,
  hypotheses,
  evidence,
  aiSummary,
  targetMetric,
}) => {
  const [selectedEvidenceForModal, setSelectedEvidenceForModal] = useState<RCAEvidence | null>(null);

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'Observed Contributor':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Coinciding Shift':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Potential Root Cause':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Verified Mathematical Facts */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Verified Analytical Facts
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              Direct Calculations
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {facts.map((fact, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {fact}
                </p>
              </div>
            ))}
          </div>

          {/* Evidence Portfolio Drawer Trigger Items */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Underlying Evidence Portfolio ({evidence.length} items)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {evidence.slice(0, 4).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate font-bold text-slate-800">
                    {ev.title}
                  </div>
                  {ev.supportingDataSnippet && ev.supportingDataSnippet.length > 0 && (
                    <button
                      onClick={() => setSelectedEvidenceForModal(ev)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      <Database className="w-3 h-3" />
                      View Data
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Evidence-Grounded Hypotheses & AI Executive Intelligence */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Formulated Hypotheses & Drivers
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold text-xs border border-violet-200">
              Evidence Grounded
            </span>
          </div>

          {/* AI Executive Summary Card */}
          {aiSummary && (
            <div className="p-4 rounded-2xl bg-linear-to-br from-indigo-50/80 via-white to-violet-50/80 border border-indigo-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                {aiSummary.headline}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {aiSummary.executiveSummary}
              </p>
            </div>
          )}

          {/* Hypotheses List */}
          <div className="space-y-3 flex-1">
            {hypotheses.map((hyp) => (
              <div
                key={hyp.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2.5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-slate-900">
                    {hyp.title}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${getClassificationBadge(
                      hyp.classification
                    )}`}
                  >
                    {hyp.classification}
                  </span>
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {hyp.statement}
                </p>

                <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="italic">{hyp.rationale}</span>
                  <span className="font-bold text-slate-700 shrink-0 ml-2">
                    Confidence: {hyp.confidenceLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Supporting Data Modal */}
      <SupportingDataModal
        evidence={selectedEvidenceForModal}
        onClose={() => setSelectedEvidenceForModal(null)}
      />
    </>
  );
};
