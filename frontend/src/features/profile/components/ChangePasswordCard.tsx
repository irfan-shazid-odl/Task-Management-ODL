'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import type { TeamMember } from '@/lib/types';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  currentUser: TeamMember;
  fallbackEmail: string;
}

// Security tab: change password via api.auth.changePassword (backend verifies the
// current password and updates in one call). Fully self-contained.
export default function ChangePasswordCard({ currentUser, fallbackEmail }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password.');
      return;
    }
    setSavingSecurity(true);

    try {
      const userEmail = currentUser.email || fallbackEmail;
      if (!userEmail) {
        toast.error('No email found for your account.');
        setSavingSecurity(false);
        return;
      }

      // Backend verifies currentPassword and updates to newPassword in one call.
      await api.auth.changePassword(newPassword, currentPassword);

      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to change password.');
      console.error(e);
    }
    setSavingSecurity(false);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        <Lock className="w-4 h-4 flex-shrink-0" />
        <p>Choose a strong password with at least 6 characters. Never share it with anyone.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
            placeholder="••••••••"
          />
          <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
            placeholder="Min. 6 characters"
          />
          <button onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all ${
              confirmPassword && confirmPassword !== newPassword
                ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10'
                : 'border-slate-200 focus:border-violet-500 focus:ring-violet-500/10'
            }`}
            placeholder="Repeat new password"
          />
          <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {confirmPassword && confirmPassword !== newPassword && (
          <p className="text-xs text-red-500 mt-1.5 ml-1">Passwords do not match.</p>
        )}
      </div>

      <div className="pt-2">
        <button
          onClick={handleChangePassword}
          disabled={savingSecurity || !newPassword || newPassword !== confirmPassword}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-violet-200 active:scale-95"
        >
          {savingSecurity ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {savingSecurity ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
