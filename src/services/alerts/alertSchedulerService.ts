import {
  AlertRule,
  AlertInstance,
  AlertStatus,
  AlertSeverity,
} from './alertTypes';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { getAlertRules, updateAlertRule } from './alertRuleService';
import { evaluateRuleAgainstData } from './alertEvaluationService';
import {
  createAlertFingerprint,
  shouldSuppressAlert,
  findActiveAlertByFingerprint,
} from './alertDeduplicationService';
import { createAndDispatchNotification } from './alertNotificationService';
import { db } from '../../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { loadDatasetRows } from '../anomaly/anomalyDetectionService';

const LOCAL_ALERTS_KEY_PREFIX = 'insightai_active_alerts_';

function getDatasetVersionString(updatedAt: any): string {
  if (!updatedAt) return '1';
  if (typeof updatedAt === 'string') return updatedAt;
  if (typeof updatedAt === 'number') return String(updatedAt);
  if (typeof updatedAt.toMillis === 'function') return String(updatedAt.toMillis());
  if (updatedAt instanceof Date) return updatedAt.toISOString();
  return '1';
}

export function generateAlertInstanceId(datasetId: string, ruleId: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `alt_${ts}_${rand}`;
}

/**
 * Saves or updates an alert instance in Firestore and LocalStorage
 */
export async function saveAlertInstance(userId: string, alert: AlertInstance): Promise<void> {
  // 1. Local Storage
  try {
    const list = getLocalAlertInstances(userId);
    const updated = [alert, ...list.filter((a) => a.alertId !== alert.alertId)];
    localStorage.setItem(`${LOCAL_ALERTS_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save alert instance warning:', e);
  }

  // 2. Firestore
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'alerts', alert.alertId);
      await setDoc(docRef, {
        ...alert,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore save alert instance warning:', err);
    }
  }
}

/**
 * Retrieves all alert instances (active + historical) for a user
 */
export async function getAlertInstances(
  userId: string,
  datasetId?: string
): Promise<AlertInstance[]> {
  if (!userId) return [];

  const alerts: AlertInstance[] = [];

  if (db) {
    try {
      const colRef = collection(db, 'users', userId, 'alerts');
      const snapshot = await getDocs(colRef);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        alerts.push({
          ...data,
          alertId: docSnap.id,
          triggeredAt: data.triggeredAt?.toDate?.()?.toISOString?.() || data.triggeredAt || new Date().toISOString(),
          resolvedAt: data.resolvedAt?.toDate?.()?.toISOString?.() || data.resolvedAt,
        });
      });
    } catch (err) {
      console.warn('Firestore getAlertInstances warning:', err);
    }
  }

  if (alerts.length === 0) {
    alerts.push(...getLocalAlertInstances(userId));
  }

  const filtered = datasetId ? alerts.filter((a) => a.datasetId === datasetId) : alerts;
  return filtered.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
}

/**
 * LocalStorage alert instances getter
 */
export function getLocalAlertInstances(userId: string): AlertInstance[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_ALERTS_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Central evaluation scheduler that batches and evaluates rules safely
 */
export async function evaluateAllEnabledRules(
  userId: string,
  datasets: Dataset[],
  profiles: Record<string, DatasetProfile>,
  userEmail?: string,
  cachedAnomalies?: Record<string, any[]>,
  cachedForecasts?: Record<string, any>
): Promise<{
  evaluatedCount: number;
  triggeredCount: number;
  resolvedCount: number;
  errors: string[];
}> {
  if (!userId) return { evaluatedCount: 0, triggeredCount: 0, resolvedCount: 0, errors: [] };

  const rules = await getAlertRules(userId);
  const enabledRules = rules.filter((r) => r.enabled);
  const existingAlerts = await getAlertInstances(userId);

  let evaluatedCount = 0;
  let triggeredCount = 0;
  let resolvedCount = 0;
  const errors: string[] = [];

  // Group rules by datasetId for batch optimization
  const rulesByDataset: Record<string, AlertRule[]> = {};
  for (const r of enabledRules) {
    if (!rulesByDataset[r.datasetId]) {
      rulesByDataset[r.datasetId] = [];
    }
    rulesByDataset[r.datasetId].push(r);
  }

  for (const datasetId of Object.keys(rulesByDataset)) {
    const dsRules = rulesByDataset[datasetId];
    const dataset = datasets.find((d) => d.datasetId === datasetId);

    if (!dataset) {
      errors.push(`Dataset ${datasetId} not found for ${dsRules.length} rules.`);
      continue;
    }

    const profile = profiles[datasetId] || null;
    const anomalies = cachedAnomalies?.[datasetId] || [];
    const forecast = cachedForecasts?.[datasetId] || null;

    // Load dataset rows once for this entire batch if tabular evaluation is needed
    let batchCachedData: { columns: string[]; rows: (string | number | boolean | null)[][] } | undefined;
    const needsTabular = dsRules.some((r) =>
      ['threshold', 'percentage_change', 'trend', 'forecast_vs_actual', 'kpi_change'].includes(r.type)
    );

    if (needsTabular) {
      try {
        batchCachedData = await loadDatasetRows(dataset);
      } catch (err: any) {
        errors.push(`Failed to load data for dataset ${dataset.name}: ${err.message}`);
      }
    }

    for (const rule of dsRules) {
      evaluatedCount++;
      const now = new Date().toISOString();

      try {
        const outcome = await evaluateRuleAgainstData(
          rule,
          dataset,
          profile,
          batchCachedData,
          anomalies,
          forecast
        );

        const datasetVer = getDatasetVersionString(dataset.updatedAt);
        const fingerprint = createAlertFingerprint(
          rule.ruleId,
          dataset.datasetId,
          datasetVer,
          rule.metric || rule.type,
          'current',
          rule.type
        );

        if (outcome.triggered) {
          // Check for deduplication
          const suppressionCheck = shouldSuppressAlert(
            existingAlerts,
            fingerprint,
            rule.lastTriggeredAt,
            rule.cooldownMinutes || 60
          );

          if (!suppressionCheck.suppress) {
            // New alert trigger!
            triggeredCount++;
            const alertId = generateAlertInstanceId(dataset.datasetId, rule.ruleId);
            const title = `${rule.name}: ${rule.metric || rule.type.replace('_', ' ')} Alert`;

            const newAlert: AlertInstance = {
              alertId,
              userId,
              ruleId: rule.ruleId,
              ruleName: rule.name,
              datasetId: dataset.datasetId,
              datasetName: dataset.name,
              datasetVersion: datasetVer,
              type: rule.type,
              metric: rule.metric || 'dataset_metric',
              severity: rule.severity,
              status: 'triggered',
              fingerprint,
              title,
              message: outcome.evidence.summaryText,
              evidence: outcome.evidence,
              triggeredAt: now,
              notificationStatus: 'pending',
              relatedLinks: {
                anomalyDocId: outcome.evidence.relatedAnomalyId,
              },
            };

            // Dispatch in-app / email notification
            const notifResult = await createAndDispatchNotification(userId, newAlert, userEmail);
            newAlert.notificationStatus = notifResult.notificationStatus;
            newAlert.notificationError = notifResult.error;

            await saveAlertInstance(userId, newAlert);
            existingAlerts.unshift(newAlert);

            // Update rule trigger stats
            await updateAlertRule(userId, rule.ruleId, {
              lastEvaluatedAt: now,
              lastEvaluatedStatus: 'success',
              lastTriggeredAt: now,
              triggerCount: (rule.triggerCount || 0) + 1,
            });
          } else {
            // Suppressed duplicate or in cooldown
            await updateAlertRule(userId, rule.ruleId, {
              lastEvaluatedAt: now,
              lastEvaluatedStatus: 'success',
            });
          }
        } else {
          // Rule is NOT triggered.
          // Auto-resolve any active alert instance matching this fingerprint if condition recovered
          const activeAlert = findActiveAlertByFingerprint(existingAlerts, fingerprint);
          if (activeAlert && activeAlert.status !== 'resolved') {
            resolvedCount++;
            activeAlert.status = 'resolved';
            activeAlert.resolvedAt = now;
            activeAlert.resolvedReason = 'Metric returned within normal baseline parameters.';
            await saveAlertInstance(userId, activeAlert);
          }

          await updateAlertRule(userId, rule.ruleId, {
            lastEvaluatedAt: now,
            lastEvaluatedStatus: 'not_triggered',
          });
        }
      } catch (err: any) {
        errors.push(`Rule ${rule.name} evaluation error: ${err.message}`);
        await updateAlertRule(userId, rule.ruleId, {
          lastEvaluatedAt: now,
          lastEvaluatedStatus: 'failed',
          lastEvaluatedError: err.message,
        });
      }
    }
  }

  return { evaluatedCount, triggeredCount, resolvedCount, errors };
}
