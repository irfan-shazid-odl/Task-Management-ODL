import { apiFetch } from '../client';
import type { TeamMember, Role } from '@/lib/types';

export const usersApi = {
  list(): Promise<TeamMember[]> {
    return apiFetch<TeamMember[]>('/users');
  },

  get(id: string): Promise<TeamMember> {
    return apiFetch<TeamMember>(`/users/${id}`);
  },

  create(input: { name: string; email: string; password: string; role: Role }): Promise<{ user: TeamMember }> {
    return apiFetch('/users', { method: 'POST', body: input });
  },

  update(
    id: string,
    input: Partial<{
      name: string;
      role: Role;
      phone: string | null;
      location: string | null;
      department: string | null;
      bio: string | null;
      avatar_url: string | null;
      is_first_login: boolean;
    }>,
  ): Promise<{ user: TeamMember }> {
    return apiFetch(`/users/${id}`, { method: 'PATCH', body: input });
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/users/${id}`, { method: 'DELETE' });
  },

  setPaused(id: string, isPaused: boolean): Promise<{ user: TeamMember }> {
    return apiFetch(`/users/${id}/pause`, { method: 'POST', body: { isPaused } });
  },
};
