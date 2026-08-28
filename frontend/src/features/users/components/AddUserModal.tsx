'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Check, Mail, KeyRound, Loader2 } from 'lucide-react';
import { TeamMember, Role, getRoleDisplayName } from '@/lib/types';
import { useCreateUser } from '@/hooks/queries/useTeamMembers';
import { getAvailableRoles, getRoleIcon } from '../constants';

interface Props {
  currentUser: TeamMember;
}

// The "Invite New Member" panel. Self-contained: owns its form state, success/error
// messaging, and the create mutation. Cache invalidation refreshes the members list.
export default function AddUserModal({ currentUser }: Props) {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('Member');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the success-message timer on unmount so it never fires on an
  // unmounted component.
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const createUser = useCreateUser();
  const availableRoles = getAvailableRoles(currentUser?.role);

  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;

    if (!availableRoles.includes(newRole)) {
      setErrorMsg("You do not have permission to assign that role.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Track success with a local flag instead of reading `errorMsg` from the
    // closure: the state setter hasn't flushed, so `errorMsg` is still '' at
    // this point and the form would otherwise reset the user's input even on a
    // failed create.
    let failed = false;
    try {
      await createUser.mutateAsync({ name: newName, email: newEmail, password: newPassword, role: newRole });
      setSuccessMsg(`Added ${newName} to the team!`);
    } catch (err: any) {
      failed = true;
      setErrorMsg(err instanceof Error ? err.message : "Failed to add user.");
    }

    if (!failed) {
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('Member');
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setSuccessMsg('');
        successTimerRef.current = null;
      }, 4000);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-5">
          <UserPlus className="w-4 h-4 text-cyan-500" />
          Invite New Member
        </h2>

        {successMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
            <Check className="w-3.5 h-3.5 shrink-0" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input
                 type="email"
                 value={newEmail}
                 onChange={(e) => setNewEmail(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500"
                 placeholder="jane@company.com"
               />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Default Password (Required)</label>
            <div className="relative">
               <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input
                 type="password"
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500"
                 placeholder="At least 6 chars"
               />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">System Role</label>
            <div className="grid grid-cols-3 gap-2">
              {availableRoles.map((r) => (
                <button
                  key={r}
                  onClick={() => setNewRole(r)}
                  className={`py-2 border rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                    newRole === r
                      ? 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {getRoleIcon(r)}
                  {getRoleDisplayName(r)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleAddUser}
              disabled={loading || !newName.trim() || !newEmail.trim() || !newPassword.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-sm text-white font-medium
                hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
