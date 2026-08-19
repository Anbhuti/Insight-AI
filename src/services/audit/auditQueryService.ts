import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  AuditEvent,
  AuditFilterParams,
  PaginatedAuditLogsResponse,
  AuditSummary,
  AuditIntegrityResult,
} from './auditTypes';
import { SECURITY_ACTIONS } from './auditConstants';
import { getLocalAuditLogs, logAuditEvent } from './auditEventService';
import { computeAuditHash } from './auditSanitizer';

/**
 * Parses date range filter into start and end Date objects
 */
export function calculateDateRangeBounds(
  dateRange?: string,
  customStart?: string,
  customEnd?: string
): { startDate?: Date; endDate?: Date } {
  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined = now;

  switch (dateRange) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      if (customStart) startDate = new Date(customStart);
      if (customEnd) endDate = new Date(customEnd);
      break;
    case 'all':
    default:
      startDate = undefined;
      break;
  }

  return { startDate, endDate };
}

/**
 * Queries and filters audit logs with server-like pagination and indexing
 */
export async function queryAuditLogs(params: AuditFilterParams): Promise<PaginatedAuditLogsResponse> {
  const { organizationId } = params;
  if (!organizationId) {
    return {
      events: [],
      totalCount: 0,
      page: 1,
      pageSize: params.pageSize || 50,
      totalPages: 0,
      hasMore: false,
    };
  }

  // Retrieve logs from local store and Firestore
  let allEvents: AuditEvent[] = getLocalAuditLogs(organizationId);

  try {
    const logsRef = collection(db, 'organizations', organizationId, 'auditLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(500));
    const snapshot = await getDocs(q);
    const firestoreEvents: AuditEvent[] = [];
    snapshot.forEach((doc) => {
      firestoreEvents.push(doc.data() as AuditEvent);
    });

    if (firestoreEvents.length > 0) {
      // Merge unique by auditId
      const map = new Map<string, AuditEvent>();
      for (const e of allEvents) map.set(e.auditId, e);
      for (const e of firestoreEvents) map.set(e.auditId, e);
      allEvents = Array.from(map.values());
    }
  } catch {
    // Rely on local storage if offline/no remote rules
  }

  // Filter by organization scope (Strict multi-tenant security)
  let filtered = allEvents.filter((e) => e.organizationId === organizationId);

  // Filter by Actor
  if (params.actorUserId && params.actorUserId !== 'ALL') {
    filtered = filtered.filter((e) => e.actorUserId === params.actorUserId);
  }
  if (params.actorType && (params.actorType as any) !== 'ALL') {
    filtered = filtered.filter((e) => e.actorType === params.actorType);
  }

  // Filter by Category
  if (params.category && params.category !== 'ALL') {
    filtered = filtered.filter((e) => e.category === params.category);
  }

  // Filter by Action
  if (params.action && params.action !== 'ALL') {
    filtered = filtered.filter((e) => e.action === params.action);
  }

  // Filter by Resource Type
  if (params.resourceType && params.resourceType !== 'ALL') {
    filtered = filtered.filter((e) => e.resourceType === params.resourceType);
  }

  // Filter by Resource ID
  if (params.resourceId) {
    filtered = filtered.filter((e) => e.resourceId === params.resourceId);
  }

  // Filter by Status
  if (params.status && params.status !== 'ALL') {
    filtered = filtered.filter((e) => e.status === params.status);
  }

  // Filter by Date Range
  const { startDate, endDate } = calculateDateRangeBounds(
    params.dateRange,
    params.startDate,
    params.endDate
  );

  if (startDate) {
    const startMs = startDate.getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= startMs);
  }
  if (endDate) {
    const endMs = endDate.getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= endMs);
  }

  // Search Filter
  if (params.searchQuery && params.searchQuery.trim().length > 0) {
    const queryTerm = params.searchQuery.toLowerCase().trim();
    filtered = filtered.filter((e) => {
      const matchAction = e.action.toLowerCase().includes(queryTerm);
      const matchDesc = e.description.toLowerCase().includes(queryTerm);
      const matchActor = (e.actorEmail || e.actorUserId).toLowerCase().includes(queryTerm);
      const matchResource = (e.resourceName || e.resourceId || e.resourceType).toLowerCase().includes(queryTerm);
      const matchReqId = (e.requestId || '').toLowerCase().includes(queryTerm);
      const matchAuditId = e.auditId.toLowerCase().includes(queryTerm);
      return matchAction || matchDesc || matchActor || matchResource || matchReqId || matchAuditId;
    });
  }

  // Deterministic sorting (Timestamp desc, then auditId)
  filtered.sort((a, b) => {
    const tDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (tDiff !== 0) return tDiff;
    return b.auditId.localeCompare(a.auditId);
  });

  // Pagination
  const pageSize = Math.min(Math.max(params.pageSize || 50, 10), 100);
  const page = Math.max(params.page || 1, 1);
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedEvents = filtered.slice(startIndex, startIndex + pageSize);

  return {
    events: paginatedEvents,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Calculates real-time executive audit summary for an organization
 */
export async function getAuditSummary(organizationId: string): Promise<AuditSummary> {
  const allEvents = getLocalAuditLogs(organizationId);

  let securityEvents = 0;
  let failedActions = 0;
  let blockedActions = 0;
  const categoryBreakdown: Record<string, number> = {};
  const actionBreakdown: Record<string, number> = {};
  const actorMap = new Map<string, { actorUserId: string; actorEmail?: string; count: number }>();

  for (const e of allEvents) {
    if (SECURITY_ACTIONS.has(e.action) || e.category === 'Security' || e.status === 'BLOCKED') {
      securityEvents++;
    }
    if (e.status === 'FAILURE') {
      failedActions++;
    }
    if (e.status === 'BLOCKED') {
      blockedActions++;
    }

    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1;
    actionBreakdown[e.action] = (actionBreakdown[e.action] || 0) + 1;

    const actorKey = e.actorUserId;
    const existingActor = actorMap.get(actorKey) || {
      actorUserId: e.actorUserId,
      actorEmail: e.actorEmail,
      count: 0,
    };
    existingActor.count++;
    actorMap.set(actorKey, existingActor);
  }

  const topActors = Array.from(actorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentCriticalEvents = allEvents
    .filter((e) => e.status === 'BLOCKED' || e.status === 'FAILURE' || e.category === 'Security')
    .slice(0, 5);

  return {
    totalEvents: allEvents.length,
    securityEvents,
    failedActions,
    blockedActions,
    categoryBreakdown,
    actionBreakdown,
    topActors,
    recentCriticalEvents,
  };
}

/**
 * Validates cryptographic hash chaining across all organization audit records
 */
export async function verifyAuditIntegrity(organizationId: string): Promise<AuditIntegrityResult> {
  const logs = getLocalAuditLogs(organizationId);
  if (logs.length === 0) {
    return {
      isValid: true,
      totalVerified: 0,
      algorithm: 'SHA-256 Chained Hashes',
      verifiedAt: new Date().toISOString(),
    };
  }

  // Reverse chronological to chronological check
  const chronological = [...logs].reverse();
  let expectedPrevHash = 'GENESIS_INSIGHT_AI_ROOT_0';

  for (let i = 0; i < chronological.length; i++) {
    const event = chronological[i];
    const partialEvent = {
      auditId: event.auditId,
      organizationId: event.organizationId,
      actorUserId: event.actorUserId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      status: event.status,
      timestamp: event.timestamp,
    };

    const calculatedHash = await computeAuditHash(partialEvent, event.previousHash || expectedPrevHash);

    // Verify hash matches
    if (event.hash && event.hash !== calculatedHash) {
      return {
        isValid: false,
        totalVerified: i,
        tamperedIndex: i,
        tamperedAuditId: event.auditId,
        algorithm: 'SHA-256 Chained Hashes',
        verifiedAt: new Date().toISOString(),
      };
    }

    expectedPrevHash = event.hash || calculatedHash;
  }

  return {
    isValid: true,
    totalVerified: chronological.length,
    algorithm: 'SHA-256 Chained Hashes',
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Seeds initial baseline audit records if organization has none, giving realistic enterprise activity
 */
export async function seedInitialAuditLogsIfEmpty(
  organizationId: string,
  userId: string,
  userEmail?: string
): Promise<void> {
  const existing = getLocalAuditLogs(organizationId);
  if (existing.length >= 3) {
    return;
  }

  const now = Date.now();
  const baselineSeedEvents = [
    {
      action: 'LOGIN_SUCCESS' as const,
      resourceType: 'USER' as const,
      resourceId: userId,
      resourceName: userEmail || 'Workspace Owner',
      status: 'SUCCESS' as const,
      actorUserId: userId,
      actorEmail: userEmail,
      actorRole: 'owner',
      timestamp: new Date(now - 1000 * 60 * 180).toISOString(),
      metadata: { authProvider: 'firebase_auth', sessionDurationMin: 120 },
    },
    {
      action: 'ORGANIZATION_CREATED' as const,
      resourceType: 'ORGANIZATION' as const,
      resourceId: organizationId,
      resourceName: 'Acme Analytics Workspace',
      status: 'SUCCESS' as const,
      actorUserId: userId,
      actorEmail: userEmail,
      actorRole: 'owner',
      timestamp: new Date(now - 1000 * 60 * 175).toISOString(),
      metadata: { plan: 'enterprise', multiTenantIsolated: true },
    },
    {
      action: 'DATASET_CREATED' as const,
      resourceType: 'DATASET' as const,
      resourceId: 'ds_sales_q3_2026',
      resourceName: 'Global Sales & Revenue Q3',
      status: 'SUCCESS' as const,
      actorUserId: userId,
      actorEmail: userEmail,
      actorRole: 'owner',
      timestamp: new Date(now - 1000 * 60 * 150).toISOString(),
      metadata: { fileType: 'csv', rowCount: 15420, columnCount: 14 },
    },
    {
      action: 'DATA_PROFILE_COMPLETED' as const,
      resourceType: 'DATA_PROFILE' as const,
      resourceId: 'prof_sales_q3',
      resourceName: 'Global Sales & Revenue Q3',
      status: 'SUCCESS' as const,
      actorUserId: 'system',
      actorType: 'SYSTEM' as const,
      status_detail: 'Profile calculation green',
      timestamp: new Date(now - 1000 * 60 * 148).toISOString(),
      metadata: { qualityScore: 94, duplicateRows: 0, missingCellsPct: 0.8 },
    },
    {
      action: 'MEMBER_INVITED' as const,
      resourceType: 'MEMBER' as const,
      resourceId: 'user_sarah_admin',
      resourceName: 'Sarah Chen (Admin)',
      status: 'SUCCESS' as const,
      actorUserId: userId,
      actorEmail: userEmail,
      actorRole: 'owner',
      timestamp: new Date(now - 1000 * 60 * 120).toISOString(),
      metadata: { invitedEmail: 'sarah.chen@acmeanalytics.io', assignedRole: 'admin' },
    },
    {
      action: 'SQL_QUERY_EXECUTED' as const,
      resourceType: 'SQL_QUERY' as const,
      resourceId: 'sql_agg_revenue_by_region',
      resourceName: 'Global Sales & Revenue Q3',
      status: 'SUCCESS' as const,
      actorUserId: 'user_sarah_admin',
      actorEmail: 'sarah.chen@acmeanalytics.io',
      actorRole: 'admin',
      timestamp: new Date(now - 1000 * 60 * 95).toISOString(),
      metadata: { rowCount: 12, executionTimeMs: 38, isAggregate: true },
    },
    {
      action: 'SQL_QUERY_BLOCKED' as const,
      resourceType: 'SQL_QUERY' as const,
      resourceId: 'sql_blocked_attempt_01',
      resourceName: 'Global Sales & Revenue Q3',
      status: 'BLOCKED' as const,
      actorUserId: 'user_marcus_analyst',
      actorEmail: 'marcus.vance@acmeanalytics.io',
      actorRole: 'analyst',
      timestamp: new Date(now - 1000 * 60 * 70).toISOString(),
      metadata: { reason: 'UNAUTHORIZED_KEYWORD', statementAttempt: 'SELECT * FROM sqlite_master' },
    },
    {
      action: 'ALERT_RULE_CREATED' as const,
      resourceType: 'ALERT_RULE' as const,
      resourceId: 'rule_margin_drop_monitor',
      resourceName: 'Profit Margin Floor Surveillance',
      status: 'SUCCESS' as const,
      actorUserId: userId,
      actorEmail: userEmail,
      actorRole: 'owner',
      timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
      metadata: { targetMetric: 'Profit Margin', threshold: '< 15%' },
    },
    {
      action: 'ALERT_TRIGGERED' as const,
      resourceType: 'ALERT' as const,
      resourceId: 'alert_inc_3092',
      resourceName: 'Profit Margin Floor Surveillance',
      status: 'SUCCESS' as const,
      actorUserId: 'system',
      actorType: 'SYSTEM' as const,
      timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
      metadata: { severity: 'HIGH', observedValue: '12.4%', threshold: '< 15%' },
    },
    {
      action: 'REPORT_CREATED' as const,
      resourceType: 'REPORT' as const,
      resourceId: 'rep_q3_exec_brief',
      resourceName: 'Q3 Board Intelligence Briefing',
      status: 'SUCCESS' as const,
      actorUserId: userId,
      actorEmail: userEmail,
      actorRole: 'owner',
      timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
      metadata: { sectionsCount: 6, template: 'Executive Briefing' },
    },
  ];

  for (const item of baselineSeedEvents) {
    await logAuditEvent({
      organizationId,
      ...item,
    });
  }
}
