'use client';

import React from 'react';
import { Users } from 'lucide-react';
import type { TeamMember } from '@/lib/types';
import MemberCard from './MemberCard';

interface Props {
  members: TeamMember[];
  onSelect: (member: TeamMember) => void;
}

export default function MemberGrid({ members, onSelect }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} onSelect={onSelect} />
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No members found</p>
        </div>
      )}
    </>
  );
}
