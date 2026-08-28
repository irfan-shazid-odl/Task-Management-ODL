'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/UserContext';
import { api } from '@/lib/api';
import type { TeamMember } from '@/lib/types';
import AvatarSection from '@/features/profile/components/AvatarSection';
import ProfileForm from '@/features/profile/components/ProfileForm';
import ChangePasswordCard from '@/features/profile/components/ChangePasswordCard';

type TabType = 'general' | 'security';

export default function ProfilePage() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Profile field state lives here so the profile card (left) and the form
  // (right) stay in sync as the user types.
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!currentUser) return;

    // Try by auth ID first, then fall back to email
    let data: TeamMember | null = null;
    try {
      data = await api.users.get(currentUser.id);
    } catch {
      data = null;
    }

    if (!data && currentUser.email) {
      try {
        const all = await api.users.list();
        data = all.find((m) => m.email === currentUser.email) || null;
      } catch {
        data = null;
      }
    }

    if (data) {
      const nameParts = (data.name || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(data.email || currentUser.email || '');
      setPhone(data.phone || '');
      setLocation(data.location || '');
      setDepartment(data.department || '');
      setBio(data.bio || '');
      setAvatarPath(data.avatar_url || null);
    }
    setProfileLoading(false);
  }, [currentUser?.id, currentUser?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!currentUser || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profile Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account details and security preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Panel — Profile Card */}
        <AvatarSection
          currentUser={currentUser}
          avatarPath={avatarPath}
          setAvatarPath={setAvatarPath}
          email={email}
          phone={phone}
          location={location}
          department={department}
          bio={bio}
        />

        {/* Right Panel — Account Details */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Panel Header */}
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Account Details</h3>
            <p className="text-sm text-slate-500 mt-0.5">Update your personal information and settings.</p>

            {/* Tabs */}
            <div className="flex mt-5 bg-slate-100 rounded-xl p-1 w-fit">
              {(['general', 'security'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'general' ? 'General' : 'Security'}
                </button>
              ))}
            </div>
          </div>

          {/* General Tab */}
          {activeTab === 'general' && (
            <ProfileForm
              currentUser={currentUser}
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              location={location}
              setLocation={setLocation}
              department={department}
              setDepartment={setDepartment}
              bio={bio}
              setBio={setBio}
            />
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <ChangePasswordCard currentUser={currentUser} fallbackEmail={email} />
          )}
        </div>
      </div>
    </div>
  );
}
