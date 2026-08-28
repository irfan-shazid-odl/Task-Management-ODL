import { TaskStatus, TASK_STATUSES } from '@/lib/types';
import type { Task } from '@/lib/types';
import type { ActivityLogRow } from '@/lib/api/resources/activity';

// Shapes rendered by the dashboard panels. Kept intentionally narrow — the page
// derives these from the query data and hands them to presentational components.
export interface StatusCount {
  status: TaskStatus;
  count: number;
}

export interface RecentTask {
  description: string;
  status: TaskStatus;
  priority: string;
  project?: { id: string; name: string };
}

export interface RecentActivityItem {
  description: string;
  action_type: string;
  created_at: string;
  member: { name: string };
  project_name?: string;
}

export interface ProjectHours {
  id: string;
  name: string;
  category: string;
  hours: number;
}

// Time-log rows fetched with `include: 'task.project'` — only the fields the
// project-distribution aggregation touches are typed here.
interface TimeLogWithProject {
  hours_logged?: number | string;
  task?: { project?: { id: string; name: string; category?: string } | null } | null;
}

interface HoursLog {
  hours_logged: number | string;
  billing_hours: number | string;
}

// Count task statuses client-side. For the member-filtered view the caller
// passes per-assignment statuses; otherwise it passes global task statuses.
export function computeStatusCounts(
  statusData: { status: string }[] | undefined,
): { totalActive: number; statusCounts: StatusCount[] } {
  const statusCountMap = new Map<string, number>(TASK_STATUSES.map((s) => [s, 0]));
  let activeCount = 0;
  (statusData || []).forEach((entry: { status: string }) => {
    if (entry.status !== 'Complete') activeCount++;
    const prev = statusCountMap.get(entry.status);
    if (prev !== undefined) statusCountMap.set(entry.status, prev + 1);
  });
  return {
    totalActive: activeCount,
    statusCounts: TASK_STATUSES.map((status) => ({ status, count: statusCountMap.get(status) || 0 })),
  };
}

export function computeHours(
  logsData: HoursLog[] | undefined,
): { totalWorkingHours: number; totalBillingHours: number } {
  const totalHours = (logsData || []).reduce((sum, log) => sum + Number(log.hours_logged), 0);
  const totalBilling = (logsData || []).reduce((sum, log) => sum + Number(log.billing_hours), 0);
  return {
    totalWorkingHours: Math.max(0, totalHours),
    totalBillingHours: Math.max(0, totalBilling),
  };
}

export function mapRecentTasks(recentData: Task[] | undefined): RecentTask[] {
  return recentData
    ? recentData.map((t) => ({
        description: t.description,
        status: t.status as TaskStatus,
        priority: t.priority,
        project: t.project as unknown as { id: string; name: string },
      }))
    : [];
}

// The activity-logs endpoint has no date/member filter, so we reproduce the
// original created_at range + member_id filtering client-side, then take the 5
// most recent (the list is already ordered created_at desc).
export function filterRecentActivity(
  actAll: ActivityLogRow[] | undefined,
  filters: { startDate: string; endDate: string; memberFilter: string | null },
): RecentActivityItem[] {
  const { startDate, endDate, memberFilter } = filters;
  const actData = (actAll || [])
    .filter((a) => {
      if (startDate && a.created_at < startDate + 'T00:00:00') return false;
      if (endDate && a.created_at > endDate + 'T23:59:59') return false;
      if (memberFilter && a.member_id !== memberFilter) return false;
      return true;
    })
    .slice(0, 5);

  return actData.map((a) => ({
    description: a.description,
    action_type: a.action_type,
    created_at: a.created_at,
    member: { name: a.member?.name || 'Unknown' },
    project_name: a.project?.name,
  }));
}

export function computeProjectHours(allLogs: TimeLogWithProject[] | undefined): ProjectHours[] {
  const pHours = new Map<string, ProjectHours>();
  (allLogs || []).forEach((log) => {
    const proj = log.task?.project;
    if (!proj?.id) return;
    const current = pHours.get(proj.id) || {
      id: proj.id,
      name: proj.name,
      category: proj.category || 'Internal',
      hours: 0,
    };
    current.hours += Number(log.hours_logged || 0);
    pHours.set(proj.id, current);
  });
  const projectHoursList = Array.from(pHours.values()).map((ph) => ({
    ...ph,
    hours: Math.max(0, ph.hours),
  }));
  return projectHoursList.sort((a, b) => b.hours - a.hours);
}
