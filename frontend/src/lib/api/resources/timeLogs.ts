import { apiFetch } from '../client';
import type { TimeLog } from '@/lib/types';

export interface TimeLogListParams {
  taskIds?: string[];
  memberId?: string;
  logDateGte?: string;
  logDateLte?: string;
  include?: string; // 'task.project'
}

export const timeLogsApi = {
  list(params: TimeLogListParams = {}): Promise<TimeLog[]> {
    return apiFetch<TimeLog[]>('/time-logs', {
      query: {
        task_ids: params.taskIds?.join(','),
        member_id: params.memberId,
        log_date_gte: params.logDateGte,
        log_date_lte: params.logDateLte,
        include: params.include,
      },
    });
  },

  latest(taskId: string): Promise<{ id: string; log_date: string } | null> {
    return apiFetch('/time-logs/latest', { query: { task_id: taskId } });
  },

  create(input: {
    task_id: string;
    member_id?: string | null;
    hours_logged: number;
    billing_hours?: number;
    log_date: string;
  }): Promise<TimeLog> {
    return apiFetch('/time-logs', { method: 'POST', body: input });
  },

  update(
    id: string,
    input: { log_date?: string; hours_logged?: number; billing_hours?: number },
  ): Promise<TimeLog> {
    return apiFetch(`/time-logs/${id}`, { method: 'PATCH', body: input });
  },
};
