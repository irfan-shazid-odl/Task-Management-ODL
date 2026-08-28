import type { Task, Project, TaskStatus, TaskPriority } from '@/lib/types';

export type TaskWithProject = Task & { project?: Project };

// Roles that see every task in the daily agenda (not just their own assignments).
export const ROLES_WITH_FULL_DAILY_ACCESS = new Set(['super-admin', 'Admin', 'Lead']);

export const TASK_STATUSES: TaskStatus[] = ['Todo', 'Working', 'On Review', 'Complete'];

export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'High', 'Urgent'];
