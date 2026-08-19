import React, { useState } from 'react';
import { X, Shield, Check, Minus, Sparkles, Filter } from 'lucide-react';
import { ROLE_PERMISSION_MATRIX, ROLE_DEFINITIONS } from '../../services/rbac/permissions';
import { AppRole } from '../../types/rbac';
import { RoleBadge } from './RoleBadge';

interface RolePermissionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RolePermissionMatrixModal: React.FC<RolePermissionMatrixModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const roles: AppRole[] = ['owner', 'admin', 'analyst', 'viewer'];

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Permissions' },
    ...ROLE_PERMISSION_MATRIX.map((c) => ({ id: c.categoryName, label: c.categoryName })),
  ];

  const filteredCategories =
    activeCategory === 'all'
      ? ROLE_PERMISSION_MATRIX
      : ROLE_PERMISSION_MATRIX.filter((c) => c.categoryName === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Role-Based Access Control Matrix
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Server-Enforced
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Enterprise security breakdown across workspace tiers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Matrix Table */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.categoryName} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {category.categoryName}
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3 w-1/2">Capability / Operation</th>
                      {roles.map((r) => (
                        <th key={r} className="py-2.5 px-3 text-center w-1/8">
                          <RoleBadge role={r} size="sm" showIcon={false} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {category.items.map((item) => (
                      <tr key={item.permission} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 text-xs">{item.label}</p>
                          <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                            {item.description}
                          </p>
                          <code className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {item.permission}
                          </code>
                        </td>

                        {roles.map((role) => {
                          const isAllowed = item.rolesAllowed.includes(role);
                          return (
                            <td key={role} className="py-3 px-3 text-center">
                              {isAllowed ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-50 text-slate-300">
                                  <Minus className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            Authorization verified automatically on every server API request.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
};
