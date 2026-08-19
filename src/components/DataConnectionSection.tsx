import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Table2, 
  Database, 
  HardDrive, 
  Sheet, 
  Webhook, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  Lock,
  Layers,
  Cpu
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { DATA_SOURCES } from '../data/mockData';

export const DataConnectionSection: React.FC = () => {
  const [activeSource, setActiveSource] = useState<string>('PostgreSQL');

  const getSourceIcon = (name: string) => {
    switch (name) {
      case 'CSV & Spreadsheets':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'Microsoft Excel':
        return <Table2 className="w-5 h-5 text-emerald-600" />;
      case 'PostgreSQL':
        return <Database className="w-5 h-5 text-blue-600" />;
      case 'MySQL':
        return <HardDrive className="w-5 h-5 text-amber-600" />;
      case 'Google Sheets':
        return <Sheet className="w-5 h-5 text-teal-600" />;
      default:
        return <Webhook className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <section id="features" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Seamless Ingestion"
          badgeIcon={<Layers className="w-3.5 h-3.5" />}
          title={
            <>
              Bring your data. <br />
              <span className="text-indigo-600">We'll do the thinking.</span>
            </>
          }
          subtitle="Connect your tables, warehouses, spreadsheets, and custom streams. InsightAI maps schemas automatically with zero manual ETL configuration."
          className="mb-14"
        />

        {/* Large White Rounded Canvas for Connection Visual */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-14 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          {/* Top connection diagram */}
          <div className="relative py-6 sm:py-10">
            
            {/* Center Hub: ✦ InsightAI */}
            <div className="relative z-20 max-w-sm mx-auto text-center mb-12 sm:mb-16">
              <div className="inline-flex flex-col items-center p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-2xl shadow-indigo-500/20 border border-slate-800 scale-105 transition-transform">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 mb-3 animate-pulse-subtle">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">✦ InsightAI Core</h3>
                <p className="text-xs text-indigo-200 mt-1">Autonomous Reasoning & Semantic Schema Engine</p>
                <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-emerald-400 border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Ready for Live Sync (Phase 1 Preview)</span>
                </div>
              </div>
            </div>

            {/* Grid of Data Source Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {DATA_SOURCES.map((source) => {
                const isCurrent = activeSource === source.name;
                return (
                  <div
                    key={source.name}
                    onClick={() => setActiveSource(source.name)}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                      isCurrent
                        ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200 shadow-md'
                        : 'bg-slate-50/70 hover:bg-slate-100/90 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200/60 shadow-xs">
                          {getSourceIcon(source.name)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{source.name}</h4>
                          <span className="text-xs text-slate-500">{source.type}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                        {source.tag}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Read-only connection</span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-1">
                        Select to preview <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Bottom Security Assurance Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero data writes. InsightAI connects using strict read-only queries.</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 font-semibold">
              <span>✓ Auto schema parsing</span>
              <span>✓ Sensitive PII auto-masking</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
