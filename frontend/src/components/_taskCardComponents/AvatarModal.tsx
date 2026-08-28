import React from 'react';
import { X } from 'lucide-react';
import Avatar from '../Avatar';

interface AvatarModalProps {
  avatarModal: {
    name: string;
    role: string;
    avatar_url?: string;
    status?: string;
    email?: string;
    phone?: string;
    location?: string;
    bio?: string;
  } | null;
  setAvatarModal: (modal: any) => void;
}

export default function AvatarModal({ avatarModal, setAvatarModal }: AvatarModalProps) {
  if (!avatarModal) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={() => setAvatarModal(null)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xs border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <div className="w-full aspect-square bg-slate-100 flex items-center justify-center">
            <Avatar
              path={avatarModal.avatar_url}
              name={avatarModal.name}
              className="w-full h-full object-cover"
              textClassName="text-4xl bg-slate-100 text-slate-400"
            />
          </div>
          <button
            onClick={() => setAvatarModal(null)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white hover:text-slate-900 transition-all shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="text-base font-bold text-slate-900">{avatarModal.name}</h3>
          <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">{avatarModal.role}</p>
          {avatarModal.status && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
              <span>Task: {avatarModal.status}</span>
            </div>
          )}
          <div className="pt-2 space-y-1.5 text-xs text-slate-600">
            {avatarModal.email && <p><span className="font-semibold text-slate-400">Email:</span> {avatarModal.email}</p>}
            {avatarModal.phone && <p><span className="font-semibold text-slate-400">Phone:</span> {avatarModal.phone}</p>}
            {avatarModal.location && <p><span className="font-semibold text-slate-400">Location:</span> {avatarModal.location}</p>}
            {avatarModal.bio && (
              <div>
                <p className="font-semibold text-slate-400 mb-0.5">Bio:</p>
                <p className="text-slate-500 leading-relaxed">{avatarModal.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
