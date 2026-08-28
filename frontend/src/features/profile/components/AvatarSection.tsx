'use client';

import React, { useRef, useState } from 'react';
import { useUser } from '@/components/UserContext';
import { getRoleDisplayName, type TeamMember } from '@/lib/types';
import Avatar from '@/components/Avatar';
import { deleteAvatar, invalidateAvatarUrl, uploadAvatar } from '@/lib/avatar';
import { useUpdateUser } from '@/hooks/queries/useTeamMembers';
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Camera,
  Trash2,
  Shield,
  Star,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

function getRoleColor(role: string) {
  switch (role) {
    case 'super-admin': return 'text-violet-600';
    case 'Admin': return 'text-red-500';
    case 'Lead': return 'text-amber-500';
    default: return 'text-sky-500';
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'super-admin':
    case 'Admin': return <Shield className="w-3.5 h-3.5" />;
    case 'Lead': return <Star className="w-3.5 h-3.5" />;
    default: return <UserIcon className="w-3.5 h-3.5" />;
  }
}

function getRoleLabel(role: string) {
  return getRoleDisplayName(role);
}

interface Props {
  currentUser: TeamMember;
  avatarPath: string | null;
  setAvatarPath: (path: string | null) => void;
  email: string;
  phone: string;
  location: string;
  department: string;
  bio: string;
}

// Left profile card: avatar upload/remove plus the read-only summary of the
// current user's details. Owns avatar persistence via useUpdateUser.
export default function AvatarSection({
  currentUser,
  avatarPath,
  setAvatarPath,
  email,
  phone,
  location,
  department,
  bio,
}: Props) {
  const { setCurrentUser } = useUser();
  const updateUser = useUpdateUser();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.');
      return;
    }
    setUploadingAvatar(true);
    try {
      const oldPath = avatarPath;
      const newPath = await uploadAvatar(currentUser.id, file);
      await updateUser.mutateAsync({ id: currentUser.id, data: { avatar_url: newPath } });
      if (oldPath && oldPath !== newPath) {
        await deleteAvatar(oldPath);
      }
      setAvatarPath(newPath);
      setCurrentUser({ ...currentUser, avatar_url: newPath });
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err?.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!avatarPath) return;
    setUploadingAvatar(true);
    try {
      const oldPath = avatarPath;
      await updateUser.mutateAsync({ id: currentUser.id, data: { avatar_url: null } });
      await deleteAvatar(oldPath);
      invalidateAvatarUrl(oldPath);
      setAvatarPath(null);
      setCurrentUser({ ...currentUser, avatar_url: undefined });
      toast.success('Avatar removed');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const avatarInitial = currentUser.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative">
      {/* Avatar */}
      <div className="relative mb-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAvatar}
          title={avatarPath ? 'Change avatar' : 'Upload avatar'}
          className="block rounded-full cursor-pointer hover:opacity-90 transition-opacity disabled:cursor-wait"
        >
          {avatarPath ? (
            <Avatar
              path={avatarPath}
              name={currentUser.name}
              className="w-28 h-28 rounded-full shadow-lg shadow-violet-500/20"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-violet-500/20">
              {avatarInitial}
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAvatar}
          title={avatarPath ? 'Change avatar' : 'Upload avatar'}
          className="absolute bottom-1 right-1 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-violet-600 hover:border-violet-300 transition-colors shadow-sm disabled:opacity-50"
        >
          {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </button>
        {avatarPath && !uploadingAvatar && (
          <button
            type="button"
            onClick={handleAvatarRemove}
            title="Remove avatar"
            className="absolute bottom-1 left-1 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-300 transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
      <div className={`flex items-center gap-1.5 mt-1 text-sm font-medium ${getRoleColor(currentUser.role)}`}>
        {getRoleIcon(currentUser.role)}
        {getRoleLabel(currentUser.role)}
      </div>

      <div className="w-full mt-6 space-y-3 text-left">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate">{currentUser.email || email || 'No email set'}</span>
        </div>
        {phone && (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{phone}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{location}</span>
          </div>
        )}
        {department && (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{department}</span>
          </div>
        )}
      </div>

      {bio && (
        <div className="w-full mt-4 pt-4 border-t border-slate-100 text-left">
          <p className="text-xs text-slate-500 leading-relaxed italic">{bio}</p>
        </div>
      )}
    </div>
  );
}
