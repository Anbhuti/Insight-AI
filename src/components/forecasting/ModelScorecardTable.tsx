import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { ModelBacktestScorecard, ForecastModelType } from '../../services/forecasting/forecastTypes';

interface ModelScorecardTableProps {
  scorecards: ModelBacktestScorecard[];
  selectedModelType: ForecastModelType;
  onSelectModelOverride?: (modelType: ForecastModelType) => void;
}

export const ModelScorecardTable: React.FC<ModelScorecardTableProps> = ({
  scorecards,
  selectedModelType,
  onSelectModelOverride,
}) => {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const toggleExpand = (modelType: string) => {
    setExpandedModel(expandedModel === modelType ? null : modelType);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Chronological Backtesting & Model Leaderboard
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Every candidate model is evaluated across historical rolling-origin cross-validation folds
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Lower sMAPE / MAE indicates higher forecast accuracy</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3.5 rounded-l-xl">Rank</th>
              <th className="py-3 px-3.5">Statistical Model</th>
              <th className="py-3 px-3.5 text-right">Validation sMAPE</th>
              <th className="py-3 px-3.5 text-right">MAE</th>
              <th className="py-3 px-3.5 text-right">RMSE</th>
              <th className="py-3 px-3.5 text-right">WAPE</th>
              <th className="py-3 px-3.5 text-center">Folds Tested</th>
              <th className="py-3 px-3.5 text-right rounded-r-xl">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {scorecards.map((card) => {
              const isSelected = card.modelType === selectedModelType;
              const isEligible = card.isEligible;
              const isExpanded = expandedModel === card.modelType;

              return (
                <React.Fragment key={card.modelType}>
                  <tr
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected ? 'bg-indigo-50/50 font-semibold' : ''
                    } ${!isEligible ? 'opacity-60 bg-slate-50/30' : ''}`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3.5">
                      {isEligible ? (
                        <span
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-extrabold ${
                            card.rank === 1
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {card.rank}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Model Name */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-bold">{card.modelName}</span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white shadow-2xs">
                            Active Choice
                          </span>
                        )}
                        {!isEligible && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600">
                            Ineligible
                          </span>
                        )}
                      </div>
                      {!isEligible && card.ineligibilityReason && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {card.ineligibilityReason}
                        </p>
                      )}
                    </td>

                    {/* sMAPE */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold">
                      {isEligible ? (
                        <span
                          className={
                            card.smape < 15
                              ? 'text-emerald-600'
                              : card.smape < 30
                              ? 'text-indigo-600'
                              : 'text-amber-600'
                          }
                        >
                          {card.smape}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* MAE */}
                    <td className="py-3 px-3.5 text-right font-mono">
                      {isEligible && isFinite(card.mae) ? card.mae.toLocaleString() : '—'}
                    </td>

                    {/* RMSE */}
                    <td className="py-3 px-3.5 text-right font-mono text-slate-500">
                      {isEligible && isFinite(card.rmse) ? card.rmse.toLocaleString() : '—'}
                    </td>

                    {/* WAPE */}
                    <td className="py-3 px-3.5 text-right font-mono text-slate-500">
                      {isEligible && isFinite(card.wape) ? `${card.wape}%` : '—'}
                    </td>

                    {/* Folds */}
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        {card.testFolds.length > 0 ? `${card.testFolds.length} folds` : 'In-sample fit'}
                      </span>
                    </td>

                    {/* Expand Toggle */}
                    <td className="py-3 px-3.5 text-right">
                      {isEligible && card.testFolds.length > 0 ? (
                        <button
                          onClick={() => toggleExpand(card.modelType)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Folds' : 'View Folds'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[11px]">N/A</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Fold Details */}
                  {isExpanded && card.testFolds.length > 0 && (
                    <tr className="bg-slate-50/90">
                      <td colSpan={8} className="p-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Rolling-Origin Cross-Validation Folds for {card.modelName}</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            {card.testFolds.map((fold) => (
                              <div
                                key={fold.foldIndex}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                              >
                                <div className="flex items-center justify-between font-bold text-slate-800">
                                  <span>Fold #{fold.foldIndex}</span>
                                  <span className="text-indigo-600 font-mono">
                                    sMAPE: {fold.smape}%
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 space-y-0.5">
                                  <div>
                                    <span className="text-slate-400">Train:</span> {fold.trainStart} → {fold.trainEnd} ({fold.trainCount} pts)
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Test:</span> {fold.testStart} → {fold.testEnd} ({fold.testCount} pts)
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Fold MAE:</span> {fold.mae}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {card.parameters && Object.keys(card.parameters).length > 0 && (
                            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                              <span className="font-semibold text-slate-700">Estimated Parameters: </span>
                              {Object.entries(card.parameters).map(([k, v]) => (
                                <span key={k} className="mr-3 font-mono">
                                  {k}: {String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
