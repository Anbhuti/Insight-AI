import { AuditAction, AuditCategory, AuditResourceType } from './auditTypes';

export const ACTION_CATEGORY_MAP: Record<AuditAction, AuditCategory> = {
  // Authentication
  LOGIN_SUCCESS: 'Authentication',
  LOGIN_FAILED: 'Authentication',
  LOGOUT: 'Authentication',
  SESSION_EXPIRED: 'Authentication',
  ACCOUNT_CREATED: 'Authentication',
  PASSWORD_RESET_REQUESTED: 'Authentication',
  PASSWORD_RESET_COMPLETED: 'Authentication',

  // Organization
  ORGANIZATION_CREATED: 'Organization',
  ORGANIZATION_UPDATED: 'Organization',
  ORGANIZATION_DELETED: 'Organization',

  // Members
  MEMBER_INVITED: 'Members',
  MEMBER_INVITATION_ACCEPTED: 'Members',
  MEMBER_INVITATION_REVOKED: 'Members',
  MEMBER_ROLE_CHANGED: 'Members',
  MEMBER_SUSPENDED: 'Members',
  MEMBER_REACTIVATED: 'Members',
  MEMBER_REMOVED: 'Members',
  MEMBER_ACCESS_REVOKED: 'Members',

  // Roles
  ROLE_CREATED: 'Roles',
  ROLE_UPDATED: 'Roles',
  ROLE_DELETED: 'Roles',
  ROLE_ASSIGNED: 'Roles',
  ROLE_CHANGED: 'Roles',
  PERMISSIONS_UPDATED: 'Roles',
  PERMISSION_CHANGED: 'Roles',

  // Datasets
  DATASET_CREATED: 'Datasets',
  DATASET_UPDATED: 'Datasets',
  DATASET_DELETED: 'Datasets',
  DATASET_RENAMED: 'Datasets',
  DATASET_REFRESHED: 'Datasets',
  DATASET_EXPORTED: 'Datasets',
  DATASET_ACCESS: 'Datasets',
  DATASET_DELETE_ATTEMPT: 'Datasets',
  FILE_UPLOAD_STARTED: 'Datasets',
  FILE_UPLOAD_COMPLETED: 'Datasets',
  FILE_UPLOAD_FAILED: 'Datasets',

  // Data Quality & Profile
  DATA_PROFILE_STARTED: 'Data Quality',
  DATA_PROFILE_COMPLETED: 'Data Quality',
  DATA_PROFILE_FAILED: 'Data Quality',
  DATA_QUALITY_ANALYSIS_STARTED: 'Data Quality',
  DATA_QUALITY_ANALYSIS_COMPLETED: 'Data Quality',
  DATA_QUALITY_ISSUE_DETECTED: 'Data Quality',

  // AI Analyst
  AI_ANALYSIS_REQUESTED: 'AI Analyst',
  AI_ANALYSIS_COMPLETED: 'AI Analyst',
  AI_ANALYSIS_FAILED: 'AI Analyst',

  // SQL Agent
  SQL_QUERY_REQUESTED: 'SQL Agent',
  SQL_QUERY_EXECUTED: 'SQL Agent',
  SQL_QUERY_FAILED: 'SQL Agent',
  SQL_QUERY_BLOCKED: 'SQL Agent',

  // Anomaly Detection
  ANOMALY_ANALYSIS_STARTED: 'Anomaly Detection',
  ANOMALY_ANALYSIS_COMPLETED: 'Anomaly Detection',
  ANOMALY_ANALYSIS_FAILED: 'Anomaly Detection',

  // Root Cause Analysis
  RCA_REQUESTED: 'Root Cause Analysis',
  RCA_COMPLETED: 'Root Cause Analysis',
  RCA_FAILED: 'Root Cause Analysis',

  // Forecasting
  FORECAST_REQUESTED: 'Forecasting',
  FORECAST_COMPLETED: 'Forecasting',
  FORECAST_FAILED: 'Forecasting',

  // Reports
  REPORT_CREATED: 'Reports',
  REPORT_UPDATED: 'Reports',
  REPORT_DELETED: 'Reports',
  REPORT_VIEWED: 'Reports',
  REPORT_EXPORTED: 'Reports',
  REPORT_SHARED: 'Reports',
  REPORT_EXPORT_REQUESTED: 'Reports',
  REPORT_EXPORT_COMPLETED: 'Reports',
  REPORT_EXPORT_FAILED: 'Reports',

  // Alerts
  ALERT_RULE_CREATED: 'Alerts',
  ALERT_RULE_UPDATED: 'Alerts',
  ALERT_RULE_DISABLED: 'Alerts',
  ALERT_RULE_DELETED: 'Alerts',
  ALERT_TRIGGERED: 'Alerts',
  ALERT_ACKNOWLEDGED: 'Alerts',
  ALERT_SNOOZED: 'Alerts',
  ALERT_RESOLVED: 'Alerts',
  ALERT_NOTIFICATION_SENT: 'Alerts',
  ALERT_NOTIFICATION_FAILED: 'Alerts',

  // Exports
  AUDIT_LOG_EXPORTED: 'Exports',

  // Security
  UNAUTHORIZED_ACCESS_ATTEMPT: 'Security',
  FORBIDDEN_ACTION: 'Security',
  INVALID_RESOURCE_ACCESS: 'Security',
  SUSPICIOUS_REQUEST: 'Security',
};

export const SECURITY_ACTIONS: Set<AuditAction> = new Set([
  'LOGIN_FAILED',
  'SQL_QUERY_BLOCKED',
  'UNAUTHORIZED_ACCESS_ATTEMPT',
  'FORBIDDEN_ACTION',
  'INVALID_RESOURCE_ACCESS',
  'SUSPICIOUS_REQUEST',
  'DATASET_DELETE_ATTEMPT',
  'MEMBER_ACCESS_REVOKED',
]);

export const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /authorization/i,
  /cookie/i,
  /credit[_-]?card/i,
  /cvv/i,
  /ssn/i,
  /session[_-]?token/i,
  /bearer/i,
];

export const AUDIT_CATEGORIES: AuditCategory[] = [
  'Authentication',
  'Organization',
  'Members',
  'Roles',
  'Datasets',
  'Data Quality',
  'AI Analyst',
  'SQL Agent',
  'Anomaly Detection',
  'Root Cause Analysis',
  'Forecasting',
  'Reports',
  'Alerts',
  'Exports',
  'Security',
];

export const AUDIT_RESOURCE_TYPES: AuditResourceType[] = [
  'DATASET',
  'REPORT',
  'ALERT',
  'ALERT_RULE',
  'SQL_QUERY',
  'ANALYSIS',
  'ANOMALY',
  'RCA',
  'FORECAST',
  'MEMBER',
  'ROLE',
  'ORGANIZATION',
  'USER',
  'NOTIFICATION',
  'EXPORT',
  'AUDIT_LOG',
];
