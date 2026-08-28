'use client';

import React, { useMemo, useState } from 'react';
import { Users, Search, Loader2 } from 'lucide-react';
import type { TeamMember } from '@/lib/types';
import { useUser } from '@/components/UserContext';
import { useTeamMembers } from '@/hooks/queries/useTeamMembers';
import MemberGrid from '@/features/team-members/components/MemberGrid';
import MemberDetailModal from '@/features/team-members/components/MemberDetailModal';

export default function TeamMembersPage() {
  const { currentUser } = useUser();
  const { data = [], isLoading } = useTeamMembers(!!currentUser);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TeamMember | null>(null);

  // Original selected a member subset ordered by created_at; list() returns full
  // rows, so sort client-side to match.
  const members = useMemo(
    () => [...data].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')),
    [data],
  );

  const filtered = members
    .filter((m) => !m.is_paused)
    .filter((m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase()),
    );

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Team Members</h1>
            <p className="text-sm text-slate-500">{members.length} members</p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-violet-400 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <MemberGrid members={filtered} onSelect={setSelected} />

      {/* Detail modal */}
      {selected && <MemberDetailModal member={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
