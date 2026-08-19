import React from 'react';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BusinessHealthData } from '../../types/dashboard';

interface BusinessHealthCardProps {
  health: BusinessHealthData;
}

export const BusinessHealthCard: React.FC<BusinessHealthCardProps> = ({ health }) => {
  const { score, maxScore, status, metrics } = health;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
      
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Business Health
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Composite stability index</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {status}
          </span>
        </div>

        {/* Big Score Gauge Area */}
        <div className="flex items-baseline gap-2 mb-5">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {score}
          </span>
          <span className="text-sm font-semibold text-slate-400">
            / {maxScore}
          </span>
          <span className="ml-auto text-xs font-medium text-slate-500">
            Weighted across 4 pillars
          </span>
        </div>

        {/* Metric Progress Bars */}
        <div className="space-y-3.5 pt-2 border-t border-slate-100">
          {metrics.map((metric) => (
            <div key={metric.name}>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">{metric.name}</span>
                <span className="text-slate-900 font-bold">{metric.score} <span className="text-slate-400 font-normal">/ {metric.maxScore}</span></span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                  style={{ width: `${(metric.score / metric.maxScore) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Evaluated continuously</span>
        <span className="font-medium text-indigo-600">Diagnostics OK</span>
      </div>

    </div>
  );
};
