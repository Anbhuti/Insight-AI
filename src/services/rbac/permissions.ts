import { AppRole, Permission, RoleDefinition, RoleMatrixCategory } from '../../types/rbac';

export const ROLE_PERMISSIONS: Record<AppRole, Set<Permission>> = {
  owner: new Set<Permission>([
    'dataset:create',
    'dataset:read',
    'dataset:update',
    'dataset:delete',
    'dataset:export',
    'dataset:profile',
    'analysis:run_ai',
    'analysis:run_sql',
    'analysis:explain_anomaly',
    'analysis:explain_rca',
    'analysis:explain_forecast',
    'report:create',
    'report:read',
    'report:update',
    'report:delete',
    'report:export',
    'report:share',
    'alert:create',
    'alert:read',
    'alert:update',
    'alert:delete',
    'alert:trigger_manual',
    'alert:notify_email',
    'org:manage_members',
    'org:manage_roles',
    'org:invite_member',
    'org:remove_member',
    'org:update_settings',
    'org:delete_org',
    'audit:view',
    'audit:search',
    'audit:export',
  ]),

  admin: new Set<Permission>([
    'dataset:create',
    'dataset:read',
    'dataset:update',
    'dataset:delete',
    'dataset:export',
    'dataset:profile',
    'analysis:run_ai',
    'analysis:run_sql',
    'analysis:explain_anomaly',
    'analysis:explain_rca',
    'analysis:explain_forecast',
    'report:create',
    'report:read',
    'report:update',
    'report:delete',
    'report:export',
    'report:share',
    'alert:create',
    'alert:read',
    'alert:update',
    'alert:delete',
    'alert:trigger_manual',
    'alert:notify_email',
    'org:manage_members',
    'org:manage_roles',
    'org:invite_member',
    'org:remove_member',
    'org:update_settings',
    'audit:view',
    'audit:search',
    'audit:export',
  ]),

  analyst: new Set<Permission>([
    'dataset:create',
    'dataset:read',
    'dataset:update',
    'dataset:export',
    'dataset:profile',
    'analysis:run_ai',
    'analysis:run_sql',
    'analysis:explain_anomaly',
    'analysis:explain_rca',
    'analysis:explain_forecast',
    'report:create',
    'report:read',
    'report:update',
    'report:export',
    'report:share',
    'alert:create',
    'alert:read',
    'alert:update',
    'alert:trigger_manual',
    'alert:notify_email',
    'audit:view',
    'audit:search',
  ]),

  viewer: new Set<Permission>([
    'dataset:read',
    'dataset:export',
    'report:read',
    'report:export',
    'alert:read',
    'audit:view',
  ]),
};

export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  owner: {
    role: 'owner',
    title: 'Workspace Owner',
    badgeLabel: 'Owner',
    description: 'Ultimate organization authority with full workspace management, billing, member administration, and resource ownership.',
    colorScheme: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      badge: 'bg-purple-600 text-white',
    },
    permissions: Array.from(ROLE_PERMISSIONS.owner),
  },
  admin: {
    role: 'admin',
    title: 'Organization Admin',
    badgeLabel: 'Admin',
    description: 'Full administrative access to manage team members, invite analysts, configure datasets, and orchestrate monitoring.',
    colorScheme: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      badge: 'bg-indigo-600 text-white',
    },
    permissions: Array.from(ROLE_PERMISSIONS.admin),
  },
  analyst: {
    role: 'analyst',
    title: 'Data Analyst',
    badgeLabel: 'Analyst',
    description: 'Core analytical role with permissions to upload data, execute SQL queries, engage AI analysts, build reports, and configure alert monitors.',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badge: 'bg-emerald-600 text-white',
    },
    permissions: Array.from(ROLE_PERMISSIONS.analyst),
  },
  viewer: {
    role: 'viewer',
    title: 'Read-Only Viewer',
    badgeLabel: 'Viewer',
    description: 'Stakeholder access to view interactive dashboards, read-only datasets, executive reports, and active anomaly alerts without editing privileges.',
    colorScheme: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      badge: 'bg-slate-600 text-white',
    },
    permissions: Array.from(ROLE_PERMISSIONS.viewer),
  },
};

/**
 * Checks if a given role possesses a specific permission
 */
export function hasPermission(role: AppRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const roleSet = ROLE_PERMISSIONS[role];
  if (!roleSet) return false;
  return roleSet.has(permission);
}

/**
 * Validates whether the acting user can alter or delete a target member's role
 */
export function canManageMemberRole(actorRole: AppRole, targetRole: AppRole): boolean {
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin') {
    // Admin cannot modify Owner or another Admin
    return targetRole === 'analyst' || targetRole === 'viewer';
  }
  return false;
}

/**
 * Returns available assignable roles for a given manager
 */
export function getAssignableRoles(actorRole: AppRole): AppRole[] {
  if (actorRole === 'owner') {
    return ['admin', 'analyst', 'viewer'];
  }
  if (actorRole === 'admin') {
    return ['analyst', 'viewer'];
  }
  return [];
}

/**
 * Comprehensive Matrix Category Breakdown for Visual Presentation
 */
export const ROLE_PERMISSION_MATRIX: RoleMatrixCategory[] = [
  {
    categoryName: 'Datasets & Ingestion',
    items: [
      {
        permission: 'dataset:create',
        label: 'Upload & Connect Datasets',
        description: 'Upload CSV/Excel files and connect data sources',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'dataset:read',
        label: 'View Datasets & Summaries',
        description: 'Read dataset metadata, preview records, and view metrics',
        rolesAllowed: ['owner', 'admin', 'analyst', 'viewer'],
      },
      {
        permission: 'dataset:profile',
        label: 'Run Data Profiling & Quality Audit',
        description: 'Compute automated statistical profiles and data hygiene score',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'dataset:update',
        label: 'Edit & Rename Datasets',
        description: 'Update dataset names, column aliases, and metadata',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'dataset:delete',
        label: 'Delete Datasets',
        description: 'Permanently remove datasets and underlying cloud storage files',
        rolesAllowed: ['owner', 'admin'],
      },
      {
        permission: 'dataset:export',
        label: 'Export Clean Data',
        description: 'Download CSV / Excel datasets to local workstation',
        rolesAllowed: ['owner', 'admin', 'analyst', 'viewer'],
      },
    ],
  },
  {
    categoryName: 'AI Analyst & SQL Execution',
    items: [
      {
        permission: 'analysis:run_ai',
        label: 'AI Natural Language Analyst',
        description: 'Prompt AI agent with diagnostic questions and conversational queries',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'analysis:run_sql',
        label: 'SQL Workspace Execution',
        description: 'Execute analytical SQL queries in analytical engine with auto-repair',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'analysis:explain_anomaly',
        label: 'Anomaly Intelligence Explanations',
        description: 'Generate quantitative business risk analysis on detected outliers',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'analysis:explain_rca',
        label: 'Root Cause Attribution Synthesis',
        description: 'Execute multivariate driver attribution and hypothesis formulation',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'analysis:explain_forecast',
        label: 'Predictive Horizon Simulation',
        description: 'Generate machine learning time-series forecasts and scenario bounds',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
    ],
  },
  {
    categoryName: 'Reports & Intelligence Briefs',
    items: [
      {
        permission: 'report:create',
        label: 'Generate Board-Ready Reports',
        description: 'Synthesize verified metrics into executive PDF/HTML report dossiers',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'report:read',
        label: 'Read & Review Reports',
        description: 'Access generated intelligence briefings and visual summaries',
        rolesAllowed: ['owner', 'admin', 'analyst', 'viewer'],
      },
      {
        permission: 'report:update',
        label: 'Customize & Edit Reports',
        description: 'Edit report sections, titles, and strategic recommendations',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'report:export',
        label: 'Export Reports (PDF / Print / JSON)',
        description: 'Download executive reports for offline stakeholders',
        rolesAllowed: ['owner', 'admin', 'analyst', 'viewer'],
      },
      {
        permission: 'report:share',
        label: 'Create Secure Share Links',
        description: 'Generate time-bound tokenized links for team review',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'report:delete',
        label: 'Delete Reports',
        description: 'Remove report dossiers and historical briefings',
        rolesAllowed: ['owner', 'admin'],
      },
    ],
  },
  {
    categoryName: 'Monitoring & Real-Time Alerts',
    items: [
      {
        permission: 'alert:create',
        label: 'Create Monitoring Rules',
        description: 'Set up statistical threshold triggers and anomaly surveillance rules',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'alert:read',
        label: 'View Alerts & Notification Center',
        description: 'Inspect triggered incident alerts and surveillance feeds',
        rolesAllowed: ['owner', 'admin', 'analyst', 'viewer'],
      },
      {
        permission: 'alert:update',
        label: 'Acknowledge & Edit Alerts',
        description: 'Mark alerts resolved, snooze triggers, or modify thresholds',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'alert:delete',
        label: 'Delete Alert Rules',
        description: 'Permanently remove alert monitoring configurations',
        rolesAllowed: ['owner', 'admin'],
      },
      {
        permission: 'alert:trigger_manual',
        label: 'Manual Evaluation Run',
        description: 'Trigger immediate sweep across active datasets',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'alert:notify_email',
        label: 'Email Alert Notifications',
        description: 'Dispatch executive alert summaries via backend email service',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
    ],
  },
  {
    categoryName: 'Organization & Workspace Administration',
    items: [
      {
        permission: 'org:invite_member',
        label: 'Invite Team Members',
        description: 'Add new users to workspace with assigned roles',
        rolesAllowed: ['owner', 'admin'],
      },
      {
        permission: 'org:manage_roles',
        label: 'Modify Member Roles',
        description: 'Promote or demote members (Owner / Admin / Analyst / Viewer)',
        rolesAllowed: ['owner', 'admin'],
      },
      {
        permission: 'org:remove_member',
        label: 'Remove Team Members',
        description: 'Revoke organization access from a member',
        rolesAllowed: ['owner', 'admin'],
      },
      {
        permission: 'org:update_settings',
        label: 'Manage Organization Settings',
        description: 'Update company name, workspace preferences, and branding',
        rolesAllowed: ['owner', 'admin'],
      },
      {
        permission: 'org:delete_org',
        label: 'Delete Organization',
        description: 'Permanently dissolve the organization workspace',
        rolesAllowed: ['owner'],
      },
      {
        permission: 'audit:view',
        label: 'View Security Audit Logs',
        description: 'Inspect compliance logs and user activity history',
        rolesAllowed: ['owner', 'admin', 'analyst', 'viewer'],
      },
      {
        permission: 'audit:search',
        label: 'Search & Filter Audit Logs',
        description: 'Perform granular queries across actors, actions, resources, and dates',
        rolesAllowed: ['owner', 'admin', 'analyst'],
      },
      {
        permission: 'audit:export',
        label: 'Export Compliance Logs',
        description: 'Download tamper-evident CSV and JSON audit archives',
        rolesAllowed: ['owner', 'admin'],
      },
    ],
  },
];
