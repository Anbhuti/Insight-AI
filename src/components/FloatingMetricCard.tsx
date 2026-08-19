import React from 'react';
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

interface FloatingMetricCardProps {
  type: 'revenue' | 'anomaly' | 'forecast' | 'quality' | 'custom';
  title?: string;
  value?: string;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  className?: string;
  id?: string;
}

export const FloatingMetricCard: React.FC<FloatingMetricCardProps> = ({
  type,
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  className = '',
  id,
}) => {
  if (type === 'revenue') {
    return (
      <div
        id={id || 'card-floating-revenue'}
        className={`p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg shadow-indigo-100/50 border border-slate-100/90 flex flex-col gap-1 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}
      >
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Revenue</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
            Current
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          ₹42.3L
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>↑ 8.2%</span>
          <span className="text-slate-400 font-normal ml-1">vs last month</span>
        </div>
      </div>
    );
  }

  if (type === 'anomaly') {
    return (
      <div
        id={id || 'card-floating-anomaly'}
        className={`p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg shadow-rose-100/50 border border-rose-100/80 flex flex-col gap-1.5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>⚠ Anomaly detected</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500 font-medium">Revenue</span>
          <span className="text-sm font-bold text-rose-600">↓ 31%</span>
        </div>
        <div className="text-[11px] font-medium text-slate-600 bg-rose-50/60 px-2 py-1 rounded-md border border-rose-100/40">
          North Region
        </div>
      </div>
    );
  }

  if (type === 'forecast') {
    return (
      <div
        id={id || 'card-floating-forecast'}
        className={`p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg shadow-indigo-100/50 border border-indigo-100/80 flex flex-col gap-1 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}
      >
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>30-Day Forecast</span>
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          ₹45.8L
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>+8.3%</span>
          <span className="text-slate-400 font-normal ml-1">expected</span>
        </div>
      </div>
    );
  }

  if (type === 'quality') {
    return (
      <div
        id={id || 'card-floating-quality'}
        className={`p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg shadow-emerald-100/50 border border-slate-100 flex flex-col gap-1 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}
      >
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Data Quality</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          94%
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>✓ Healthy</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={id || 'card-floating-custom'}
      className={`p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-100 flex flex-col gap-1 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}
    >
      {title && <span className="text-xs font-medium text-slate-500">{title}</span>}
      {value && <div className="text-xl font-bold text-slate-900">{value}</div>}
      {change && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          <span>{change}</span>
          {subtitle && <span className="text-slate-400 font-normal ml-1">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
