import type { TeamMember, TaskStatus, TaskCategory } from '@/lib/types';

// One row per task — the report's unit of work, matching how the team
// actually tracks tasks day to day (client → project → task → assignee).
export interface TaskReportRow {
  taskId: string;
  logDate: string | null;
  clientId: string | null;
  clientName: string;
  projectId: string | null;
  projectName: string;
  description: string;
  assignees: TeamMember[];
  category: TaskCategory | null;
  estimatedTime: number | null;
  status: TaskStatus;
  // What used to be tracked as "Billing Hours" — surfaced here as Logged Time.
  loggedTime: number;
}

// Estimated Time / Logged Time are deliberately not sortable.
export type ReportSortKey = 'client' | 'project' | 'assignee' | 'category' | 'status';
export type SortDirection = 'asc' | 'desc';
