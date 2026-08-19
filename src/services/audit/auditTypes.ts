import { AppRole } from '../../types/rbac';

export type AuditCategory =
  | 'Authentication'
  | 'Authorization'
  | 'Organization'
  | 'Members'
  | 'Roles'
  | 'Datasets'
  | 'Data Quality'
  | 'Analytics'
  | 'AI Analyst'
  | 'SQL Agent'
  | 'Anomaly Detection'
  | 'Root Cause Analysis'
  | 'Forecasting'
  | 'Reports'
  | 'Alerts'
  | 'Exports'
  | 'Security';

export type AuditAction =
  // Authentication
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SESSION_EXPIRED'
  | 'ACCOUNT_CREATED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  // Organization
  | 'ORGANIZATION_CREATED'
  | 'ORGANIZATION_UPDATED'
  | 'ORGANIZATION_DELETED'
  // Members
  | 'MEMBER_INVITED'
  | 'MEMBER_INVITATION_ACCEPTED'
  | 'MEMBER_INVITATION_REVOKED'
  | 'MEMBER_ROLE_CHANGED'
  | 'MEMBER_SUSPENDED'
  | 'MEMBER_REACTIVATED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ACCESS_REVOKED'
  // Roles & RBAC
  | 'ROLE_CREATED'
  | 'ROLE_UPDATED'
  | 'ROLE_DELETED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_CHANGED'
  | 'PERMISSIONS_UPDATED'
  | 'PERMISSION_CHANGED'
  // Datasets & Ingestion
  | 'DATASET_CREATED'
  | 'DATASET_UPDATED'
  | 'DATASET_DELETED'
  | 'DATASET_RENAMED'
  | 'DATASET_REFRESHED'
  | 'DATASET_EXPORTED'
  | 'DATASET_ACCESS'
  | 'DATASET_DELETE_ATTEMPT'
  | 'FILE_UPLOAD_STARTED'
  | 'FILE_UPLOAD_COMPLETED'
  | 'FILE_UPLOAD_FAILED'
  // Data Profiling & Quality
  | 'DATA_PROFILE_STARTED'
  | 'DATA_PROFILE_COMPLETED'
  | 'DATA_PROFILE_FAILED'
  | 'DATA_QUALITY_ANALYSIS_STARTED'
  | 'DATA_QUALITY_ANALYSIS_COMPLETED'
  | 'DATA_QUALITY_ISSUE_DETECTED'
  // AI Analyst
  | 'AI_ANALYSIS_REQUESTED'
  | 'AI_ANALYSIS_COMPLETED'
  | 'AI_ANALYSIS_FAILED'
  // SQL Agent
  | 'SQL_QUERY_REQUESTED'
  | 'SQL_QUERY_EXECUTED'
  | 'SQL_QUERY_FAILED'
  | 'SQL_QUERY_BLOCKED'
  // Anomaly Detection
  | 'ANOMALY_ANALYSIS_STARTED'
  | 'ANOMALY_ANALYSIS_COMPLETED'
  | 'ANOMALY_ANALYSIS_FAILED'
  // Root Cause Analysis
  | 'RCA_REQUESTED'
  | 'RCA_COMPLETED'
  | 'RCA_FAILED'
  // Forecasting
  | 'FORECAST_REQUESTED'
  | 'FORECAST_COMPLETED'
  | 'FORECAST_FAILED'
  // Reports
  | 'REPORT_CREATED'
  | 'REPORT_UPDATED'
  | 'REPORT_DELETED'
  | 'REPORT_VIEWED'
  | 'REPORT_EXPORTED'
  | 'REPORT_SHARED'
  | 'REPORT_EXPORT_REQUESTED'
  | 'REPORT_EXPORT_COMPLETED'
  | 'REPORT_EXPORT_FAILED'
  // Alerts
  | 'ALERT_RULE_CREATED'
  | 'ALERT_RULE_UPDATED'
  | 'ALERT_RULE_DISABLED'
  | 'ALERT_RULE_DELETED'
  | 'ALERT_TRIGGERED'
  | 'ALERT_ACKNOWLEDGED'
  | 'ALERT_SNOOZED'
  | 'ALERT_RESOLVED'
  | 'ALERT_NOTIFICATION_SENT'
  | 'ALERT_NOTIFICATION_FAILED'
  // Exports
  | 'AUDIT_LOG_EXPORTED'
  // Security
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'FORBIDDEN_ACTION'
  | 'INVALID_RESOURCE_ACCESS'
  | 'SUSPICIOUS_REQUEST';

export type AuditResourceType =
  | 'ORGANIZATION'
  | 'USER'
  | 'MEMBER'
  | 'ROLE'
  | 'DATASET'
  | 'DATA_PROFILE'
  | 'ANALYSIS'
  | 'SQL_QUERY'
  | 'ANOMALY'
  | 'RCA'
  | 'FORECAST'
  | 'REPORT'
  | 'ALERT'
  | 'ALERT_RULE'
  | 'NOTIFICATION'
  | 'EXPORT'
  | 'AUDIT_LOG';

export type AuditEventStatus = 'SUCCESS' | 'FAILURE' | 'BLOCKED';

export type AuditActorType = 'USER' | 'SYSTEM' | 'ADMIN_PROCESS';

export interface AuditEvent {
  auditId: string;
  organizationId: string;
  actorUserId: string;
  actorEmail?: string;
  actorRole?: AppRole | string;
  actorType: AuditActorType;
  action: AuditAction;
  category: AuditCategory;
  resourceType: AuditResourceType;
  resourceId: string;
  resourceName?: string;
  status: AuditEventStatus;
  timestamp: string; // ISO 8601 server timestamp
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  errorCode?: string;
  previousHash?: string;
  hash?: string;
}

export interface CreateAuditEventInput {
  organizationId: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: AppRole | string;
  actorType?: AuditActorType;
  action: AuditAction;
  category?: AuditCategory;
  resourceType: AuditResourceType;
  resourceId: string;
  resourceName?: string;
  status: AuditEventStatus;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  errorCode?: string;
  timestamp?: string;
}

export interface AuditFilterParams {
  organizationId: string;
  actorUserId?: string;
  actorType?: AuditActorType;
  category?: AuditCategory | 'ALL';
  action?: AuditAction | 'ALL';
  resourceType?: AuditResourceType | 'ALL';
  resourceId?: string;
  status?: AuditEventStatus | 'ALL';
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditLogsResponse {
  events: AuditEvent[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface AuditSummary {
  totalEvents: number;
  securityEvents: number;
  failedActions: number;
  blockedActions: number;
  categoryBreakdown: Record<string, number>;
  actionBreakdown: Record<string, number>;
  topActors: { actorUserId: string; actorEmail?: string; count: number }[];
  recentCriticalEvents: AuditEvent[];
}

export interface AuditIntegrityResult {
  isValid: boolean;
  totalVerified: number;
  tamperedIndex?: number;
  tamperedAuditId?: string;
  algorithm: string;
  verifiedAt: string;
}
