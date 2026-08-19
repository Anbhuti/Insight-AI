import { RCAResult, AIExecutiveSummary } from './types';

/**
 * Calls server-side Gemini endpoint with structured evidence to generate enterprise executive summary
 */
export async function explainRootCauseWithAI(
  rcaResult: RCAResult
): Promise<AIExecutiveSummary> {
  try {
    const payload = {
      targetMetric: rcaResult.targetMetric,
      targetMetricLabel: rcaResult.targetMetricLabel,
      datasetName: rcaResult.datasetName,
      periodComparison: rcaResult.periodComparison,
      facts: rcaResult.facts,
      topDrivers: rcaResult.topDrivers.slice(0, 5).map((d) => ({
        dimension: d.dimension,
        segment: d.segment,
        contributionPct: d.contributionPct,
        absoluteChange: d.absoluteChange,
        confidence: d.confidence,
      })),
      metricDecompositions: rcaResult.metricDecompositions,
      correlations: rcaResult.correlations.slice(0, 4).map((c) => ({
        relatedMetric: c.relatedMetric,
        correlation: c.pearsonCorrelation,
        strength: c.statisticalStrength,
      })),
      hypotheses: rcaResult.hypotheses.map((h) => ({
        title: h.title,
        statement: h.statement,
        classification: h.classification,
        confidence: h.confidenceLevel,
      })),
      limitations: rcaResult.limitations,
      overallConfidence: rcaResult.overallConfidenceLevel,
    };

    const res = await fetch('/api/root-cause/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`AI RCA service failed with status ${res.status}`);
    }

    const data: AIExecutiveSummary = await res.json();
    return {
      ...data,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('AI RCA explanation API fallback:', error);
    // Fallback to grounded local summary if API call fails
    return generateLocalExecutiveSummary(rcaResult);
  }
}

function generateLocalExecutiveSummary(rca: RCAResult): AIExecutiveSummary {
  const p = rca.periodComparison;
  const isDecline = p.percentageChange < 0;
  const sign = p.percentageChange > 0 ? '+' : '';
  const top = rca.topDrivers[0];

  const headline = top
    ? `${rca.targetMetric} shifted ${sign}${p.percentageChange}%, driven primarily by "${top.segment}" (${top.contributionPct}% contribution)`
    : `${rca.targetMetric} shifted ${sign}${p.percentageChange}% across baseline periods`;

  const executiveSummary = `A rigorous multi-dimensional contribution analysis of ${rca.datasetName} reveals that ${rca.targetMetric} moved by ${sign}${p.percentageChange}% (${p.absoluteChange.toLocaleString()} delta). ${
    top
      ? `The primary observed contributor was segment "${top.segment}" within "${top.dimension}", accounting for ${top.contributionPct}% of the observed net variance.`
      : 'The variance was distributed across multiple segments without a single dominant category.'
  } This analysis reflects factual evidence from available columns and identifies key areas requiring targeted investigation.`;

  return {
    headline,
    executiveSummary,
    keyFacts: rca.facts,
    topDriversExplanation: rca.topDrivers.slice(0, 3).map(
      (d) => `"${d.segment}" (${d.dimension}): ${d.contributionPct}% contribution (${d.absoluteChange.toLocaleString()} delta).`
    ),
    hypothesesSummary: rca.hypotheses.map(
      (h) => `[${h.classification}] ${h.statement} (Confidence: ${h.confidenceLevel})`
    ),
    limitationsExplained: rca.limitations.map(
      (l) => `${l.title}: ${l.impact}`
    ),
    recommendedInvestigations: rca.recommendedInvestigations,
    confidenceNarrative: `Overall evidence confidence is rated ${rca.overallConfidenceLevel.toUpperCase()} based on sample size (${p.sampleSizeBefore + p.sampleSizeAfter} observations) and dimension data completeness.`,
    generatedAt: new Date().toISOString(),
  };
}
