import { apiFetch } from '../client';

export interface ActivityLogRow {
  id: string;
  project_id: string | null;
  member_id: string | null;
  action_type: string;
  description: string;
  created_at: string;
  member?: { id: string; name: string; avatar_url?: string | null; role?: string } | null;
  project?: { id: string; name: string } | null;
}

export const activityApi = {
  list(
    params: { projectId?: string; memberId?: string; createdFrom?: string; createdTo?: string; limit?: number } = {}
  ): Promise<ActivityLogRow[]> {
    return apiFetch<ActivityLogRow[]>('/activity-logs', {
      query: {
        project_id: params.projectId,
        member_id: params.memberId,
        created_from: params.createdFrom,
        created_to: params.createdTo,
        limit: params.limit,
      },
    });
  },

  create(input: {
    project_id?: string | null;
    member_id?: string | null;
    action_type: string;
    description: string;
  }): Promise<ActivityLogRow> {
    return apiFetch('/activity-logs', { method: 'POST', body: input });
  },
};
