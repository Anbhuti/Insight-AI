import React, { useState } from 'react';
import { Anomaly, AnomalyAIExplanation } from '../../types/anomaly';
import {
  X,
  Sparkles,
  Bot,
  Terminal,
  TrendingUp,
  TrendingDown,
  Activity,
  Calculator,
  Table,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
  Compass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { explainAnomalyWithAI } from '../../services/anomaly/anomalyAIService';

interface AnomalyDetailModalProps {
  anomaly: Anomaly | null;
  onClose: () => void;
  onInvestigateAI: (anomaly: Anomaly) => void;
  onInvestigateSQL: (anomaly: Anomaly) => void;
  onInvestigateRCA?: (anomaly: Anomaly) => void;
  onUpdateStatus: (anomaly: Anomaly, newStatus: any) => void;
}

export const AnomalyDetailModal: React.FC<AnomalyDetailModalProps> = ({
  anomaly,
  onClose,
  onInvestigateAI,
  onInvestigateSQL,
  onInvestigateRCA,
  onUpdateStatus,
}) => {
  if (!anomaly) return null;

  const [activeTab, setActiveTab] = useState<'evidence' | 'ai_impact' | 'raw_record'>('evidence');
  const [copied, setCopied] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [explanation, setExplanation] = useState<AnomalyAIExplanation | undefined>(
    anomaly.aiExplanation
  );

  const isSpike = anomaly.type === 'spike';
  const isCritical = anomaly.severity === 'critical';

  const handleCopy = () => {
    const summaryText = `[Anomaly Report]
Dataset: ${anomaly.datasetName}
Metric: ${anomaly.column} (${anomaly.rowIdentifier || `Row #${anomaly.rowIndex}`})
Type: ${anomaly.type.toUpperCase()}
Observed: ${anomaly.actualValue.toLocaleString()}
Expected: ${anomaly.expectedValue.toLocaleString()}
Variance: ${anomaly.deviationPercentage > 0 ? '+' : ''}${anomaly.deviationPercentage}%
Method: ${anomaly.method.toUpperCase()} (${anomaly.scoreLabel})
Evidence: ${anomaly.statisticalEvidence}
`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await explainAnomalyWithAI(anomaly);
      setExplanation(res);
      anomaly.aiExplanation = res;
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const chartData = anomaly.historicalContext || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isCritical ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              {isCritical ? <ShieldAlert className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">{anomaly.title}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                  {anomaly.severity}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {anomaly.datasetName} · {anomaly.rowIdentifier || `Row #${(anomaly.rowIndex || 0) + 1}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Copy Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Statistical Evidence</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_impact')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai_impact'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Business Impact</span>
          </button>

          <button
            onClick={() => setActiveTab('raw_record')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'raw_record'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Full Row Record</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Statistical Evidence */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Math Metrics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Observed Value (X)
                  </span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {anomaly.actualValue.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Expected Baseline (μ)
                  </span>
                  <span className="text-xl font-semibold text-slate-700">
                    {anomaly.expectedValue.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Magnitude Delta (Δ)
                  </span>
                  <span
                    className={`text-xl font-extrabold ${
                      anomaly.deviationPercentage > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {anomaly.deviationPercentage > 0 ? '+' : ''}
                    {anomaly.deviationPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Algorithm Score
                  </span>
                  <span className="text-xl font-extrabold text-indigo-600">
                    {anomaly.scoreLabel}
                  </span>
                </div>
              </div>

              {/* Mathematical Proof Box */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 font-sans font-bold text-xs text-white">
                    <Calculator className="w-4 h-4 text-indigo-400" />
                    <span>Algorithmic Derivation Formula</span>
                  </span>
                  <span className="text-[11px] uppercase tracking-wider">{anomaly.method}</span>
                </div>
                <p className="text-emerald-400 font-bold">{anomaly.statisticalEvidence}</p>
                <p className="text-slate-400 text-[11px] font-sans">
                  The analytical engine confirmed this value lies outside the confidence interval.
                </p>
              </div>

              {/* Expanded Context Timeline Chart */}
              {chartData.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Sequence Trajectory & Confidence Corridor
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Gray dashed = Baseline Expected Value ({anomaly.expectedValue.toLocaleString()})
                    </span>
                  </div>

                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl space-y-1">
                                  <p className="font-bold">{d.label}</p>
                                  <p>Value: {d.value?.toLocaleString()}</p>
                                  <p className="text-slate-400">Baseline: {d.expected?.toLocaleString()}</p>
                                  {d.isAnomaly && (
                                    <p className="text-rose-400 font-extrabold">⚠️ Outlier Point</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine
                          y={anomaly.expectedValue}
                          stroke="#94a3b8"
                          strokeDasharray="4 4"
                          label={{ value: 'Baseline', fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            if (payload.isAnomaly) {
                              return (
                                <circle
                                  key={props.key || 'anom-node'}
                                  cx={cx}
                                  cy={cy}
                                  r={6}
                                  fill="#f43f5e"
                                  stroke="#ffffff"
                                  strokeWidth={2}
                                />
                              );
                            }
                            return (
                              <circle
                                key={props.key || 'norm-node'}
                                cx={cx}
                                cy={cy}
                                r={3}
                                fill="#6366f1"
                              />
                            );
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI Business Impact & Prescriptive Solutions */}
          {activeTab === 'ai_impact' && (
            <div className="space-y-6">
              {!explanation ? (
                <div className="p-8 rounded-3xl bg-indigo-50/50 border border-indigo-100 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Synthesize Executive AI Business Analysis
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                      Translate this statistical outlier into an executive narrative with business impacts, potential drivers, and prescriptive recommendations.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAI ? 'Consulting Gemini...' : 'Generate Business Explanation'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Executive Headline & Impact */}
                  <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>Executive Briefing</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                        {Math.round((explanation.confidence || 0.9) * 100)}% Analytical Confidence
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">{explanation.headline}</h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {explanation.businessImpact}
                    </p>
                  </div>

                  {/* Potential Drivers */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Probable Root Drivers & Hypotheses</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {explanation.potentialDrivers.map((driver, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5"
                        >
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="font-medium leading-relaxed">{driver}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prescriptive Action Steps */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recommended Prescriptive Actions</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {explanation.recommendedActions.map((action, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-800 flex items-start gap-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="font-medium leading-relaxed">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Full Row Record Inspector */}
          {activeTab === 'raw_record' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Raw Record Columns for Row #{anomaly.rowIndex !== undefined ? anomaly.rowIndex + 1 : 'N/A'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {Object.keys(anomaly.rowData || {}).length} columns captured
                </span>
              </div>

              {anomaly.rowData ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5 font-bold text-slate-700">Column Name</th>
                        <th className="px-4 py-2.5 font-bold text-slate-700">Record Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {Object.entries(anomaly.rowData).map(([col, val]) => {
                        const isTargetCol = col === anomaly.column;
                        return (
                          <tr
                            key={col}
                            className={`hover:bg-slate-50 ${
                              isTargetCol ? 'bg-rose-50/60 font-bold' : ''
                            }`}
                          >
                            <td className="px-4 py-2 text-slate-600 flex items-center gap-1.5">
                              {isTargetCol && <span className="text-rose-500 font-sans">⚠️</span>}
                              <span>{col}</span>
                            </td>
                            <td
                              className={`px-4 py-2 ${
                                isTargetCol ? 'text-rose-700' : 'text-slate-900'
                              }`}
                            >
                              {val === null || val === undefined ? (
                                <span className="text-slate-400 italic">null</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 text-center">
                  No full row dictionary cached for this anomaly.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Enterprise Cross-Feature Bridges */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateStatus(anomaly, anomaly.status === 'resolved' ? 'active' : 'resolved')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                anomaly.status === 'resolved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{anomaly.status === 'resolved' ? 'Mark as Active' : 'Mark as Resolved'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {onInvestigateRCA && (
              <button
                onClick={() => {
                  onClose();
                  onInvestigateRCA(anomaly);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Investigate Root Cause</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onInvestigateSQL(anomaly);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              <span>SQL</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onInvestigateAI(anomaly);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
