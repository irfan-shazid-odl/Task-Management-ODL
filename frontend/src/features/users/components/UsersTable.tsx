'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Trash2,
  Loader2,
  Pencil,
  X,
  Save,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { TeamMember, Role, getRoleDisplayName, SYSTEM_ADMIN_EMAIL } from '@/lib/types';
import { useUpdateUser, useSetUserPaused } from '@/hooks/queries/useTeamMembers';
import { getAvailableRoles, getRoleBadge, getRoleIcon } from '../constants';

interface Props {
  members: TeamMember[];
  currentUser: TeamMember;
  onRequestDelete: (member: TeamMember) => void;
}

// The Team Directory table. Owns inline row-editing state and the update/pause
// mutations; the parent supplies the (already system-admin filtered) members and
// handles the delete confirmation flow.
export default function UsersTable({ members, currentUser, onRequestDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Role>('Member');
  const [pausingId, setPausingId] = useState<string | null>(null);

  const updateUser = useUpdateUser();
  const setUserPaused = useSetUserPaused();

  const handleUpdateUser = async (userId: string) => {
    if (!editName.trim()) return;

    const member = members.find(m => m.id === userId);
    if (member?.email === SYSTEM_ADMIN_EMAIL) {
      toast.error("The system administrator account cannot be edited.");
      return;
    }

    try {
      // Backend ignores email and only lets admins change role; send allowed fields.
      await updateUser.mutateAsync({ id: userId, data: { name: editName, role: editRole } });
      setEditingId(null);
    } catch (err: any) {
      alert("Failed to update user: " + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handlePauseToggle = async (member: TeamMember) => {
    const newPaused = !member.is_paused;

    if (member.id === currentUser.id) {
      toast.error("You cannot pause your own access.");
      return;
    }

    if (member.email === SYSTEM_ADMIN_EMAIL) {
      toast.error("The system administrator account cannot be paused.");
      return;
    }

    if (currentUser?.role === 'Admin' && (member.role === 'Admin' || member.role === 'super-admin')) {
      toast.error("Admins cannot pause other Admins or Super Admins.");
      return;
    }

    if (currentUser?.role === 'Lead') {
      toast.error("Leads cannot pause users.");
      return;
    }

    setPausingId(member.id);

    try {
      await setUserPaused.mutateAsync({ id: member.id, isPaused: newPaused });
      toast.success(newPaused ? `${member.name}'s access has been paused.` : `${member.name}'s access has been restored.`);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to update access status.");
    }

    setPausingId(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-500" />
          {members.filter(m => !m.is_paused).length} Active{members.some(m => m.is_paused) ? ` · ${members.filter(m => m.is_paused).length} Paused` : ''}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs shrink-0 border border-violet-200">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      {editingId === member.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-slate-50 border border-violet-500 rounded px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-200"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateUser(member.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => handleUpdateUser(member.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Save Changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/name">
                          <p className={`text-slate-900 font-medium ${member.is_paused ? 'line-through text-slate-400' : ''}`}>{member.name}</p>
                          {member.is_paused && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Paused</span>
                          )}
                          {member.email !== SYSTEM_ADMIN_EMAIL && (
                            <button
                              onClick={() => {
                                setEditingId(member.id);
                                setEditName(member.name);
                                setEditRole(member.role);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all opacity-100 lg:opacity-40 lg:hover:opacity-100 lg:group-hover:opacity-100"
                              title="Edit Member"
                            >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          )}
                        </div>
                      )}
                      <p className="text-slate-400 text-[10px] font-mono">{member.email || member.id.substring(0,8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editingId === member.id && member.id !== currentUser.id && member.email !== SYSTEM_ADMIN_EMAIL ? (
                     <select
                       value={editRole}
                       onChange={(e) => setEditRole(e.target.value as Role)}
                       className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-semibold focus:outline-none focus:border-violet-500"
                     >
                       {getAvailableRoles(currentUser?.role, member.role).map(role => (
                         <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                       ))}
                     </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border ${getRoleBadge(member.role)}`}>
                      {getRoleIcon(member.role)} {getRoleDisplayName(member.role)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {member.id === currentUser.id ? (
                    <span className="text-[10px] text-slate-400 italic">You</span>
                  ) : member.email === SYSTEM_ADMIN_EMAIL ? (
                    <span className="text-[10px] text-violet-500 font-semibold">System Admin</span>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      {(currentUser?.role === 'super-admin' || currentUser?.role === 'Admin') && (
                        <button
                          onClick={() => handlePauseToggle(member)}
                          disabled={pausingId === member.id}
                          className={`p-1.5 rounded-lg transition-all ${
                            member.is_paused
                              ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                              : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                          } lg:opacity-0 lg:group-hover:opacity-100 disabled:opacity-50`}
                          title={member.is_paused ? 'Resume Access' : 'Pause Access'}
                        >
                          {pausingId === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : member.is_paused ? (
                            <PlayCircle className="w-4 h-4" />
                          ) : (
                            <PauseCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {(member.role !== 'super-admin' || currentUser?.role === 'super-admin') && (
                        <button
                          onClick={() => onRequestDelete(member)}
                          className="p-1.5 rounded-lg text-slate-400 lg:opacity-0 lg:group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Remove User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
