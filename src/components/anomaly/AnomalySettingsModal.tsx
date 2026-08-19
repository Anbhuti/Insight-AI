import React, { useState } from 'react';
import {
  AnomalyDetectionConfig,
  AnomalySensitivity,
  DetectionMethod,
} from '../../types/anomaly';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import { getDefaultDetectionConfig } from '../../services/anomaly/anomalyDetectionService';

interface AnomalySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AnomalyDetectionConfig;
  onSaveConfig: (config: AnomalyDetectionConfig) => void;
  availableColumns: string[];
}

export const AnomalySettingsModal: React.FC<AnomalySettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  availableColumns,
}) => {
  if (!isOpen) return null;

  const [formConfig, setFormConfig] = useState<AnomalyDetectionConfig>({ ...config });

  const handleSensitivityChange = (sens: AnomalySensitivity) => {
    const defaults = getDefaultDetectionConfig(sens);
    setFormConfig({
      ...defaults,
      selectedColumns: formConfig.selectedColumns,
    });
  };

  const handleToggleMethod = (method: DetectionMethod) => {
    const current = formConfig.enabledMethods;
    const next = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    if (next.length === 0) return; // Prevent disabling all
    setFormConfig({ ...formConfig, enabledMethods: next });
  };

  const handleToggleColumn = (col: string) => {
    const current = formConfig.selectedColumns || [];
    const next = current.includes(col)
      ? current.filter((c) => c !== col)
      : [...current, col];
    setFormConfig({ ...formConfig, selectedColumns: next.length > 0 ? next : undefined });
  };

  const handleSave = () => {
    onSaveConfig(formConfig);
    onClose();
  };

  const handleReset = () => {
    setFormConfig(getDefaultDetectionConfig('standard'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Statistical Engine Thresholds
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Calibrate outlier bounds, z-score tolerances, and scanning algorithms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          
          {/* Sensitivity Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Preset Sensitivity
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'conservative', label: 'Conservative', desc: 'Fewer, high-confidence critical outliers (Z >= 3.5σ)' },
                  { id: 'standard', label: 'Standard (Balanced)', desc: 'Recommended enterprise baseline (Z >= 2.8σ)' },
                  { id: 'aggressive', label: 'Aggressive', desc: 'Captures subtle drifts and low-magnitude variances (Z >= 2.3σ)' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSensitivityChange(p.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    formConfig.sensitivity === p.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <p className="font-extrabold text-slate-900 mb-1">{p.label}</p>
                  <p className="text-[11px] text-slate-500 leading-snug">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Granular Sliders */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider">
              Mathematical Parameters
            </h4>

            {/* Z-Score */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>Z-Score Tolerance Threshold (Gaussian Distribution)</span>
                <span className="font-mono text-indigo-600 font-bold">{formConfig.zScoreThreshold.toFixed(1)}σ</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="4.5"
                step="0.1"
                value={formConfig.zScoreThreshold}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, zScoreThreshold: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Flags records where metric value deviates by more than ±{formConfig.zScoreThreshold.toFixed(1)} standard deviations from sample mean.
              </p>
            </div>

            {/* IQR Multiplier */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>IQR Multiplier (Interquartile Range Outliers)</span>
                <span className="font-mono text-indigo-600 font-bold">{formConfig.iqrMultiplier.toFixed(1)}× IQR</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={formConfig.iqrMultiplier}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, iqrMultiplier: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Tukey fence bound: Q1 - {formConfig.iqrMultiplier.toFixed(1)}*IQR to Q3 + {formConfig.iqrMultiplier.toFixed(1)}*IQR.
              </p>
            </div>

            {/* MAD Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>MAD Modified Z-Score Threshold (Robust to Extreme Outliers)</span>
                <span className="font-mono text-indigo-600 font-bold">{formConfig.madThreshold.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="5.0"
                step="0.1"
                value={formConfig.madThreshold}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, madThreshold: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Percentage Change Spike Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>Period-over-Period Variance Velocity Threshold</span>
                <span className="font-mono text-indigo-600 font-bold">±{formConfig.pctChangeThreshold}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={formConfig.pctChangeThreshold}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, pctChangeThreshold: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Enabled Algorithms Checkboxes */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider">
              Active Analytical Algorithms
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'z_score', label: 'Z-Score Normal Curve' },
                  { id: 'iqr', label: 'IQR Quartile Fencing' },
                  { id: 'mad', label: 'MAD Robust Estimator' },
                  { id: 'rolling_window', label: 'Rolling Moving Avg Trend' },
                  { id: 'pct_change', label: '% Velocity Shock' },
                ] as { id: DetectionMethod; label: string }[]
              ).map((m) => {
                const checked = formConfig.enabledMethods.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      checked ? 'bg-indigo-50/50 border-indigo-200 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleMethod(m.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{m.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Target Columns Filter */}
          {availableColumns.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider">
                  Target Columns to Scan
                </h4>
                <span className="text-[11px] text-slate-400">
                  {formConfig.selectedColumns ? `${formConfig.selectedColumns.length} selected` : 'All numeric columns'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                {availableColumns.map((col) => {
                  const isSelected = !formConfig.selectedColumns || formConfig.selectedColumns.includes(col);
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => handleToggleColumn(col)}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200 opacity-60'
                      }`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
