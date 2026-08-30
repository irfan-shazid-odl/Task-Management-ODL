'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToChanges } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';
import { useUser } from '@/components/UserContext';
import { Skeleton } from '@/components/Skeleton';
import { FileBarChart, Download } from 'lucide-react';
import { useProjects } from '@/hooks/queries/useProjects';
import { useTasks, useUpdateTask } from '@/hooks/queries/useTasks';
import { useTaskAssignments, useReplaceAssignees } from '@/hooks/queries/useTaskAssignments';
import { useTimeLogs, useCreateTimeLog } from '@/hooks/queries/useTimeLogs';
import { useTeamMembers } from '@/hooks/queries/useTeamMembers';
import { buildTaskReportRows, filterTaskRows, sortTaskRows, distinctValues, formatReportDateLabel } from '@/features/reports/lib/reportData';
import type { ReportSortKey, SortDirection, TaskReportRow } from '@/features/reports/types';
import ReportsSummaryCards from '@/features/reports/components/ReportsSummaryCards';
import ReportsFilters from '@/features/reports/components/ReportsFilters';
import ReportsTable from '@/features/reports/components/ReportsTable';

export default function ReportsPage() {
  const { loading: userLoading, currentUser } = useUser();
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // One filter per column header — each defaults to "All" and narrows to an
  // exact value once the lead picks one from that column's dropdown.
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // A→Z / Z→A per column, same as the filter dropdown it lives in.
  const [sortKey, setSortKey] = useState<ReportSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  // Defaults to a single day (today); widen dateFrom/dateTo to review any range.
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [dateFrom, setDateFrom] = useState<string>(todayStr);
  const [dateTo, setDateTo] = useState<string>(todayStr);

  // Server state.
  const projectsQuery = useProjects({ include: 'lead,client' });
  const tasksQuery = useTasks({ order_by: 'id', order: 'asc' });
  const assignmentsQuery = useTaskAssignments();
  const membersQuery = useTeamMembers();
  const timeLogsQuery = useTimeLogs({ logDateGte: dateFrom, logDateLte: dateTo });

  const queryClient = useQueryClient();

  // Live report — everything a member creates or edits (tasks, per-assignee
  // status, logged time, new members, projects) is re-fetched every 8s while
  // this page is open, so the lead sees it without a manual refresh. The
  // poller pauses while the tab is hidden (same convention as the board,
  // dashboard, and admin task pages).
  useEffect(() => {
    const unsub = subscribeToChanges(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.taskAssignments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeLogs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    });
    return unsub;
  }, [queryClient]);

  const loading =
    projectsQuery.isLoading ||
    tasksQuery.isLoading ||
    assignmentsQuery.isLoading ||
    membersQuery.isLoading ||
    timeLogsQuery.isLoading;

  const rows = useMemo(
    () =>
      buildTaskReportRows(
        projectsQuery.data || [],
        tasksQuery.data || [],
        assignmentsQuery.data || [],
        membersQuery.data || [],
        timeLogsQuery.data || [],
        dateFrom,
        dateTo,
      ),
    [projectsQuery.data, tasksQuery.data, assignmentsQuery.data, membersQuery.data, timeLogsQuery.data, dateFrom, dateTo],
  );

  // Everybody — member, lead, admin — sees every task here, mirroring the
  // board's "All Members" central view, so a member's created/updated tasks
  // always flow to the report.
  const assignableMembers = membersQuery.data || [];

  // Every distinct value actually present today, for each column's filter dropdown.
  const clientOptions = useMemo(() => distinctValues(rows, r => [r.clientName]), [rows]);
  const projectOptions = useMemo(() => distinctValues(rows, r => [r.projectName]), [rows]);
  const assigneeOptions = useMemo(() => distinctValues(rows, r => r.assignees.map(a => a.name)), [rows]);

  const filtered = useMemo(
    () => filterTaskRows(rows, {
      search,
      status: statusFilter,
      category: categoryFilter,
      client: clientFilter,
      project: projectFilter,
      assignee: assigneeFilter,
    }),
    [rows, search, statusFilter, categoryFilter, clientFilter, projectFilter, assigneeFilter],
  );

  const sorted = useMemo(() => sortTaskRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const handleSort = (key: ReportSortKey, dir: SortDirection) => {
    setSortKey(key);
    setSortDir(dir);
  };

  // Stats
  const totalTasks = filtered.length;
  const totalProjects = new Set(filtered.map(r => r.projectId).filter(Boolean)).size;
  const totalMembers = new Set(filtered.flatMap(r => r.assignees.map(a => a.id))).size;
  const totalLoggedTime = filtered.reduce((s, r) => s + r.loggedTime, 0);

  // Inline editing — every column updates immediately from the table.
  const updateTask = useUpdateTask();
  const replaceAssignees = useReplaceAssignees();
  const createTimeLog = useCreateTimeLog();
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const handleCategoryChange = async (taskId: string, category: string) => {
    setSavingTaskId(taskId);
    try {
      await updateTask.mutateAsync({ id: taskId, patch: { category: category || null } });
    } catch (err: any) {
      toast.error(`Failed to update category: ${err?.message || 'error'}`);
    } finally {
      setSavingTaskId(null);
    }
  };
  const handleStatusChange = async (taskId: string, status: string) => {
    setSavingTaskId(taskId);
    try {
      await updateTask.mutateAsync({ id: taskId, patch: { status } });
      toast.success('Status updated');
    } catch (err: any) {
      toast.error(`Failed to update status: ${err?.message || 'error'}`);
    } finally {
      setSavingTaskId(null);
    }
  };
  const handleDescriptionChange = async (taskId: string, description: string) => {
    setSavingTaskId(taskId);
    try {
      await updateTask.mutateAsync({ id: taskId, patch: { description } });
    } catch (err: any) {
      toast.error(`Failed to update description: ${err?.message || 'error'}`);
    } finally {
      setSavingTaskId(null);
    }
  };
  const handleEstimatedTimeChange = async (taskId: string, estimatedTime: number) => {
    setSavingTaskId(taskId);
    try {
      await updateTask.mutateAsync({ id: taskId, patch: { estimated_time: estimatedTime } });
    } catch (err: any) {
      toast.error(`Failed to update estimated time: ${err?.message || 'error'}`);
    } finally {
      setSavingTaskId(null);
    }
  };
  const handleAssigneesChange = async (row: TaskReportRow, memberIds: string[]) => {
    setSavingTaskId(row.taskId);
    try {
      await replaceAssignees.mutateAsync({
        taskId: row.taskId,
        assignees: memberIds.map(id => ({ member_id: id, status: row.status })),
      });
    } catch (err: any) {
      toast.error(`Failed to update assignees: ${err?.message || 'error'}`);
    } finally {
      setSavingTaskId(null);
    }
  };
  // Logged Time is an aggregate over time_logs, not a single stored field —
  // editing it inserts the delta between the new total and the current one,
  // dated to whichever day the report is currently viewing (same convention
  // the board and admin task manager use for hour edits).
  const handleLoggedTimeChange = async (row: TaskReportRow, newValue: number) => {
    const delta = newValue - row.loggedTime;
    if (delta === 0) return;
    const memberId = row.assignees[0]?.id || currentUser?.id;
    if (!memberId) {
      toast.error('Assign someone to this task before logging time.');
      return;
    }
    setSavingTaskId(row.taskId);
    try {
      await createTimeLog.mutateAsync({
        task_id: row.taskId,
        member_id: memberId,
        hours_logged: 0,
        billing_hours: delta,
        // A range has no single unambiguous day to attribute the edit to —
        // file it under the most recent day in the range being viewed.
        log_date: dateTo,
      });
    } catch (err: any) {
      toast.error(`Failed to update logged time: ${err?.message || 'error'}`);
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      // Load the rasterizer only when the user actually clicks Save — it's a
      // sizable library that otherwise bloats this page's bundle for everyone.
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      const dateLabel = dateFrom === dateTo ? dateFrom : `${dateFrom}_to_${dateTo}`;
      link.download = `report-${dateLabel}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-100 rounded-xl">
              <FileBarChart className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
              <p className="text-sm text-slate-500">
                Task-level breakdown — client, project, assignee, category, and logged time
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Saving...' : 'Save as Image'}
          </button>
        </div>

        {/* Capturable report area */}
        <div ref={reportRef}>
          <ReportsSummaryCards
            totalTasks={totalTasks}
            totalProjects={totalProjects}
            totalMembers={totalMembers}
            totalLoggedTime={totalLoggedTime}
          />

          <ReportsFilters
            search={search}
            onSearchChange={setSearch}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            todayStr={todayStr}
          />

          {/* Report Date banner — single day, or the full range when one is picked */}
          <div className="mb-4 bg-white border border-slate-200 rounded-xl py-2.5 text-center text-sm font-medium text-slate-600 shadow-sm">
            Report Date: {formatReportDateLabel(dateFrom, dateTo)}
          </div>

          <ReportsTable
            rows={sorted}
            totalLoggedTime={totalLoggedTime}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            clientOptions={clientOptions}
            projectOptions={projectOptions}
            assigneeOptions={assigneeOptions}
            clientFilter={clientFilter}
            projectFilter={projectFilter}
            assigneeFilter={assigneeFilter}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            onClientFilterChange={setClientFilter}
            onProjectFilterChange={setProjectFilter}
            onAssigneeFilterChange={setAssigneeFilter}
            onStatusFilterChange={setStatusFilter}
            onCategoryFilterChange={setCategoryFilter}
            onCategoryChange={handleCategoryChange}
            onStatusChange={handleStatusChange}
            onDescriptionChange={handleDescriptionChange}
            onEstimatedTimeChange={handleEstimatedTimeChange}
            onAssigneesChange={handleAssigneesChange}
            onLoggedTimeChange={handleLoggedTimeChange}
            assignableMembers={assignableMembers}
            savingTaskId={savingTaskId}
          />
        </div>{/* end reportRef */}
      </div>
    </div>
  );
}
