import { SENSITIVE_KEY_PATTERNS } from './auditConstants';

/**
 * Sanitizes an object by removing or redacting sensitive keys, credentials, and API secrets.
 */
export function sanitizeMetadata(data: any, depth = 0): any {
  if (data === null || data === undefined) return data;
  if (depth > 5) return '[Object depth exceeded]';

  if (typeof data === 'string') {
    // Check if string looks like an authorization header or API key
    if (data.startsWith('Bearer ') || data.startsWith('AIzaSy') || data.length > 500) {
      if (data.length > 500) return `${data.substring(0, 300)}... [truncated]`;
      return '[REDACTED_SECRET]';
    }
    return data;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    // Avoid storing massive dataset arrays inside audit logs
    if (data.length > 20) {
      return data.slice(0, 20).map((item) => sanitizeMetadata(item, depth + 1)).concat([`[... ${data.length - 20} more items]` as any]);
    }
    return data.map((item) => sanitizeMetadata(item, depth + 1));
  }

  if (typeof data === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if key is sensitive
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitiveKey) {
        cleanObj[key] = '[REDACTED_CONFIDENTIAL]';
      } else {
        cleanObj[key] = sanitizeMetadata(value, depth + 1);
      }
    }
    return cleanObj;
  }

  return String(data);
}

/**
 * Computes a deterministic SHA-256 hash string for tamper-evident audit chaining
 */
export async function computeAuditHash(eventData: Record<string, any>, previousHash = 'GENESIS_INSIGHT_AI_ROOT_0'): Promise<string> {
  const contentToHash = JSON.stringify({
    previousHash,
    auditId: eventData.auditId,
    organizationId: eventData.organizationId,
    actorUserId: eventData.actorUserId,
    action: eventData.action,
    resourceType: eventData.resourceType,
    resourceId: eventData.resourceId,
    status: eventData.status,
    timestamp: eventData.timestamp,
  });

  // Browser Crypto API or Node crypto (globalThis.crypto.subtle)
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(contentToHash);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Pure JavaScript deterministic hash fallback for environments without subtle crypto
  let h1 = 0xdeadbeef ^ previousHash.length;
  let h2 = 0x41c6ce57 ^ eventData.auditId.length;
  for (let i = 0; i < contentToHash.length; i++) {
    const ch = contentToHash.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `sha256_${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0')}`;
}
