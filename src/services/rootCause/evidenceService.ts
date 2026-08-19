import {
  RCAEvidence,
  PeriodComparisonData,
  DimensionContribution,
  MetricDecompositionResult,
  CorrelationResult,
  InteractionContribution,
  RCAConfidenceLevel,
} from './types';
import { RCA_CONSTANTS } from './constants';

/**
 * Builds structured evidence objects from all mathematical analyses
 */
export function buildEvidencePortfolio(
  periodComparison: PeriodComparisonData,
  targetMetric: string,
  rankedDrivers: DimensionContribution[],
  metricDecompositions: MetricDecompositionResult[],
  correlations: CorrelationResult[],
  interactions: InteractionContribution[],
  beforeRows: Record<string, any>[],
  afterRows: Record<string, any>[]
): RCAEvidence[] {
  const evidenceList: RCAEvidence[] = [];
  let evidenceCounter = 1;

  // 1. Period Baseline Shift Evidence
  const isDecline = periodComparison.percentageChange < 0;
  evidenceList.push({
    id: `ev_${evidenceCounter++}`,
    type: 'period_change',
    title: `Aggregate ${targetMetric} Shift`,
    statement: `${targetMetric} changed by ${periodComparison.percentageChange > 0 ? '+' : ''}${
      periodComparison.percentageChange
    }% (absolute change: ${periodComparison.absoluteChange.toLocaleString()}) between ${
      periodComparison.periodBeforeLabel
    } and ${periodComparison.periodAfterLabel}.`,
    metric: targetMetric,
    valueBefore: periodComparison.beforeValue,
    valueAfter: periodComparison.afterValue,
    absoluteChange: periodComparison.absoluteChange,
    sampleSize: periodComparison.sampleSizeBefore + periodComparison.sampleSizeAfter,
    dataQualityScore: 0.98,
    confidenceScore: periodComparison.confidence === 'high' ? 0.95 : periodComparison.confidence === 'medium' ? 0.75 : 0.5,
    confidenceLevel: periodComparison.confidence,
    supportingDataSnippet: [...afterRows.slice(0, 4), ...beforeRows.slice(0, 4)],
  });

  // 2. Dimension Contribution Evidence
  for (const driver of rankedDrivers.slice(0, 5)) {
    if (Math.abs(driver.contributionPct) < 3 && Math.abs(driver.absoluteChange) < 1) continue;

    // Filter matching supporting rows
    const matchingRows = afterRows
      .filter((r) => String(r[driver.dimension] ?? '').trim() === driver.segment)
      .slice(0, RCA_CONSTANTS.MAX_SUPPORTING_ROWS_SNIPPET);

    const totalRecords = driver.recordCountBefore + driver.recordCountAfter;
    const confScore = driver.confidence === 'high' ? 0.92 : driver.confidence === 'medium' ? 0.7 : 0.45;

    evidenceList.push({
      id: `ev_${evidenceCounter++}`,
      type: 'dimension_contribution',
      title: `${driver.segment} (${driver.dimension}) Contribution`,
      statement: `Segment "${driver.segment}" within "${driver.dimension}" accounted for approximately ${
        driver.contributionPct
      }% of the total observed ${isDecline ? 'decline' : 'growth'} (variance: ${
        driver.absoluteChange.toLocaleString()
      }).`,
      dimension: driver.dimension,
      segment: driver.segment,
      metric: targetMetric,
      valueBefore: driver.beforeValue,
      valueAfter: driver.afterValue,
      absoluteChange: driver.absoluteChange,
      contributionPct: driver.contributionPct,
      sampleSize: totalRecords,
      dataQualityScore: 0.95,
      confidenceScore: confScore,
      confidenceLevel: driver.confidence,
      supportingDataSnippet: matchingRows,
    });
  }

  // 3. Interaction / Combination Driver Evidence
  for (const inter of interactions.slice(0, 2)) {
    if (Math.abs(inter.contributionPct) < 10) continue;

    const matchingRows = afterRows
      .filter(
        (r) =>
          String(r[inter.dimensionA] ?? '').trim() === inter.segmentA &&
          String(r[inter.dimensionB] ?? '').trim() === inter.segmentB
      )
      .slice(0, RCA_CONSTANTS.MAX_SUPPORTING_ROWS_SNIPPET);

    evidenceList.push({
      id: `ev_${evidenceCounter++}`,
      type: 'segment_interaction',
      title: `Combined Segment: ${inter.combinedLabel}`,
      statement: `The combination of ${inter.dimensionA} "${inter.segmentA}" and ${inter.dimensionB} "${inter.segmentB}" accounts for ${inter.contributionPct}% of the observed shift.`,
      dimension: `${inter.dimensionA} + ${inter.dimensionB}`,
      segment: inter.combinedLabel,
      metric: targetMetric,
      valueBefore: inter.beforeValue,
      valueAfter: inter.afterValue,
      absoluteChange: inter.absoluteChange,
      contributionPct: inter.contributionPct,
      sampleSize: inter.recordCount,
      dataQualityScore: 0.92,
      confidenceScore: inter.confidence === 'high' ? 0.88 : 0.65,
      confidenceLevel: inter.confidence,
      supportingDataSnippet: matchingRows,
    });
  }

  // 4. Metric Decomposition Evidence
  for (const decomp of metricDecompositions) {
    const nonPrimary = decomp.components.filter((c) => c.role !== 'primary');
    evidenceList.push({
      id: `ev_${evidenceCounter++}`,
      type: 'metric_decomposition',
      title: `Mathematical Decomposition (${decomp.formulaExpression})`,
      statement: decomp.analyticalInsight,
      metric: targetMetric,
      sampleSize: periodComparison.sampleSizeBefore + periodComparison.sampleSizeAfter,
      dataQualityScore: 0.95,
      confidenceScore: 0.88,
      confidenceLevel: 'high',
      supportingDataSnippet: afterRows.slice(0, 5),
    });
  }

  // 5. Correlation Evidence (Statistical Association)
  for (const corr of correlations.slice(0, 3)) {
    if (corr.statisticalStrength !== 'strong' && corr.statisticalStrength !== 'moderate') continue;

    evidenceList.push({
      id: `ev_${evidenceCounter++}`,
      type: 'correlation',
      title: `Correlation with ${corr.relatedMetricLabel}`,
      statement: `Metric "${corr.relatedMetric}" exhibits a ${corr.statisticalStrength} ${
        corr.direction
      } correlation (r = ${corr.pearsonCorrelation > 0 ? '+' : ''}${corr.pearsonCorrelation}) with ${targetMetric}. ${
        corr.disclaimer
      }`,
      metric: corr.relatedMetric,
      correlation: corr.pearsonCorrelation,
      sampleSize: corr.sampleSize,
      dataQualityScore: 0.9,
      confidenceScore: corr.isSignificant ? 0.8 : 0.55,
      confidenceLevel: corr.isSignificant ? 'medium' : 'low',
    });
  }

  // Rank evidence by magnitude and confidence
  evidenceList.sort((a, b) => {
    const aMagnitude = Math.abs(a.contributionPct || a.absoluteChange || (a.correlation ? a.correlation * 100 : 0));
    const bMagnitude = Math.abs(b.contributionPct || b.absoluteChange || (b.correlation ? b.correlation * 100 : 0));
    return bMagnitude * b.confidenceScore - aMagnitude * a.confidenceScore;
  });

  return evidenceList;
}
