import React, { useState } from 'react';
import { X, Mail, UserPlus, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppRole, InviteMemberInput } from '../../types/rbac';
import { ROLE_DEFINITIONS, getAssignableRoles } from '../../services/rbac/permissions';
import { RoleBadge } from './RoleBadge';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (input: InviteMemberInput) => Promise<void>;
  currentUserRole: AppRole;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvite,
  currentUserRole,
}) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('analyst');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const assignableRoles = getAssignableRoles(currentUserRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onInvite({
        email: email.trim(),
        displayName: displayName.trim() || email.split('@')[0],
        role: selectedRole,
      });
      onClose();
      setEmail('');
      setDisplayName('');
      setSelectedRole('analyst');
    } catch (err: any) {
      setError(err.message || 'Failed to invite team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Invite Team Member
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Add a collaborator with role-based access controls
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

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Work Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Full name input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name (Optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jordan Miller"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Assign Organization Role *
            </label>
            <div className="space-y-2">
              {assignableRoles.map((role) => {
                const def = ROLE_DEFINITIONS[role];
                const isSelected = selectedRole === role;
                return (
                  <div
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="mt-0.5">
                      <input
                        type="radio"
                        name="role"
                        checked={isSelected}
                        onChange={() => setSelectedRole(role)}
                        className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={role} size="sm" />
                        <span className="text-xs font-bold text-slate-900">
                          {def.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {def.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Sending Invite...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Send Workspace Invite</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
