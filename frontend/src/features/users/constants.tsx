import React from 'react';
import { Shield, Star, User } from 'lucide-react';
import type { Role } from '@/lib/types';

// Shared role presentation + permission helpers for the Team Directory.

export function getRoleIcon(role: string) {
  switch (role) {
    case 'super-admin': return <Shield className="w-3.5 h-3.5" />;
    case 'Admin': return <Shield className="w-3.5 h-3.5" />;
    case 'Lead': return <Star className="w-3.5 h-3.5" />;
    default: return <User className="w-3.5 h-3.5" />;
  }
}

export function getRoleBadge(role: string) {
  switch (role) {
    case 'super-admin': return 'bg-violet-50 text-violet-600 border-violet-200';
    case 'Admin': return 'bg-red-50 text-red-600 border-red-200';
    case 'Lead': return 'bg-amber-50 text-amber-600 border-amber-200';
    default: return 'bg-sky-50 text-sky-600 border-sky-200';
  }
}

// Which roles the current user is allowed to assign (optionally for a given target).
export function getAvailableRoles(currentRole: Role | undefined, targetRole?: string): Role[] {
  if (currentRole === 'super-admin') return ['super-admin', 'Admin', 'Lead', 'Member'];
  if (currentRole === 'Admin') {
    // Admins can't demote/promote other Admins or Super Admins
    if (targetRole === 'Admin' || targetRole === 'super-admin') return [targetRole as Role];
    return ['Lead', 'Member'];
  }
  if (currentRole === 'Lead') return ['Member'];
  return [];
}
