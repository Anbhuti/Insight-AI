import { AlertSeverity } from './alertTypes';
import { SEVERITY_CONFIG } from './alertConstants';

/**
 * Calculates a sensible default severity from percentage deviation if not explicitly fixed
 */
export function calculateSeverityFromDeviation(absDeviationPct: number): AlertSeverity {
  if (absDeviationPct >= 40) return 'critical';
  if (absDeviationPct >= 20) return 'high';
  if (absDeviationPct >= 10) return 'medium';
  if (absDeviationPct >= 5) return 'low';
  return 'info';
}

/**
 * Checks if a given severity meets or exceeds a required threshold level
 */
export function isSeverityAtLeast(
  current: AlertSeverity,
  required: AlertSeverity
): boolean {
  const currentOrder = SEVERITY_CONFIG[current]?.order || 0;
  const requiredOrder = SEVERITY_CONFIG[required]?.order || 0;
  return currentOrder >= requiredOrder;
}

/**
 * Compares two severities for sorting (highest severity first)
 */
export function compareSeveritiesDesc(a: AlertSeverity, b: AlertSeverity): number {
  const orderA = SEVERITY_CONFIG[a]?.order || 0;
  const orderB = SEVERITY_CONFIG[b]?.order || 0;
  return orderB - orderA;
}

/**
 * Formats a metric value into a readable currency or abbreviated number
 */
export function formatAlertMetricValue(value: number, isPercentage: boolean = false): string {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  
  if (isPercentage) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  const abs = Math.abs(value);
  if (abs >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (abs >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  return value.toFixed(2);
}
