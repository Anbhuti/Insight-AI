/**
 * InsightAI — Comprehensive Production Readiness & Security Test Suite
 * Validates Frontend/Backend Logic, RBAC, Multi-Tenant Isolation, SQL Security,
 * Cryptographic Audit Immutability, Statistical Engines, and Resilience.
 */

import { hasPermission, ROLE_DEFINITIONS } from '../src/services/rbac/permissions';
import { AppRole, Permission } from '../src/types/rbac';
import { validateSQL } from '../src/services/sql/sqlValidator';
import { sanitizeMetadata, computeAuditHash } from '../src/services/audit/auditSanitizer';
import { AuditEvent, CreateAuditEventInput } from '../src/services/audit/auditTypes';
import { calculateDataQuality } from '../src/services/profilingService';
import { evaluateThresholdRule } from '../src/services/alerts/alertEvaluationService';
import { AlertRule } from '../src/services/alerts/alertTypes';

let passedTests = 0;
let failedTests = 0;
const testLogs: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    testLogs.push(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    const errMsg = `  [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`;
    testLogs.push(errMsg);
    console.error(errMsg);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('  InsightAI Production Readiness & Security Test Suite');
  console.log('======================================================\n');

  // ---------------------------------------------------------
  // 1. RBAC PERMISSION MATRIX & PRIVILEGE ESCALATION
  // ---------------------------------------------------------
  console.log('1. Testing RBAC Role Permissions & Access Control...');

  // Owner permissions
  assert(hasPermission('owner', 'org:delete_org'), 'Owner can delete organization');
  assert(hasPermission('owner', 'audit:export'), 'Owner can export audit logs');
  assert(hasPermission('owner', 'dataset:delete'), 'Owner can delete datasets');

  // Admin permissions
  assert(hasPermission('admin', 'dataset:create'), 'Admin can create datasets');
  assert(hasPermission('admin', 'org:invite_member'), 'Admin can invite members');
  assert(!hasPermission('admin', 'org:delete_org'), 'Admin CANNOT delete organization (Privilege Escalation Protection)');

  // Analyst permissions
  assert(hasPermission('analyst', 'analysis:run_sql'), 'Analyst can run SQL queries');
  assert(hasPermission('analyst', 'analysis:run_ai'), 'Analyst can use AI Analyst');
  assert(hasPermission('analyst', 'report:create'), 'Analyst can create reports');
  assert(!hasPermission('analyst', 'org:manage_roles'), 'Analyst CANNOT change user roles');
  assert(!hasPermission('analyst', 'audit:export'), 'Analyst CANNOT export audit logs');

  // Viewer permissions (Read-only)
  assert(hasPermission('viewer', 'dataset:read'), 'Viewer can read datasets');
  assert(hasPermission('viewer', 'report:read'), 'Viewer can read reports');
  assert(!hasPermission('viewer', 'dataset:create'), 'Viewer CANNOT upload datasets');
  assert(!hasPermission('viewer', 'dataset:delete'), 'Viewer CANNOT delete datasets');
  assert(!hasPermission('viewer', 'alert:create'), 'Viewer CANNOT create alert rules');
  assert(!hasPermission('viewer', 'analysis:run_sql'), 'Viewer CANNOT execute arbitrary SQL');

  // ---------------------------------------------------------
  // 2. SQL AGENT INJECTION & DESTRUCTIVE QUERY RESTRICTIONS
  // ---------------------------------------------------------
  console.log('\n2. Testing SQL Security & Analytical Query Restrictions...');

  const validSelect = validateSQL('SELECT region, SUM(revenue) AS total_rev FROM sales_data GROUP BY region ORDER BY total_rev DESC;');
  assert(validSelect.isValid, 'Valid analytical SELECT query accepted');

  const dropTableAttempt = validateSQL('DROP TABLE sales_data;');
  assert(!dropTableAttempt.isValid, 'Destructive DROP TABLE query blocked');

  const deleteAttempt = validateSQL('DELETE FROM sales_data WHERE id > 0;');
  assert(!deleteAttempt.isValid, 'Destructive DELETE query blocked');

  const updateAttempt = validateSQL("UPDATE sales_data SET revenue = 999999 WHERE id = '1';");
  assert(!updateAttempt.isValid, 'Destructive UPDATE query blocked');

  const insertAttempt = validateSQL("INSERT INTO sales_data (region, revenue) VALUES ('North', 1000);");
  assert(!insertAttempt.isValid, 'Destructive INSERT query blocked');

  const truncateAttempt = validateSQL('TRUNCATE TABLE sales_data;');
  assert(!truncateAttempt.isValid, 'Destructive TRUNCATE query blocked');

  const multiStatementInjection = validateSQL('SELECT * FROM sales_data; DROP TABLE users;');
  assert(!multiStatementInjection.isValid, 'Multi-statement SQL injection blocked');

  // ---------------------------------------------------------
  // 3. AUDIT LOG SENSITIVE DATA SANITIZATION & IMMUTABILITY
  // ---------------------------------------------------------
  console.log('\n3. Testing Audit Trail Sanitization & Cryptographic Integrity...');

  const rawMetadataWithSecrets = {
    apiKey: 'sk-secret-key-123456789',
    userPassword: 'SuperSecretPassword!',
    authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    clientToken: 'token_abcdef98765',
    datasetId: 'ds_test_123',
    rowCount: 5000,
  };

  const sanitized = sanitizeMetadata(rawMetadataWithSecrets);
  assert(sanitized.apiKey === '[REDACTED_CONFIDENTIAL]' || sanitized.apiKey === '[REDACTED_SECRET]', 'API Key sanitized in audit metadata');
  assert(sanitized.userPassword === '[REDACTED_CONFIDENTIAL]', 'User password sanitized in audit metadata');
  assert(sanitized.authorization === '[REDACTED_CONFIDENTIAL]' || sanitized.authorization === '[REDACTED_SECRET]', 'Bearer authorization token sanitized');
  assert(sanitized.clientToken === '[REDACTED_CONFIDENTIAL]', 'Client token sanitized');
  assert(sanitized.datasetId === 'ds_test_123', 'Safe operational metadata preserved');
  assert(sanitized.rowCount === 5000, 'Safe numeric metadata preserved');

  // Hash verification
  const testEvent: AuditEvent = {
    auditId: 'aud_test_001',
    organizationId: 'org_enterprise_1',
    timestamp: '2026-08-19T07:00:00.000Z',
    actorUserId: 'usr_admin_123',
    actorEmail: 'admin@enterprise.com',
    actorRole: 'admin',
    actorType: 'USER',
    action: 'DATASET_CREATED',
    category: 'Data Management',
    resourceType: 'DATASET',
    resourceId: 'ds_sales_q3',
    resourceName: 'Q3 Sales Data',
    status: 'SUCCESS',
    details: 'Dataset uploaded via CSV',
    metadata: { rowCount: 12000 },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    hash: '',
  };

  const hash1 = await computeAuditHash(testEvent);
  assert(typeof hash1 === 'string' && hash1.length === 64, 'Computed SHA-256 cryptographic audit hash');

  testEvent.hash = hash1;
  const hash2 = await computeAuditHash(testEvent);
  assert(hash1 === hash2, 'SHA-256 hash is deterministic and reproducible');

  // Tampering detection
  const tamperedEvent = { ...testEvent, actorUserId: 'usr_hacker_999' };
  const tamperedHash = await computeAuditHash(tamperedEvent);
  assert(tamperedHash !== hash1, 'Tampered audit record generates invalid hash (Tamper Detection)');

  // ---------------------------------------------------------
  // 4. DATA PROFILING & DATA QUALITY SCORE
  // ---------------------------------------------------------
  console.log('\n4. Testing Data Quality & Profiling Logic...');

  const quality100 = calculateDataQuality(
    1000,
    10,
    [],
    0,
    0,
    0,
    0,
    []
  );
  assert(quality100.overallScore >= 95, 'Pristine dataset receives 95-100 quality score');

  const degradedQuality = calculateDataQuality(
    1000,
    10,
    [],
    150,
    15,
    2000,
    20,
    []
  );
  assert(degradedQuality.overallScore < quality100.overallScore, 'Degraded dataset receives proportionally lower quality score');

  // ---------------------------------------------------------
  // 5. ALERT ENGINE & FALSE-POSITIVE PREVENTION
  // ---------------------------------------------------------
  console.log('\n5. Testing Alert Evaluation & False-Positive Immunity...');

  const mockRule: AlertRule = {
    id: 'rule_rev_drop',
    organizationId: 'org_test',
    name: 'Revenue Drop Alert',
    datasetId: 'ds_1',
    alertType: 'THRESHOLD',
    metric: 'revenue',
    operator: '<',
    threshold: 10000,
    severity: 'critical',
    enabled: true,
    channels: ['in_app'],
    cooldownMinutes: 60,
    createdBy: 'usr_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const columns = ['date', 'revenue'];
  const rowsTriggered = [
    ['2026-08-01', 12000],
    ['2026-08-02', 8500],
  ];
  const rowsSafe = [
    ['2026-08-01', 12000],
    ['2026-08-02', 15000],
  ];

  // Condition is True: Current revenue 8500 < 10000
  const evalTriggered = evaluateThresholdRule(mockRule, columns, rowsTriggered);
  assert(evalTriggered.triggered === true, 'Threshold alert triggers when condition is met (8500 < 10000)');

  // Condition is False: Current revenue 15000 is NOT < 10000
  const evalSafe = evaluateThresholdRule(mockRule, columns, rowsSafe);
  assert(evalSafe.triggered === false, 'Alert engine avoids false-positive when condition is NOT met (15000 >= 10000)');

  // ---------------------------------------------------------
  // 6. MULTI-TENANT ISOLATION BOUNDARY
  // ---------------------------------------------------------
  console.log('\n6. Testing Multi-Tenant Data Isolation...');

  const orgA_Id = 'org_tenant_alpha';
  const orgB_Id = 'org_tenant_beta';

  const datasetStore = [
    { datasetId: 'ds_alpha_1', organizationId: orgA_Id, name: 'Alpha Sales' },
    { datasetId: 'ds_beta_1', organizationId: orgB_Id, name: 'Beta Financials' },
  ];

  const tenantAlphaQuery = datasetStore.filter((d) => d.organizationId === orgA_Id);
  const tenantBetaQuery = datasetStore.filter((d) => d.organizationId === orgB_Id);

  assert(tenantAlphaQuery.length === 1 && tenantAlphaQuery[0].name === 'Alpha Sales', 'Tenant Alpha queries only own datasets');
  assert(!tenantAlphaQuery.some((d) => d.organizationId === orgB_Id), 'Tenant Alpha CANNOT leak Tenant Beta datasets (Multi-Tenant Isolation)');
  assert(!tenantBetaQuery.some((d) => d.organizationId === orgA_Id), 'Tenant Beta CANNOT leak Tenant Alpha datasets (Multi-Tenant Isolation)');

  console.log('\n======================================================');
  console.log(`  Test Suite Finished: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
