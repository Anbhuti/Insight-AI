import {
  RCAResult,
  RCAInvestigationTarget,
  RCAConfidenceLevel,
} from './types';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { Anomaly } from '../../types/anomaly';
import { loadDatasetRows } from '../anomaly/anomalyDetectionService';
import {
  splitDatasetByPeriod,
  calculatePeriodComparison,
  detectChangePoint,
} from './periodComparison';
import { performMultiDimensionContributionAnalysis } from './contributionAnalysis';
import { performMetricDecomposition } from './metricComparison';
import { performCorrelationAnalysis } from './correlationAnalysis';
import { buildEvidencePortfolio } from './evidenceService';
import {
  deriveFacts,
  generateHypotheses,
  identifyLimitations,
  generateRecommendedInvestigations,
} from './hypothesisService';
import { explainRootCauseWithAI } from './rootCauseAIService';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

const LOCAL_RCA_KEY_PREFIX = 'insightai_rca_';

function generateAnalysisId(datasetId: string, targetMetric: string): string {
  const cleanMetric = targetMetric.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const timestamp = Date.now().toString(36);
  return `rca_${datasetId}_${cleanMetric}_${timestamp}`;
}

/**
 * Executes a full root cause analysis workflow on an anomaly or chosen target metric
 */
export async function runRootCauseAnalysis(
  dataset: Dataset,
  target: RCAInvestigationTarget,
  profile?: DatasetProfile | null
): Promise<RCAResult> {
  const startTime = new Date().toISOString();
  const analysisId = generateAnalysisId(dataset.datasetId, target.targetMetric);
  const datasetVersion = typeof dataset.updatedAt === 'string' 
    ? dataset.updatedAt 
    : (dataset.updatedAt as any)?.toDate?.()?.toISOString?.() || 'v1';

  // 1. Load actual data rows
  const { columns, rows } = await loadDatasetRows(dataset);

  if (!rows || rows.length < 5) {
    throw new Error(
      `Insufficient dataset rows (${rows?.length || 0} rows found). RCA requires at least 5 records to perform comparative analysis.`
    );
  }

  // Verify target metric column exists
  const targetCol = columns.find(
    (c) => c.toLowerCase() === target.targetMetric.toLowerCase()
  );
  if (!targetCol) {
    throw new Error(
      `Target metric column "${target.targetMetric}" does not exist in dataset "${dataset.name}". Available columns: ${columns.join(', ')}`
    );
  }

  // 2. Period Partitioning (Before vs After)
  const splitResult = splitDatasetByPeriod(
    columns,
    rows,
    targetCol,
    target.dateColumn,
    target.anomalyDate,
    target.anomalyRowIndex
  );

  const { beforeRows, afterRows, periodBeforeLabel, periodAfterLabel } = splitResult;

  if (beforeRows.length === 0 || afterRows.length === 0) {
    throw new Error('Could not establish distinct baseline and comparison periods for this dataset.');
  }

  // 3. Calculate Period Shift
  const periodComparison = calculatePeriodComparison(
    beforeRows,
    afterRows,
    targetCol,
    periodBeforeLabel,
    periodAfterLabel
  );

  // 4. Multi-Dimensional Contribution Analysis & Interactions
  const { dimensionAnalyses, rankedGlobalDrivers, interactionAnalyses } =
    performMultiDimensionContributionAnalysis(
      columns,
      beforeRows,
      afterRows,
      targetCol,
      periodComparison.absoluteChange,
      profile
    );

  // 5. Mathematical Metric Decomposition
  const metricDecompositions = performMetricDecomposition(
    columns,
    beforeRows,
    afterRows,
    targetCol
  );

  // 6. Correlation Analysis with Numeric Columns
  const correlations = performCorrelationAnalysis(
    columns,
    [...beforeRows, ...afterRows],
    targetCol
  );

  // 7. Structural Change Point Detection
  const allRows = [...beforeRows, ...afterRows];
  const changePointResult = detectChangePoint(allRows, targetCol);
  const changePoints = changePointResult ? [changePointResult.changePoint] : [];

  // 8. Build Evidence Portfolio
  const evidence = buildEvidencePortfolio(
    periodComparison,
    targetCol,
    rankedGlobalDrivers,
    metricDecompositions,
    correlations,
    interactionAnalyses,
    beforeRows,
    afterRows
  );

  // 9. Derive Facts, Hypotheses, Limitations & Recommended Investigations
  const facts = deriveFacts(
    periodComparison,
    targetCol,
    rankedGlobalDrivers,
    metricDecompositions
  );

  const hypotheses = generateHypotheses(
    targetCol,
    rankedGlobalDrivers,
    metricDecompositions,
    correlations,
    evidence
  );

  const limitations = identifyLimitations(columns, targetCol, allRows.length);

  const recommendedInvestigations = generateRecommendedInvestigations(
    targetCol,
    rankedGlobalDrivers,
    metricDecompositions
  );

  // Calculate Overall Confidence
  let overallScore = 0.85;
  if (allRows.length < 20) overallScore -= 0.25;
  if (dimensionAnalyses.length === 0) overallScore -= 0.2;
  if (periodComparison.confidence === 'low') overallScore -= 0.15;
  if (periodComparison.confidence === 'insufficient') overallScore -= 0.35;
  overallScore = Math.max(0.2, Math.min(0.98, overallScore));

  let overallLevel: RCAConfidenceLevel = 'high';
  if (overallScore < 0.4) overallLevel = 'insufficient';
  else if (overallScore < 0.65) overallLevel = 'low';
  else if (overallScore < 0.8) overallLevel = 'medium';

  const preliminaryResult: RCAResult = {
    analysisId,
    datasetId: dataset.datasetId,
    datasetName: dataset.name,
    datasetVersion,
    anomalyId: target.anomalyId,
    targetMetric: targetCol,
    targetMetricLabel: target.targetMetricLabel || targetCol,
    status: 'completed',
    createdAt: startTime,
    completedAt: new Date().toISOString(),
    overallConfidenceScore: Number(overallScore.toFixed(2)),
    overallConfidenceLevel: overallLevel,
    periodComparison,
    facts,
    topDrivers: rankedGlobalDrivers,
    dimensionAnalyses,
    interactionAnalyses,
    metricDecompositions,
    correlations,
    changePoints,
    evidence,
    hypotheses,
    limitations,
    recommendedInvestigations,
  };

  // 10. Augment with AI Grounded Interpretation
  try {
    const aiSummary = await explainRootCauseWithAI(preliminaryResult);
    preliminaryResult.aiExecutiveSummary = aiSummary;
  } catch (err) {
    console.warn('AI summary generation skipped:', err);
  }

  // 11. Cache to Firestore and Local Storage
  await saveRootCauseAnalysis(dataset.userId, preliminaryResult);

  return preliminaryResult;
}

/**
 * Convenient wrapper to start RCA directly from a detected anomaly
 */
export async function analyzeAnomalyRootCause(
  dataset: Dataset,
  anomaly: Anomaly,
  profile?: DatasetProfile | null
): Promise<RCAResult> {
  const target: RCAInvestigationTarget = {
    datasetId: dataset.datasetId,
    datasetName: dataset.name,
    userId: dataset.userId,
    targetMetric: anomaly.column,
    targetMetricLabel: anomaly.column.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    anomalyId: anomaly.id,
    anomalyTitle: anomaly.title,
    anomalyType: anomaly.type,
    observedValue: anomaly.actualValue,
    expectedValue: anomaly.expectedValue,
    dateColumn: anomaly.dateColumn,
    anomalyDate: anomaly.dateValue,
    anomalyRowIndex: anomaly.rowIndex,
  };

  return runRootCauseAnalysis(dataset, target, profile);
}

/**
 * Saves RCA result in Firestore users/{userId}/datasets/{datasetId}/rootCauseAnalyses/{analysisId}
 */
export async function saveRootCauseAnalysis(
  userId: string,
  rca: RCAResult
): Promise<void> {
  if (!userId) return;

  // Local storage cache backup
  try {
    const localKey = `${LOCAL_RCA_KEY_PREFIX}${userId}_${rca.datasetId}_${rca.targetMetric}`;
    localStorage.setItem(localKey, JSON.stringify(rca));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  // Firestore persistent storage
  if (db) {
    try {
      const docRef = doc(
        db,
        'users',
        userId,
        'datasets',
        rca.datasetId,
        'rootCauseAnalyses',
        rca.analysisId
      );
      await setDoc(docRef, {
        ...rca,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore RCA save warning:', err);
    }
  }
}

/**
 * Retrieves the latest cached RCA result for a target dataset and metric
 */
export async function getLatestRootCauseAnalysis(
  userId: string,
  datasetId: string,
  targetMetric?: string
): Promise<RCAResult | null> {
  if (!userId || !datasetId) return null;

  // Check Firestore first
  if (db) {
    try {
      const colRef = collection(
        db,
        'users',
        userId,
        'datasets',
        datasetId,
        'rootCauseAnalyses'
      );
      const q = query(colRef, orderBy('completedAt', 'desc'));
      const snap = await getDocs(q);

      if (!snap.empty) {
        for (const d of snap.docs) {
          const data = d.data() as RCAResult;
          if (!targetMetric || data.targetMetric.toLowerCase() === targetMetric.toLowerCase()) {
            return data;
          }
        }
      }
    } catch (err) {
      console.warn('Firestore fetch RCA warning:', err);
    }
  }

  // Fallback to local storage
  try {
    if (targetMetric) {
      const localKey = `${LOCAL_RCA_KEY_PREFIX}${userId}_${datasetId}_${targetMetric}`;
      const raw = localStorage.getItem(localKey);
      if (raw) return JSON.parse(raw);
    } else {
      // Find any cached key
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${LOCAL_RCA_KEY_PREFIX}${userId}_${datasetId}_`)) {
          const raw = localStorage.getItem(key);
          if (raw) return JSON.parse(raw);
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}
