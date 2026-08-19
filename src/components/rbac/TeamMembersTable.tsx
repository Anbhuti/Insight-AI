import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
  Crown,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AppRole, OrganizationMember, InviteMemberInput } from '../../types/rbac';
import { canManageMemberRole, getAssignableRoles, ROLE_DEFINITIONS } from '../../services/rbac/permissions';
import { RoleBadge } from './RoleBadge';
import { InviteMemberModal } from './InviteMemberModal';
import { RolePermissionMatrixModal } from './RolePermissionMatrixModal';
import { PermissionGate } from './PermissionGate';

export const TeamMembersTable: React.FC = () => {
  const { user } = useAuth();
  const {
    currentOrganization,
    members,
    effectiveRole,
    inviteMember,
    updateMemberRole,
    removeMember,
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<AppRole>('analyst');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canManage = effectiveRole === 'owner' || effectiveRole === 'admin';

  const filteredMembers = members.filter(
    (m) =>
      m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEditRole = (member: OrganizationMember) => {
    setEditingMember(member);
    setSelectedNewRole(member.role);
  };

  const handleSaveRoleChange = async () => {
    if (!editingMember) return;
    try {
      await updateMemberRole(editingMember.userId, selectedNewRole);
      setStatusMessage(`Role for ${editingMember.displayName} updated to ${selectedNewRole}.`);
      setEditingMember(null);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (member: OrganizationMember) => {
    if (member.role === 'owner') {
      alert('Cannot remove the workspace owner.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.displayName} (${member.userEmail}) from ${currentOrganization?.name || 'this workspace'}?`
    );
    if (!confirmed) return;

    try {
      await removeMember(member.userId);
      setStatusMessage(`${member.displayName} was removed from the organization.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  const handleInviteSubmit = async (input: InviteMemberInput) => {
    await inviteMember(input);
    setStatusMessage(`Invitation sent to ${input.email} as ${input.role}.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Team Members & Authorization</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {members.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage who has access to {currentOrganization?.name || 'Workspace'} and assign analytical privileges.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Open Matrix View */}
          <button
            onClick={() => setMatrixModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>View Role Matrix</span>
          </button>

          {/* Invite Member Button (Gated) */}
          <PermissionGate
            permission="org:invite_member"
            fallback={
              <button
                disabled
                title="Only Organization Owners and Admins can invite new members"
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed opacity-60 flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Member</span>
              </button>
            }
          >
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Success Notification Banner */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by name, email, or role..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3.5 px-4 sm:px-6">Team Member</th>
                <th className="py-3.5 px-4 sm:px-6">Assigned Role</th>
                <th className="py-3.5 px-4 sm:px-6 hidden md:table-cell">Joined Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const isCurrentUser = member.userId === user?.uid;
                const canModifyThisMember =
                  canManage &&
                  canManageMemberRole(effectiveRole, member.role) &&
                  !isCurrentUser;

                return (
                  <tr key={member.userId} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* User Info */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt={member.displayName}
                            className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            {member.displayName ? member.displayName[0].toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 leading-tight">
                              {member.displayName}
                            </p>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                            {member.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-4 px-4 sm:px-6">
                      <RoleBadge role={member.role} size="md" />
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-4 sm:px-6 hidden md:table-cell text-slate-500 font-medium">
                      {new Date(member.joinedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      {canModifyThisMember ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditRole(member)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Modify role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {isCurrentUser ? 'Active session' : 'Protected'}
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Change Role for {editingMember.displayName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select an authorized permission tier for this team member.
            </p>

            <div className="space-y-2 mb-6">
              {getAssignableRoles(effectiveRole).map((role) => {
                const def = ROLE_DEFINITIONS[role];
                const isSelected = selectedNewRole === role;
                return (
                  <div
                    key={role}
                    onClick={() => setSelectedNewRole(role)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editRole"
                      checked={isSelected}
                      onChange={() => setSelectedNewRole(role)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={role} size="sm" />
                        <span className="text-xs font-bold text-slate-900">{def.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{def.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoleChange}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Save Role Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteSubmit}
        currentUserRole={effectiveRole}
      />

      {/* Role Permission Matrix Modal */}
      <RolePermissionMatrixModal
        isOpen={matrixModalOpen}
        onClose={() => setMatrixModalOpen(false)}
      />

    </div>
  );
};
