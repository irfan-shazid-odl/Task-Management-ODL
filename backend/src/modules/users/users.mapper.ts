import type { TeamMember } from '@prisma/client';
import { serialize } from '../../utils/serialize.js';

export type PublicMember = Omit<TeamMember, 'password_hash'>;

// Never leak the bcrypt hash to clients. Shape matches the frontend
// TeamMember type (src/lib/types.ts).
export function toPublicMember(member: TeamMember): PublicMember {
  const { password_hash: _omit, ...rest } = member;
  void _omit;
  return serialize(rest);
}

export function toPublicMembers(members: TeamMember[]): PublicMember[] {
  return members.map(toPublicMember);
}
