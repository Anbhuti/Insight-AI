import React, { useState, useEffect, useMemo } from 'react';
import { Dataset } from '../types/dataset';
import { DatasetProfile } from '../types/dataProfile';
import {
  Anomaly,
  AnomalyDetectionConfig,
  AnomalyFilterOptions,
  AnomalyScanSummary,
  AnomalySensitivity,
  AnomalySeverity,
  AnomalyStatus,
  DetectionMethod,
} from '../types/anomaly';
import {
  runAnomalyDetectionScan,
  getLatestAnomalyScan,
  updateAnomalyStatus,
  getDefaultDetectionConfig,
} from '../services/anomaly/anomalyDetectionService';
import { AnomalySummaryCards } from '../components/anomaly/AnomalySummaryCards';
import { AnomalyScanToolbar } from '../components/anomaly/AnomalyScanToolbar';
import { AnomalyCard } from '../components/anomaly/AnomalyCard';
import { AnomalyDetailModal } from '../components/anomaly/AnomalyDetailModal';
import { AnomalySettingsModal } from '../components/anomaly/AnomalySettingsModal';
import {
  Activity,
  AlertCircle,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  Terminal,
  Upload,
  CheckCircle2,
  FilterX,
  Search,
} from 'lucide-react';

interface AnomaliesPageProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (dataset: Dataset) => void;
  datasetProfiles: Record<string, DatasetProfile>;
  onNavigateToAnalyst: (dataset: Dataset, initialPrompt?: string) => void;
  onNavigateToSQL: (dataset: Dataset, initialQuery?: string) => void;
  onNavigateToRCA?: (dataset: Dataset, anomaly?: Anomaly) => void;
  onNavigateToUpload: () => void;
}

export const AnomaliesPage: React.FC<AnomaliesPageProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  datasetProfiles,
  onNavigateToAnalyst,
  onNavigateToSQL,
  onNavigateToRCA,
  onNavigateToUpload,
}) => {
  const [scanSummary, setScanSummary] = useState<AnomalyScanSummary | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings & Sensitivity
  const [sensitivity, setSensitivity] = useState<AnomalySensitivity>('standard');
  const [config, setConfig] = useState<AnomalyDetectionConfig>(getDefaultDetectionConfig('standard'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal Inspection
  const [inspectedAnomaly, setInspectedAnomaly] = useState<Anomaly | null>(null);

  // Filter State
  const [filters, setFilters] = useState<AnomalyFilterOptions>({
    searchQuery: '',
    severity: 'all',
    type: 'all',
    method: 'all',
    column: 'all',
    status: 'all',
    sortBy: 'severity',
    sortOrder: 'desc',
  });

  const activeProfile = selectedDataset ? datasetProfiles[selectedDataset.datasetId] || null : null;

  // Available numeric column list for filters
  const availableColumns = useMemo(() => {
    if (activeProfile?.columns) {
      return activeProfile.columns
        .filter((c) => c.logicalType === 'numeric' || c.logicalType === 'integer' || c.logicalType === 'decimal')
        .map((c) => c.name);
    }
    if (selectedDataset?.previewSample?.columns) {
      return selectedDataset.previewSample.columns;
    }
    return [];
  }, [activeProfile, selectedDataset]);

  // Load cached anomaly scan on dataset change
  useEffect(() => {
    if (!selectedDataset) {
      setScanSummary(null);
      return;
    }

    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const cached = await getLatestAnomalyScan(selectedDataset.userId, selectedDataset.datasetId);
        if (isMounted) {
          if (cached) {
            setScanSummary(cached);
          } else {
            // Auto trigger initial scan if none exists
            handleRunScan();
          }
        }
      } catch (err) {
        console.error('Failed to load anomaly scan:', err);
      }
    };

    fetchLatest();

    return () => {
      isMounted = false;
    };
  }, [selectedDataset?.datasetId]);

  // Execute Anomaly Detection
  const handleRunScan = async (customCfg?: AnomalyDetectionConfig) => {
    if (!selectedDataset) return;
    setIsScanning(true);
    setError(null);

    try {
      const activeCfg = customCfg || config;
      const res = await runAnomalyDetectionScan(selectedDataset, activeProfile, activeCfg);
      setScanSummary(res);
    } catch (err: any) {
      console.error('Error during anomaly scan:', err);
      setError(err.message || 'Failed to complete anomaly detection scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSensitivityChange = (newSens: AnomalySensitivity) => {
    setSensitivity(newSens);
    const newCfg = {
      ...getDefaultDetectionConfig(newSens),
      selectedColumns: config.selectedColumns,
    };
    setConfig(newCfg);
    handleRunScan(newCfg);
  };

  const handleSaveConfig = (newCfg: AnomalyDetectionConfig) => {
    setConfig(newCfg);
    setSensitivity(newCfg.sensitivity);
    handleRunScan(newCfg);
  };

  const handleToggleAnomalyStatus = async (anomaly: Anomaly) => {
    if (!selectedDataset) return;
    const newStatus: AnomalyStatus = anomaly.status === 'resolved' ? 'active' : 'resolved';
    await updateAnomalyStatus(selectedDataset.userId, selectedDataset.datasetId, anomaly.id, newStatus);
    
    // Update local state
    if (scanSummary) {
      const updatedList = scanSummary.anomalies.map((a) =>
        a.id === anomaly.id ? { ...a, status: newStatus } : a
      );
      setScanSummary({ ...scanSummary, anomalies: updatedList });
    }
  };

  // Filtered & Sorted Anomalies
  const filteredAnomalies = useMemo(() => {
    if (!scanSummary?.anomalies) return [];

    let list = [...scanSummary.anomalies];

    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.column.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          (a.dimensionValue && a.dimensionValue.toLowerCase().includes(q)) ||
          (a.rowIdentifier && a.rowIdentifier.toLowerCase().includes(q))
      );
    }

    // Severity
    if (filters.severity !== 'all') {
      list = list.filter((a) => a.severity === filters.severity);
    }

    // Method
    if (filters.method !== 'all') {
      list = list.filter((a) => a.method === filters.method);
    }

    // Column
    if (filters.column !== 'all') {
      list = list.filter((a) => a.column === filters.column);
    }

    // Status
    if (filters.status !== 'all') {
      list = list.filter((a) => a.status === filters.status);
    }

    return list;
  }, [scanSummary, filters]);

  // Investigation Navigation Triggers
  const handleInvestigateAI = (anomaly: Anomaly) => {
    if (!selectedDataset) return;
    const prompt = `Investigate the statistical anomaly detected in "${anomaly.column}" for ${
      anomaly.rowIdentifier || `Row #${anomaly.rowIndex}`
    }. The observed value was ${anomaly.actualValue.toLocaleString()} vs baseline expected ${anomaly.expectedValue.toLocaleString()} (${
      anomaly.deviationPercentage > 0 ? '+' : ''
    }${anomaly.deviationPercentage}% variance, ${anomaly.scoreLabel}). What business factors explain this deviation?`;
    onNavigateToAnalyst(selectedDataset, prompt);
  };

  const handleInvestigateSQL = (anomaly: Anomaly) => {
    if (!selectedDataset) return;
    const query = `Show rows where "${anomaly.column}" has extreme values or investigate records around ${
      anomaly.rowIdentifier || `row ${anomaly.rowIndex}`
    }`;
    onNavigateToSQL(selectedDataset, query);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-6 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Statistical Anomaly Intelligence Engine
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Real algorithmic outlier, spike, drop, and variance surveillance computed across your dataset
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {datasets.length === 0 && (
              <button
                onClick={onNavigateToUpload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Dataset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
        
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => handleRunScan()}
              className="font-bold underline hover:text-rose-800 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State: No Dataset Uploaded */}
        {datasets.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                No Datasets Uploaded
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Upload a CSV or Excel dataset to automatically scan for Gaussian Z-Score outliers, IQR quartile breaches, and volatility shocks.
              </p>
            </div>
            <button
              onClick={onNavigateToUpload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload CSV / Excel</span>
            </button>
          </div>
        ) : (
          <>
            {/* KPI Banner */}
            <AnomalySummaryCards summary={scanSummary} isScanning={isScanning} />

            {/* Filter & Scan Toolbar */}
            <AnomalyScanToolbar
              datasets={datasets}
              selectedDataset={selectedDataset}
              onSelectDataset={onSelectDataset}
              filters={filters}
              onFilterChange={setFilters}
              sensitivity={sensitivity}
              onSensitivityChange={handleSensitivityChange}
              onRunScan={() => handleRunScan()}
              isScanning={isScanning}
              onOpenSettings={() => setIsSettingsOpen(true)}
              availableColumns={availableColumns}
            />

            {/* Anomaly Cards Grid */}
            {isScanning ? (
              <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Executing Statistical Surveillance Engine
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Calculating standard deviations, interquartile Tukey bounds, and velocity variance...
                  </p>
                </div>
              </div>
            ) : filteredAnomalies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAnomalies.map((anom) => (
                  <AnomalyCard
                    key={anom.id}
                    anomaly={anom}
                    onInspect={(a) => setInspectedAnomaly(a)}
                    onInvestigateAI={handleInvestigateAI}
                    onInvestigateSQL={handleInvestigateSQL}
                    onToggleStatus={handleToggleAnomalyStatus}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FilterX className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    No Anomalies Match the Current Filters
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Try adjusting your search criteria, severity pills, or increase scan sensitivity.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setFilters({
                      searchQuery: '',
                      severity: 'all',
                      type: 'all',
                      method: 'all',
                      column: 'all',
                      status: 'all',
                      sortBy: 'severity',
                      sortOrder: 'desc',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {/* Modal: Deep Anomaly Math & AI Inspector */}
      <AnomalyDetailModal
        anomaly={inspectedAnomaly}
        onClose={() => setInspectedAnomaly(null)}
        onInvestigateAI={handleInvestigateAI}
        onInvestigateSQL={handleInvestigateSQL}
        onInvestigateRCA={(a) => selectedDataset && onNavigateToRCA?.(selectedDataset, a)}
        onUpdateStatus={handleToggleAnomalyStatus}
      />

      {/* Modal: Detection Settings & Thresholds */}
      <AnomalySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        availableColumns={availableColumns}
      />
    </div>
  );
};
