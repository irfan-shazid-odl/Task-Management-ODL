import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { toPublicMember } from '../users/users.mapper.js';

export async function login(email: string, password: string) {
  const member = await prisma.teamMember.findUnique({ where: { email } });
  if (!member) throw ApiError.unauthorized('Invalid email or password');

  const ok = await verifyPassword(password, member.password_hash);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  const token = signToken({ sub: member.id, email: member.email, role: member.role });
  return { token, user: toPublicMember(member) };
}

export async function me(userId: string) {
  const member = await prisma.teamMember.findUnique({ where: { id: userId } });
  if (!member) throw ApiError.unauthorized('Account no longer exists');
  return toPublicMember(member);
}

export async function changePassword(
  userId: string,
  newPassword: string,
  currentPassword?: string,
) {
  const member = await prisma.teamMember.findUnique({ where: { id: userId } });
  if (!member) throw ApiError.unauthorized();

  // If the caller supplied their current password, verify it (profile flow).
  if (currentPassword !== undefined) {
    const ok = await verifyPassword(currentPassword, member.password_hash);
    if (!ok) throw ApiError.badRequest('Current password is incorrect');
  }

  const password_hash = await hashPassword(newPassword);
  await prisma.teamMember.update({
    where: { id: userId },
    data: { password_hash, is_first_login: false },
  });
  return { success: true };
}

// Public "forgot password" — resets by email with no prior auth. This mirrors
// the original application's open reset flow (Supabase admin updateUserById
// called from an unauthenticated route). Preserved intentionally for parity.
export async function resetPasswordByEmail(email: string, newPassword: string) {
  const member = await prisma.teamMember.findUnique({ where: { email } });
  if (!member) throw ApiError.notFound('No account found with that email address.');

  const password_hash = await hashPassword(newPassword);
  await prisma.teamMember.update({
    where: { id: member.id },
    data: { password_hash },
  });
  return { success: true, message: 'Password has been reset successfully.' };
}
