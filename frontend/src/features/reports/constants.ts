import type { TaskStatus, TaskCategory } from '@/lib/types';

// Colors for the task-level Category field (distinct from a project's own category).
export const TASK_CATEGORY_COLORS: Record<TaskCategory, string> = {
  Automation:      'bg-rose-100 text-rose-700',
  Website:         'bg-blue-100 text-blue-700',
  'Landing page':  'bg-amber-100 text-amber-700',
  Workflow:        'bg-emerald-100 text-emerald-700',
  Meta:            'bg-indigo-100 text-indigo-700',
  'Vibe coding':   'bg-cyan-100 text-cyan-700',
  Research:        'bg-teal-100 text-teal-700',
  Documentation:   'bg-violet-100 text-violet-700',
  'AI Agent':      'bg-orange-100 text-orange-700',
  Other:           'bg-slate-100 text-slate-600',
};

export const STATUS_COLORS: Record<string, string> = {
  'Todo':      'bg-slate-50 text-slate-600 border-slate-200',
  'Working':   'bg-blue-50 text-blue-600 border-blue-200',
  'On Review': 'bg-amber-50 text-amber-600 border-amber-200',
  'Complete':  'bg-emerald-50 text-emerald-600 border-emerald-200',
};

export const MEMBER_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
];

// Statuses treated as "active" (used by the status filter's "Active" option).
export const ACTIVE_STATUSES: TaskStatus[] = ['Todo', 'Working'];
