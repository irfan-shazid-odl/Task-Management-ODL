'use client';

import React from 'react';
import { Mail, Phone, MapPin, FileText } from 'lucide-react';
import type { TeamMember } from '@/lib/types';
import { getRoleDisplayName } from '@/lib/types';
import Avatar from '@/components/Avatar';
import { getRoleIcon } from '../lib/roleIcon';

interface Props {
  member: TeamMember;
  onSelect: (member: TeamMember) => void;
}

export default function MemberCard({ member: m, onSelect }: Props) {
  const roleIcon = getRoleIcon(m.role);
  return (
    <button
      onClick={() => onSelect(m)}
      className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-200 hover:shadow-md hover:shadow-violet-500/5 transition-all duration-300 space-y-4 w-full cursor-pointer"
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <Avatar
          path={m.avatar_url}
          name={m.name}
          className="w-12 h-12 rounded-full border-2 border-slate-200"
          textClassName="text-sm bg-violet-100 text-violet-700 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 truncate">{m.name}</p>
          <div className="flex items-center gap-1 text-[11px] text-violet-600 font-semibold uppercase tracking-wider">
            {React.createElement(roleIcon, { className: 'w-3 h-3' })}
            {getRoleDisplayName(m.role)}
          </div>
        </div>
        {m.is_paused && (
          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Paused</span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 text-xs text-slate-600">
        {m.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{m.email}</span>
          </div>
        )}
        {m.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{m.phone}</span>
          </div>
        )}
        {m.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{m.location}</span>
          </div>
        )}
      </div>

      {/* Bio */}
      {m.bio && (
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed line-clamp-3">{m.bio}</p>
        </div>
      )}
    </button>
  );
}
