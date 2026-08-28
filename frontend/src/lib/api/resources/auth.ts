import { apiFetch, setToken, clearToken } from '../client';
import type { TeamMember } from '@/lib/types';

export interface LoginResult {
  token: string;
  user: TeamMember;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResult> {
    const result = await apiFetch<LoginResult>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    setToken(result.token);
    return result;
  },

  logout() {
    clearToken();
  },

  me(): Promise<TeamMember> {
    return apiFetch<TeamMember>('/auth/me');
  },

  changePassword(newPassword: string, currentPassword?: string): Promise<{ success: boolean }> {
    return apiFetch('/auth/change-password', {
      method: 'POST',
      body: { newPassword, currentPassword },
    });
  },

  resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      auth: false,
      body: { email, newPassword },
    });
  },
};
