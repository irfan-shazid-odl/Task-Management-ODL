import type { TeamMember, TaskStatus } from '@/lib/types';
import type { TaskReportRow, ReportSortKey, SortDirection } from '../types';
import { ACTIVE_STATUSES } from '../constants';

// Determine the dominant status across a task's per-assignee overrides.
export function getDominantStatus(statuses: TaskStatus[]): TaskStatus {
  if (statuses.length === 0) return 'Todo';
  if (statuses.every(s => s === 'Complete')) return 'Complete';
  if (statuses.some(s => s === 'Working')) return 'Working';
  if (statuses.some(s => s === 'On Review')) return 'On Review';
  if (statuses.some(s => s === 'Todo')) return 'Todo';
  return 'Working';
}

// Build one row per task within [dateFrom, dateTo] (inclusive). Pass the same
// value for both to get a single day. A task's own log_date must fall inside
// that window to appear — this is a historical slice, not a live board, so
// there's no carry-over of older unfinished tasks.
export function buildTaskReportRows(
  projects: any[],
  tasks: any[],
  assignments: any[],
  allMembers: any[],
  timeLogs: any[],
  dateFrom: string,
  dateTo: string,
): TaskReportRow[] {
  const memberLookup: Record<string, TeamMember> = {};
  (allMembers || []).forEach((m: any) => { memberLookup[m.id] = m; });

  const projectLookup: Record<string, any> = {};
  (projects || []).forEach((p: any) => { projectLookup[p.id] = p; });

  // Same two-signal merge as the board: a task's real status is whichever of
  // tasks.status / task_assignments.status (per assignee) is further along.
  const STATUS_RANK: Record<string, number> = { Todo: 0, Working: 1, 'On Review': 2, Complete: 3 };
  const taskAssignmentStatusMap: Record<string, TaskStatus[]> = {};
  (assignments || []).forEach((a: any) => {
    if (!a.status) return;
    (taskAssignmentStatusMap[a.task_id] ||= []).push(a.status);
  });
  const effectiveStatus = (t: any): TaskStatus => {
    const statuses = taskAssignmentStatusMap[t.id];
    const dominant = statuses && statuses.length > 0 ? getDominantStatus(statuses) : null;
    if (!dominant) return t.status;
    return STATUS_RANK[dominant] >= STATUS_RANK[t.status] ? dominant : t.status;
  };

  const includeTask = (t: any): boolean => {
    if (!dateFrom && !dateTo) return true;
    // t.log_date comes back as a full ISO timestamp ("2026-08-27T00:00:00.000Z"),
    // never equal to a plain "YYYY-MM-DD" bound by string equality — normalize
    // to the date-only portion before comparing.
    const raw: string | null | undefined = t.log_date;
    if (!raw) return false;
    const d = raw.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const assigneesByTask: Record<string, TeamMember[]> = {};
  (assignments || []).forEach((a: any) => {
    const member = memberLookup[a.member_id];
    if (!member) return;
    (assigneesByTask[a.task_id] ||= []).push(member);
  });

  // "Logged Time" = what the app tracks internally as billing hours.
  const loggedTimeByTask: Record<string, number> = {};
  (timeLogs || []).forEach((log: any) => {
    loggedTimeByTask[log.task_id] = (loggedTimeByTask[log.task_id] || 0) + (log.billing_hours || 0);
  });

  return (tasks || [])
    .filter(includeTask)
    .map((t: any): TaskReportRow => {
      const project = t.project_id ? projectLookup[t.project_id] : null;
      const client = project?.client || null;
      return {
        taskId: t.id,
        logDate: t.log_date || null,
        clientId: client?.id || project?.client_id || null,
        clientName: client?.name || project?.client_name || '—',
        projectId: t.project_id || null,
        projectName: project?.name || '— No Project —',
        description: t.description,
        assignees: assigneesByTask[t.id] || [],
        category: t.category || null,
        estimatedTime: t.estimated_time ?? null,
        status: effectiveStatus(t),
        loggedTime: Math.max(0, loggedTimeByTask[t.id] || 0),
      };
    });
}

export interface ReportFilters {
  search: string;
  status: string;
  category: string;
  client: string;
  project: string;
  assignee: string;
}

// Free-text search plus one exact-match filter per column — each column
// header carries a dropdown of every distinct value actually present in the
// day's rows, and picking one narrows the table to just that value.
export function filterTaskRows(rows: TaskReportRow[], f: ReportFilters): TaskReportRow[] {
  return rows.filter(r => {
    if (f.status === 'Active' && !ACTIVE_STATUSES.includes(r.status)) return false;
    else if (f.status !== 'All' && f.status !== 'Active' && r.status !== f.status) return false;
    if (f.category !== 'All' && (r.category || 'Uncategorized') !== f.category) return false;
    if (f.client !== 'All' && r.clientName !== f.client) return false;
    if (f.project !== 'All' && r.projectName !== f.project) return false;
    if (f.assignee !== 'All' && !r.assignees.some(a => a.name === f.assignee)) return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      return (
        r.clientName.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.assignees.some(m => m.name.toLowerCase().includes(q))
      );
    }
    return true;
  });
}

// A→Z / Z→A (or low→high / high→low for the numeric columns) — the same
// per-column sort every spreadsheet's column menu offers, on top of the
// exact-value filter that same dropdown also carries.
export function sortTaskRows(rows: TaskReportRow[], key: ReportSortKey | null, dir: SortDirection): TaskReportRow[] {
  if (!key) return rows;
  const rank = dir === 'asc' ? 1 : -1;
  const STATUS_RANK: Record<string, number> = { Todo: 0, Working: 1, 'On Review': 2, Complete: 3 };
  const valueOf = (r: TaskReportRow): string | number => {
    switch (key) {
      case 'client': return r.clientName.toLowerCase();
      case 'project': return r.projectName.toLowerCase();
      case 'assignee': return (r.assignees[0]?.name || '').toLowerCase();
      case 'category': return (r.category || 'zzz').toLowerCase();
      case 'status': return STATUS_RANK[r.status] ?? 0;
      default: return '';
    }
  };
  return [...rows].sort((a, b) => {
    const av = valueOf(a);
    const bv = valueOf(b);
    if (av < bv) return -1 * rank;
    if (av > bv) return 1 * rank;
    return 0;
  });
}

// Distinct, sorted values for a column's filter dropdown.
export function distinctValues(rows: TaskReportRow[], pick: (r: TaskReportRow) => string[]): string[] {
  const set = new Set<string>();
  rows.forEach(r => pick(r).forEach(v => { if (v) set.add(v); }));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function formatDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

// "Report Date: 28 Aug 26" for a single day, "Report Date: 28 Aug 26 - 02 Sep 26" for a range.
export function formatReportDateLabel(dateFrom: string, dateTo: string): string {
  if (!dateFrom && !dateTo) return 'All time';
  if (dateFrom === dateTo) return formatDate(dateFrom);
  return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
}
