import { apiFetch, type ApiInput } from '../client';
import type { Client, Subscription, ProjectCredential, ProjectDocument, Subscription as Sub } from '@/lib/types';

// ── Clients ───────────────────────────────────────────────────────────────
export const clientsApi = {
  list(): Promise<Client[]> {
    return apiFetch<Client[]>('/clients');
  },
  create(data: ApiInput<Client> & { name: string }): Promise<Client> {
    return apiFetch('/clients', { method: 'POST', body: data });
  },
  update(id: string, data: ApiInput<Client>): Promise<Client> {
    return apiFetch(`/clients/${id}`, { method: 'PATCH', body: data });
  },
  remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/clients/${id}`, { method: 'DELETE' });
  },
};

// ── Subscriptions ───────────────────────────────────────────────────────────
export const subscriptionsApi = {
  list(): Promise<Subscription[]> {
    return apiFetch<Subscription[]>('/subscriptions');
  },
  // Count of subscriptions lapsing strictly before `before` (a YYYY-MM-DD the
  // caller computes in its own timezone). Used by the sidebar badge so it
  // doesn't have to download every subscription just to count a few.
  // Strictly-before, not on-or-before, to match the string comparison the
  // badge previously did client-side — see the route for the full reasoning.
  expiringCount(before: string): Promise<{ count: number }> {
    return apiFetch<{ count: number }>('/subscriptions/expiring-count', { query: { before } });
  },
  create(data: ApiInput<Sub> & { name: string; email: string; start_date: string }): Promise<Subscription> {
    return apiFetch('/subscriptions', { method: 'POST', body: data });
  },
  update(id: string, data: ApiInput<Sub>): Promise<Subscription> {
    return apiFetch(`/subscriptions/${id}`, { method: 'PATCH', body: data });
  },
  remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/subscriptions/${id}`, { method: 'DELETE' });
  },
};

// ── Project credentials ─────────────────────────────────────────────────────
export const credentialsApi = {
  listForProject(projectId: string): Promise<ProjectCredential[]> {
    return apiFetch<ProjectCredential[]>('/project-credentials', { query: { project_id: projectId } });
  },
  create(data: ApiInput<ProjectCredential> & { project_id: string; label: string }): Promise<ProjectCredential> {
    return apiFetch('/project-credentials', { method: 'POST', body: data });
  },
  update(id: string, data: ApiInput<ProjectCredential>): Promise<ProjectCredential> {
    return apiFetch(`/project-credentials/${id}`, { method: 'PATCH', body: data });
  },
  remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/project-credentials/${id}`, { method: 'DELETE' });
  },
};

// ── Project documents ───────────────────────────────────────────────────────
// doc_type is stored as a string in the UI; kept loose here to match callers.
type DocInput = { project_id: string; title: string; url: string; doc_type: string };

export const documentsApi = {
  listForProject(projectId: string): Promise<ProjectDocument[]> {
    return apiFetch<ProjectDocument[]>('/project-documents', { query: { project_id: projectId } });
  },
  listByIds(ids: string[]): Promise<ProjectDocument[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return apiFetch<ProjectDocument[]>('/project-documents', { query: { ids: ids.join(',') } });
  },
  create(data: DocInput): Promise<ProjectDocument> {
    return apiFetch('/project-documents', { method: 'POST', body: data });
  },
  update(id: string, data: Partial<DocInput>): Promise<ProjectDocument> {
    return apiFetch(`/project-documents/${id}`, { method: 'PATCH', body: data });
  },
  remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/project-documents/${id}`, { method: 'DELETE' });
  },
};
