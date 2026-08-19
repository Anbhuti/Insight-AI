import { auth } from '../lib/firebase';
import { AppRole } from '../types/rbac';

const LOCAL_ROLE_SIM_KEY = 'insightai_simulated_role';
const LOCAL_ACTIVE_ORG_KEY = 'insightai_active_org_id';

/**
 * Returns authorization and workspace identification headers for backend API calls
 */
export function getApiAuthHeaders(customOrgId?: string, customRole?: AppRole): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const user = auth.currentUser;
  if (user) {
    headers['x-user-id'] = user.uid;
    if (user.email) {
      headers['x-user-email'] = user.email;
    }
  }

  // Active organization
  let orgId = customOrgId;
  if (!orgId) {
    try {
      orgId = localStorage.getItem(LOCAL_ACTIVE_ORG_KEY) || undefined;
    } catch {
      // ignore
    }
  }
  if (orgId) {
    headers['x-organization-id'] = orgId;
  }

  // Simulated or effective role
  let role = customRole;
  if (!role) {
    try {
      const sim = localStorage.getItem(LOCAL_ROLE_SIM_KEY);
      if (sim) role = sim as AppRole;
    } catch {
      // ignore
    }
  }
  if (role) {
    headers['x-user-role'] = role;
  }

  return headers;
}
