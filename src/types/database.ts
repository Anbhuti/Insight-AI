import { Timestamp, FieldValue } from 'firebase/firestore';

export type FirestoreDate = Timestamp | FieldValue | Date | string;

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: string; // 'password' | 'google.com' | etc.
  role: 'user' | 'admin'; // 'user' initially, extensible
  plan: 'free' | 'starter' | 'pro' | 'enterprise'; // 'free' initially
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  lastLoginAt: FirestoreDate;
}

// Future-Ready Architectural Models (Phase 4+)

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'analyst' | 'viewer';
  joinedAt: FirestoreDate;
}

export type DatasetSourceType = 'csv' | 'excel' | 'database' | 'google_sheets' | 'api';
export type DatasetStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface Dataset {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  sourceType: DatasetSourceType;
  fileName?: string;
  fileSize?: number;
  rowCount?: number;
  columnCount?: number;
  status: DatasetStatus;
  createdBy: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export type AnalysisType = 'trend' | 'anomaly' | 'root_cause' | 'forecast' | 'summary' | 'custom';
export type AnalysisStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface Analysis {
  id: string;
  organizationId: string;
  datasetId: string;
  userId: string;
  question: string;
  analysisType: AnalysisType;
  status: AnalysisStatus;
  createdAt: FirestoreDate;
  completedAt?: FirestoreDate;
}

export type ReportType = 'executive' | 'analytics' | 'anomaly' | 'forecast' | 'custom';
export type ReportStatus = 'draft' | 'published' | 'archived';

export interface Report {
  id: string;
  organizationId: string;
  title: string;
  analysisId?: string;
  createdBy: string;
  reportType: ReportType;
  status: ReportStatus;
  fileUrl?: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export type AlertCondition = 'above' | 'below' | 'change_pct' | 'anomaly';
export type AlertStatus = 'active' | 'paused';

export interface Alert {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  status: AlertStatus;
  createdBy: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  createdAt: FirestoreDate;
}
