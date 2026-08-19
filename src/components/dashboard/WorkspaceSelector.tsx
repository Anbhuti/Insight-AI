import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus, Shield } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { RoleBadge } from '../rbac/RoleBadge';

export const WorkspaceSelector: React.FC = () => {
  const {
    organizations,
    currentOrganization,
    switchOrganization,
    createOrganization,
    effectiveRole,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      setIsCreating(true);
      await createOrganization(newOrgName.trim(), 'pro');
      setNewOrgName('');
      setCreateModalOpen(false);
      setIsOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create organization.');
    } finally {
      setIsCreating(false);
    }
  };

  const displayName = currentOrganization?.name || 'Workspace';
  const initial = displayName ? displayName[0].toUpperCase() : 'W';

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none"
          aria-expanded={isOpen}
        >
          <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
            {initial}
          </div>
          <span className="truncate max-w-[110px] sm:max-w-[150px] font-bold">
            {displayName}
          </span>
          <RoleBadge role={effectiveRole} size="sm" showIcon={false} />
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl p-2 border border-slate-200/90 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Workspaces</span>
              <span className="text-slate-500 font-mono text-[9px]">{organizations.length}</span>
            </div>
            
            <div className="py-1 space-y-0.5 max-h-56 overflow-y-auto">
              {organizations.map((org) => {
                const isSelected = org.id === currentOrganization?.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchOrganization(org.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {org.name[0]?.toUpperCase() || 'W'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                          {org.name}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium capitalize">
                          {org.plan} Tier
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-slate-100 mt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCreateModalOpen(true);
                }}
                className="w-full px-2.5 py-1.5 text-left text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Create New Organization</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Create New Organization
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set up a separate team workspace with its own datasets, reports, and team members.
            </p>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme EMEA or Marketing Intelligence"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newOrgName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {isCreating ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

