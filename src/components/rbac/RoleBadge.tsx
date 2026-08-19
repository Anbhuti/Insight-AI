import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Eye, Crown } from 'lucide-react';
import { AppRole } from '../../types/rbac';
import { ROLE_DEFINITIONS } from '../../services/rbac/permissions';

interface RoleBadgeProps {
  role: AppRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const def = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.viewer;

  const getIcon = () => {
    switch (role) {
      case 'owner':
        return <Crown className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />;
      case 'admin':
        return <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />;
      case 'analyst':
        return <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />;
      case 'viewer':
      default:
        return <Eye className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />;
    }
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-semibold rounded-md',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-bold rounded-lg',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold rounded-xl',
  };

  const roleStyles: Record<AppRole, string> = {
    owner: 'bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs',
    admin: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs',
    analyst: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs',
    viewer: 'bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs',
  };

  return (
    <span
      className={`inline-flex items-center tracking-tight transition-all ${sizeClasses[size]} ${roleStyles[role]} ${className}`}
      title={def.description}
    >
      {showIcon && getIcon()}
      <span>{def.badgeLabel}</span>
    </span>
  );
};
