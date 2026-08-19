import React from 'react';
import { Sparkles, ArrowRight, Lightbulb, ShieldCheck } from 'lucide-react';
import { AISummaryData } from '../../types/dashboard';

interface AISummaryCardProps {
  summary: AISummaryData;
  onInvestigate: () => void;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  summary,
  onInvestigate,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 sm:p-6 shadow-md border border-indigo-800/40 flex flex-col justify-between">
      
      {/* Decorative backdrop glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-4 h-4 text-indigo-300" />
            </span>
            <span className="text-xs font-extrabold tracking-wider uppercase text-indigo-200">
              InsightAI Assistant
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            Demo insight
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-3 leading-snug">
          {summary.headline}
        </h3>

        {/* Narrative paragraphs */}
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed mb-4">
          {summary.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Recommendation Box */}
        <div className="p-3 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-start gap-2.5 text-xs text-indigo-100 mb-5">
          <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <span className="font-bold text-amber-300">Action: </span>
            {summary.recommendation}
          </p>
        </div>
      </div>

      {/* Action button */}
      <div className="pt-2">
        <button
          onClick={onInvestigate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer group"
        >
          <span>Investigate with AI</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
};
