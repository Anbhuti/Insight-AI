import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { AnomalyPreviewData } from '../../types/dashboard';
import { useAuth } from '../../context/AuthContext';
import { AnomalyScanSummary, Anomaly } from '../../types/anomaly';

interface AnomalyPreviewProps {
  data: AnomalyPreviewData;
  onViewAnomalies: () => void;
}

export const AnomalyPreview: React.FC<AnomalyPreviewProps> = ({
  data,
  onViewAnomalies,
}) => {
  const { user } = useAuth();
  const [topAnomaly, setTopAnomaly] = useState<Anomaly | null>(null);
  const [anomalyCount, setAnomalyCount] = useState<number>(1);

  useEffect(() => {
    if (!user) return;
    try {
      // Find latest anomaly scan from local storage cache
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`insightai_anomalies_${user.uid}`)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const scan: AnomalyScanSummary = JSON.parse(raw);
            if (scan.anomalies && scan.anomalies.length > 0) {
              const active = scan.anomalies.filter((a) => a.status !== 'resolved');
              if (active.length > 0) {
                setTopAnomaly(active[0]);
                setAnomalyCount(active.length);
                break;
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }, [user]);

  const displayMetric = topAnomaly ? `${topAnomaly.column} Outlier` : `${data.metric} Variance`;
  const displayDimension = topAnomaly
    ? (topAnomaly.dimensionValue || topAnomaly.rowIdentifier || `Row #${(topAnomaly.rowIndex || 0) + 1}`)
    : data.dimension;
  const displayDeviation = topAnomaly
    ? `${topAnomaly.deviationPercentage > 0 ? '+' : ''}${topAnomaly.deviationPercentage.toFixed(1)}%`
    : data.deviation;
  const displayTime = topAnomaly ? 'Algorithmic Scan' : data.detectedTime;
  const isCritical = topAnomaly?.severity === 'critical';

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
      
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isCritical ? 'bg-rose-50 border border-rose-100 text-rose-600' : 'bg-amber-50 border border-amber-100 text-amber-600'}`}>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Statistical Surveillance
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Outlier & volatility radar</p>
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {anomalyCount} {anomalyCount === 1 ? 'Outlier Flagged' : 'Outliers Flagged'}
          </span>
        </div>

        {/* Anomaly Card Box */}
        <div className={`p-4 rounded-xl mb-4 border ${isCritical ? 'bg-rose-50/50 border-rose-200/60' : 'bg-slate-50 border-slate-200/70'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              {displayMetric}
            </span>
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {displayTime}
            </span>
          </div>

          <p className="text-xs font-bold text-slate-900 mb-1 truncate">
            {displayDimension}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 rounded-md text-white text-xs font-bold shadow-2xs ${isCritical ? 'bg-rose-600' : 'bg-indigo-600'}`}>
              {displayDeviation}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {topAnomaly ? topAnomaly.scoreLabel : 'vs moving average'}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onViewAnomalies}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer group"
      >
        <span>Launch Anomaly Engine</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </button>

    </div>
  );
};
