'use client';

import React from 'react';
import { Users, User, LayoutGrid, CheckCircle2, ChevronDown } from 'lucide-react';
import { getRoleDisplayName } from '@/lib/types';

type ViewMode = 'mine' | 'all' | string;

interface TeamMember {
  id: string;
  name: string;
  role: string;
  is_paused?: boolean;
}

interface BoardMemberSwitcherProps {
  viewMode: ViewMode;
  memberDropdownOpen: boolean;
  memberDropdownRef: React.RefObject<HTMLDivElement | null>;
  teamMembers: TeamMember[];
  onToggleDropdown: () => void;
  onSelectView: (mode: ViewMode) => void;
}

export default function BoardMemberSwitcher({
  viewMode,
  memberDropdownOpen,
  memberDropdownRef,
  teamMembers,
  onToggleDropdown,
  onSelectView,
}: BoardMemberSwitcherProps) {
  return (
    <div className="relative" ref={memberDropdownRef}>
      <button
        onClick={onToggleDropdown}
        className={`flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border transition-all text-xs font-semibold min-w-[160px] ${
          viewMode !== 'mine' ? 'border-cyan-400 shadow-sm text-cyan-700' : 'border-slate-200 text-slate-700'
        } hover:border-cyan-300`}
      >
        <Users className={`w-3.5 h-3.5 ${viewMode !== 'mine' ? 'text-cyan-500' : 'text-slate-400'}`} />
        <span className="flex-1 text-left truncate">
          {viewMode === 'mine' ? 'My Board' : viewMode === 'all' ? 'All Members' : teamMembers?.find(m => m.id === viewMode)?.name || 'Member'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${memberDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {memberDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 z-[100] bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 min-w-[220px]">
          <button
            onClick={() => onSelectView('mine')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'mine' ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">My Board</span>
            {viewMode === 'mine' && <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />}
          </button>
          <button
            onClick={() => onSelectView('all')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'all' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">All Members</span>
            {viewMode === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </button>
          <div className="my-1 border-t border-slate-100" />
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {(teamMembers || []).filter(m => !m.is_paused).map(member => (
              <button
                key={member.id}
                onClick={() => onSelectView(member.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === member.id ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                  viewMode === member.id ? 'bg-cyan-200 text-cyan-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {member.name.charAt(0)}
                </div>
                <span className="flex-1 text-left truncate">{member.name}</span>
                <span className="text-[9px] text-slate-400">{getRoleDisplayName(member.role)}</span>
                {viewMode === member.id && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
