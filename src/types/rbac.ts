export type AppRole = 'owner' | 'admin' | 'analyst' | 'viewer';

export type Permission =
  // Dataset permissions
  | 'dataset:create'
  | 'dataset:read'
  | 'dataset:update'
  | 'dataset:delete'
  | 'dataset:export'
  | 'dataset:profile'
  // Analysis & AI permissions
  | 'analysis:run_ai'
  | 'analysis:run_sql'
  | 'analysis:explain_anomaly'
  | 'analysis:explain_rca'
  | 'analysis:explain_forecast'
  // Report permissions
  | 'report:create'
  | 'report:read'
  | 'report:update'
  | 'report:delete'
  | 'report:export'
  | 'report:share'
  // Alert permissions
  | 'alert:create'
  | 'alert:read'
  | 'alert:update'
  | 'alert:delete'
  | 'alert:trigger_manual'
  | 'alert:notify_email'
  // Organization / Workspace management
  | 'org:manage_members'
  | 'org:manage_roles'
  | 'org:invite_member'
  | 'org:remove_member'
  | 'org:update_settings'
  | 'org:delete_org'
  // Audit log permissions
  | 'audit:view'
  | 'audit:search'
  | 'audit:export';

export interface RoleDefinition {
  role: AppRole;
  title: string;
  badgeLabel: string;
  description: string;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
  permissions: Permission[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  datasetCount?: number;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  displayName: string;
  photoURL?: string | null;
  role: AppRole;
  joinedAt: string;
  invitedBy?: string;
}

export interface InviteMemberInput {
  email: string;
  role: AppRole;
  displayName?: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  role: AppRole;
  requiredPermission: Permission;
  reason?: string;
}

export interface RoleMatrixCategory {
  categoryName: string;
  items: {
    permission: Permission;
    label: string;
    description: string;
    rolesAllowed: AppRole[];
  }[];
}
