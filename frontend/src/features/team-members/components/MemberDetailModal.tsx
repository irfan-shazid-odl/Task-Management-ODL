'use client';

import React from 'react';
import { Mail, Phone, MapPin, Shield, Star, User, X, CalendarDays } from 'lucide-react';
import type { TeamMember } from '@/lib/types';
import { getRoleDisplayName } from '@/lib/types';
import Avatar from '@/components/Avatar';

interface Props {
  member: TeamMember;
  onClose: () => void;
}

export default function MemberDetailModal({ member: selected, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover / Avatar */}
        <div className="relative bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-700 h-36">
          <div className="absolute -bottom-12 left-6">
            <Avatar
              path={selected.avatar_url}
              name={selected.name}
              className="w-24 h-24 rounded-full border-4 border-white shadow-xl"
              textClassName="text-2xl bg-violet-100 text-violet-700 rounded-full"
            />
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="pt-16 pb-6 px-6 space-y-5">
          {/* Name + Role */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5 text-sm font-semibold text-violet-600 uppercase tracking-wider">
                {selected.role === 'super-admin' || selected.role === 'Admin' ? (
                  <Shield className="w-3.5 h-3.5" />
                ) : selected.role === 'Lead' ? (
                  <Star className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                {getRoleDisplayName(selected.role)}
              </div>
            </div>
            {selected.is_paused && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full uppercase tracking-wider shrink-0">Paused</span>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact</p>
            <div className="space-y-2.5">
              {selected.email && (
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-violet-500" />
                  </div>
                  <span>{selected.email}</span>
                </div>
              )}
              {selected.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-violet-500" />
                  </div>
                  <span>{selected.phone}</span>
                </div>
              )}
              {selected.location && (
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-violet-500" />
                  </div>
                  <span>{selected.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {selected.bio && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">About</p>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                {selected.bio}
              </p>
            </div>
          )}

          {/* Joined */}
          {selected.created_at && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <CalendarDays className="w-3.5 h-3.5" />
              Joined {new Date(selected.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
