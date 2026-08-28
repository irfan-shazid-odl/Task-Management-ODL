// Centralized query keys — the single source of truth for cache identity and
// invalidation. Import these everywhere instead of hand-writing key arrays.

import type { TaskListParams } from '@/lib/api/resources/tasks';
import type { TimeLogListParams } from '@/lib/api/resources/timeLogs';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (opts?: unknown) => ['projects', 'list', opts ?? null] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    count: ['projects', 'count'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (params?: TaskListParams) => ['tasks', 'list', params ?? null] as const,
  },
  taskAssignments: {
    all: ['task-assignments'] as const,
    list: (params?: { taskIds?: string[]; memberId?: string }) =>
      ['task-assignments', params ?? null] as const,
  },
  timeLogs: {
    all: ['time-logs'] as const,
    list: (params?: TimeLogListParams) => ['time-logs', params ?? null] as const,
  },
  clients: {
    all: ['clients'] as const,
  },
  subscriptions: {
    all: ['subscriptions'] as const,
  },
  activity: {
    all: ['activity'] as const,
    list: (params?: { projectId?: string; limit?: number }) =>
      ['activity', params ?? null] as const,
  },
  credentials: {
    forProject: (projectId: string) => ['credentials', projectId] as const,
  },
  documents: {
    forProject: (projectId: string) => ['documents', 'project', projectId] as const,
    byIds: (ids: string[]) => ['documents', 'byIds', ids] as const,
  },
  vault: {
    all: ['vault'] as const,
  },
} as const;
