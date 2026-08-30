/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react';
import { useUser } from '@/components/UserContext';
import { Task, TaskStatus, TaskPriority, TaskCategory, TASK_STATUSES } from '@/lib/types';
import { api, subscribeToChanges } from '@/lib/api';
import type { TaskListParams } from '@/lib/api/resources/tasks';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/queries/useProjects';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setViewMode as setViewModeAction,
  setFilterMode as setFilterModeAction,
  setDate as setDateAction,
  setMonth as setMonthAction,
  setProjectId as setProjectIdAction,
  setShowTasksTable as setShowTasksTableAction,
} from '@/store/slices/boardSlice';
import { useBoardPDF } from './useBoardPDF';
import { useBoardReports } from './useBoardReports';

export type ViewMode = 'mine' | 'all' | string;

// Rows from one api.tasks.board() call, handed to enrichTasks instead of the
// three separate requests it used to issue itself.
interface BoardSources {
  timeLogs: any[];
  documents: any[];
  assignments: any[];
}

export function useBoardState() {
  const { currentUser, teamMembers } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Board view/filter state lives in Redux so it survives navigating away and
  // back (the slice existed for this but was never wired up). Everything
  // ephemeral — dropdown open flags, the calendar's browsing month, modal and
  // new-task form fields — deliberately stays local: it is component-scoped,
  // changes on every keystroke, and would only add store churn.
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(s => s.board.viewMode);
  const boardFilterMode = useAppSelector(s => s.board.filterMode);
  const boardDate = useAppSelector(s => s.board.date);
  const boardMonth = useAppSelector(s => s.board.month);
  const boardProjectId = useAppSelector(s => s.board.projectId);
  const showTasksTable = useAppSelector(s => s.board.showTasksTable);

  const setViewMode = useCallback((m: ViewMode) => { dispatch(setViewModeAction(m)); }, [dispatch]);
  const setBoardFilterMode = useCallback((m: 'day' | 'month') => { dispatch(setFilterModeAction(m)); }, [dispatch]);
  const setBoardDate = useCallback((d: string) => { dispatch(setDateAction(d)); }, [dispatch]);
  const setBoardMonth = useCallback((m: string) => { dispatch(setMonthAction(m)); }, [dispatch]);
  const setBoardProjectId = useCallback((id: string) => { dispatch(setProjectIdAction(id)); }, [dispatch]);
  const setShowTasksTable = useCallback((v: boolean) => { dispatch(setShowTasksTableAction(v)); }, [dispatch]);

  useEffect(() => {
    const savedValue = localStorage.getItem('octopi_show_tasks_table');
    if (savedValue !== null) {
      dispatch(setShowTasksTableAction(savedValue === 'true'));
    }
  }, [dispatch]);

  const toggleTasksTable = () => {
    const newState = !showTasksTable;
    dispatch(setShowTasksTableAction(newState));
    localStorage.setItem('octopi_show_tasks_table', String(newState));
  };

  const [todaysActivity, setTodaysActivity] = useState<Record<string, { working: number; billing: number }>>({});
  const [todaysTotalHours, setTodaysTotalHours] = useState(0);
  const [todaysTotalBillingHours, setTodaysTotalBillingHours] = useState(0);
  const [todaysTotalProjects, setTodaysTotalProjects] = useState(0);

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

  // Keep object identity of tasks that did not change between fetches so the
  // memoized KanbanColumn/TaskCard/table rows skip re-rendering when the 8s
  // poll returns the same data. Rendering is driven purely by the fields here,
  // so reusing the previous object is behavior-identical.
  // Declared above enrichTasks/fetchTasks (which both close over these) so
  // neither reads them before they're initialized.
  const tasksByIdRef = useRef<Map<string, { sig: string; task: Task }>>(new Map());
  const lastTasksRef = useRef<Task[]>([]);
  const taskSignature = (t: any): string =>
    JSON.stringify([
      t.id,
      t.description,
      t.status,
      t.assignment_status,
      t.priority,
      t.deadline,
      t.project_id,
      t.reference_doc_id,
      t.category,
      t.estimated_time,
      t.log_date,
      t.created_at,
      t.updated_at,
      t.total_logged_hours,
      t.total_billing_hours,
      t.has_logged_time,
      t.project?.name ?? null,
      t.project?.category ?? null,
      t.reference_doc?.id ?? null,
      (t.assignees || []).map((a: any) => `${a.id}:${a.name}:${a.status ?? ''}:${a.assignment_status ?? ''}`).join(','),
    ]);

  const stabilizeTasks = useCallback((next: Task[]): Task[] => {
    const prevMap = tasksByIdRef.current;
    const fresh = new Map<string, { sig: string; task: Task }>();
    const out = new Array<Task>(next.length);
    for (let i = 0; i < next.length; i++) {
      const t = next[i];
      const sig = taskSignature(t);
      const old = prevMap.get(t.id);
      if (old && old.sig === sig) {
        fresh.set(t.id, old);
        out[i] = old.task;
      } else {
        fresh.set(t.id, { sig, task: t });
        out[i] = t;
      }
    }
    tasksByIdRef.current = fresh;

    // If every task object is bit-for-bit the same in the same order, hand back
    // the exact previous array so React bails out of the whole board render.
    const last = lastTasksRef.current;
    let same = last.length === out.length;
    if (same) {
      for (let i = 0; i < out.length; i++) {
        if (last[i] !== out[i]) { same = false; break; }
      }
    }
    lastTasksRef.current = same ? last : out;
    return lastTasksRef.current;
  }, []);

  const activitySigRef = useRef('');

  // Pure transform over rows already fetched by api.tasks.board(). All date
  // bucketing below still runs in the browser's timezone exactly as before —
  // only the network fetching moved out of this function.
  const enrichTasks = useCallback((tasksData: any[], sources: BoardSources) => {
    if (!tasksData.length) return [];

    // The bundle is fetched for the pre-filter task set, but callers may drop
    // tasks afterwards (the today/carry-over filter). Narrow the logs and
    // assignments to the surviving tasks so the totals below stay identical to
    // the old per-task-id requests.
    const taskIdSet = new Set(tasksData.map(t => t.id));
    const logsData = (sources.timeLogs || []).filter((l: any) => taskIdSet.has(l.task_id));
    const rawAssignments = (sources.assignments || []).filter((a: any) => taskIdSet.has(a.task_id));
    const refDocs = sources.documents;

    const memberIds = new Set((rawAssignments || []).map((a: any) => a.member_id).filter(Boolean));
    const memberMap = new Map<string, any>();
    (teamMembers || []).forEach((m: any) => {
      if (memberIds.has(m.id)) memberMap.set(m.id, m);
    });

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

    setTodaysTotalHours(totalWorking);
    setTodaysTotalBillingHours(totalBilling);
    setTodaysTotalProjects(projectSet.size);

    // Only swap the activity map when it actually changed, so memoized table
    // rows don't re-render on identical polls.
    const activitySig = JSON.stringify(
      Object.keys(activityMap)
        .sort()
        .map((id) => `${id}:${activityMap[id].working}:${activityMap[id].billing}`)
    );
    if (activitySig !== activitySigRef.current) {
      activitySigRef.current = activitySig;
      setTodaysActivity(activityMap);
    }

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
  }, [boardDate, boardFilterMode, boardMonth, viewMode, currentUser?.id, teamMembers, setTodaysActivity, setTodaysTotalHours, setTodaysTotalBillingHours, setTodaysTotalProjects]);

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
        const bundle = await api.tasks.board(baseParams);
        if (fetchSeqRef.current !== fetchSeq) return;
        const enriched = (bundle.tasks.length ? enrichTasks(bundle.tasks, bundle) : []) as Task[];
        startTransition(() => setTasks(stabilizeTasks(enriched)));
        setLoading(false); setRefreshing(false); return;
      }

      // Member board. The server scopes tasks to this member's assignments and
      // returns their statuses alongside, so the old assignments->tasks
      // round-trip pair collapses into the same single request.
      const targetId = viewMode === 'mine' ? currentUser.id : viewMode;

      let memberParams: TaskListParams & { member_id?: string };
      if (boardFilterMode !== 'month') {
        memberParams = {
          include: 'project',
          order_by: 'created_at',
          order: 'desc',
          member_id: targetId,
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
        memberParams = { ...baseParams, member_id: targetId };
      }

      const bundle = await api.tasks.board(memberParams);
      const assignmentStatusMap = new Map<string, TaskStatus>(
        (bundle.memberAssignments || []).map((a: any) => [a.task_id, a.status as TaskStatus])
      );

      const tasksWithAssignmentStatus = (bundle.tasks || []).map((t: any) => ({
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
      const enriched = (filteredTasks.length ? enrichTasks(filteredTasks, bundle) : []) as Task[];
      startTransition(() => setTasks(stabilizeTasks(enriched)));
    } catch {
      if (fetchSeqRef.current !== fetchSeq) return;
      setTasks([]);
    }
    if (fetchSeqRef.current !== fetchSeq) return;
    setLoading(false);
    setRefreshing(false);
  }, [currentUser, viewMode, boardDate, boardMonth, boardFilterMode, boardProjectId, enrichTasks, stabilizeTasks, setTasks, setLoading, setRefreshing]);

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
  const tableTasks = useMemo(() => tasks.filter(t => {
    const s = getDisplayStatus(t);
    if (s === 'Todo' || s === 'Working') return true;
    const creationDateStr = t.created_at ? new Date(t.created_at).toLocaleDateString('en-CA') : '';
    const hasActivity = (todaysActivity[t.id]?.working || 0) > 0 || (todaysActivity[t.id]?.billing || 0) > 0;
    const isCreatedToday = creationDateStr === boardDate;
    return hasActivity || isCreatedToday;
  }), [tasks, todaysActivity, boardDate, getDisplayStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await api.tasks.remove(taskId);
      toast.success('Task deleted');
      fetchTasksRef.current();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete task');
    }
  }, []);

  // Keep a ref pointed at the latest fetchTasks so stableFetchTasks/handleDeleteTask
  // never go stale, without giving memoized children (KanbanColumn/TaskCard) a new
  // callback identity every time a filter change (or an unrelated teamMembers
  // context refresh flowing through enrichTasks) changes fetchTasks's own
  // identity — that identity churn would otherwise defeat their memo checks.
  // The "latest ref" idiom is intentionally exempted from the newer
  // compiler-lint immutability/refs rules below; there's no stable-callback
  // primitive in React yet (useEffectEvent is still experimental) that covers this.
  /* eslint-disable react-hooks/immutability -- latest-ref idiom, see comment above */
  const fetchTasksRef = useRef(fetchTasks);
  useEffect(() => { fetchTasksRef.current = fetchTasks; }, [fetchTasks]);
  /* eslint-enable react-hooks/immutability */
  const stableFetchTasks = useCallback(() => { fetchTasksRef.current(); }, []);

  const handleDropTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
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
        catch (err: any) {
          toast.error(err?.message || 'Failed to update status');
          fetchTasksRef.current();
        }
      }
    }
  }, [currentUser, viewMode, boardDate]);

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
    handleDeleteTask,
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
