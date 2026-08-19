import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  FileText, 
  Lightbulb, 
  MessageSquare,
  RefreshCw,
  Search
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { DEMO_QUESTIONS } from '../data/mockData';

export const InteractiveDemo: React.FC = () => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('q1');
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'recommendations'>('overview');

  const currentQ = DEMO_QUESTIONS.find((q) => q.id === selectedQuestionId) || DEMO_QUESTIONS[0];

  return (
    <section id="demo" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Hands-On Sandbox"
          badgeIcon={<Search className="w-3.5 h-3.5" />}
          title={
            <>
              Ask InsightAI <br />
              <span className="text-indigo-600">anything.</span>
            </>
          }
          subtitle="Click any real-world business question below to test how InsightAI synthesizes tabular records into executive-grade answers, charts, and recommendations."
          className="mb-14"
        />

        {/* 6 Clickable Question Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto mb-10">
          {DEMO_QUESTIONS.map((q) => {
            const isSelected = selectedQuestionId === q.id;
            return (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedQuestionId(q.id);
                  setActiveTab('overview');
                }}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-102 ring-2 ring-indigo-300'
                    : 'bg-white text-slate-700 hover:bg-slate-100/90 border border-slate-200/80'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                <span>{q.question}</span>
              </button>
            );
          })}
        </div>

        {/* Large Interactive Sandbox Canvas */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-xl shadow-slate-200/50 max-w-5xl mx-auto">
          
          {/* Query Bar Header */}
          <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/70 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                ?
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
                  Active Query Simulation ({currentQ.category})
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  "{currentQ.question}"
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Confidence: {currentQ.answer.confidence}%
              </span>
            </div>
          </div>

          {/* Agent Answer Container */}
          <div className="flex flex-col gap-6">
            
            {/* Answer Headline & Summary */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border border-indigo-100 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>InsightAI Agent Reasoning</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {currentQ.answer.headline}
              </h4>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                {currentQ.answer.summary}
              </p>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {currentQ.answer.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                >
                  <span className="text-xs text-slate-500 font-medium">{metric.label}</span>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 my-1">
                    {metric.value}
                  </div>
                  {metric.trend && (
                    <span className={`text-xs font-bold ${
                      metric.isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {metric.trend}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Tabbed Exploration View */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Root Cause & Slices
                </button>
                <button
                  onClick={() => setActiveTab('evidence')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'evidence'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Empirical Evidence ({currentQ.answer.evidenceItems.length})
                </button>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'recommendations'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Recommended Action
                </button>
              </div>

              {/* Tab Contents */}
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 text-xs sm:text-sm">
                {activeTab === 'overview' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 font-bold block mb-1">Identified Root Cause:</strong>
                        <p className="text-slate-600 leading-relaxed">
                          {currentQ.answer.rootCause || 'Statistical correlation isolated across regional delivery SLAs.'}
                        </p>
                      </div>
                    </div>

                    {currentQ.answer.chartData && (
                      <div className="pt-3 border-t border-slate-200/60">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-2">
                          Cohort Comparison Chart:
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {currentQ.answer.chartData.map((d) => (
                            <div key={d.label} className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                              <span className="text-[10px] text-slate-500 block">{d.label}</span>
                              <span className="font-bold text-slate-900">{d.value}L</span>
                              {d.benchmark && (
                                <div className="text-[9px] text-slate-400">Target: {d.benchmark}L</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'evidence' && (
                  <div className="space-y-2.5">
                    <strong className="text-slate-900 font-bold block">Verified Database Logs:</strong>
                    {currentQ.answer.evidenceItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div className="space-y-3">
                    <strong className="text-slate-900 font-bold block">Actionable Next Step:</strong>
                    <div className="p-4 rounded-xl bg-indigo-600 text-white font-medium text-xs sm:text-sm leading-relaxed shadow-sm">
                      {currentQ.answer.recommendation}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
