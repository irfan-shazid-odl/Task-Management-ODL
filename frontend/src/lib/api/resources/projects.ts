import { apiFetch, type ApiInput } from '../client';
import type { Project } from '@/lib/types';

interface ListOpts {
  include?: string; // 'lead,client'
  orderBy?: 'sort_order' | 'name' | 'created_at';
  order?: 'asc' | 'desc';
}

export const projectsApi = {
  list(opts: ListOpts = {}): Promise<Project[]> {
    return apiFetch<Project[]>('/projects', {
      query: { include: opts.include, order_by: opts.orderBy, order: opts.order },
    });
  },

  count(): Promise<{ count: number }> {
    return apiFetch('/projects', { query: { count: true } });
  },

  get(id: string): Promise<Project> {
    return apiFetch<Project>(`/projects/${id}`);
  },

  create(data: ApiInput<Project> & { name: string; category: string }): Promise<Project> {
    return apiFetch('/projects', { method: 'POST', body: data });
  },

  update(id: string, data: ApiInput<Project>): Promise<Project> {
    return apiFetch(`/projects/${id}`, { method: 'PATCH', body: data });
  },

  reorder(updates: Array<{ id: string; sort_order: number }>): Promise<{ ok: boolean }> {
    return apiFetch('/projects/reorder', { method: 'POST', body: { updates } });
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/projects/${id}`, { method: 'DELETE' });
  },

  overrideHours(
    id: string,
    input: { hours_logged: number; billing_hours: number; log_date: string },
  ): Promise<{ ok: boolean }> {
    return apiFetch(`/projects/${id}/hours`, { method: 'PUT', body: input });
  },
};
