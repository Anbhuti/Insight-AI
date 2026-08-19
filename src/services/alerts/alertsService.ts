import {
  AlertRule,
  AlertInstance,
  AlertStatistics,
  TestRuleResult,
  NotificationPreferences,
  InAppNotification,
} from './alertTypes';
import {
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getAlertRules,
  validateAlertRule,
  testAlertRule,
} from './alertRuleService';
import {
  getAlertInstances,
  saveAlertInstance,
  evaluateAllEnabledRules,
} from './alertSchedulerService';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  saveNotificationPreferences,
} from './alertNotificationService';
import { Dataset } from '../../types/dataset';
import { DatasetProfile } from '../../types/dataProfile';

export class AlertService {
  // Rule Management
  static createRule = createAlertRule;
  static updateRule = updateAlertRule;
  static deleteRule = deleteAlertRule;
  static getRules = getAlertRules;
  static validateRule = validateAlertRule;
  static testRule = testAlertRule;

  // Evaluation & Processing
  static evaluateAllRules = evaluateAllEnabledRules;
  static getAlerts = getAlertInstances;
  static getAlertHistory = getAlertInstances;

  /**
   * User Acknowledges an active Alert Instance
   */
  static async acknowledgeAlert(
    userId: string,
    alertId: string,
    userDisplayName?: string
  ): Promise<AlertInstance | null> {
    const alerts = await getAlertInstances(userId);
    const alert = alerts.find((a) => a.alertId === alertId);
    if (!alert) return null;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = userDisplayName || 'User';

    await saveAlertInstance(userId, alert);
    return alert;
  }

  /**
   * User Snoozes an active Alert Instance for N minutes
   */
  static async snoozeAlert(
    userId: string,
    alertId: string,
    durationMinutes: number
  ): Promise<AlertInstance | null> {
    const alerts = await getAlertInstances(userId);
    const alert = alerts.find((a) => a.alertId === alertId);
    if (!alert) return null;

    const snoozedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    alert.status = 'snoozed';
    alert.snoozedUntil = snoozedUntil;
    alert.snoozeDurationMinutes = durationMinutes;

    await saveAlertInstance(userId, alert);
    return alert;
  }

  /**
   * User Manually or System Automatically Resolves an Alert Instance
   */
  static async resolveAlert(
    userId: string,
    alertId: string,
    reason: string = 'Manually marked as resolved'
  ): Promise<AlertInstance | null> {
    const alerts = await getAlertInstances(userId);
    const alert = alerts.find((a) => a.alertId === alertId);
    if (!alert) return null;

    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedReason = reason;

    await saveAlertInstance(userId, alert);
    return alert;
  }

  /**
   * Calculates real, verified statistics from alert instances
   */
  static async getAlertStatistics(
    userId: string,
    datasetId?: string
  ): Promise<AlertStatistics> {
    const alerts = await getAlertInstances(userId, datasetId);

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let acknowledgedCount = 0;
    let snoozedCount = 0;
    let resolvedCount = 0;
    let activeCount = 0;

    let totalResolutionMinutes = 0;
    let resolvedWithTimestampsCount = 0;

    for (const a of alerts) {
      if (a.status === 'resolved') {
        resolvedCount++;
        if (a.triggeredAt && a.resolvedAt) {
          const start = new Date(a.triggeredAt).getTime();
          const end = new Date(a.resolvedAt).getTime();
          if (end >= start) {
            totalResolutionMinutes += (end - start) / (1000 * 60);
            resolvedWithTimestampsCount++;
          }
        }
      } else {
        activeCount++;
        if (a.status === 'acknowledged') acknowledgedCount++;
        if (a.status === 'snoozed') snoozedCount++;

        if (a.severity === 'critical') criticalCount++;
        else if (a.severity === 'high') highCount++;
        else if (a.severity === 'medium') mediumCount++;
        else lowCount++;
      }
    }

    const avgResolutionTimeMinutes =
      resolvedWithTimestampsCount > 0
        ? Math.round(totalResolutionMinutes / resolvedWithTimestampsCount)
        : 0;

    return {
      totalTriggered: alerts.length,
      activeCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      acknowledgedCount,
      snoozedCount,
      resolvedCount,
      avgResolutionTimeMinutes,
    };
  }

  /**
   * Requests an AI Explanation strictly grounded on verified alert evidence
   */
  static async explainAlertWithAI(
    alert: AlertInstance,
    additionalContext?: {
      rcaSummary?: string;
      anomalyContext?: string;
      forecastContext?: string;
    }
  ): Promise<string> {
    try {
      const response = await fetch('/api/alerts/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertTitle: alert.title,
          severity: alert.severity,
          type: alert.type,
          metric: alert.metric,
          datasetName: alert.datasetName,
          evidence: alert.evidence,
          additionalContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      return data.explanation || 'AI explanation unavailable.';
    } catch (error: any) {
      console.warn('AI alert explanation error:', error);
      return 'AI explanation unavailable. Review structured evidence metrics for direct validation.';
    }
  }

  // In-App Notifications
  static getNotifications = getNotifications;
  static markNotificationAsRead = markNotificationAsRead;
  static markAllNotificationsAsRead = markAllNotificationsAsRead;

  // Preferences
  static getPreferences = getNotificationPreferences;
  static savePreferences = saveNotificationPreferences;
}

export default AlertService;
