import {
  Report,
  ReportMetadata,
  ReportSharingConfig,
  ReportStatus,
} from './reportTypes';
import { db } from '../../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

const LOCAL_REPORTS_KEY_PREFIX = 'insightai_reports_';
const LOCAL_SHARED_KEY_PREFIX = 'insightai_shared_reports_';

export function generateReportId(datasetId: string): string {
  const timestamp = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `rep_${datasetId}_${timestamp}_${rand}`;
}

export function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'shr_';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Saves or updates a report in Firestore and Local Storage
 */
export async function saveReport(
  userId: string,
  datasetId: string,
  report: Report
): Promise<void> {
  if (!userId || !datasetId || !report.metadata.reportId) {
    throw new Error('Missing user, dataset, or report ID.');
  }

  // Update timestamps
  report.metadata.updatedAt = new Date().toISOString();

  // 1. Local Storage Cache
  try {
    const list = getLocalReports(userId, datasetId);
    const updatedList = [
      report,
      ...list.filter((r) => r.metadata.reportId !== report.metadata.reportId),
    ];
    localStorage.setItem(
      `${LOCAL_REPORTS_KEY_PREFIX}${userId}_${datasetId}`,
      JSON.stringify(updatedList)
    );
  } catch (e) {
    console.warn('LocalStorage save report warning:', e);
  }

  // 2. Firestore Storage
  if (db) {
    try {
      const docRef = doc(
        db,
        'users',
        userId,
        'datasets',
        datasetId,
        'reports',
        report.metadata.reportId
      );
      await setDoc(docRef, {
        ...report,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore saveReport warning:', err);
    }
  }
}

/**
 * Retrieves all saved reports for a dataset (or across datasets for a user)
 */
export async function getReports(
  userId: string,
  datasetId?: string
): Promise<Report[]> {
  if (!userId) return [];

  const reports: Report[] = [];

  // If specific dataset
  if (datasetId && db) {
    try {
      const collRef = collection(
        db,
        'users',
        userId,
        'datasets',
        datasetId,
        'reports'
      );
      const q = query(collRef, orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);

      snap.forEach((d) => {
        const data = d.data() as Report;
        reports.push(data);
      });
    } catch (err) {
      console.warn('Firestore getReports error, checking local storage:', err);
    }
  }

  if (reports.length > 0) {
    return reports;
  }

  // Fallback to local storage
  if (datasetId) {
    return getLocalReports(userId, datasetId);
  }

  // Read all local storage reports for user
  const allUserReports: Report[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${LOCAL_REPORTS_KEY_PREFIX}${userId}_`)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: Report[] = JSON.parse(raw);
          allUserReports.push(...list);
        }
      }
    }
  } catch {
    // ignore
  }

  return allUserReports.sort(
    (a, b) =>
      new Date(b.metadata.updatedAt).getTime() -
      new Date(a.metadata.updatedAt).getTime()
  );
}

/**
 * Retrieves a single report by ID
 */
export async function getReportById(
  userId: string,
  datasetId: string,
  reportId: string
): Promise<Report | null> {
  if (!userId || !datasetId || !reportId) return null;

  if (db) {
    try {
      const docRef = doc(
        db,
        'users',
        userId,
        'datasets',
        datasetId,
        'reports',
        reportId
      );
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as Report;
      }
    } catch (err) {
      console.warn('Firestore getReportById warning:', err);
    }
  }

  const localList = getLocalReports(userId, datasetId);
  return localList.find((r) => r.metadata.reportId === reportId) || null;
}

/**
 * Deletes a report
 */
export async function deleteReport(
  userId: string,
  datasetId: string,
  reportId: string
): Promise<void> {
  // Local storage
  try {
    const list = getLocalReports(userId, datasetId);
    const filtered = list.filter((r) => r.metadata.reportId !== reportId);
    localStorage.setItem(
      `${LOCAL_REPORTS_KEY_PREFIX}${userId}_${datasetId}`,
      JSON.stringify(filtered)
    );
  } catch (e) {
    console.warn('LocalStorage delete error:', e);
  }

  // Firestore
  if (db) {
    try {
      const docRef = doc(
        db,
        'users',
        userId,
        'datasets',
        datasetId,
        'reports',
        reportId
      );
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteDoc error:', err);
    }
  }
}

/**
 * Duplicates an existing report
 */
export async function duplicateReport(
  userId: string,
  datasetId: string,
  sourceReportId: string,
  newTitle?: string
): Promise<Report> {
  const existing = await getReportById(userId, datasetId, sourceReportId);
  if (!existing) {
    throw new Error('Source report not found.');
  }

  const newReportId = generateReportId(datasetId);
  const now = new Date().toISOString();

  const duplicated: Report = {
    ...existing,
    metadata: {
      ...existing.metadata,
      reportId: newReportId,
      title: newTitle || `${existing.metadata.title} (Copy)`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    },
    sharing: {
      isShared: false,
      allowExport: true,
      viewCount: 0,
      revoked: false,
      creatorUserId: userId,
    },
  };

  await saveReport(userId, datasetId, duplicated);
  return duplicated;
}

/**
 * Creates a public secure share link with expiration
 */
export async function createShareLink(
  userId: string,
  report: Report,
  expiresInHours?: number
): Promise<{ shareToken: string; shareUrl: string; expiresAt: string | null }> {
  const shareToken = report.sharing?.shareToken || generateShareToken();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/#report-share=${shareToken}`;

  let expiresAt: string | null = null;
  if (expiresInHours && expiresInHours > 0) {
    const expDate = new Date();
    expDate.setHours(expDate.getHours() + expiresInHours);
    expiresAt = expDate.toISOString();
  }

  const updatedSharing: ReportSharingConfig = {
    isShared: true,
    shareToken,
    shareUrl,
    expiresAt,
    allowExport: true,
    viewCount: report.sharing?.viewCount || 0,
    revoked: false,
    creatorUserId: userId,
  };

  report.sharing = updatedSharing;
  await saveReport(userId, report.metadata.datasetId, report);

  // Write to public sharedReports collection in Firestore for unauthenticated link readers
  if (db) {
    try {
      const shareDocRef = doc(db, 'sharedReports', shareToken);
      await setDoc(shareDocRef, {
        shareToken,
        reportSnapshot: report,
        creatorUserId: userId,
        datasetId: report.metadata.datasetId,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        revoked: false,
      });
    } catch (err) {
      console.warn('Firestore save sharedReport warning:', err);
    }
  }

  // Local storage fallback
  try {
    localStorage.setItem(
      `${LOCAL_SHARED_KEY_PREFIX}${shareToken}`,
      JSON.stringify({
        shareToken,
        reportSnapshot: report,
        expiresAt,
        revoked: false,
      })
    );
  } catch {
    // ignore
  }

  return { shareToken, shareUrl, expiresAt };
}

/**
 * Retrieves a shared report snapshot by its token
 */
export async function getSharedReport(shareToken: string): Promise<Report | null> {
  if (!shareToken) return null;

  // Try Firestore
  if (db) {
    try {
      const docRef = doc(db, 'sharedReports', shareToken);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.revoked) return null;
        if (data.expiresAt) {
          const expTime = data.expiresAt?.toDate
            ? data.expiresAt.toDate().getTime()
            : new Date(data.expiresAt).getTime();
          if (Date.now() > expTime) return null;
        }
        return data.reportSnapshot as Report;
      }
    } catch (err) {
      console.warn('Firestore getSharedReport error:', err);
    }
  }

  // Try local storage
  try {
    const raw = localStorage.getItem(`${LOCAL_SHARED_KEY_PREFIX}${shareToken}`);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.revoked) return null;
      if (data.expiresAt && Date.now() > new Date(data.expiresAt).getTime()) return null;
      return data.reportSnapshot as Report;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Revokes an existing share link
 */
export async function revokeShareLink(
  userId: string,
  datasetId: string,
  reportId: string,
  shareToken?: string
): Promise<void> {
  const report = await getReportById(userId, datasetId, reportId);
  if (!report) return;

  const token = shareToken || report.sharing.shareToken;
  report.sharing.isShared = false;
  report.sharing.revoked = true;

  await saveReport(userId, datasetId, report);

  if (token && db) {
    try {
      const docRef = doc(db, 'sharedReports', token);
      await updateDoc(docRef, { revoked: true });
    } catch (e) {
      console.warn('Firestore revoke share warning:', e);
    }
  }

  if (token) {
    try {
      localStorage.removeItem(`${LOCAL_SHARED_KEY_PREFIX}${token}`);
    } catch {
      // ignore
    }
  }
}

// Local storage helper
function getLocalReports(userId: string, datasetId: string): Report[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_REPORTS_KEY_PREFIX}${userId}_${datasetId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
