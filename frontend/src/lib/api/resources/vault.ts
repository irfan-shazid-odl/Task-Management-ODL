import { apiFetch } from '../client';

export interface VaultItem {
  id: string;
  member_id: string;
  title: string;
  username: string;
  encrypted_password: string;
  url: string;
  notes: string;
  folder: string;
  created_at?: string;
  updated_at?: string;
}

type VaultInput = Partial<Omit<VaultItem, 'id' | 'member_id' | 'created_at' | 'updated_at'>> & {
  title: string;
};

export const vaultApi = {
  list(): Promise<VaultItem[]> {
    return apiFetch<VaultItem[]>('/vault');
  },
  create(data: VaultInput): Promise<VaultItem> {
    return apiFetch('/vault', { method: 'POST', body: data });
  },
  update(id: string, data: Partial<VaultInput>): Promise<VaultItem> {
    return apiFetch(`/vault/${id}`, { method: 'PATCH', body: data });
  },
  remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/vault/${id}`, { method: 'DELETE' });
  },
};
