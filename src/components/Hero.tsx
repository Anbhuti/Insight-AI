import React from 'react';
import { ArrowRight, Sparkles, Play, Shield, CheckCircle } from 'lucide-react';
import { HeroProductPreview } from './HeroProductPreview';

interface HeroProps {
  onStartAnalyzing: () => void;
  onSeeHowItWorks: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartAnalyzing, onSeeHowItWorks }) => {
  return (
    <section className="relative pt-28 sm:pt-36 pb-20 lg:pb-32 overflow-hidden">
      {/* Soft Ambient Pastel Background Blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[640px] pointer-events-none -z-10 overflow-hidden">
        {/* Soft Lavender Orb */}
        <div className="absolute top-10 left-[15%] w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
        {/* Soft Blush Pink Orb */}
        <div className="absolute top-20 right-[15%] w-96 h-96 bg-rose-200/40 rounded-full blur-3xl" />
        {/* Soft Light Blue Orb */}
        <div className="absolute top-48 left-[40%] w-[500px] h-[400px] bg-sky-200/40 rounded-full blur-3xl" />
        {/* Soft Peach Orb */}
        <div className="absolute top-72 right-[30%] w-80 h-80 bg-amber-100/50 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Hero Typography & Badge */}
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center mb-12 sm:mb-16">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-white/80 text-indigo-700 border border-indigo-100 shadow-xs backdrop-blur-md mb-6 hover:border-indigo-200 transition-colors">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Introducing InsightAI — Autonomous Business Intelligence</span>
          </div>

          {/* Large Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] mb-6">
            <span>Your data.</span> <br />
            <span className="text-slate-800">Your answers.</span> <br />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
              One intelligent analyst.
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl text-lg sm:text-xl text-slate-600 font-normal leading-relaxed mb-9">
            InsightAI connects to your business data, investigates what is happening, explains why it is happening, and helps you decide what to do next.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-6">
            <button
              onClick={onStartAnalyzing}
              id="hero-btn-start"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-semibold text-white bg-slate-900 hover:bg-indigo-600 shadow-xl shadow-slate-900/10 hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer active:scale-98"
            >
              <span>Start Analyzing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onSeeHowItWorks}
              id="hero-btn-how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-base font-semibold text-slate-700 bg-white/90 hover:bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Trust Line */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500">
            <div className="flex -space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500 border border-white flex items-center justify-center text-[10px] text-white font-bold">A</span>
              <span className="w-5 h-5 rounded-full bg-purple-500 border border-white flex items-center justify-center text-[10px] text-white font-bold">K</span>
              <span className="w-5 h-5 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-[10px] text-white font-bold">S</span>
            </div>
            <span>Built for modern data-driven teams.</span>
            <span className="mx-1.5 text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Read-Only Security
            </span>
          </div>

        </div>

        {/* Hero Product Visual Canvas & Floating Cards */}
        <HeroProductPreview onOpenExplore={onStartAnalyzing} />

      </div>
    </section>
  );
};
