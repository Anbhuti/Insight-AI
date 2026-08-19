import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  AppRole,
  Organization,
  OrganizationMember,
  Permission,
  InviteMemberInput,
} from '../types/rbac';
import {
  ensureDefaultOrganization,
  getUserOrganizations,
  createOrganization as createOrgService,
  getOrganizationMembers,
  inviteMember as inviteMemberService,
  updateMemberRole as updateMemberRoleService,
  removeMember as removeMemberService,
  getSavedActiveOrganizationId,
  saveActiveOrganizationId,
} from '../services/rbac/rbacService';
import { hasPermission as checkPermission, ROLE_DEFINITIONS } from '../services/rbac/permissions';

interface WorkspaceContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  currentRole: AppRole;
  effectiveRole: AppRole;
  simulationRole: AppRole | null;
  members: OrganizationMember[];
  isLoading: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
  createOrganization: (name: string, plan?: 'free' | 'starter' | 'pro' | 'enterprise') => Promise<Organization>;
  inviteMember: (input: InviteMemberInput) => Promise<OrganizationMember>;
  updateMemberRole: (targetUserId: string, newRole: AppRole) => Promise<void>;
  removeMember: (targetUserId: string) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  setSimulationRole: (role: AppRole | null) => void;
  refreshMembers: () => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentRole, setCurrentRole] = useState<AppRole>('owner');
  const [simulationRole, setSimulationRole] = useState<AppRole | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Effective role is simulationRole if active, else currentRole
  const effectiveRole = simulationRole || currentRole;

  // Initialize workspace & organizations for user
  const initWorkspace = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setCurrentRole('owner');
      setMembers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { organization, member } = await ensureDefaultOrganization(
        user.uid,
        user.email,
        userProfile?.displayName || user.displayName
      );

      const allOrgs = await getUserOrganizations(user.uid);
      setOrganizations(allOrgs.length > 0 ? allOrgs : [organization]);

      // Check saved active org or default to first
      const savedOrgId = getSavedActiveOrganizationId(user.uid);
      const active = allOrgs.find((o) => o.id === savedOrgId) || organization;
      setCurrentOrganization(active);
      setCurrentRole(member.role || (active.ownerId === user.uid ? 'owner' : 'analyst'));

      // Load members for active org
      const orgMembers = await getOrganizationMembers(active.id);
      setMembers(orgMembers);
    } catch (err) {
      console.error('Failed to initialize workspace:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile]);

  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  const switchOrganization = async (orgId: string) => {
    if (!user) return;
    const target = organizations.find((o) => o.id === orgId);
    if (!target) return;

    setCurrentOrganization(target);
    saveActiveOrganizationId(user.uid, orgId);

    const orgMembers = await getOrganizationMembers(target.id);
    setMembers(orgMembers);

    const userMember = orgMembers.find((m) => m.userId === user.uid);
    setCurrentRole(userMember?.role || (target.ownerId === user.uid ? 'owner' : 'analyst'));
  };

  const createOrganization = async (
    name: string,
    plan: 'free' | 'starter' | 'pro' | 'enterprise' = 'pro'
  ): Promise<Organization> => {
    if (!user) throw new Error('User must be authenticated to create an organization.');

    const newOrg = await createOrgService(user.uid, name, plan);
    setOrganizations((prev) => [newOrg, ...prev]);
    setCurrentOrganization(newOrg);
    setCurrentRole('owner');
    saveActiveOrganizationId(user.uid, newOrg.id);

    const orgMembers = await getOrganizationMembers(newOrg.id);
    setMembers(orgMembers);

    return newOrg;
  };

  const refreshMembers = async () => {
    if (!currentOrganization) return;
    const orgMembers = await getOrganizationMembers(currentOrganization.id);
    setMembers(orgMembers);
  };

  const refreshOrganizations = async () => {
    if (!user) return;
    const orgs = await getUserOrganizations(user.uid);
    setOrganizations(orgs);
  };

  const inviteMember = async (input: InviteMemberInput): Promise<OrganizationMember> => {
    if (!user || !currentOrganization) {
      throw new Error('Active organization and authenticated user required.');
    }

    const newMember = await inviteMemberService(currentOrganization.id, user.uid, input);
    setMembers((prev) => [...prev.filter((m) => m.userId !== newMember.userId), newMember]);
    return newMember;
  };

  const updateMemberRole = async (targetUserId: string, newRole: AppRole): Promise<void> => {
    if (!currentOrganization) return;
    await updateMemberRoleService(currentOrganization.id, targetUserId, newRole);
    setMembers((prev) =>
      prev.map((m) => (m.userId === targetUserId ? { ...m, role: newRole } : m))
    );
    if (user && targetUserId === user.uid) {
      setCurrentRole(newRole);
    }
  };

  const removeMember = async (targetUserId: string): Promise<void> => {
    if (!currentOrganization) return;
    await removeMemberService(currentOrganization.id, targetUserId);
    setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
  };

  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(effectiveRole, permission);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        organizations,
        currentOrganization,
        currentRole,
        effectiveRole,
        simulationRole,
        members,
        isLoading,
        switchOrganization,
        createOrganization,
        inviteMember,
        updateMemberRole,
        removeMember,
        hasPermission,
        setSimulationRole,
        refreshMembers,
        refreshOrganizations,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
