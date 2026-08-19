import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppRole, Organization, OrganizationMember, InviteMemberInput } from '../../types/rbac';

const LOCAL_ORGS_KEY_PREFIX = 'insightai_organizations_';
const LOCAL_MEMBERS_KEY_PREFIX = 'insightai_members_';
const LOCAL_ACTIVE_ORG_PREFIX = 'insightai_active_org_';

function generateOrgId(): string {
  return `org_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

function generateMemberId(): string {
  return `member_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Ensures a user has at least one default organization (e.g. Acme Analytics / Personal Workspace)
 */
export async function ensureDefaultOrganization(
  userId: string,
  userEmail?: string | null,
  displayName?: string | null
): Promise<{ organization: Organization; member: OrganizationMember }> {
  const existing = await getUserOrganizations(userId);
  if (existing.length > 0) {
    const defaultOrg = existing[0];
    const member = await getOrganizationMember(defaultOrg.id, userId);
    return {
      organization: defaultOrg,
      member: member || {
        id: `member_${userId}`,
        organizationId: defaultOrg.id,
        userId: userId,
        userEmail: userEmail || 'user@insightai.com',
        displayName: displayName || 'User',
        role: defaultOrg.ownerId === userId ? 'owner' : 'analyst',
        joinedAt: new Date().toISOString(),
      },
    };
  }

  // Create default organization
  const name = displayName ? `${displayName}'s Workspace` : 'Acme Analytics';
  const org = await createOrganization(userId, name, 'pro');

  const defaultMember: OrganizationMember = {
    id: `member_${userId}`,
    organizationId: org.id,
    userId: userId,
    userEmail: userEmail || 'user@insightai.com',
    displayName: displayName || 'Workspace Owner',
    role: 'owner',
    joinedAt: new Date().toISOString(),
  };

  await saveMemberLocally(org.id, defaultMember);

  // Add demo team members to showcase real multi-user collaboration
  const sampleMembers: OrganizationMember[] = [
    {
      id: generateMemberId(),
      organizationId: org.id,
      userId: 'user_sarah_admin',
      userEmail: 'sarah.chen@acmeanalytics.io',
      displayName: 'Sarah Chen',
      role: 'admin',
      joinedAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    },
    {
      id: generateMemberId(),
      organizationId: org.id,
      userId: 'user_marcus_analyst',
      userEmail: 'marcus.vance@acmeanalytics.io',
      displayName: 'Marcus Vance',
      role: 'analyst',
      joinedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
    {
      id: generateMemberId(),
      organizationId: org.id,
      userId: 'user_elena_viewer',
      userEmail: 'elena.rostova@acmeanalytics.io',
      displayName: 'Elena Rostova',
      role: 'viewer',
      joinedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];

  for (const m of sampleMembers) {
    await saveMemberLocally(org.id, m);
  }

  return { organization: org, member: defaultMember };
}

/**
 * Creates a brand new organization
 */
export async function createOrganization(
  ownerId: string,
  name: string,
  plan: 'free' | 'starter' | 'pro' | 'enterprise' = 'pro'
): Promise<Organization> {
  const orgId = generateOrgId();
  const now = new Date().toISOString();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'workspace';

  const org: Organization = {
    id: orgId,
    name: name.trim(),
    slug,
    ownerId,
    plan,
    createdAt: now,
    updatedAt: now,
    memberCount: 1,
  };

  if (db) {
    try {
      const orgRef = doc(db, 'organizations', orgId);
      await setDoc(orgRef, {
        ...org,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add owner as member
      const memberRef = doc(db, 'organizations', orgId, 'members', ownerId);
      await setDoc(memberRef, {
        id: `member_${ownerId}`,
        organizationId: orgId,
        userId: ownerId,
        role: 'owner',
        joinedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore createOrganization error, using local fallback:', err);
    }
  }

  saveOrganizationLocally(ownerId, org);
  return org;
}

/**
 * Fetches all organizations accessible by a user
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  if (!userId) return [];

  if (db) {
    try {
      const orgsRef = collection(db, 'organizations');
      const snapshot = await getDocs(orgsRef);
      if (!snapshot.empty) {
        const list: Organization[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.ownerId === userId) {
            list.push({
              id: d.id,
              name: data.name || 'Workspace',
              slug: data.slug || 'workspace',
              ownerId: data.ownerId,
              plan: data.plan || 'pro',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
              memberCount: data.memberCount || 1,
            });
          }
        });
        if (list.length > 0) return list;
      }
    } catch (e) {
      console.warn('Firestore getUserOrganizations error, reading local fallback:', e);
    }
  }

  return getOrganizationsLocally(userId);
}

/**
 * Fetches members of an organization
 */
export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  if (!orgId) return [];

  if (db) {
    try {
      const membersRef = collection(db, 'organizations', orgId, 'members');
      const snapshot = await getDocs(membersRef);
      if (!snapshot.empty) {
        const list: OrganizationMember[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            organizationId: orgId,
            userId: data.userId || d.id,
            userEmail: data.userEmail || 'member@insightai.com',
            displayName: data.displayName || 'Team Member',
            photoURL: data.photoURL || null,
            role: data.role || 'analyst',
            joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate().toISOString() : (data.joinedAt || new Date().toISOString()),
            invitedBy: data.invitedBy,
          });
        });
        if (list.length > 0) return list;
      }
    } catch (e) {
      console.warn('Firestore getOrganizationMembers warning:', e);
    }
  }

  return getMembersLocally(orgId);
}

/**
 * Gets a specific member record
 */
export async function getOrganizationMember(
  orgId: string,
  userId: string
): Promise<OrganizationMember | null> {
  const members = await getOrganizationMembers(orgId);
  return members.find((m) => m.userId === userId) || null;
}

/**
 * Invites a new team member
 */
export async function inviteMember(
  orgId: string,
  inviterId: string,
  input: InviteMemberInput
): Promise<OrganizationMember> {
  const memberId = generateMemberId();
  const userId = `user_${input.email.split('@')[0].replace(/[^a-z0-9]/gi, '_')}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newMember: OrganizationMember = {
    id: memberId,
    organizationId: orgId,
    userId,
    userEmail: input.email.trim().toLowerCase(),
    displayName: input.displayName?.trim() || input.email.split('@')[0],
    role: input.role,
    joinedAt: now,
    invitedBy: inviterId,
  };

  if (db) {
    try {
      const memberRef = doc(db, 'organizations', orgId, 'members', userId);
      await setDoc(memberRef, {
        ...newMember,
        joinedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore inviteMember error, using local storage:', e);
    }
  }

  saveMemberLocally(orgId, newMember);
  return newMember;
}

/**
 * Updates a member's role
 */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  newRole: AppRole
): Promise<void> {
  if (db) {
    try {
      const memberRef = doc(db, 'organizations', orgId, 'members', userId);
      await updateDoc(memberRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore updateMemberRole error:', e);
    }
  }

  updateMemberRoleLocally(orgId, userId, newRole);
}

/**
 * Removes a member from an organization
 */
export async function removeMember(
  orgId: string,
  userId: string
): Promise<void> {
  if (db) {
    try {
      const memberRef = doc(db, 'organizations', orgId, 'members', userId);
      await deleteDoc(memberRef);
    } catch (e) {
      console.warn('Firestore removeMember error:', e);
    }
  }

  removeMemberLocally(orgId, userId);
}

/**
 * Active organization preference storage
 */
export function getSavedActiveOrganizationId(userId: string): string | null {
  try {
    return localStorage.getItem(`${LOCAL_ACTIVE_ORG_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export function saveActiveOrganizationId(userId: string, orgId: string): void {
  try {
    localStorage.setItem(`${LOCAL_ACTIVE_ORG_PREFIX}${userId}`, orgId);
  } catch {
    // Ignore
  }
}

// Local Storage Helpers

function getOrganizationsLocally(userId: string): Organization[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_ORGS_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveOrganizationLocally(userId: string, org: Organization): void {
  try {
    const existing = getOrganizationsLocally(userId);
    const updated = [org, ...existing.filter((o) => o.id !== org.id)];
    localStorage.setItem(`${LOCAL_ORGS_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save organization locally:', e);
  }
}

function getMembersLocally(orgId: string): OrganizationMember[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_MEMBERS_KEY_PREFIX}${orgId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMemberLocally(orgId: string, member: OrganizationMember): void {
  try {
    const existing = getMembersLocally(orgId);
    const updated = [...existing.filter((m) => m.userId !== member.userId), member];
    localStorage.setItem(`${LOCAL_MEMBERS_KEY_PREFIX}${orgId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save member locally:', e);
  }
}

function updateMemberRoleLocally(orgId: string, userId: string, newRole: AppRole): void {
  try {
    const existing = getMembersLocally(orgId);
    const updated = existing.map((m) => (m.userId === userId ? { ...m, role: newRole } : m));
    localStorage.setItem(`${LOCAL_MEMBERS_KEY_PREFIX}${orgId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to update member role locally:', e);
  }
}

function removeMemberLocally(orgId: string, userId: string): void {
  try {
    const existing = getMembersLocally(orgId);
    const updated = existing.filter((m) => m.userId !== userId);
    localStorage.setItem(`${LOCAL_MEMBERS_KEY_PREFIX}${orgId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to remove member locally:', e);
  }
}
