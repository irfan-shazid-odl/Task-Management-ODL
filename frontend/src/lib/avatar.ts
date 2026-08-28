import { api } from '@/lib/api';
import { filesApi } from '@/lib/api/resources/files';

// Avatars are now stored as binary inside PostgreSQL and served by the backend.
// `team_members.avatar_url` holds the absolute servable URL of the file asset.

export function getSignedAvatarUrl(url: string | null | undefined): Promise<string | null> {
  // The stored value is already a servable URL — return it as-is.
  return Promise.resolve(url || null);
}

export function invalidateAvatarUrl(_url: string | null | undefined) {
  // No-op: URLs are stable per uploaded asset.
}

// Uploads an avatar and returns the absolute URL to store in avatar_url.
export async function uploadAvatar(_userId: string, file: File): Promise<string> {
  const asset = await api.files.upload(file, 'avatar');
  return filesApi.urlFor(asset.id);
}

function extractAssetId(url: string): string | null {
  const match = url.match(/\/files\/([0-9a-fA-F-]{36})/);
  return match ? match[1] : null;
}

export async function deleteAvatar(url: string): Promise<void> {
  const id = extractAssetId(url);
  if (id) {
    try {
      await api.files.remove(id);
    } catch {
      /* best-effort cleanup */
    }
  }
}
