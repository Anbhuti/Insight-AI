import React from 'react';
import {
  Bot,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { ForecastResult } from '../../services/forecasting/forecastTypes';

interface ForecastAIExecutiveBriefProps {
  forecast: ForecastResult;
  onAskAIAnalyst?: (prompt: string) => void;
  onOpenSQL?: (query: string) => void;
}

export const ForecastAIExecutiveBrief: React.FC<ForecastAIExecutiveBriefProps> = ({
  forecast,
  onAskAIAnalyst,
  onOpenSQL,
}) => {
  const { aiExplanation, summary, config, selectedModelName } = forecast;

  if (!aiExplanation) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/20">
                AI Executive Intelligence
              </span>
              <span className="text-xs text-slate-400">Statistical Interpretation</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-0.5">
              Strategic Forecast Briefing
            </h3>
          </div>
        </div>

        {onAskAIAnalyst && (
          <button
            onClick={() =>
              onAskAIAnalyst(
                `Explain the ${config.metricColumn} forecast in detail. The ${selectedModelName} predicts a ${summary.expectedGrowthPct}% growth to ${summary.finalPredictedValue.toLocaleString()} over the next ${summary.forecastHorizon} ${summary.horizonUnit}. What actions should we take?`
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white shadow-md transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Chat with AI Analyst</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Executive Headline & Summary */}
      <div className="space-y-4 mb-6 relative z-10">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-bold text-indigo-200 mb-1.5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>{aiExplanation.headline}</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {aiExplanation.executiveSummary}
          </p>
        </div>
      </div>

      {/* Narrative Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs text-slate-300 relative z-10">
        {/* Trend & Direction */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Historical Dynamics & Trajectory</span>
          </h5>
          <p className="text-slate-300 leading-relaxed">
            {aiExplanation.historicalTrendNarrative}
          </p>
          <p className="text-slate-400 pt-1">
            {aiExplanation.forecastDirectionNarrative}
          </p>
        </div>

        {/* Model Selection & Uncertainty */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Statistical Validation & Confidence</span>
          </h5>
          <p className="text-slate-300 leading-relaxed">
            {aiExplanation.modelSelectionNarrative}
          </p>
          <p className="text-slate-400 pt-1">
            {aiExplanation.uncertaintyNarrative}
          </p>
        </div>
      </div>

      {/* Actionable Strategic Recommendations */}
      {aiExplanation.recommendedActions && aiExplanation.recommendedActions.length > 0 && (
        <div className="pt-4 border-t border-white/10 relative z-10">
          <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Recommended Strategic Next Steps</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {aiExplanation.recommendedActions.map((rec, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Limitations note */}
      {aiExplanation.limitationsNarrative && (
        <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{aiExplanation.limitationsNarrative}</span>
        </div>
      )}
    </div>
  );
};
