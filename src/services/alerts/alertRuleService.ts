import {
  AlertRule,
  TestRuleResult,
  AlertType,
  AlertOperator,
  AlertSeverity,
  EvaluationFrequency,
} from './alertTypes';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';
import { db } from '../../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { evaluateRuleAgainstData } from './alertEvaluationService';

const LOCAL_RULES_KEY_PREFIX = 'insightai_alert_rules_';

export function generateRuleId(datasetId: string): string {
  const cleanId = datasetId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 12);
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `rule_${cleanId}_${ts}_${rand}`;
}

/**
 * Validates whether a metric is compatible with the selected rule type
 */
export function validateRuleMetric(
  ruleType: AlertType,
  metricName?: string,
  profile?: DatasetProfile | null
): { valid: boolean; error?: string } {
  if (ruleType === 'data_quality') {
    return { valid: true };
  }

  if (!metricName || metricName.trim() === '') {
    return { valid: false, error: 'Metric or column name is required.' };
  }

  if (!profile || !profile.columns) {
    return { valid: true }; // Cannot strictly validate without profile
  }

  const column = profile.columns.find(
    (c) => c.name.toLowerCase() === metricName.toLowerCase()
  );

  if (!column) {
    return {
      valid: false,
      error: `Column '${metricName}' does not exist in the dataset schema.`,
    };
  }

  // Numerical rules require numeric columns
  const numericRequiredTypes: AlertType[] = [
    'threshold',
    'percentage_change',
    'trend',
    'forecast',
    'forecast_vs_actual',
    'kpi_change',
  ];

  if (numericRequiredTypes.includes(ruleType)) {
    const colType = column.inferredType?.toLowerCase() || '';
    const isNumeric =
      colType === 'number' ||
      colType === 'integer' ||
      colType === 'float' ||
      colType === 'currency' ||
      colType === 'numeric';

    if (!isNumeric && column.uniqueCount && column.uniqueCount > 20) {
      // Check if metric name looks like an ID
      const lowerName = metricName.toLowerCase();
      if (
        lowerName.endsWith('id') ||
        lowerName.endsWith('_id') ||
        lowerName === 'id' ||
        lowerName.includes('identifier')
      ) {
        return {
          valid: false,
          error: `Column '${metricName}' appears to be an identifier. Select a valid numeric metric (e.g. Revenue, Quantity, Price).`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validates the complete rule payload before saving
 */
export function validateAlertRule(
  rule: Partial<AlertRule>,
  dataset?: Dataset | null,
  profile?: DatasetProfile | null
): { valid: boolean; error?: string } {
  if (!rule.name || rule.name.trim() === '') {
    return { valid: false, error: 'Rule name is required.' };
  }

  if (!rule.datasetId) {
    return { valid: false, error: 'Dataset must be selected.' };
  }

  if (!rule.type) {
    return { valid: false, error: 'Alert type must be specified.' };
  }

  // Validate metric
  const metricValidation = validateRuleMetric(rule.type, rule.metric, profile);
  if (!metricValidation.valid) {
    return metricValidation;
  }

  // Validate specific conditions
  if (rule.type === 'threshold') {
    if (rule.threshold === undefined || isNaN(rule.threshold)) {
      return { valid: false, error: 'Threshold value must be a valid number.' };
    }
    if (!rule.operator) {
      return { valid: false, error: 'Comparison operator is required for threshold alert.' };
    }
  }

  if (rule.type === 'percentage_change') {
    if (
      rule.percentageChangeThreshold === undefined ||
      isNaN(rule.percentageChangeThreshold) ||
      rule.percentageChangeThreshold <= 0
    ) {
      return { valid: false, error: 'Percentage change threshold must be greater than 0%.' };
    }
  }

  if (rule.type === 'trend') {
    if (!rule.minConsecutivePeriods || rule.minConsecutivePeriods < 2) {
      return { valid: false, error: 'Minimum consecutive periods must be at least 2.' };
    }
  }

  return { valid: true };
}

/**
 * Creates and persists a new Alert Rule
 */
export async function createAlertRule(
  userId: string,
  input: Omit<AlertRule, 'ruleId' | 'createdAt' | 'updatedAt'>
): Promise<AlertRule> {
  if (!userId) throw new Error('User must be authenticated to create alert rules.');

  const ruleId = generateRuleId(input.datasetId);
  const now = new Date().toISOString();

  const newRule: AlertRule = {
    ...input,
    ruleId,
    userId,
    enabled: input.enabled !== undefined ? input.enabled : true,
    cooldownMinutes: input.cooldownMinutes || 60,
    createdAt: now,
    updatedAt: now,
    lastEvaluatedStatus: 'not_triggered',
  };

  // 1. Local storage cache
  try {
    const list = getLocalAlertRules(userId);
    const updated = [newRule, ...list.filter((r) => r.ruleId !== ruleId)];
    localStorage.setItem(`${LOCAL_RULES_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (err) {
    console.warn('LocalStorage save alert rule warning:', err);
  }

  // 2. Cloud Firestore
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'alertRules', ruleId);
      await setDoc(docRef, {
        ...newRule,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore createAlertRule warning:', err);
    }
  }

  return newRule;
}

/**
 * Updates an existing Alert Rule
 */
export async function updateAlertRule(
  userId: string,
  ruleId: string,
  updates: Partial<AlertRule>
): Promise<void> {
  if (!userId || !ruleId) throw new Error('Missing user or rule ID.');

  const now = new Date().toISOString();

  // 1. Local Storage
  try {
    const list = getLocalAlertRules(userId);
    const updatedList = list.map((r) =>
      r.ruleId === ruleId ? { ...r, ...updates, updatedAt: now } : r
    );
    localStorage.setItem(`${LOCAL_RULES_KEY_PREFIX}${userId}`, JSON.stringify(updatedList));
  } catch (e) {
    console.warn('LocalStorage update alert rule warning:', e);
  }

  // 2. Firestore
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'alertRules', ruleId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore updateAlertRule warning:', err);
    }
  }
}

/**
 * Deletes an Alert Rule (historical alerts are preserved!)
 */
export async function deleteAlertRule(
  userId: string,
  ruleId: string
): Promise<void> {
  if (!userId || !ruleId) throw new Error('Missing user or rule ID.');

  // 1. Local Storage
  try {
    const list = getLocalAlertRules(userId);
    const filtered = list.filter((r) => r.ruleId !== ruleId);
    localStorage.setItem(`${LOCAL_RULES_KEY_PREFIX}${userId}`, JSON.stringify(filtered));
  } catch (e) {
    console.warn('LocalStorage delete alert rule warning:', e);
  }

  // 2. Firestore
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'alertRules', ruleId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteAlertRule warning:', err);
    }
  }
}

/**
 * Retrieves all configured alert rules for a user
 */
export async function getAlertRules(
  userId: string,
  datasetId?: string
): Promise<AlertRule[]> {
  if (!userId) return [];

  const rules: AlertRule[] = [];

  // 1. Try Firestore
  if (db) {
    try {
      const colRef = collection(db, 'users', userId, 'alertRules');
      const snapshot = await getDocs(colRef);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        rules.push({
          ...data,
          ruleId: docSnap.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || new Date().toISOString(),
        });
      });
    } catch (err) {
      console.warn('Firestore getAlertRules warning:', err);
    }
  }

  // 2. Fallback to LocalStorage if Firestore is empty or unavailable
  if (rules.length === 0) {
    const local = getLocalAlertRules(userId);
    rules.push(...local);
  }

  const filtered = datasetId ? rules.filter((r) => r.datasetId === datasetId) : rules;
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * LocalStorage helper for reading rules
 */
export function getLocalAlertRules(userId: string): AlertRule[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_RULES_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Tests an Alert Rule against the actual dataset without triggering real alerts
 */
export async function testAlertRule(
  rule: AlertRule,
  dataset: Dataset,
  profile?: DatasetProfile | null,
  cachedAnomalies?: any[],
  cachedForecast?: any
): Promise<TestRuleResult> {
  const evaluatedAt = new Date().toISOString();
  try {
    const outcome = await evaluateRuleAgainstData(
      rule,
      dataset,
      profile,
      undefined,
      cachedAnomalies,
      cachedForecast
    );

    return {
      wouldTrigger: outcome.triggered,
      currentCalculatedValue: outcome.actualValue,
      expectedValue: outcome.expectedValue,
      deviationPct: outcome.deviationPct,
      evidence: outcome.evidence,
      message: outcome.evidence.summaryText,
      evaluatedAt,
    };
  } catch (error: any) {
    return {
      wouldTrigger: false,
      message: `Evaluation error: ${error.message || 'Could not evaluate rule'}`,
      evaluatedAt,
    };
  }
}
