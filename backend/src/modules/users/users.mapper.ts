import type { TeamMember } from '@prisma/client';
import { serialize } from '../../utils/serialize.js';

export type PublicMember = Omit<TeamMember, 'password_hash'>;

// Never leak the bcrypt hash to clients. Shape matches the frontend
// TeamMember type (src/lib/types.ts). Accepts a member that may already be
// selected without the hash, or a full row (whose hash is stripped here).
export function toPublicMember(member: PublicMember): PublicMember {
  const { password_hash: _omit, ...rest } = member as TeamMember;
  void _omit;
  return serialize(rest);
}

export function toPublicMembers(members: PublicMember[]): PublicMember[] {
  return members.map(toPublicMember);
}
