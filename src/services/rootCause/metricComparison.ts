import {
  MetricDecompositionResult,
  MetricComponentChange,
} from './types';
import { COMMON_METRIC_FORMULAS, MetricFormulaPattern } from './constants';
import { parseNumericValue } from './periodComparison';

/**
 * Discovers and computes mathematical decompositions for the target metric
 */
export function performMetricDecomposition(
  columns: string[],
  beforeRows: Record<string, any>[],
  afterRows: Record<string, any>[],
  targetMetric: string
): MetricDecompositionResult[] {
  const lowerTarget = targetMetric.toLowerCase().trim();
  const lowerCols = columns.map((c) => c.toLowerCase().trim());
  const decompositions: MetricDecompositionResult[] = [];

  for (const pattern of COMMON_METRIC_FORMULAS) {
    const isTargetMatch = pattern.targetAliases.some(
      (alias) => lowerTarget === alias || lowerTarget.includes(alias)
    );

    if (!isTargetMatch) continue;

    // Check if component columns exist in dataset
    const matchedComponents: {
      colName: string;
      friendlyLabel: string;
      role: 'primary' | 'component_multiplier' | 'component_divisor' | 'component_subtraction';
    }[] = [];

    for (const comp of pattern.components) {
      const foundIdx = lowerCols.findIndex((c) =>
        comp.aliases.some((a) => c === a || c.includes(a))
      );
      if (foundIdx !== -1 && columns[foundIdx].toLowerCase() !== lowerTarget) {
        matchedComponents.push({
          colName: columns[foundIdx],
          friendlyLabel: comp.friendlyLabel,
          role: comp.role,
        });
      }
    }

    if (matchedComponents.length === 0) continue;

    // Calculate changes for target metric and components
    const targetBefore = calculateSum(beforeRows, targetMetric);
    const targetAfter = calculateSum(afterRows, targetMetric);
    const targetDeltaPct = calculatePctChange(targetBefore, targetAfter);

    const componentChanges: MetricComponentChange[] = [
      {
        metricName: targetMetric,
        friendlyLabel: `Target: ${targetMetric}`,
        beforeValue: Number(targetBefore.toFixed(2)),
        afterValue: Number(targetAfter.toFixed(2)),
        percentageChange: targetDeltaPct,
        role: 'primary',
      },
    ];

    for (const comp of matchedComponents) {
      const bSum = calculateSum(beforeRows, comp.colName);
      const aSum = calculateSum(afterRows, comp.colName);
      const deltaPct = calculatePctChange(bSum, aSum);

      componentChanges.push({
        metricName: comp.colName,
        friendlyLabel: comp.friendlyLabel,
        beforeValue: Number(bSum.toFixed(2)),
        afterValue: Number(aSum.toFixed(2)),
        percentageChange: deltaPct,
        role: comp.role,
      });
    }

    // Build analytical insight based on component movements
    const nonPrimary = componentChanges.filter((c) => c.role !== 'primary');
    let insight = `Observed target metric ${targetMetric} shifted ${
      targetDeltaPct > 0 ? '+' : ''
    }${targetDeltaPct}%. `;

    if (pattern.formulaType === 'multiplication') {
      const vol = nonPrimary.find((c) => c.role === 'component_multiplier' && (c.metricName.toLowerCase().includes('qty') || c.metricName.toLowerCase().includes('units') || c.metricName.toLowerCase().includes('volume')));
      const price = nonPrimary.find((c) => c.role === 'component_multiplier' && (c.metricName.toLowerCase().includes('price') || c.metricName.toLowerCase().includes('rate')));

      if (vol && price) {
        insight += `Volume changed ${vol.percentageChange > 0 ? '+' : ''}${vol.percentageChange}%, while unit pricing changed ${
          price.percentageChange > 0 ? '+' : ''
        }${price.percentageChange}%, indicating ${
          Math.abs(vol.percentageChange) > Math.abs(price.percentageChange)
            ? 'sales volume contraction was the larger coinciding factor'
            : 'unit pricing shifts were the larger coinciding factor'
        }.`;
      } else if (vol) {
        insight += `Coincided with a ${vol.percentageChange > 0 ? '+' : ''}${vol.percentageChange}% shift in ${vol.friendlyLabel}.`;
      }
    } else if (pattern.formulaType === 'subtraction') {
      const costComp = nonPrimary.find((c) => c.role === 'component_subtraction');
      if (costComp) {
        insight += `Coincided with a ${costComp.percentageChange > 0 ? '+' : ''}${costComp.percentageChange}% change in ${costComp.friendlyLabel}.`;
      }
    } else {
      insight += `Coinciding metric shifts: ${nonPrimary
        .map((c) => `${c.friendlyLabel}: ${c.percentageChange > 0 ? '+' : ''}${c.percentageChange}%`)
        .join(', ')}.`;
    }

    decompositions.push({
      formulaType: pattern.formulaType,
      formulaExpression: pattern.expression,
      targetMetric,
      targetChangePct: targetDeltaPct,
      components: componentChanges,
      analyticalInsight: insight,
    });
  }

  return decompositions;
}

function calculateSum(rows: Record<string, any>[], colName: string): number {
  let sum = 0;
  for (const r of rows) {
    const val = parseNumericValue(r[colName]);
    if (val !== null) sum += val;
  }
  return sum;
}

function calculatePctChange(before: number, after: number): number {
  if (before === 0) return after > 0 ? 100 : 0;
  return Number((((after - before) / Math.abs(before)) * 100).toFixed(2));
}
