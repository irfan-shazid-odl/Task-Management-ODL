import { apiFetch } from '../client';
import type { Task } from '@/lib/types';

export interface TaskListParams {
  project_id?: string;
  ids?: string[];
  status?: string[];
  log_date?: string;
  log_date_lt?: string;
  log_date_lte?: string;
  log_date_gte?: string;
  created_from?: string;
  created_to?: string;
  board_date?: string;
  carry_over?: boolean;
  order_by?: 'created_at' | 'deadline' | 'id';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  include?: string; // 'project,reference_doc'
  count?: boolean;
}

export interface TaskData {
  project_id?: string | null;
  description: string;
  status?: string;
  priority?: string;
  deadline?: string | null;
  reference_doc_id?: string | null;
  category?: string | null;
  estimated_time?: number | null;
  log_date?: string;
}

function toQuery(p: TaskListParams): Record<string, string | number | boolean | undefined> {
  return {
    project_id: p.project_id,
    ids: p.ids?.join(','),
    status: p.status?.join(','),
    log_date: p.log_date,
    log_date_lt: p.log_date_lt,
    log_date_lte: p.log_date_lte,
    log_date_gte: p.log_date_gte,
    created_from: p.created_from,
    created_to: p.created_to,
    board_date: p.board_date,
    carry_over: p.carry_over,
    order_by: p.order_by,
    order: p.order,
    limit: p.limit,
    offset: p.offset,
    include: p.include,
    count: p.count,
  };
}

// Raw materials for one board render, fetched in a single round trip.
// Every date field is returned untouched so the caller keeps doing its own
// local-timezone bucketing — see boardBundle() on the server.
export interface BoardBundle {
  tasks: Task[];
  /** The focused member's own assignments (empty on the "all members" board). */
  memberAssignments: { task_id: string; member_id: string; status: string }[];
  /** Every assignee of every returned task, for avatars. */
  assignments: { task_id: string; member_id: string; status: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timeLogs: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: any[];
}

export const tasksApi = {
  list(params: TaskListParams = {}): Promise<Task[]> {
    return apiFetch<Task[]>('/tasks', { query: toQuery(params) });
  },

  // Single-request replacement for the board's old five-request fetch.
  board(params: TaskListParams & { member_id?: string } = {}): Promise<BoardBundle> {
    return apiFetch<BoardBundle>('/tasks/board', {
      query: { ...toQuery(params), member_id: params.member_id },
    });
  },

  // Paginated variant: returns { data, count }.
  listWithCount(params: TaskListParams = {}): Promise<{ data: Task[]; count: number }> {
    return apiFetch('/tasks', { query: toQuery({ ...params, count: true }) });
  },

  create(input: {
    task: TaskData;
    assigneeIds?: string[];
    anchor?: { member_id: string | null; log_date: string } | null;
  }): Promise<Task> {
    return apiFetch('/tasks', { method: 'POST', body: input });
  },

  update(id: string, patch: Partial<TaskData>): Promise<Task> {
    return apiFetch(`/tasks/${id}`, { method: 'PATCH', body: patch });
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/tasks/${id}`, { method: 'DELETE' });
  },
};
