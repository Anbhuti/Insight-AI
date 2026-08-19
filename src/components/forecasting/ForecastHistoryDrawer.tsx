import React from 'react';
import {
  History,
  TrendingUp,
  Trash2,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { ForecastResult } from '../../services/forecasting/forecastTypes';

interface ForecastHistoryDrawerProps {
  history: ForecastResult[];
  activeForecastId: string | null;
  onSelectForecast: (forecast: ForecastResult) => void;
  onDeleteForecast: (forecastId: string) => void;
}

export const ForecastHistoryDrawer: React.FC<ForecastHistoryDrawerProps> = ({
  history,
  activeForecastId,
  onSelectForecast,
  onDeleteForecast,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
        <History className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900">Saved Forecasts & Scenarios</h3>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
          {history.length}
        </span>
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {history.map((item) => {
          const isActive = item.forecastId === activeForecastId;
          const isPositive = item.summary.expectedGrowthPct > 0;

          return (
            <div
              key={item.forecastId}
              onClick={() => onSelectForecast(item)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isActive
                  ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/70'
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {item.config.metricColumn}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-white text-indigo-700 border border-indigo-200">
                    {item.config.horizon} {item.config.frequency}
                  </span>
                  {item.isOutdated && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Dataset Updated
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{item.selectedModelName}</span>
                  <span>•</span>
                  <span className={isPositive ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {isPositive ? '+' : ''}{item.summary.expectedGrowthPct}%
                  </span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteForecast(item.forecastId);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete forecast"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-300'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
