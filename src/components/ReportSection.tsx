import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Share2, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface ReportSectionProps {
  onGenerateReport?: () => void;
}

export const ReportSection: React.FC<ReportSectionProps> = ({ onGenerateReport }) => {
  const [activeReportTab, setActiveReportTab] = useState<string>('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const reportSections = [
    { id: 'summary', title: 'Executive Summary' },
    { id: 'kpi', title: 'KPI Overview' },
    { id: 'trends', title: 'Major Trends' },
    { id: 'anomalies', title: 'Anomalies' },
    { id: 'rootcause', title: 'Root Cause Analysis' },
    { id: 'forecast', title: 'Forecast' },
    { id: 'recommendations', title: 'Recommendations' },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      if (onGenerateReport) onGenerateReport();
    }, 1200);
  };

  return (
    <section id="reports" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Automated Executive Synthesis"
          badgeIcon={<FileText className="w-3.5 h-3.5" />}
          title={
            <>
              From analysis <br />
              <span className="text-indigo-600">to executive-ready report.</span>
            </>
          }
          subtitle="Compile hours of manual data wrangling into clean, beautifully structured PDF briefs ready for board meetings, leadership syncs, and team standups."
          className="mb-14"
        />

        {/* Large White Container */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-14 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Report Features & One-Click Generation (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Publication-Quality Artifacts
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-4">
                  Turn Complex Numbers into Clear Narrative Briefs
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  InsightAI automatically synthesizes all charts, statistical proofs, and causal driver trees into an unassailable executive document with zero formatting hassle.
                </p>

                {/* Section Checklist in the document */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2 mb-6">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Included in Executive Brief:
                  </span>
                  {reportSections.map((sec) => (
                    <div
                      key={sec.id}
                      onClick={() => setActiveReportTab(sec.id)}
                      className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        activeReportTab === sec.id
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>{sec.title}</span>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${activeReportTab === sec.id ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="space-y-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  id="btn-generate-report"
                  className="w-full py-4 rounded-full bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all cursor-pointer active:scale-98 disabled:opacity-70"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Synthesizing PDF Brief...' : 'Generate Executive Report'}</span>
                </button>
                <div className="text-center text-[11px] text-slate-400">
                  Exportable to PDF, Notion, Slack, and Google Docs (Phase 1 Preview)
                </div>
              </div>
            </div>

            {/* Right: High-Fidelity Visual Document Preview (7 cols on lg) */}
            <div className="lg:col-span-7 bg-slate-100/90 rounded-2xl p-4 sm:p-6 border border-slate-200/80">
              
              {/* Document Paper Mockup */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200/90 p-6 sm:p-8 flex flex-col gap-5 text-slate-900 min-h-[480px]">
                
                {/* PDF Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✦
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      INSIGHTAI BUSINESS REPORT
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">CONFIDENTIAL • Q2 BRIEFING</span>
                </div>

                {/* Document Title */}
                <div>
                  <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    Monthly Performance & Anomaly Investigation
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span>Generated: Today</span>
                    <span>•</span>
                    <span>Scope: Global Enterprise Operations</span>
                  </div>
                </div>

                {/* Executive Summary Block */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs leading-relaxed space-y-2">
                  <strong className="text-slate-900 font-bold block">1. Executive Summary</strong>
                  <p className="text-slate-600">
                    Gross revenue clocked at ₹42.3L (+8.2% MoM). Underlying healthy expansion in West (+7.8%) and South (+5.1%) offset a temporary -41% logistical bottleneck in North region.
                  </p>
                </div>

                {/* Mini Visual Metrics in Report */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Total Revenue</span>
                    <span className="font-bold text-slate-900">₹42.3L</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Identified Root Cause</span>
                    <span className="font-bold text-rose-600">North Delivery SLA</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">30d Growth Potential</span>
                    <span className="font-bold text-indigo-600">+8.3% Projected</span>
                  </div>
                </div>

                {/* Recommendations in Report */}
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-700 space-y-1">
                  <strong className="text-indigo-900 font-bold block">2. Primary Recommendations</strong>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                    <span>Reroute 600 units of Product A from West warehouse.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                    <span>Deploy backup regional carrier in North metropolitan cluster.</span>
                  </div>
                </div>

                {/* PDF Footer Watermark */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Prepared by InsightAI Autonomous Agent</span>
                  <span>Page 1 of 4</span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Toast Notification on Generate */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div className="text-xs">
            <span className="font-bold block">Executive Brief Generated</span>
            <span className="text-slate-400">Phase 1 Preview: Real export connects in Phase 2</span>
          </div>
        </div>
      )}
    </section>
  );
};
