import {
  InAppNotification,
  NotificationPreferences,
  AlertInstance,
  AlertSeverity,
} from './alertTypes';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './alertConstants';
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

const LOCAL_NOTIFS_KEY_PREFIX = 'insightai_notifications_';
const LOCAL_PREFS_KEY_PREFIX = 'insightai_alert_prefs_';

export function generateNotificationId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `notif_${ts}_${rand}`;
}

/**
 * Checks if the current local time falls within configured quiet hours
 */
export function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = (prefs.quietHoursStart || '22:00').split(':').map(Number);
  const [endH, endM] = (prefs.quietHoursEnd || '07:00').split(':').map(Number);

  const startMinutes = (startH || 22) * 60 + (startM || 0);
  const endMinutes = (endH || 7) * 60 + (endM || 0);

  if (startMinutes <= endMinutes) {
    // Standard window in same day (e.g. 13:00 to 14:00)
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight window (e.g. 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

/**
 * Dispatches an email notification via the backend API
 */
export async function sendEmailNotification(
  alert: AlertInstance,
  targetEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/alerts/notify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        alertTitle: alert.title,
        severity: alert.severity,
        metric: alert.metric,
        datasetName: alert.datasetName,
        actualValueFormatted: alert.evidence?.actualValueFormatted || 'N/A',
        expectedValueFormatted: alert.evidence?.expectedValueFormatted || 'N/A',
        thresholdFormatted: alert.evidence?.thresholdFormatted || 'N/A',
        deviationPct: alert.evidence?.deviationPct,
        summaryText: alert.evidence?.summaryText || alert.message,
        triggeredAt: alert.triggeredAt,
        alertId: alert.alertId,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Server responded with status ${response.status}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to dispatch email request',
    };
  }
}

/**
 * Creates an in-app notification and dispatches to configured channels
 */
export async function createAndDispatchNotification(
  userId: string,
  alert: AlertInstance,
  userEmail?: string
): Promise<{
  notificationStatus: 'sent' | 'failed' | 'suppressed_quiet_hours';
  error?: string;
}> {
  const prefs = await getNotificationPreferences(userId, userEmail);

  // Check Quiet Hours suppression
  const inQuiet = isInQuietHours(prefs);
  if (inQuiet && alert.severity !== 'critical' && !prefs.quietHoursBypassCritical) {
    return { notificationStatus: 'suppressed_quiet_hours' };
  }

  // 1. Create In-App Notification if enabled
  if (prefs.inAppEnabled) {
    const notificationId = generateNotificationId();
    const notif: InAppNotification = {
      notificationId,
      userId,
      alertId: alert.alertId,
      ruleId: alert.ruleId,
      datasetId: alert.datasetId,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Save locally
    try {
      const list = getLocalNotifications(userId);
      const updated = [notif, ...list.slice(0, 49)];
      localStorage.setItem(`${LOCAL_NOTIFS_KEY_PREFIX}${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save notification warning:', e);
    }

    // Save in Firestore
    if (db) {
      try {
        const docRef = doc(db, 'users', userId, 'notifications', notificationId);
        await setDoc(docRef, {
          ...notif,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore save notification warning:', err);
      }
    }
  }

  // 2. Dispatch Email if enabled
  if (prefs.emailEnabled && prefs.emailAddress) {
    const emailResult = await sendEmailNotification(alert, prefs.emailAddress);
    if (!emailResult.success) {
      return {
        notificationStatus: 'failed',
        error: emailResult.error,
      };
    }
  }

  return { notificationStatus: 'sent' };
}

/**
 * Retrieves in-app notifications
 */
export async function getNotifications(userId: string): Promise<InAppNotification[]> {
  if (!userId) return [];

  const notifs: InAppNotification[] = [];

  if (db) {
    try {
      const colRef = collection(db, 'users', userId, 'notifications');
      const snapshot = await getDocs(colRef);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        notifs.push({
          ...data,
          notificationId: docSnap.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
        });
      });
    } catch (err) {
      console.warn('Firestore getNotifications warning:', err);
    }
  }

  if (notifs.length === 0) {
    notifs.push(...getLocalNotifications(userId));
  }

  return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * LocalStorage notifications getter
 */
export function getLocalNotifications(userId: string): InAppNotification[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_NOTIFS_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Marks an individual notification as read
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  const now = new Date().toISOString();

  // Local storage
  try {
    const list = getLocalNotifications(userId);
    const updated = list.map((n) =>
      n.notificationId === notificationId ? { ...n, read: true, readAt: now } : n
    );
    localStorage.setItem(`${LOCAL_NOTIFS_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage mark read warning:', e);
  }

  // Firestore
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(docRef, { read: true, readAt: serverTimestamp() });
    } catch (err) {
      console.warn('Firestore mark read warning:', err);
    }
  }
}

/**
 * Marks all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const now = new Date().toISOString();

  // Local storage
  try {
    const list = getLocalNotifications(userId);
    const updated = list.map((n) => ({ ...n, read: true, readAt: now }));
    localStorage.setItem(`${LOCAL_NOTIFS_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage mark all read warning:', e);
  }

  // Firestore
  if (db) {
    try {
      const colRef = collection(db, 'users', userId, 'notifications');
      const snapshot = await getDocs(colRef);
      snapshot.forEach(async (docSnap) => {
        if (!docSnap.data().read) {
          await updateDoc(doc(db, 'users', userId, 'notifications', docSnap.id), {
            read: true,
            readAt: serverTimestamp(),
          });
        }
      });
    } catch (err) {
      console.warn('Firestore mark all read warning:', err);
    }
  }
}

/**
 * Retrieves User's Notification Preferences
 */
export async function getNotificationPreferences(
  userId: string,
  userEmail?: string
): Promise<NotificationPreferences> {
  const defaultPrefs = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    userId,
    emailAddress: userEmail || '',
  };

  if (!userId) return defaultPrefs;

  // 1. Firestore
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'alertPreferences', 'default');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { ...defaultPrefs, ...snapshot.data() } as NotificationPreferences;
      }
    } catch (err) {
      console.warn('Firestore get preferences warning:', err);
    }
  }

  // 2. Local storage
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFS_KEY_PREFIX}${userId}`);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('LocalStorage preferences warning:', e);
  }

  return defaultPrefs;
}

/**
 * Saves User's Notification Preferences
 */
export async function saveNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const existing = await getNotificationPreferences(userId);
  const updated: NotificationPreferences = {
    ...existing,
    ...prefs,
    userId,
    updatedAt: new Date().toISOString(),
  };

  // Local storage
  try {
    localStorage.setItem(`${LOCAL_PREFS_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save prefs warning:', e);
  }

  // Firestore
  if (db) {
    try {
      const docRef = doc(db, 'users', userId, 'alertPreferences', 'default');
      await setDoc(docRef, {
        ...updated,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore save prefs warning:', err);
    }
  }

  return updated;
}
