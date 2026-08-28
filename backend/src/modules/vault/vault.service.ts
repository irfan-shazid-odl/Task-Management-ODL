import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { serialize } from '../../utils/serialize.js';

export async function listForMember(memberId: string) {
  const items = await prisma.passwordVaultItem.findMany({
    where: { member_id: memberId },
    orderBy: { created_at: 'desc' },
  });
  return serialize(items);
}

interface VaultInput {
  title: string;
  username?: string;
  encrypted_password?: string;
  url?: string;
  notes?: string;
  folder?: string;
}

export async function createForMember(memberId: string, input: VaultInput) {
  const item = await prisma.passwordVaultItem.create({
    data: { member_id: memberId, ...input },
  });
  return serialize(item);
}

async function assertOwned(id: string, memberId: string) {
  const item = await prisma.passwordVaultItem.findUnique({ where: { id } });
  if (!item || item.member_id !== memberId) throw ApiError.notFound('Vault item not found');
  return item;
}

export async function updateForMember(id: string, memberId: string, input: Partial<VaultInput>) {
  await assertOwned(id, memberId);
  const item = await prisma.passwordVaultItem.update({ where: { id }, data: input });
  return serialize(item);
}

export async function deleteForMember(id: string, memberId: string) {
  await assertOwned(id, memberId);
  await prisma.passwordVaultItem.delete({ where: { id } });
  return { ok: true };
}
