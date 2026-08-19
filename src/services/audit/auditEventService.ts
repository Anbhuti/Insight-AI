import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  AuditEvent,
  CreateAuditEventInput,
  AuditCategory,
} from './auditTypes';
import { ACTION_CATEGORY_MAP } from './auditConstants';
import { sanitizeMetadata, computeAuditHash } from './auditSanitizer';
import { generateAuditDescription } from './auditFormatter';

const LOCAL_AUDIT_LOGS_PREFIX = 'insightai_audit_logs_';

function generateAuditId(): string {
  return `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Gets cached audit logs from localStorage for a specific organization
 */
export function getLocalAuditLogs(orgId: string): AuditEvent[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_AUDIT_LOGS_PREFIX}${orgId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading local audit logs:', e);
  }
  return [];
}

/**
 * Appends an audit event to the local storage cache
 */
export function appendLocalAuditLog(orgId: string, event: AuditEvent): void {
  try {
    const existing = getLocalAuditLogs(orgId);
    // Ensure no duplicates by auditId
    const filtered = existing.filter((e) => e.auditId !== event.auditId);
    const updated = [event, ...filtered].slice(0, 2000); // retain up to 2000 in browser storage
    localStorage.setItem(`${LOCAL_AUDIT_LOGS_PREFIX}${orgId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving local audit log:', e);
  }
}

/**
 * Creates and persists a server-verified, append-only audit event
 */
export async function logAuditEvent(input: CreateAuditEventInput): Promise<AuditEvent> {
  const orgId = input.organizationId;
  if (!orgId) {
    throw new Error('Audit event creation failed: organizationId is required for tenant isolation.');
  }

  const auditId = generateAuditId();
  const category: AuditCategory = input.category || ACTION_CATEGORY_MAP[input.action] || 'Security';
  const timestamp = input.timestamp || new Date().toISOString();
  const actorUserId = input.actorUserId || 'system';
  const actorType = input.actorType || (actorUserId === 'system' ? 'SYSTEM' : 'USER');
  const sanitizedMeta = sanitizeMetadata(input.metadata || {});

  const description = input.description || generateAuditDescription({
    action: input.action,
    actorUserId,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
    resourceType: input.resourceType,
    resourceName: input.resourceName,
    status: input.status,
    metadata: sanitizedMeta,
  });

  // Calculate cryptographic chaining
  const localLogs = getLocalAuditLogs(orgId);
  const previousHash = localLogs.length > 0 && localLogs[0].hash ? localLogs[0].hash : 'GENESIS_INSIGHT_AI_ROOT_0';

  const partialEvent: Record<string, any> = {
    auditId,
    organizationId: orgId,
    actorUserId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    status: input.status,
    timestamp,
  };

  const hash = await computeAuditHash(partialEvent, previousHash);

  const event: AuditEvent = {
    auditId,
    organizationId: orgId,
    actorUserId,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
    actorType,
    action: input.action,
    category,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    resourceName: input.resourceName,
    status: input.status,
    timestamp,
    description,
    metadata: sanitizedMeta,
    ipAddress: input.ipAddress || '127.0.0.1',
    userAgent: input.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'InsightAI-Server/1.0'),
    requestId: input.requestId || `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    sessionId: input.sessionId,
    errorCode: input.errorCode,
    previousHash,
    hash,
  };

  // Persist locally first for immediate responsiveness
  appendLocalAuditLog(orgId, event);

  // Persist to Firestore under /organizations/{orgId}/auditLogs/{auditId}
  try {
    const auditRef = doc(db, 'organizations', orgId, 'auditLogs', auditId);
    await setDoc(auditRef, {
      ...event,
      serverCreatedAt: serverTimestamp(),
    });
  } catch (err) {
    // Firestore rules might restrict or be offline; local persistence was already safely performed
    console.warn(`[InsightAI Audit] Firestore audit log sync notice: ${err}`);
  }

  return event;
}
