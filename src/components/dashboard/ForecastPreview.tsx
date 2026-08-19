import React from 'react';
import { TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { ForecastPreviewData } from '../../types/dashboard';

interface ForecastPreviewProps {
  data: ForecastPreviewData;
  onViewForecasts: () => void;
}

export const ForecastPreview: React.FC<ForecastPreviewProps> = ({
  data,
  onViewForecasts,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
      
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Forecast
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">30-day projection model</p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            95% Confidence
          </span>
        </div>

        {/* Forecast Numbers */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-indigo-50/40 border border-indigo-100/70">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current</span>
            <p className="text-base font-extrabold text-slate-800">{data.currentValue}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Forecast</span>
            <div className="flex items-baseline gap-1">
              <p className="text-base font-extrabold text-indigo-900">{data.forecastValue}</p>
              <span className="text-[10px] font-bold text-emerald-600">({data.expectedGrowth})</span>
            </div>
          </div>
        </div>

        {/* Mini Historical -> Forecast Trajectory Visual */}
        <div className="py-2 mb-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-1">
            <span>Historical</span>
            <span className="text-indigo-600 font-bold">Projected →</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full flex overflow-hidden">
            <div className="w-1/2 bg-slate-400 h-full" />
            <div className="w-1/2 bg-indigo-600 h-full animate-pulse" />
          </div>
        </div>
      </div>

      <button
        onClick={onViewForecasts}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer group mt-2"
      >
        <span>View Forecast</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </button>

    </div>
  );
};
