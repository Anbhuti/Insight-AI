import React from 'react';
import { ArrowRight, Sparkles, Compass, ShieldCheck, Check } from 'lucide-react';

interface CTASectionProps {
  onStartAnalyzing: () => void;
  onExploreAgent: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onStartAnalyzing, onExploreAgent }) => {
  return (
    <section id="pricing" className="py-20 lg:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Large Rounded Callout Card with Dark Slate / Indigo Theme */}
        <div className="relative bg-slate-900 text-white rounded-[32px] sm:rounded-[44px] p-8 sm:p-14 lg:p-20 border border-slate-800 shadow-2xl shadow-slate-900/30 overflow-hidden text-center">
          
          {/* Subtle Ambient Background Gradients inside card */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Floating Pill Badges in Background */}
          <div className="hidden md:block absolute top-10 left-10 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-indigo-200 animate-float">
            <span>✨ Driver attribution in 1.4s</span>
          </div>
          <div className="hidden md:block absolute bottom-12 right-12 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-emerald-300 animate-float-delayed">
            <span>✓ 94.2% Forecast Accuracy</span>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/15 backdrop-blur-md mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phase 1 Early Access</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Stop staring at dashboards. <br />
              <span className="bg-gradient-to-r from-indigo-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                Start making decisions.
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-10">
              Let your data analyst investigate the numbers for you. Connect your first dataset in under two minutes with zero ETL overhead.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-8">
              <button
                onClick={onStartAnalyzing}
                id="cta-btn-start"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-slate-900 bg-white hover:bg-indigo-50 shadow-xl shadow-white/10 transition-all duration-200 cursor-pointer active:scale-98"
              >
                <span>Start Analyzing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onExploreAgent}
                id="cta-btn-explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700 transition-all duration-200 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-indigo-400" />
                <span>Explore the Agent</span>
              </button>
            </div>

            {/* Reassurance text */}
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> No credit card required
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Read-only database safety
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Instant schema detection
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
