import React, { useState, useEffect } from 'react';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { Anomaly } from '../../types/anomaly';
import { RCAResult } from '../../services/rootCause/types';
import {
  runRootCauseAnalysis,
  getLatestRootCauseAnalysis,
  analyzeAnomalyRootCause,
} from '../../services/rootCause/rootCauseService';
import { getStoredAnomalies } from '../../services/anomaly/anomalyDetectionService';
import { RootCauseSummaryCards } from './RootCauseSummaryCards';
import { DimensionWaterfallChart } from './DimensionWaterfallChart';
import { MetricDecompositionView } from './MetricDecompositionView';
import { CorrelationMatrixView } from './CorrelationMatrixView';
import { EvidenceHypothesisBoard } from './EvidenceHypothesisBoard';
import { LimitationsAlert } from './LimitationsAlert';
import { RCAInvestigationToolbar } from './RCAInvestigationToolbar';
import {
  Sparkles,
  Download,
  AlertCircle,
  HelpCircle,
  FileText,
  Search,
  Compass,
  RefreshCw,
  Share2,
} from 'lucide-react';

interface RootCauseDashboardProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (dataset: Dataset) => void;
  datasetProfiles: Record<string, DatasetProfile>;
  initialAnomaly?: Anomaly | null;
  onOpenSQLWorkspace?: () => void;
  onOpenAIAnalyst?: () => void;
}

export const RootCauseDashboard: React.FC<RootCauseDashboardProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  datasetProfiles,
  initialAnomaly,
  onOpenSQLWorkspace,
  onOpenAIAnalyst,
}) => {
  const [rcaResult, setRcaResult] = useState<RCAResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available numeric metrics for selected dataset
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  
  // Available anomalies for selected dataset
  const [availableAnomalies, setAvailableAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string>('');

  // Update metrics and anomalies whenever selected dataset changes
  useEffect(() => {
    if (!selectedDataset) {
      setAvailableMetrics([]);
      setSelectedMetric('');
      setAvailableAnomalies([]);
      setSelectedAnomalyId('');
      setRcaResult(null);
      return;
    }

    const profile = datasetProfiles[selectedDataset.datasetId];
    let metrics: string[] = [];

    if (profile?.columns) {
      metrics = profile.columns
        .filter(
          (c) =>
            (c.logicalType === 'numeric' || c.logicalType === 'integer' || c.logicalType === 'decimal') &&
            !c.isPotentialId
        )
        .map((c) => c.name);
    } else if (selectedDataset.previewSample?.columns) {
      metrics = selectedDataset.previewSample.columns;
    }

    setAvailableMetrics(metrics);

    // Default metric selection
    if (initialAnomaly && initialAnomaly.datasetId === selectedDataset.datasetId) {
      setSelectedMetric(initialAnomaly.column);
      setSelectedAnomalyId(initialAnomaly.id);
    } else if (metrics.length > 0) {
      setSelectedMetric(metrics[0]);
    }

    // Load cached anomalies
    const storedAnoms = getStoredAnomalies(selectedDataset.datasetId);
    setAvailableAnomalies(storedAnoms);

    // Try loading cached RCA
    loadCachedAnalysis(selectedDataset.userId, selectedDataset.datasetId, metrics[0]);
  }, [selectedDataset?.datasetId]);

  // Initial anomaly trigger on mount if passed
  useEffect(() => {
    if (initialAnomaly && selectedDataset && initialAnomaly.datasetId === selectedDataset.datasetId) {
      handleAnalyzeAnomaly(initialAnomaly);
    }
  }, [initialAnomaly?.id]);

  const loadCachedAnalysis = async (userId: string, datasetId: string, metric?: string) => {
    try {
      const cached = await getLatestRootCauseAnalysis(userId, datasetId, metric);
      if (cached) {
        setRcaResult(cached);
      }
    } catch (e) {
      console.warn('Could not load cached RCA:', e);
    }
  };

  const handleRunRCA = async () => {
    if (!selectedDataset || !selectedMetric) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const profile = datasetProfiles[selectedDataset.datasetId];
      const matchedAnomaly = availableAnomalies.find((a) => a.id === selectedAnomalyId);

      let result: RCAResult;
      if (matchedAnomaly) {
        result = await analyzeAnomalyRootCause(selectedDataset, matchedAnomaly, profile);
      } else {
        result = await runRootCauseAnalysis(
          selectedDataset,
          {
            datasetId: selectedDataset.datasetId,
            datasetName: selectedDataset.name,
            userId: selectedDataset.userId,
            targetMetric: selectedMetric,
            targetMetricLabel: selectedMetric.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          },
          profile
        );
      }

      setRcaResult(result);
    } catch (err: any) {
      console.error('RCA execution failed:', err);
      setErrorMessage(err.message || 'Failed to run root cause analysis on this dataset.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeAnomaly = async (anomaly: Anomaly) => {
    if (!selectedDataset) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    setSelectedMetric(anomaly.column);
    setSelectedAnomalyId(anomaly.id);

    try {
      const profile = datasetProfiles[selectedDataset.datasetId];
      const result = await analyzeAnomalyRootCause(selectedDataset, anomaly, profile);
      setRcaResult(result);
    } catch (err: any) {
      console.error('RCA anomaly execution failed:', err);
      setErrorMessage(err.message || 'Failed to analyze root cause for this anomaly.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportRCAReport = () => {
    if (!rcaResult) return;

    const report = `# Root Cause Analysis Report: ${rcaResult.targetMetric}
**Dataset:** ${rcaResult.datasetName}
**Generated At:** ${new Date(rcaResult.completedAt).toLocaleString()}
**Overall Confidence:** ${rcaResult.overallConfidenceLevel.toUpperCase()} (${Math.round(rcaResult.overallConfidenceScore * 100)}%)

---

## Executive Summary
${rcaResult.aiExecutiveSummary?.headline || ''}
${rcaResult.aiExecutiveSummary?.executiveSummary || ''}

## Baseline vs Current Period
- **Baseline Period:** ${rcaResult.periodComparison.periodBeforeLabel} (${rcaResult.periodComparison.beforeValue.toLocaleString()})
- **Current Period:** ${rcaResult.periodComparison.periodAfterLabel} (${rcaResult.periodComparison.afterValue.toLocaleString()})
- **Net Absolute Shift:** ${rcaResult.periodComparison.absoluteChange > 0 ? '+' : ''}${rcaResult.periodComparison.absoluteChange.toLocaleString()} (${rcaResult.periodComparison.percentageChange > 0 ? '+' : ''}${rcaResult.periodComparison.percentageChange}%)
- **Observations:** ${rcaResult.periodComparison.sampleSizeBefore + rcaResult.periodComparison.sampleSizeAfter} records

## Verified Analytical Facts
${rcaResult.facts.map((f) => `- ${f}`).join('\n')}

## Top Observed Segment Contributors
${rcaResult.topDrivers.map((d) => `- **${d.segment}** (${d.dimension}): ${d.contributionPct}% contribution (Δ: ${d.absoluteChange.toLocaleString()})`).join('\n')}

## Formulated Hypotheses
${rcaResult.hypotheses.map((h) => `- [${h.classification}] **${h.title}**: ${h.statement} (Confidence: ${h.confidenceLevel})`).join('\n')}

## Limitations & Unobserved Variables
${rcaResult.limitations.map((l) => `- **${l.title}**: ${l.impact}`).join('\n')}

## Recommended Next Steps
${rcaResult.recommendedInvestigations.map((r) => `1. ${r}`).join('\n')}
`;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rca_report_${rcaResult.targetMetric.toLowerCase()}_${new Date().toISOString().substring(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Root Cause Analysis (RCA)
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Industry-grade mathematical decomposition and multi-dimensional driver attribution
          </p>
        </div>

        {rcaResult && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportRCAReport}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export RCA Report (.md)
            </button>
          </div>
        )}
      </div>

      {/* Investigation Controls Toolbar */}
      <RCAInvestigationToolbar
        datasets={datasets}
        selectedDataset={selectedDataset}
        onSelectDataset={onSelectDataset}
        availableMetrics={availableMetrics}
        selectedMetric={selectedMetric}
        onSelectMetric={setSelectedMetric}
        availableAnomalies={availableAnomalies}
        selectedAnomalyId={selectedAnomalyId}
        onSelectAnomalyId={setSelectedAnomalyId}
        isAnalyzing={isAnalyzing}
        onRunAnalysis={handleRunRCA}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold">Investigation Error: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Empty State when no RCA generated yet */}
      {!rcaResult && !isAnalyzing && (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900">
              Ready to Investigate Business Shifts
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Select a dataset and target metric above to perform multi-dimensional segmentation, mathematical metric decomposition, and evidence-backed hypothesis formulation.
            </p>
          </div>
          <button
            onClick={handleRunRCA}
            disabled={!selectedDataset || !selectedMetric}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            Launch Root Cause Analysis
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <RootCauseSummaryCards rca={rcaResult} isAnalyzing={isAnalyzing} />

      {/* Main Analysis Views */}
      {rcaResult && (
        <div className="space-y-6">
          
          {/* Dimension Contribution Waterfall & Segment Table */}
          <DimensionWaterfallChart
            dimensionAnalyses={rcaResult.dimensionAnalyses}
            topDrivers={rcaResult.topDrivers}
            targetMetric={rcaResult.targetMetric}
          />

          {/* Mathematical Metric Decomposition */}
          {rcaResult.metricDecompositions.length > 0 && (
            <MetricDecompositionView
              decompositions={rcaResult.metricDecompositions}
            />
          )}

          {/* Verified Facts & Evidence-Grounded Hypotheses Board */}
          <EvidenceHypothesisBoard
            facts={rcaResult.facts}
            hypotheses={rcaResult.hypotheses}
            evidence={rcaResult.evidence}
            aiSummary={rcaResult.aiExecutiveSummary}
            targetMetric={rcaResult.targetMetric}
          />

          {/* Metric Correlations */}
          {rcaResult.correlations.length > 0 && (
            <CorrelationMatrixView
              correlations={rcaResult.correlations}
              targetMetric={rcaResult.targetMetric}
            />
          )}

          {/* Enterprise Limitations & Recommended Investigations */}
          <LimitationsAlert
            limitations={rcaResult.limitations}
            recommendedInvestigations={rcaResult.recommendedInvestigations}
            onOpenSQLWorkspace={onOpenSQLWorkspace}
            onOpenAIAnalyst={onOpenAIAnalyst}
          />

        </div>
      )}

    </div>
  );
};
