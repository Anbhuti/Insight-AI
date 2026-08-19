import { AlertInstance } from './alertTypes';

/**
 * Creates a unique, deterministic fingerprint for an alert condition instance.
 * Formula: ruleId:datasetId:datasetVersion:metric:evaluationPeriod:conditionType
 */
export function createAlertFingerprint(
  ruleId: string,
  datasetId: string,
  datasetVersion: string | number = '1',
  metric: string = 'default_metric',
  evaluationPeriod: string = 'current',
  conditionType: string = 'threshold'
): string {
  const cleanMetric = metric.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const cleanPeriod = evaluationPeriod.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `fp_${ruleId}_${datasetId}_v${datasetVersion}_${cleanMetric}_${cleanPeriod}_${conditionType}`;
}

/**
 * Checks whether an existing alert instance is currently in active snooze mode
 */
export function isAlertSnoozed(alert: AlertInstance): boolean {
  if (alert.status !== 'snoozed' || !alert.snoozedUntil) return false;
  const snoozedUntilTime = new Date(alert.snoozedUntil).getTime();
  const now = Date.now();
  return now < snoozedUntilTime;
}

/**
 * Checks if a rule was triggered within the configured cooldown window
 */
export function isWithinCooldown(
  lastTriggeredAt: string | undefined,
  cooldownMinutes: number = 60
): boolean {
  if (!lastTriggeredAt) return false;
  const lastTriggeredTime = new Date(lastTriggeredAt).getTime();
  const elapsedMinutes = (Date.now() - lastTriggeredTime) / (1000 * 60);
  return elapsedMinutes < cooldownMinutes;
}

/**
 * Finds an active (triggered, acknowledged, or snoozed) alert matching the fingerprint
 */
export function findActiveAlertByFingerprint(
  existingAlerts: AlertInstance[],
  fingerprint: string
): AlertInstance | undefined {
  return existingAlerts.find(
    (a) => a.fingerprint === fingerprint && (a.status === 'triggered' || a.status === 'acknowledged' || a.status === 'snoozed')
  );
}

/**
 * Checks whether an incoming evaluation should be suppressed to avoid alert fatigue & spam.
 * Returns true if an active duplicate exists or if the rule is in cooldown and condition hasn't resolved.
 */
export function shouldSuppressAlert(
  existingAlerts: AlertInstance[],
  fingerprint: string,
  lastTriggeredAt?: string,
  cooldownMinutes: number = 60
): { suppress: boolean; reason?: string; existingAlert?: AlertInstance } {
  const existing = findActiveAlertByFingerprint(existingAlerts, fingerprint);

  if (existing) {
    if (isAlertSnoozed(existing)) {
      return {
        suppress: true,
        reason: `Alert is snoozed until ${new Date(existing.snoozedUntil!).toLocaleTimeString()}`,
        existingAlert: existing,
      };
    }
    return {
      suppress: true,
      reason: 'An identical active alert condition is already active and being tracked.',
      existingAlert: existing,
    };
  }

  // Check cooldown if no active instance exists
  if (isWithinCooldown(lastTriggeredAt, cooldownMinutes)) {
    return {
      suppress: true,
      reason: `Rule is in cooldown period (${cooldownMinutes} min).`,
    };
  }

  return { suppress: false };
}
