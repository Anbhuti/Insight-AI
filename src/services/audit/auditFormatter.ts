import { AuditEvent, AuditAction, AuditEventStatus } from './auditTypes';

/**
 * Generates an objective, human-readable description for an audit event
 */
export function generateAuditDescription(event: {
  action: AuditAction;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: string;
  resourceType?: string;
  resourceName?: string;
  status: AuditEventStatus;
  metadata?: Record<string, any>;
}): string {
  const actorName = event.actorEmail?.split('@')[0] || event.actorUserId || 'User';
  const resource = event.resourceName || event.resourceType || 'resource';

  if (event.status === 'BLOCKED') {
    const reason = event.metadata?.reason || event.metadata?.error || 'unauthorized access attempt';
    return `Security blocked ${event.action.toLowerCase().replace(/_/g, ' ')} on ${resource} by ${actorName} (${reason}).`;
  }

  if (event.status === 'FAILURE') {
    const err = event.metadata?.error || 'system error';
    return `Operation ${event.action.toLowerCase().replace(/_/g, ' ')} on ${resource} by ${actorName} failed (${err}).`;
  }

  switch (event.action) {
    case 'LOGIN_SUCCESS':
      return `${actorName} logged in successfully to workspace.`;
    case 'LOGIN_FAILED':
      return `Failed authentication attempt for ${actorName}.`;
    case 'LOGOUT':
      return `${actorName} logged out of session.`;
    case 'ORGANIZATION_CREATED':
      return `Organization workspace "${resource}" was initialized.`;
    case 'MEMBER_INVITED':
      return `${actorName} invited ${event.metadata?.invitedEmail || 'a new member'} as ${event.metadata?.assignedRole || 'member'}.`;
    case 'MEMBER_ROLE_CHANGED':
      return `${actorName} updated member role for ${event.metadata?.targetUser || 'user'} to ${event.metadata?.newRole || 'role'}.`;
    case 'MEMBER_REMOVED':
      return `${actorName} revoked organization access for ${event.metadata?.removedEmail || 'member'}.`;
    case 'DATASET_CREATED':
      return `${actorName} uploaded and created dataset "${resource}".`;
    case 'DATASET_DELETED':
      return `${actorName} deleted dataset "${resource}".`;
    case 'DATASET_RENAMED':
      return `${actorName} renamed dataset to "${resource}".`;
    case 'DATASET_EXPORTED':
      return `${actorName} exported dataset "${resource}" in ${event.metadata?.format || 'CSV'} format.`;
    case 'DATA_PROFILE_COMPLETED':
      return `Statistical profiling and quality analysis completed for dataset "${resource}" (Score: ${event.metadata?.qualityScore || 'N/A'}/100).`;
    case 'AI_ANALYSIS_REQUESTED':
      return `${actorName} initiated AI Data Analyst chat inquiry on dataset "${resource}".`;
    case 'AI_ANALYSIS_COMPLETED':
      return `AI Data Analyst inquiry completed for dataset "${resource}".`;
    case 'SQL_QUERY_EXECUTED':
      return `${actorName} executed analytical SQL query on "${resource}" (${event.metadata?.rowCount || 0} rows returned in ${event.metadata?.executionTimeMs || 0}ms).`;
    case 'SQL_QUERY_BLOCKED':
      return `SQL query blocked on "${resource}": ${event.metadata?.reason || 'unauthorized statement or keyword'}.`;
    case 'ANOMALY_ANALYSIS_COMPLETED':
      return `Statistical anomaly scan completed on "${resource}" (${event.metadata?.anomalyCount || 0} anomalies detected).`;
    case 'RCA_COMPLETED':
      return `Root cause analysis executed for target metric "${event.metadata?.targetMetric || resource}".`;
    case 'FORECAST_COMPLETED':
      return `Predictive forecast generated for "${event.metadata?.targetMetric || resource}" (${event.metadata?.horizon || 30} periods forward).`;
    case 'REPORT_CREATED':
      return `${actorName} generated business intelligence report "${resource}".`;
    case 'REPORT_EXPORTED':
      return `${actorName} exported report "${resource}" as ${event.metadata?.format || 'PDF'}.`;
    case 'REPORT_SHARED':
      return `${actorName} generated secure share token for report "${resource}".`;
    case 'ALERT_RULE_CREATED':
      return `${actorName} configured alert monitor rule "${resource}".`;
    case 'ALERT_TRIGGERED':
      return `Automated surveillance triggered alert "${resource}" [${event.metadata?.severity?.toUpperCase() || 'HIGH'}].`;
    case 'ALERT_ACKNOWLEDGED':
      return `${actorName} acknowledged alert incident "${resource}".`;
    case 'ALERT_RESOLVED':
      return `${actorName} resolved alert incident "${resource}".`;
    case 'ALERT_NOTIFICATION_SENT':
      return `Alert notification dispatched via ${event.metadata?.channel || 'email'} to ${event.metadata?.recipient || 'team'}.`;
    case 'AUDIT_LOG_EXPORTED':
      return `${actorName} downloaded audit log compliance export (${event.metadata?.recordCount || 0} records, format: ${event.metadata?.format || 'CSV'}).`;
    case 'UNAUTHORIZED_ACCESS_ATTEMPT':
      return `Security: Unauthorized access attempt detected on "${resource}" by ${actorName}.`;
    default:
      return `${actorName} performed ${event.action.toLowerCase().replace(/_/g, ' ')} on ${resource}.`;
  }
}

/**
 * Converts a list of audit events into CSV format for export
 */
export function formatAuditLogsAsCSV(events: AuditEvent[]): string {
  const headers = [
    'Audit ID',
    'Timestamp (UTC)',
    'Actor ID',
    'Actor Email',
    'Actor Role',
    'Actor Type',
    'Category',
    'Action',
    'Resource Type',
    'Resource ID',
    'Resource Name',
    'Status',
    'Description',
    'Request ID',
    'IP Address',
    'Hash',
  ];

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = events.map((e) => [
    escapeCSV(e.auditId),
    escapeCSV(e.timestamp),
    escapeCSV(e.actorUserId),
    escapeCSV(e.actorEmail || ''),
    escapeCSV(e.actorRole || ''),
    escapeCSV(e.actorType),
    escapeCSV(e.category),
    escapeCSV(e.action),
    escapeCSV(e.resourceType),
    escapeCSV(e.resourceId),
    escapeCSV(e.resourceName || ''),
    escapeCSV(e.status),
    escapeCSV(e.description),
    escapeCSV(e.requestId || ''),
    escapeCSV(e.ipAddress || ''),
    escapeCSV(e.hash || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Returns color classes for audit event status
 */
export function getStatusBadgeClasses(status: AuditEventStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'SUCCESS':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'FAILURE':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'BLOCKED':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  }
}
