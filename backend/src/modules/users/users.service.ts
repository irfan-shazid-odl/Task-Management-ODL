import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { SYSTEM_ADMIN_EMAIL } from '../../config/env.js';
import { hashPassword } from '../../utils/password.js';
import { toPublicMember, toPublicMembers } from './users.mapper.js';

export async function listMembers() {
  const members = await prisma.teamMember.findMany({ orderBy: { name: 'asc' } });
  return toPublicMembers(members);
}

export async function getMember(id: string) {
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) throw ApiError.notFound('User not found');
  return toPublicMember(member);
}

export async function createMember(input: {
  name: string;
  email: string;
  password: string;
  role: string;
  managed_by_id?: string | null;
}) {
  const existing = await prisma.teamMember.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('A user with that email already exists');

  const password_hash = await hashPassword(input.password);
  const member = await prisma.teamMember.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      password_hash,
      managed_by_id: input.managed_by_id ?? null,
      is_first_login: true,
    },
  });
  return toPublicMember(member);
}

interface UpdateInput {
  name?: string;
  role?: string;
  phone?: string | null;
  location?: string | null;
  department?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  is_first_login?: boolean;
}

// `actor` is the authenticated caller. Self-service profile edits are allowed;
// role changes and editing other users require Admin+ (enforced in the route).
export async function updateMember(id: string, input: UpdateInput) {
  const target = await prisma.teamMember.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound('User not found');

  if (target.email === SYSTEM_ADMIN_EMAIL && (input.role || input.name)) {
    // The original app forbids modifying the system admin's name/role.
    if (input.role && input.role !== target.role) {
      throw ApiError.forbidden('The system administrator account cannot be modified.');
    }
  }

  const member = await prisma.teamMember.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.department !== undefined ? { department: input.department } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.avatar_url !== undefined ? { avatar_url: input.avatar_url } : {}),
      ...(input.is_first_login !== undefined ? { is_first_login: input.is_first_login } : {}),
    },
  });
  return toPublicMember(member);
}

export async function deleteMember(id: string) {
  const target = await prisma.teamMember.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound('User not found');
  if (target.email === SYSTEM_ADMIN_EMAIL) {
    throw ApiError.forbidden('The system administrator account cannot be deleted.');
  }
  await prisma.teamMember.delete({ where: { id } });
  return { ok: true };
}

export async function setPaused(id: string, isPaused: boolean) {
  const target = await prisma.teamMember.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound('User not found');
  if (target.email === SYSTEM_ADMIN_EMAIL) {
    throw ApiError.forbidden('The system administrator account cannot be paused.');
  }
  const member = await prisma.teamMember.update({
    where: { id },
    data: { is_paused: isPaused },
  });
  return toPublicMember(member);
}
