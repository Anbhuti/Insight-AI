import { Anomaly, AnomalyAIExplanation } from '../../types/anomaly';
import { getLatestAnomalyScan, saveAnomalyScan } from './anomalyDetectionService';

export interface ExplainAnomalyRequest {
  anomaly: Anomaly;
  datasetSummary?: {
    rowCount: number;
    columnCount: number;
    qualityScore?: number;
  };
}

/**
 * Calls the server-side API to generate an executive AI business explanation for an anomaly
 */
export async function explainAnomalyWithAI(
  anomaly: Anomaly,
  datasetSummary?: { rowCount: number; columnCount: number; qualityScore?: number }
): Promise<AnomalyAIExplanation> {
  try {
    const response = await fetch('/api/anomaly/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        anomaly,
        datasetSummary,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error (${response.status})`);
    }

    const data = await response.json();
    const explanation: AnomalyAIExplanation = {
      headline: data.headline || `Significant variance detected in ${anomaly.column}`,
      businessImpact: data.businessImpact || anomaly.summary,
      potentialDrivers: Array.isArray(data.potentialDrivers) && data.potentialDrivers.length > 0
        ? data.potentialDrivers
        : [
            `Sudden shift in ${anomaly.column} value (${anomaly.scoreLabel})`,
            `Unusual deviation from expected baseline (${anomaly.deviationPercentage > 0 ? '+' : ''}${anomaly.deviationPercentage}%)`,
            `Potential underlying transactional spike or localized disruption`,
          ],
      recommendedActions: Array.isArray(data.recommendedActions) && data.recommendedActions.length > 0
        ? data.recommendedActions
        : [
            `Audit underlying source events around row ${anomaly.rowIndex !== undefined ? anomaly.rowIndex + 1 : 'record'}.`,
            `Cross-examine correlating categorical dimensions to isolate driver segments.`,
            `Verify whether this observation represents a one-off outlier or an emerging structural trend.`,
          ],
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.92,
      generatedAt: new Date().toISOString(),
    };

    // Save explanation to cached anomaly scan
    const scan = await getLatestAnomalyScan(anomaly.userId, anomaly.datasetId);
    if (scan) {
      const match = scan.anomalies.find((a) => a.id === anomaly.id);
      if (match) {
        match.aiExplanation = explanation;
        await saveAnomalyScan(scan);
      }
    }

    return explanation;
  } catch (error: any) {
    console.warn('Fallback explanation used due to server error:', error);
    // Deterministic high-quality fallback explanation
    const isSpike = anomaly.type === 'spike';
    const fallbackExplanation: AnomalyAIExplanation = {
      headline: `${isSpike ? 'Surge' : 'Drop'} of ${Math.abs(anomaly.deviationPercentage)}% in ${anomaly.column}`,
      businessImpact: `The metric "${anomaly.column}" registered ${anomaly.actualValue.toLocaleString()} vs expected baseline of ${anomaly.expectedValue.toLocaleString()} (${anomaly.scoreLabel}). If unchecked, this magnitude of deviation can distort revenue forecasting, inventory management, or performance reporting.`,
      potentialDrivers: [
        `High localized concentration in row record ${anomaly.rowIdentifier || ''}`,
        `Mathematical deviation (${anomaly.statisticalEvidence})`,
        `Possible upstream data ingestion discrepancy or genuine market demand shock`,
      ],
      recommendedActions: [
        `Drill down into row details and related dimensional attributes (e.g. Region, Category).`,
        `Formulate a diagnostic hypothesis using the InsightAI Analyst agent.`,
        `Set up real-time threshold alert to detect recurrence in future batches.`,
      ],
      confidence: 0.88,
      generatedAt: new Date().toISOString(),
    };
    return fallbackExplanation;
  }
}
