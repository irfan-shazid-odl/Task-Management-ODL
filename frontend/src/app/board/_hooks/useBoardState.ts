/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUser } from '@/components/UserContext';
import { Task, TaskStatus, TaskPriority, TaskCategory, TASK_STATUSES } from '@/lib/types';
import { api, subscribeToChanges } from '@/lib/api';
import type { TaskListParams } from '@/lib/api/resources/tasks';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/queries/useProjects';
import { useBoardPDF } from './useBoardPDF';
import { useBoardReports } from './useBoardReports';

export type ViewMode = 'mine' | 'all' | string;

export function useBoardState() {
  const { currentUser, teamMembers } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTasksTable, setShowTasksTable] = useState(true);

  useEffect(() => {
    const savedValue = localStorage.getItem('octopi_show_tasks_table');
    if (savedValue !== null) {
      setShowTasksTable(savedValue === 'true');
    }
  }, []);

  const toggleTasksTable = () => {
    const newState = !showTasksTable;
    setShowTasksTable(newState);
    localStorage.setItem('octopi_show_tasks_table', String(newState));
  };

  const [todaysActivity, setTodaysActivity] = useState<Record<string, { working: number; billing: number }>>({});
  const [todaysTotalHours, setTodaysTotalHours] = useState(0);
  const [todaysTotalBillingHours, setTodaysTotalBillingHours] = useState(0);
  const [todaysTotalProjects, setTodaysTotalProjects] = useState(0);

  const [viewMode, setViewMode] = useState<ViewMode>('mine');

  const [boardFilterMode, setBoardFilterMode] = useState<'day' | 'month'>('day');
  const [boardDate, setBoardDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [boardMonth, setBoardMonth] = useState(() => new Date().toLocaleDateString('en-CA').slice(0, 7));
  const [boardProjectId, setBoardProjectId] = useState<string>('all');
  const [boardProjectDropdownOpen, setBoardProjectDropdownOpen] = useState(false);
  const [boardProjectSearch, setBoardProjectSearch] = useState('');
  const [boardCalendarOpen, setBoardCalendarOpen] = useState(false);
  const boardProjectDropdownRef = useRef<HTMLDivElement>(null);
  const boardCalendarRef = useRef<HTMLDivElement>(null);
  const [boardCalendarViewDate, setBoardCalendarViewDate] = useState(new Date());

  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Todo');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Low');
  const [taskDeadline, setTaskDeadline] = useState(new Date().toLocaleDateString('en-CA'));
  const [taskLogDate, setTaskLogDate] = useState<string>(() => new Date().toLocaleDateString('en-CA'));
  const [taskEstimatedTime, setTaskEstimatedTime] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory | ''>('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskProjectName, setTaskProjectName] = useState('');
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Shared react-query cache instead of a one-shot fetch: project create/update/
  // delete elsewhere in the app (e.g. the Projects page) invalidate this same
  // query, so a Lead adding or removing a project shows up here immediately
  // instead of requiring the member to reload the board.
  const { data: projectsData } = useProjects({ orderBy: 'name', order: 'asc' });
  const availableProjects = useMemo(
    () => (projectsData ?? []).map(p => ({ id: p.id, name: p.name })),
    [projectsData],
  );

  const [projectSearch, setProjectSearch] = useState('');
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const [projectDocs, setProjectDocs] = useState<{ id: string; title: string; url: string; doc_type: string }[]>([]);
  const [refDocId, setRefDocId] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);

  const isSuperAdmin = currentUser?.role === 'super-admin';
  const isMember = currentUser?.role === 'Member';
  // Central "All Members" board + the PDF summary export used to be
  // super-admin only; Leads now get the same board-level controls.
  const canViewAllMembers = isSuperAdmin || currentUser?.role === 'Lead';

  // Guards against out-of-order async responses: changing board date / member /
  // project / range while a fetch is in flight must not let an older response
  // overwrite the newer one.
  const fetchSeqRef = useRef(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(target)) {
        setProjectDropdownOpen(false);
      }
      if (boardProjectDropdownRef.current && !boardProjectDropdownRef.current.contains(target)) {
        setBoardProjectDropdownOpen(false);
      }
      if (boardCalendarRef.current && !boardCalendarRef.current.contains(target)) {
        setBoardCalendarOpen(false);
      }
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(target)) {
        setMemberDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const enrichTasks = useCallback(async (tasksData: any[]) => {
    if (!tasksData.length) return [];
    const taskIds = tasksData.map(t => t.id);
    const refDocIds = [...new Set(tasksData.map((t: any) => t.reference_doc_id).filter(Boolean))];

    const [logsData, refDocs, rawAssignments] = await Promise.all([
      api.timeLogs.list({ taskIds, include: 'task.project' }),
      api.documents.listByIds(refDocIds as string[]),
      api.taskAssignments.list({ taskIds }),
    ]);

    const memberIds = [...new Set((rawAssignments || []).map((a: any) => a.member_id).filter(Boolean))];
    const memberMap = new Map<string, any>();
    if (memberIds.length > 0) {
      const members = (await api.users.list()).filter((m: any) => memberIds.includes(m.id));
      (members || []).forEach((m: any) => memberMap.set(m.id, m));
    }

    const workingHoursByTaskId = new Map<string, number>();
    const billingHoursByTaskId = new Map<string, number>();
    const activityMap: Record<string, { working: number; billing: number }> = {};
    let totalWorking = 0;
    let totalBilling = 0;
    const projectSet = new Set();

    let monthFirst: string | null = null;
    let monthLast: string | null = null;
    if (boardFilterMode === 'month') {
      const [year, month] = boardMonth.split('-').map(Number);
      monthFirst = new Date(year, month - 1, 1).toLocaleDateString('en-CA');
      monthLast = new Date(year, month, 0).toLocaleDateString('en-CA');
    }
    const logInScope = (logDateStr: string): boolean => {
      if (boardFilterMode === 'month') {
        return logDateStr >= (monthFirst as string) && logDateStr <= (monthLast as string);
      }
      return logDateStr === boardDate;
    };

    const focusMemberId =
      viewMode === 'all' ? null : viewMode === 'mine' ? (currentUser?.id ?? null) : viewMode;

    (logsData || []).forEach((log: any) => {
      if (focusMemberId && log.member_id !== focusMemberId) return;
      const working_h = Number(log.hours_logged || 0);
      const billing_h = Number(log.billing_hours || 0);
      const logDateOnly = new Date(log.log_date).toLocaleDateString('en-CA');

      if (logInScope(logDateOnly)) {
        workingHoursByTaskId.set(log.task_id, (workingHoursByTaskId.get(log.task_id) || 0) + working_h);
        billingHoursByTaskId.set(log.task_id, (billingHoursByTaskId.get(log.task_id) || 0) + billing_h);
      }

      if (logDateOnly === boardDate) {
        if (!activityMap[log.task_id]) activityMap[log.task_id] = { working: 0, billing: 0 };
        activityMap[log.task_id].working += working_h;
        activityMap[log.task_id].billing += billing_h;
        totalWorking += working_h;
        totalBilling += billing_h;
        const taskObj = Array.isArray(log.task) ? log.task[0] : log.task;
        if (taskObj?.project?.id) projectSet.add(taskObj.project.id);
      }
    });

    setTodaysActivity(activityMap);
    setTodaysTotalHours(totalWorking);
    setTodaysTotalBillingHours(totalBilling);
    setTodaysTotalProjects(projectSet.size);

    const refDocMap = new Map<string, any>();
    (refDocs || []).forEach((d: any) => refDocMap.set(d.id, d));

    const assigneesByTaskId = new Map<string, any[]>();
    (rawAssignments || []).forEach((a: any) => {
      if (!assigneesByTaskId.has(a.task_id)) assigneesByTaskId.set(a.task_id, []);
      const member = memberMap.get(a.member_id);
      if (member) assigneesByTaskId.get(a.task_id)!.push({ ...member, assignment_status: a.status });
    });

    return tasksData.map((task) => ({
      ...task,
      assignees: assigneesByTaskId.get(task.id) || [],
      total_logged_hours: workingHoursByTaskId.get(task.id) || 0,
      total_billing_hours: billingHoursByTaskId.get(task.id) || 0,
      reference_doc: task.reference_doc_id ? (refDocMap.get(task.reference_doc_id) || null) : null,
    }));
  }, [boardDate, boardFilterMode, boardMonth, viewMode, currentUser?.id, setTodaysActivity, setTodaysTotalHours, setTodaysTotalBillingHours, setTodaysTotalProjects]);

  const fetchTasks = useCallback(async () => {
    if (!currentUser) { setLoading(false); return; }

    const fetchSeq = ++fetchSeqRef.current;

    try {
      const baseParams: TaskListParams = {
        include: 'project',
        order_by: 'created_at',
        order: 'desc',
      };
      if (boardProjectId !== 'all') baseParams.project_id = boardProjectId;

      const todayStr = new Date().toLocaleDateString('en-CA');
      const isToday = boardDate === todayStr;

      if (boardFilterMode === 'month') {
        const [year, month] = boardMonth.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1).toLocaleDateString('en-CA');
        const lastDay = new Date(year, month, 0).toLocaleDateString('en-CA');
        baseParams.log_date_gte = firstDay;
        baseParams.log_date_lte = lastDay;
      } else {
        if (boardDate > todayStr) {
          if (fetchSeqRef.current !== fetchSeq) return;
          setTasks([]); setLoading(false); setRefreshing(false); return;
        }
        if (isToday) {
          // Today's live board still carries unfinished work forward so
          // nothing gets lost, exactly like before.
          baseParams.board_date = boardDate;
          baseParams.carry_over = true;
        } else {
          // A specific past day is a historical snapshot — show exactly
          // what was logged that day, not tasks carried forward from
          // earlier days (those would otherwise show up on every day).
          baseParams.log_date = boardDate;
        }
      }

      if (viewMode === 'all') {
        const tasksData = await api.tasks.list(baseParams);
        if (fetchSeqRef.current !== fetchSeq) return;
        setTasks((tasksData.length ? await enrichTasks(tasksData) : []) as Task[]);
        setLoading(false); setRefreshing(false); return;
      }

      const targetId = viewMode === 'mine' ? currentUser.id : viewMode;
      const assignments = await api.taskAssignments.list({ memberId: targetId });

      if (!assignments || assignments.length === 0) {
        if (fetchSeqRef.current !== fetchSeq) return;
        setTasks([]); setLoading(false); setRefreshing(false); return;
      }

      const taskIds = assignments.map((a: any) => a.task_id);
      const assignmentStatusMap = new Map<string, TaskStatus>(
        assignments.map((a: any) => [a.task_id, a.status as TaskStatus])
      );

      let memberParams: TaskListParams;
      if (boardFilterMode !== 'month') {
        memberParams = {
          include: 'project',
          order_by: 'created_at',
          order: 'desc',
          ids: taskIds,
        };
        if (isToday) {
          // Today's board carries unfinished work forward, so fetch
          // everything up to today and filter the carry-over below.
          memberParams.log_date_lte = boardDate;
        } else {
          // A specific past day is a historical snapshot — exact match only.
          memberParams.log_date = boardDate;
        }
        if (boardProjectId !== 'all') memberParams.project_id = boardProjectId;
      } else {
        memberParams = { ...baseParams, ids: taskIds };
      }

      const tasksData = await api.tasks.list(memberParams);
      const tasksWithAssignmentStatus = (tasksData || []).map((t: any) => ({
        ...t,
        assignment_status: assignmentStatusMap.get(t.id) || null,
      }));

      let filteredTasks = tasksWithAssignmentStatus;
      if (boardFilterMode !== 'month' && isToday) {
        const boardDateStr = boardDate;
        filteredTasks = tasksWithAssignmentStatus.filter((t: any) => {
          const ld = t.log_date ? new Date(t.log_date).toLocaleDateString('en-CA') : '';
          return ld >= boardDateStr || t.assignment_status !== 'Complete';
        });
      }

      if (fetchSeqRef.current !== fetchSeq) return;
      setTasks((filteredTasks.length ? await enrichTasks(filteredTasks) : []) as Task[]);
    } catch {
      if (fetchSeqRef.current !== fetchSeq) return;
      setTasks([]);
    }
    if (fetchSeqRef.current !== fetchSeq) return;
    setLoading(false);
    setRefreshing(false);
  }, [currentUser, viewMode, boardDate, boardMonth, boardFilterMode, boardProjectId, enrichTasks, setTasks, setLoading, setRefreshing]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
    const unsub = subscribeToChanges(fetchTasks);
    return () => { unsub(); };
  }, [fetchTasks, setLoading]);

  useEffect(() => {
    if (!taskProjectId) { setProjectDocs([]); return; }
    setLoadingDocs(true);
    setRefDocId('');
    api.documents.listForProject(taskProjectId).then((data) => {
      setProjectDocs(data);
      setLoadingDocs(false);
    });
  }, [taskProjectId, setProjectDocs, setRefDocId, setLoadingDocs]);

  const getDisplayStatus = useCallback((t: Task) => (t as any).assignment_status || t.status, []);
  // Group once per `tasks` change instead of re-filtering per status on every
  // render. The board renders one KanbanColumn per status and each column is
  // memoized on array identity — calling `.filter()` fresh for every column on
  // every render (e.g. from typing in an unrelated field) handed each column a
  // brand-new array reference every time, defeating that memoization and
  // forcing all cards on the board to re-render. Precomputing here means the
  // same array reference is returned as long as the underlying tasks haven't
  // changed, so unrelated re-renders skip the columns entirely.
  const tasksByStatusMap = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>(TASK_STATUSES.map(s => [s, [] as Task[]]));
    tasks.forEach(t => {
      const status = getDisplayStatus(t) as TaskStatus;
      let bucket = map.get(status);
      if (!bucket) { bucket = []; map.set(status, bucket); }
      bucket.push(t);
    });
    return map;
  }, [tasks, getDisplayStatus]);
  const tasksByStatus = useCallback((status: TaskStatus) => tasksByStatusMap.get(status) ?? [], [tasksByStatusMap]);
  const tableTasks = tasks.filter(t => {
    const s = getDisplayStatus(t);
    if (s === 'Todo' || s === 'Working') return true;
    const creationDateStr = t.created_at ? new Date(t.created_at).toLocaleDateString('en-CA') : '';
    const hasActivity = (todaysActivity[t.id]?.working || 0) > 0 || (todaysActivity[t.id]?.billing || 0) > 0;
    const isCreatedToday = creationDateStr === boardDate;
    return hasActivity || isCreatedToday;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const fetchTasksRef = useRef(fetchTasks);
  useEffect(() => { fetchTasksRef.current = fetchTasks; }, [fetchTasks]);
  const stableFetchTasks = useCallback(() => { fetchTasksRef.current(); }, []);

  const handleDropTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    const isAdmin = ['super-admin', 'Admin'].includes(currentUser?.role || '');
    if (task && getDisplayStatus(task) === 'Complete' && !isAdmin) {
      toast.error('Completed tasks are locked and cannot be moved by staff.');
      return;
    }

    const shouldUpdateLogDate = newStatus === 'Complete';

    if (viewMode === 'all') {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, ...(shouldUpdateLogDate ? { log_date: boardDate } : {}) } : t));
      try {
        const patch: Record<string, unknown> = { status: newStatus };
        if (shouldUpdateLogDate) patch.log_date = boardDate;
        await api.tasks.update(taskId, patch);
      }
      catch { fetchTasksRef.current(); }
    } else {
      const memberId = viewMode === 'mine' ? currentUser?.id : viewMode;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignment_status: newStatus, ...(shouldUpdateLogDate ? { log_date: boardDate } : {}) } : t));
      if (memberId) {
        try {
          if (shouldUpdateLogDate) await api.tasks.update(taskId, { log_date: boardDate });
          await api.taskAssignments.updateStatus(taskId, memberId, newStatus);
        }
        catch { fetchTasksRef.current(); }
      }
    }
  }, [tasks, currentUser, viewMode, getDisplayStatus, boardDate]);

  const handleDropTaskRef = useRef(handleDropTask);
  useEffect(() => { handleDropTaskRef.current = handleDropTask; }, [handleDropTask]);
  const stableHandleDropTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    return handleDropTaskRef.current(taskId, newStatus);
  }, []);

  const toggleAssignee = (id: string) => {
    setTaskAssignees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openModal = () => {
    setTaskDescription(''); setTaskStatus('Todo'); setTaskPriority('Low');
    setTaskDeadline(new Date().toLocaleDateString('en-CA')); setTaskLogDate(new Date().toLocaleDateString('en-CA'));
    setTaskEstimatedTime('');
    setTaskCategory('');
    setTaskProjectId(''); setTaskProjectName('');
    setTaskAssignees([]); setProjectSearch(''); setProjectDropdownOpen(false);
    setRefDocId(''); setProjectDocs([]);
    setShowNewTaskModal(true);
  };

  const handleCreateTask = async () => {
    if (!taskDescription.trim()) { toast.error('Task description is required.'); return; }
    if (!taskProjectId) { toast.error('Please select a project.'); return; }
    const estimatedTimeValue = parseFloat(taskEstimatedTime);
    if (!taskEstimatedTime || isNaN(estimatedTimeValue) || estimatedTimeValue <= 0) {
      toast.error('Please enter an estimated time.');
      return;
    }
    if (!taskCategory) { toast.error('Please select a category.'); return; }
    setIsSubmitting(true);
    try {
      const todayLocal = new Date().toLocaleDateString('en-CA');
      const logDateForTask = taskLogDate || todayLocal;
      const taskData: any = {
        description: taskDescription.trim(),
        status: taskStatus,
        priority: taskPriority,
        deadline: taskDeadline || null,
        project_id: taskProjectId,
        category: taskCategory || null,
        estimated_time: estimatedTimeValue,
        log_date: logDateForTask,
        ...(refDocId ? { reference_doc_id: refDocId } : {}),
      };
      const assigneeIds = isMember
        ? (currentUser?.id ? [currentUser.id] : [])
        : taskAssignees;
      const anchorMemberId = assigneeIds[0] || currentUser?.id;
      await api.tasks.create({
        task: taskData,
        assigneeIds,
        anchor: anchorMemberId ? { member_id: anchorMemberId, log_date: logDateForTask } : null,
      });
      toast.success('Task created successfully!');
      setShowNewTaskModal(false);
      fetchTasks();
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Failed to create task'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { generatePDF } = useBoardPDF(tasks, boardFilterMode, boardMonth, boardDate, getDisplayStatus);
  const { openReportModal, buildDailyReport, handleCopyTable, handleCopyDailyReport } = useBoardReports(
    tableTasks,
    todaysActivity,
    getDisplayStatus,
    viewMode,
    currentUser,
    teamMembers || [],
    boardFilterMode,
    boardMonth,
    boardDate,
    setShowReportModal
  );

  const viewLabel = () => {
    if (viewMode === 'all') return 'All Members — Central Board';
    if (viewMode === 'mine') return currentUser ? `My Tasks — ${currentUser.name}` : 'My Tasks';
    const member = teamMembers?.find(m => m.id === viewMode);
    return member ? `${member.name}'s Board` : 'Team Member Board';
  };

  return {
    tasks,
    setTasks,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    showTasksTable,
    setShowTasksTable,
    toggleTasksTable,
    todaysActivity,
    setTodaysActivity,
    todaysTotalHours,
    setTodaysTotalHours,
    todaysTotalBillingHours,
    setTodaysTotalBillingHours,
    todaysTotalProjects,
    setTodaysTotalProjects,
    viewMode,
    setViewMode,
    boardFilterMode,
    setBoardFilterMode,
    boardDate,
    setBoardDate,
    boardMonth,
    setBoardMonth,
    boardProjectId,
    setBoardProjectId,
    boardProjectDropdownOpen,
    setBoardProjectDropdownOpen,
    boardProjectSearch,
    setBoardProjectSearch,
    boardCalendarOpen,
    setBoardCalendarOpen,
    boardProjectDropdownRef,
    boardCalendarRef,
    boardCalendarViewDate,
    setBoardCalendarViewDate,
    memberDropdownOpen,
    setMemberDropdownOpen,
    memberDropdownRef,
    showNewTaskModal,
    setShowNewTaskModal,
    showActivityModal,
    setShowActivityModal,
    showReportModal,
    setShowReportModal,
    taskDescription,
    setTaskDescription,
    taskStatus,
    setTaskStatus,
    taskPriority,
    setTaskPriority,
    taskDeadline,
    setTaskDeadline,
    taskLogDate,
    setTaskLogDate,
    taskEstimatedTime,
    setTaskEstimatedTime,
    taskCategory,
    setTaskCategory,
    taskProjectId,
    setTaskProjectId,
    taskProjectName,
    setTaskProjectName,
    taskAssignees,
    setTaskAssignees,
    isSubmitting,
    setIsSubmitting,
    availableProjects,
    projectSearch,
    setProjectSearch,
    projectDropdownOpen,
    setProjectDropdownOpen,
    projectDropdownRef,
    triggerRef,
    dropdownRect,
    setDropdownRect,
    projectDocs,
    setProjectDocs,
    refDocId,
    setRefDocId,
    loadingDocs,
    setLoadingDocs,
    isSuperAdmin,
    isMember,
    canViewAllMembers,
    currentUser,
    teamMembers,
    enrichTasks,
    fetchTasks,
    getDisplayStatus,
    tasksByStatus,
    tableTasks,
    handleRefresh,
    stableFetchTasks,
    stableHandleDropTask,
    toggleAssignee,
    openModal,
    handleCreateTask,
    generatePDF,
    openReportModal,
    buildDailyReport,
    handleCopyTable,
    handleCopyDailyReport,
    viewLabel,
  };
}
