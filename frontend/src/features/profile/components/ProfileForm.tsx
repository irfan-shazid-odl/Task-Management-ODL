'use client';

import React, { useState } from 'react';
import { useUser } from '@/components/UserContext';
import type { TeamMember } from '@/lib/types';
import { useUpdateUser } from '@/hooks/queries/useTeamMembers';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  currentUser: TeamMember;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
}

// General tab: edits the current user's profile details and persists them via
// useUpdateUser. Field state is owned by the page so the profile card can mirror it.
export default function ProfileForm({
  currentUser,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  phone,
  setPhone,
  location,
  setLocation,
  department,
  setDepartment,
  bio,
  setBio,
}: Props) {
  const { setCurrentUser } = useUser();
  const updateUser = useUpdateUser();
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savedGeneral, setSavedGeneral] = useState(false);

  const handleSaveGeneral = async () => {
    if (!firstName.trim()) {
      toast.error('First name is required.');
      return;
    }
    setSavingGeneral(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      // Update the current user's profile (email/role are managed by the backend and
      // ignored here for a self-save).
      const { user: upserted } = await updateUser.mutateAsync({
        id: currentUser.id,
        data: {
          name: fullName,
          ...(phone && { phone }),
          ...(location && { location }),
          ...(department && { department }),
          ...(bio && { bio }),
        },
      });

      if (!upserted) {
        toast.error('Save failed: unknown error');
        console.error('Profile upsert error: no user returned');
      } else {
        setCurrentUser({ ...currentUser, name: fullName, phone, location, department, bio });
        toast.success('Profile saved successfully!');
        setSavedGeneral(true);
        setTimeout(() => setSavedGeneral(false), 2500);
      }
    } catch (e) {
      toast.error('Save failed: ' + (e instanceof Error ? e.message : 'unknown error'));
      console.error('Profile upsert error:', e);
    }
    setSavingGeneral(false);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
            placeholder="First name"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
            placeholder="Last name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
            placeholder="City, Country"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
            placeholder="e.g. Product Department"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all resize-none"
          placeholder="A short bio about yourself..."
        />
      </div>

      <div className="pt-2">
        <button
          onClick={handleSaveGeneral}
          disabled={savingGeneral}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-violet-200 active:scale-95"
        >
          {savingGeneral ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedGeneral ? (
            <Check className="w-4 h-4" />
          ) : null}
          {savingGeneral ? 'Saving...' : savedGeneral ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
