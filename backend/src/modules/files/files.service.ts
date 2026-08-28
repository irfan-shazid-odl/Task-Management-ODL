import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

interface StoreInput {
  ownerId?: string;
  kind: string;
  fileName: string;
  mimeType: string;
  data: Buffer;
}

export async function storeFile(input: StoreInput) {
  const asset = await prisma.fileAsset.create({
    data: {
      owner_id: input.ownerId ?? null,
      kind: input.kind,
      file_name: input.fileName,
      mime_type: input.mimeType,
      size_bytes: input.data.length,
      data: new Uint8Array(input.data),
    },
    select: { id: true, file_name: true, mime_type: true, size_bytes: true, kind: true },
  });
  return asset;
}

export async function getFile(id: string) {
  const asset = await prisma.fileAsset.findUnique({ where: { id } });
  if (!asset) throw ApiError.notFound('File not found');
  return asset;
}

export async function deleteFile(id: string) {
  await prisma.fileAsset.delete({ where: { id } });
  return { ok: true };
}
