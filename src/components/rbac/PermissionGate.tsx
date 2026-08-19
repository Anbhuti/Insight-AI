import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { Permission, AppRole } from '../../types/rbac';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ROLE_DEFINITIONS } from '../../services/rbac/permissions';

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showNotice?: boolean;
  noticeTitle?: string;
  noticeMessage?: string;
  renderDisabled?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback,
  showNotice = false,
  noticeTitle = 'Permission Restricted',
  noticeMessage,
  renderDisabled = false,
}) => {
  const { hasPermission, effectiveRole } = useWorkspace();
  const allowed = hasPermission(permission);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (renderDisabled) {
    return (
      <div className="relative group inline-block cursor-not-allowed opacity-60 pointer-events-none">
        {children}
      </div>
    );
  }

  if (showNotice) {
    const currentRoleDef = ROLE_DEFINITIONS[effectiveRole];
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start gap-3.5 my-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-amber-900 leading-tight">
            {noticeTitle}
          </h4>
          <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
            {noticeMessage ||
              `Your current role (${currentRoleDef.title}) does not have authorization for \`${permission}\`. Contact your organization Admin or Owner to request elevated access.`}
          </p>
        </div>
      </div>
    );
  }

  return null;
};
