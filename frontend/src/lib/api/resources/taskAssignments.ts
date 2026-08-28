import { apiFetch } from '../client';
import type { TaskAssignment } from '@/lib/types';

export const taskAssignmentsApi = {
  list(params: { taskIds?: string[]; memberId?: string } = {}): Promise<TaskAssignment[]> {
    return apiFetch<TaskAssignment[]>('/task-assignments', {
      query: { task_ids: params.taskIds?.join(','), member_id: params.memberId },
    });
  },

  assign(taskId: string, memberId: string): Promise<TaskAssignment> {
    return apiFetch('/task-assignments', {
      method: 'POST',
      body: { task_id: taskId, member_id: memberId },
    });
  },

  unassign(taskId: string, memberId: string): Promise<{ ok: boolean }> {
    return apiFetch('/task-assignments', {
      method: 'DELETE',
      body: { task_id: taskId, member_id: memberId },
    });
  },

  updateStatus(taskId: string, memberId: string, status: string): Promise<{ ok: boolean }> {
    return apiFetch('/task-assignments/status', {
      method: 'PATCH',
      body: { task_id: taskId, member_id: memberId, status },
    });
  },

  // Atomic replace of a task's full assignee set (preserves prior status).
  replaceForTask(
    taskId: string,
    assignees: Array<{ member_id: string; status?: string }>,
  ): Promise<TaskAssignment[]> {
    return apiFetch(`/task-assignments/task/${taskId}`, { method: 'PUT', body: { assignees } });
  },
};
