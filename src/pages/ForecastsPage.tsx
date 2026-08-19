import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Sparkles,
  AlertCircle,
  Database,
  ArrowRight,
  RefreshCw,
  Layers,
  History,
  Bot,
  Terminal,
  Upload,
} from 'lucide-react';
import { Dataset } from '../types/dataset';
import { DatasetProfile } from '../types/dataProfile';
import {
  ForecastConfig,
  ForecastResult,
  ForecastStatus,
} from '../services/forecasting/forecastTypes';
import {
  autoConfigureForecast,
  runFullForecast,
  loadForecastHistory,
  deleteForecast,
} from '../services/forecasting/forecastingService';
import { ForecastSetupCard } from '../components/forecasting/ForecastSetupCard';
import { ForecastKPIHeader } from '../components/forecasting/ForecastKPIHeader';
import { ForecastChart } from '../components/forecasting/ForecastChart';
import { ModelScorecardTable } from '../components/forecasting/ModelScorecardTable';
import { TimeSeriesDecompositionCard } from '../components/forecasting/TimeSeriesDecompositionCard';
import { ForecastDataTable } from '../components/forecasting/ForecastDataTable';
import { ForecastAIExecutiveBrief } from '../components/forecasting/ForecastAIExecutiveBrief';
import { ForecastHistoryDrawer } from '../components/forecasting/ForecastHistoryDrawer';

interface ForecastsPageProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (dataset: Dataset) => void;
  datasetProfiles: Record<string, DatasetProfile>;
  onNavigateToAnalyst?: (dataset: Dataset, prompt: string) => void;
  onNavigateToSQL?: (dataset: Dataset, query: string) => void;
  onNavigateToUpload?: () => void;
}

export const ForecastsPage: React.FC<ForecastsPageProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  datasetProfiles,
  onNavigateToAnalyst,
  onNavigateToSQL,
  onNavigateToUpload,
}) => {
  const [config, setConfig] = useState<ForecastConfig | null>(null);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [history, setHistory] = useState<ForecastResult[]>([]);
  const [status, setStatus] = useState<ForecastStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or update config when dataset changes
  useEffect(() => {
    if (selectedDataset) {
      const profile = datasetProfiles[selectedDataset.datasetId];
      const initialConfig = autoConfigureForecast(selectedDataset, profile);
      setConfig(initialConfig);
      loadSavedForecasts(selectedDataset.userId, selectedDataset.datasetId);
    } else if (datasets.length > 0) {
      onSelectDataset(datasets[0]);
    }
  }, [selectedDataset?.datasetId]);

  const loadSavedForecasts = async (userId: string, datasetId: string) => {
    try {
      const saved = await loadForecastHistory(userId, datasetId);
      setHistory(saved);
      if (saved.length > 0 && !forecastResult) {
        setForecastResult(saved[0]);
      }
    } catch (e) {
      console.warn('Failed to load forecast history:', e);
    }
  };

  const handleAutoDetect = () => {
    if (!selectedDataset) return;
    const profile = datasetProfiles[selectedDataset.datasetId];
    const autoCfg = autoConfigureForecast(selectedDataset, profile);
    setConfig(autoCfg);
  };

  const handleRunForecast = async () => {
    if (!selectedDataset || !config) return;

    setStatus('preparing_data');
    setStatusMessage('Initializing time-series pipeline...');
    setErrorMessage(null);

    try {
      const profile = datasetProfiles[selectedDataset.datasetId];
      const result = await runFullForecast(
        selectedDataset,
        config,
        profile,
        (currentStatus, message) => {
          setStatus(currentStatus);
          setStatusMessage(message);
        }
      );

      setForecastResult(result);
      setHistory((prev) => [result, ...prev.filter((h) => h.forecastId !== result.forecastId)]);
      setStatus('completed');
    } catch (err: any) {
      console.error('Forecast calculation failed:', err);
      setStatus('failed');
      setErrorMessage(err.message || 'An unexpected error occurred during time-series modeling.');
    }
  };

  const handleDeleteHistoryItem = async (forecastId: string) => {
    if (!selectedDataset) return;
    await deleteForecast(selectedDataset.userId, selectedDataset.datasetId, forecastId);
    setHistory((prev) => prev.filter((h) => h.forecastId !== forecastId));
    if (forecastResult?.forecastId === forecastId) {
      const remaining = history.filter((h) => h.forecastId !== forecastId);
      setForecastResult(remaining[0] || null);
    }
  };

  // If no datasets available, render empty state
  if (datasets.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            No Datasets Available for Predictive Modeling
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Upload a time-stamped CSV or Excel file (e.g. Sales, Revenue, Orders, Demand) to run statistical models and AI forecast intelligence.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateToUpload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload CSV / Excel Dataset</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Predictive Forecasting Engine
              </h1>
              <p className="text-xs text-slate-500">
                Phase 11 — Industry-grade statistical modeling, backtesting, and AI executive briefings
              </p>
            </div>
          </div>
        </div>

        {forecastResult && onNavigateToAnalyst && selectedDataset && (
          <button
            onClick={() =>
              onNavigateToAnalyst(
                selectedDataset,
                `Analyze the ${forecastResult.config.metricColumn} forecast trajectory and model accuracy.`
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Ask AI Analyst</span>
          </button>
        )}
      </div>

      {/* Setup & Config Card */}
      {config && (
        <ForecastSetupCard
          datasets={datasets}
          selectedDataset={selectedDataset}
          onSelectDataset={onSelectDataset}
          datasetProfiles={datasetProfiles}
          config={config}
          onChangeConfig={setConfig}
          onAutoDetect={handleAutoDetect}
          onRunForecast={handleRunForecast}
          status={status}
          statusMessage={statusMessage}
        />
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-900">Forecasting Computation Halted</h4>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Results View */}
      {forecastResult && (
        <div className="space-y-6">
          {/* KPI Header Cards */}
          <ForecastKPIHeader forecast={forecastResult} />

          {/* Primary Interactive Chart */}
          <ForecastChart forecast={forecastResult} />

          {/* AI Executive Intelligence Briefing */}
          <ForecastAIExecutiveBrief
            forecast={forecastResult}
            onAskAIAnalyst={(prompt) => {
              if (selectedDataset && onNavigateToAnalyst) {
                onNavigateToAnalyst(selectedDataset, prompt);
              }
            }}
            onOpenSQL={(query) => {
              if (selectedDataset && onNavigateToSQL) {
                onNavigateToSQL(selectedDataset, query);
              }
            }}
          />

          {/* Time Series Decomposition & Hygiene Breakdown */}
          <TimeSeriesDecompositionCard
            decomposition={forecastResult.decomposition}
            metadata={forecastResult.metadata}
          />

          {/* Model Leaderboard & Backtesting Scorecard */}
          <ModelScorecardTable
            scorecards={forecastResult.scorecard}
            selectedModelType={forecastResult.selectedModel}
          />

          {/* Detailed Data Table with CSV Export */}
          <ForecastDataTable forecast={forecastResult} />

          {/* History Drawer */}
          <ForecastHistoryDrawer
            history={history}
            activeForecastId={forecastResult.forecastId}
            onSelectForecast={(f) => setForecastResult(f)}
            onDeleteForecast={handleDeleteHistoryItem}
          />
        </div>
      )}
    </div>
  );
};
