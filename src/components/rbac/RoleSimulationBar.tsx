import React from 'react';
import { Shield, Sparkles, RefreshCcw, Eye, Crown, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AppRole } from '../../types/rbac';
import { RoleBadge } from './RoleBadge';

export const RoleSimulationBar: React.FC = () => {
  const { currentRole, effectiveRole, simulationRole, setSimulationRole } = useWorkspace();

  const roles: { role: AppRole; label: string; desc: string }[] = [
    { role: 'owner', label: 'Owner', desc: 'Full workspace authority & billing' },
    { role: 'admin', label: 'Admin', desc: 'Team & data management' },
    { role: 'analyst', label: 'Analyst', desc: 'Full analytics, SQL & AI' },
    { role: 'viewer', label: 'Viewer', desc: 'Read-only dashboards & exports' },
  ];

  return (
    <div className="bg-slate-900 text-white px-4 py-2 text-xs border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-inner">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
          <Shield className="w-3 h-3" />
          <span>RBAC Simulator</span>
        </div>
        <span className="text-slate-300 hidden sm:inline text-[11px]">
          Simulate role perspective:
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        {roles.map((r) => {
          const isActive = effectiveRole === r.role;
          return (
            <button
              key={r.role}
              onClick={() => setSimulationRole(r.role === currentRole && simulationRole === null ? null : r.role)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/50 ring-1 ring-white/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={r.desc}
            >
              <span>{r.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}

        {simulationRole && (
          <button
            onClick={() => setSimulationRole(null)}
            className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer ml-1"
            title="Reset to your authenticated role"
          >
            <RefreshCcw className="w-3 h-3" />
            <span>Reset ({currentRole})</span>
          </button>
        )}
      </div>
    </div>
  );
};
