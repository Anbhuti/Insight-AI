import {
  AuditEvent,
  CreateAuditEventInput,
  AuditFilterParams,
  PaginatedAuditLogsResponse,
  AuditSummary,
  AuditIntegrityResult,
} from './auditTypes';
import { logAuditEvent, getLocalAuditLogs } from './auditEventService';
import {
  queryAuditLogs,
  getAuditSummary,
  verifyAuditIntegrity,
  seedInitialAuditLogsIfEmpty,
} from './auditQueryService';
import { formatAuditLogsAsCSV } from './auditFormatter';

/**
 * Enterprise Audit Service for InsightAI
 */
export const AuditService = {
  /**
   * Logs a verified, append-only audit event
   */
  logEvent: async (input: CreateAuditEventInput): Promise<AuditEvent> => {
    return logAuditEvent(input);
  },

  /**
   * Retrieves paginated audit logs with multi-tenant filtering
   */
  getAuditLogs: async (params: AuditFilterParams): Promise<PaginatedAuditLogsResponse> => {
    return queryAuditLogs(params);
  },

  /**
   * Retrieves a single audit log event by its ID with strict organization boundary check
   */
  getAuditLog: async (organizationId: string, auditId: string): Promise<AuditEvent | null> => {
    const logs = getLocalAuditLogs(organizationId);
    const found = logs.find((l) => l.organizationId === organizationId && l.auditId === auditId);
    return found || null;
  },

  /**
   * Retrieves high-level analytics summary of audit and security events
   */
  getAuditSummary: async (organizationId: string): Promise<AuditSummary> => {
    return getAuditSummary(organizationId);
  },

  /**
   * Searches audit logs by query text and filters
   */
  searchAuditLogs: async (
    organizationId: string,
    searchQuery: string,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedAuditLogsResponse> => {
    return queryAuditLogs({
      organizationId,
      searchQuery,
      page,
      pageSize,
    });
  },

  /**
   * Filters audit logs by custom constraints
   */
  filterAuditLogs: async (params: AuditFilterParams): Promise<PaginatedAuditLogsResponse> => {
    return queryAuditLogs(params);
  },

  /**
   * Exports organization audit logs in CSV or JSON format with tamper-evident formatting
   * and automatically logs the export event without recursion.
   */
  exportAuditLogs: async (
    organizationId: string,
    format: 'csv' | 'json',
    actorUserId: string,
    actorEmail?: string,
    filters?: Partial<AuditFilterParams>
  ): Promise<{ content: string; filename: string; mimeType: string; recordCount: number }> => {
    // 1. Query matching records
    const res = await queryAuditLogs({
      organizationId,
      ...filters,
      page: 1,
      pageSize: 1000, // Export up to 1000 records
    });

    const records = res.events;
    const nowStr = new Date().toISOString().replace(/[:.]/g, '-');
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'csv') {
      content = formatAuditLogsAsCSV(records);
      filename = `insightai_audit_export_${organizationId}_${nowStr}.csv`;
      mimeType = 'text/csv;charset=utf-8;';
    } else {
      content = JSON.stringify(
        {
          exportMetadata: {
            organizationId,
            exportedAt: new Date().toISOString(),
            exportedBy: actorEmail || actorUserId,
            recordCount: records.length,
            algorithm: 'SHA-256 Chained Integrity',
          },
          auditRecords: records,
        },
        null,
        2
      );
      filename = `insightai_audit_export_${organizationId}_${nowStr}.json`;
      mimeType = 'application/json;charset=utf-8;';
    }

    // 2. Safely log the export event (without causing recursive export loops)
    try {
      await logAuditEvent({
        organizationId,
        actorUserId,
        actorEmail,
        action: 'AUDIT_LOG_EXPORTED',
        resourceType: 'EXPORT',
        resourceId: filename,
        resourceName: `Audit Export (${format.toUpperCase()})`,
        status: 'SUCCESS',
        metadata: {
          format,
          recordCount: records.length,
          filtersApplied: Boolean(filters && Object.keys(filters).length > 0),
        },
      });
    } catch (e) {
      console.warn('Could not log export event:', e);
    }

    return {
      content,
      filename,
      mimeType,
      recordCount: records.length,
    };
  },

  /**
   * Cryptographically verifies the audit log chain for tampering
   */
  verifyAuditIntegrity: async (organizationId: string): Promise<AuditIntegrityResult> => {
    return verifyAuditIntegrity(organizationId);
  },

  /**
   * Seeds realistic baseline activity if the organization is newly created
   */
  seedInitialAuditLogsIfEmpty: async (
    organizationId: string,
    userId: string,
    userEmail?: string
  ): Promise<void> => {
    return seedInitialAuditLogsIfEmpty(organizationId, userId, userEmail);
  },
};

export default AuditService;
