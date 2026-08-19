import {
  RCAEvidence,
  RCAHypothesis,
  RCALimitation,
  PeriodComparisonData,
  DimensionContribution,
  MetricDecompositionResult,
  CorrelationResult,
  RCAConfidenceLevel,
} from './types';

/**
 * Derives verified facts from analytical calculations
 */
export function deriveFacts(
  periodComparison: PeriodComparisonData,
  targetMetric: string,
  rankedDrivers: DimensionContribution[],
  metricDecompositions: MetricDecompositionResult[]
): string[] {
  const facts: string[] = [];

  // Fact 1: Baseline change
  const sign = periodComparison.percentageChange > 0 ? '+' : '';
  facts.push(
    `${targetMetric} changed by ${sign}${periodComparison.percentageChange}% (from ${periodComparison.beforeValue.toLocaleString()} to ${periodComparison.afterValue.toLocaleString()}) between ${periodComparison.periodBeforeLabel} and ${periodComparison.periodAfterLabel}.`
  );

  // Fact 2: Top segment contributors
  if (rankedDrivers.length > 0) {
    const top = rankedDrivers[0];
    if (Math.abs(top.contributionPct) > 1) {
      facts.push(
        `Segment "${top.segment}" within dimension "${top.dimension}" accounted for ${top.contributionPct}% of the observed net shift (${top.absoluteChange.toLocaleString()} delta).`
      );
    }
  }

  if (rankedDrivers.length > 1) {
    const second = rankedDrivers[1];
    if (Math.abs(second.contributionPct) > 5) {
      facts.push(
        `Segment "${second.segment}" within "${second.dimension}" accounted for an additional ${second.contributionPct}% contribution.`
      );
    }
  }

  // Fact 3: Metric component facts
  for (const decomp of metricDecompositions) {
    const nonPrimary = decomp.components.filter((c) => c.role !== 'primary');
    const summaries = nonPrimary.map(
      (c) => `${c.friendlyLabel} shifted ${c.percentageChange > 0 ? '+' : ''}${c.percentageChange}%`
    );
    if (summaries.length > 0) {
      facts.push(`Metric decomposition (${decomp.formulaExpression}): ${summaries.join(', ')}.`);
    }
  }

  return facts;
}

/**
 * Generates evidence-grounded hypotheses
 */
export function generateHypotheses(
  targetMetric: string,
  rankedDrivers: DimensionContribution[],
  metricDecompositions: MetricDecompositionResult[],
  correlations: CorrelationResult[],
  evidenceList: RCAEvidence[]
): RCAHypothesis[] {
  const hypotheses: RCAHypothesis[] = [];
  let hypCounter = 1;

  // 1. Primary Segment Driver Hypothesis
  if (rankedDrivers.length > 0) {
    const top = rankedDrivers[0];
    const matchingEv = evidenceList.filter(
      (e) => e.dimension === top.dimension && e.segment === top.segment
    );

    let confLevel: RCAConfidenceLevel = top.confidence;
    let confScore = top.confidence === 'high' ? 0.9 : top.confidence === 'medium' ? 0.7 : 0.45;

    if (Math.abs(top.contributionPct) > 50) {
      hypotheses.push({
        id: `hyp_${hypCounter++}`,
        title: `Dominant Segment Driver: ${top.segment} (${top.dimension})`,
        statement: `The shift in "${top.segment}" is the primary observed contributor to the ${targetMetric} change, explaining ${top.contributionPct}% of the total variance.`,
        classification: 'Observed Contributor',
        confidenceLevel: confLevel,
        confidenceScore: confScore,
        evidenceIds: matchingEv.map((e) => e.id),
        supportingEvidence: matchingEv,
        rationale: `Statistical aggregation across records indicates "${top.segment}" represents the largest negative/positive delta (${top.absoluteChange.toLocaleString()}).`,
      });
    } else if (Math.abs(top.contributionPct) > 20) {
      hypotheses.push({
        id: `hyp_${hypCounter++}`,
        title: `Significant Contributor: ${top.segment} (${top.dimension})`,
        statement: `Sales or activity in "${top.segment}" represents a substantial observed contributor (${top.contributionPct}% of total variance).`,
        classification: 'Observed Contributor',
        confidenceLevel: confLevel,
        confidenceScore: confScore,
        evidenceIds: matchingEv.map((e) => e.id),
        supportingEvidence: matchingEv,
        rationale: `Direct segment contribution calculation reveals a ${top.absoluteChange.toLocaleString()} delta.`,
      });
    }
  }

  // 2. Metric Decomposition Factor Hypothesis (Volume vs Price / Cost)
  for (const decomp of metricDecompositions) {
    const matchingEv = evidenceList.filter((e) => e.type === 'metric_decomposition');
    const nonPrimary = decomp.components.filter((c) => c.role !== 'primary');

    const largestComponent = [...nonPrimary].sort(
      (a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange)
    )[0];

    if (largestComponent) {
      hypotheses.push({
        id: `hyp_${hypCounter++}`,
        title: `Coinciding Metric Factor: ${largestComponent.friendlyLabel}`,
        statement: `The target ${targetMetric} change coincided with a ${
          largestComponent.percentageChange > 0 ? '+' : ''
        }${largestComponent.percentageChange}% shift in ${largestComponent.friendlyLabel}.`,
        classification: 'Coinciding Shift',
        confidenceLevel: 'high',
        confidenceScore: 0.85,
        evidenceIds: matchingEv.map((e) => e.id),
        supportingEvidence: matchingEv,
        rationale: `Decomposition equation ${decomp.formulaExpression} confirms ${largestComponent.friendlyLabel} had the largest magnitude shift among component metrics.`,
      });
    }
  }

  // 3. Statistical Association Hypothesis
  const strongCorr = correlations.find((c) => c.statisticalStrength === 'strong');
  if (strongCorr) {
    const matchingEv = evidenceList.filter(
      (e) => e.type === 'correlation' && e.metric === strongCorr.relatedMetric
    );

    hypotheses.push({
      id: `hyp_${hypCounter++}`,
      title: `Associated Metric Movement: ${strongCorr.relatedMetricLabel}`,
      statement: `Changes in ${strongCorr.relatedMetricLabel} show a strong ${strongCorr.direction} statistical correlation (r = ${strongCorr.pearsonCorrelation}) with ${targetMetric}.`,
      classification: 'Coinciding Shift',
      confidenceLevel: strongCorr.isSignificant ? 'medium' : 'low',
      confidenceScore: 0.7,
      evidenceIds: matchingEv.map((e) => e.id),
      supportingEvidence: matchingEv,
      rationale: `Correlation analysis indicates aligned movements. However, this reflects statistical co-occurrence, not verified causation.`,
    });
  }

  // Fallback if no specific hypotheses could be formulated
  if (hypotheses.length === 0) {
    hypotheses.push({
      id: `hyp_${hypCounter++}`,
      title: 'Dispersed Multi-Segment Variation',
      statement: 'The change is distributed across multiple segments without a single dominant driver exceeding significant concentration.',
      classification: 'Observed Contributor',
      confidenceLevel: 'low',
      confidenceScore: 0.4,
      evidenceIds: [],
      supportingEvidence: [],
      rationale: 'No individual category explained more than 20% of the total variance in the available dataset.',
    });
  }

  return hypotheses;
}

/**
 * Identifies unobserved dimensions and data limitations
 */
export function identifyLimitations(
  columns: string[],
  targetMetric: string,
  totalRows: number
): RCALimitation[] {
  const limitations: RCALimitation[] = [];
  const lowerCols = columns.map((c) => c.toLowerCase());

  // Check for Marketing / Acquisition spend
  const hasMarketing = lowerCols.some(
    (c) => c.includes('marketing') || c.includes('ad_spend') || c.includes('campaign') || c.includes('cpc')
  );
  if (!hasMarketing) {
    limitations.push({
      title: 'Marketing & Acquisition Data Not Present',
      description: 'The dataset does not contain marketing spend, ad campaign performance, or CAC figures.',
      unobservedVariable: 'Marketing & Ad Spend',
      impact: 'Cannot determine if advertising budget cuts or campaign pauses influenced the metric shift.',
    });
  }

  // Check for Competitor / Market benchmark data
  limitations.push({
    title: 'External & Macroeconomic Factors Unobserved',
    description: 'External factors such as competitor pricing, seasonality shocks, supply chain disruptions, or macroeconomic trends are not recorded in this dataset.',
    unobservedVariable: 'Competitor / Market Trends',
    impact: 'External market pressures cannot be confirmed or ruled out solely from internal dataset records.',
  });

  // Check for Customer Satisfaction / NPS / Churn reasons
  const hasFeedback = lowerCols.some(
    (c) => c.includes('rating') || c.includes('feedback') || c.includes('nps') || c.includes('review') || c.includes('churn_reason')
  );
  if (!hasFeedback) {
    limitations.push({
      title: 'Customer Sentiment / Feedback Not Present',
      description: 'Customer reviews, Net Promoter Scores (NPS), support ticket volumes, and cancellation reasons are absent.',
      unobservedVariable: 'Customer Feedback & Sentiment',
      impact: 'Qualitative customer satisfaction impacts cannot be evaluated.',
    });
  }

  // Sample size limitation check
  if (totalRows < 50) {
    limitations.push({
      title: 'Limited Historical Sample Size',
      description: `Analysis is based on ${totalRows} total records. Small sample size limits statistical confidence for granular sub-segment breakdowns.`,
      impact: 'Segment-level inferences carry wider confidence bounds.',
    });
  }

  return limitations;
}

/**
 * Generates recommended business investigation actions
 */
export function generateRecommendedInvestigations(
  targetMetric: string,
  rankedDrivers: DimensionContribution[],
  metricDecompositions: MetricDecompositionResult[]
): string[] {
  const recommendations: string[] = [];

  if (rankedDrivers.length > 0) {
    const top = rankedDrivers[0];
    recommendations.push(
      `Conduct a deep-dive audit on segment "${top.segment}" within "${top.dimension}" to review account-level transaction histories.`
    );
  }

  if (rankedDrivers.length > 1) {
    const second = rankedDrivers[1];
    recommendations.push(
      `Compare operational performance and pricing between "${rankedDrivers[0].segment}" and "${second.segment}".`
    );
  }

  for (const decomp of metricDecompositions) {
    const nonPrimary = decomp.components.filter((c) => c.role !== 'primary');
    for (const comp of nonPrimary) {
      if (Math.abs(comp.percentageChange) > 15) {
        recommendations.push(
          `Investigate underlying drivers for ${comp.friendlyLabel} (${comp.percentageChange > 0 ? '+' : ''}${comp.percentageChange}% shift).`
        );
      }
    }
  }

  recommendations.push(
    `Use the SQL Workspace to query individual row records during the transition window to verify data consistency.`
  );

  return recommendations;
}
