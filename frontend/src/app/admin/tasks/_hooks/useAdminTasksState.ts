import { useState, useEffect, useCallback, useRef } from 'react';
import { api, subscribeToChanges } from '@/lib/api';
import { useUser } from '@/components/UserContext';
import { Task, Project, TaskStatus, TaskPriority, ProjectDocument } from '@/lib/types';
import { toast } from 'sonner';
import { useStore, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCreatingTask, resetForm } from '@/store/slices/adminTaskFormSlice';

const todayIsoDate = () => new Date().toLocaleDateString('en-CA');

export function useAdminTasksState() {
  const { currentUser, teamMembers, loading: userLoading } = useUser();
  const store = useStore<RootState>();
  const dispatch = useDispatch();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<(Task & { assignee_ids?: string[] })[]>([]);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalTasks / PAGE_SIZE));

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [editingWorkingHoursTaskId, setEditingWorkingHoursTaskId] = useState<string | null>(null);
  const [editingWorkingHoursValue, setEditingWorkingHoursValue] = useState('');
  const [editingBillingHoursTaskId, setEditingBillingHoursTaskId] = useState<string | null>(null);
  const [editingBillingHoursValue, setEditingBillingHoursValue] = useState('');
  const [editingHoursDate, setEditingHoursDate] = useState<string>(todayIsoDate());
  
  const [taskHours, setTaskHours] = useState<Record<string, number>>({});
  const [taskWorkingHours, setTaskWorkingHours] = useState<Record<string, number>>({});
  const [taskBillingHours, setTaskBillingHours] = useState<Record<string, number>>({});
  
  const canEditHours = currentUser && ['super-admin', 'Admin', 'Lead'].includes(currentUser.role);

  const insertHoursDelta = async (taskId: string, deltaHours: number, deltaBilling: number, logDate: string) => {
    if (!currentUser) return false;
    if (deltaHours === 0 && deltaBilling === 0) return true;
    const date = logDate || todayIsoDate();
    const assigns = await api.taskAssignments.list({ taskIds: [taskId] });
    const memberId = assigns?.[0]?.member_id || currentUser.id;
    try {
      await api.timeLogs.create({ task_id: taskId, member_id: memberId, hours_logged: deltaHours, billing_hours: deltaBilling, log_date: date });
    } catch (error: any) { toast.error('Failed to save hours: ' + error.message); return false; }
    await api.tasks.update(taskId, { log_date: date });
    return true;
  };

  const updateLatestLogDate = async (taskId: string, newDate: string): Promise<boolean> => {
    if (!currentUser) return false;
    const date = newDate || todayIsoDate();
    try { await api.tasks.update(taskId, { log_date: date }); }
    catch (taskErr: any) { toast.error('Failed to update log date on task: ' + taskErr.message); return false; }
    const latest = await api.timeLogs.latest(taskId);
    if (latest?.id) {
      try { await api.timeLogs.update(latest.id, { log_date: date }); }
      catch (error: any) { toast.error('Failed to update log date: ' + error.message); return false; }
      return true;
    }
    const assigns = await api.taskAssignments.list({ taskIds: [taskId] });
    const memberId = assigns?.[0]?.member_id || currentUser.id;
    try { await api.timeLogs.create({ task_id: taskId, member_id: memberId, hours_logged: 0, billing_hours: 0, log_date: date }); }
    catch (insErr: any) { toast.error('Failed to anchor log date: ' + insErr.message); return false; }
    return true;
  };

  const saveWorkingHours = async (taskId: string, newTotal: number, logDate: string = todayIsoDate()) => {
    if (newTotal < 0 || !currentUser) return;
    const prevTotal = taskWorkingHours[taskId] || 0;
    const delta = newTotal - prevTotal;
    if (delta === 0) { const ok = await updateLatestLogDate(taskId, logDate); if (ok) toast.success(`Log date updated to ${logDate}`); return; }
    const ok = await insertHoursDelta(taskId, delta, 0, logDate);
    if (!ok) return;
    setTaskWorkingHours(prev => ({ ...prev, [taskId]: newTotal }));
    toast.success(`Working hours: ${newTotal.toFixed(2)}h (${delta > 0 ? '+' : ''}${delta.toFixed(2)} on ${logDate})`);
  };

  const saveBillingHours = async (taskId: string, newTotal: number, logDate: string = todayIsoDate()) => {
    if (newTotal < 0 || !currentUser) return;
    const prevTotal = taskBillingHours[taskId] || 0;
    const delta = newTotal - prevTotal;
    if (delta === 0) { const ok = await updateLatestLogDate(taskId, logDate); if (ok) toast.success(`Log date updated to ${logDate}`); return; }
    const ok = await insertHoursDelta(taskId, 0, delta, logDate);
    if (!ok) return;
    setTaskBillingHours(prev => ({ ...prev, [taskId]: newTotal }));
    toast.success(`Logged time: ${newTotal.toFixed(2)}h (${delta > 0 ? '+' : ''}${delta.toFixed(2)} on ${logDate})`);
  };

  const fetchData = useCallback(async () => {
    try {
      const from = (page - 1) * PAGE_SIZE;
      const [projectsData, tasksRes] = await Promise.all([
        api.projects.list({ include: 'client', orderBy: 'created_at', order: 'desc' }),
        api.tasks.listWithCount({ include: 'project', order_by: 'created_at', order: 'desc', limit: PAGE_SIZE, offset: from }),
      ]);
      setProjects((projectsData || []) as any);
      setTotalTasks(tasksRes.count ?? 0);
      const tasksData = tasksRes.data;
      if (tasksData) {
        const taskIds = tasksData.map((t: any) => t.id);
        const allAssigns = taskIds.length > 0 ? await api.taskAssignments.list({ taskIds }) : [];
        const assignsByTask: Record<string, string[]> = {};
        (allAssigns || []).forEach((a: any) => { if (!assignsByTask[a.task_id]) assignsByTask[a.task_id] = []; assignsByTask[a.task_id].push(a.member_id); });
        const enriched = tasksData.map((task: any) => ({ ...task, assignee_ids: assignsByTask[task.id] || [] }));

        const refDocIds = [...new Set(enriched.map((t: any) => t.reference_doc_id).filter(Boolean))];
        const refDocMap = new Map<string, any>();
        if (refDocIds.length > 0) { const refDocs = await api.documents.listByIds(refDocIds as string[]); (refDocs || []).forEach((d: any) => refDocMap.set(d.id, d)); }
        const enrichedWithDocs = enriched.map((t: any) => ({ ...t, reference_doc: t.reference_doc_id ? (refDocMap.get(t.reference_doc_id) || null) : null }));
        setTasks(enrichedWithDocs);

        if (taskIds.length > 0) {
          const logsData = await api.timeLogs.list({ taskIds });
          const workingHoursMap: Record<string, number> = {};
          const billingHoursMap: Record<string, number> = {};
          (logsData || []).forEach((log: any) => {
            workingHoursMap[log.task_id] = (workingHoursMap[log.task_id] || 0) + Number(log.hours_logged || 0);
            billingHoursMap[log.task_id] = (billingHoursMap[log.task_id] || 0) + Number(log.billing_hours || 0);
          });
          setTaskHours(workingHoursMap);
          setTaskWorkingHours(workingHoursMap);
          setTaskBillingHours(billingHoursMap);
        }
      }
    } catch { /* Backend not reachable */ }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchData(), 0);
    return () => { window.clearTimeout(timeoutId); };
  }, [fetchData]);

  useEffect(() => {
    const unsub = subscribeToChanges(() => void fetchData());
    return () => { unsub(); };
  }, [fetchData]);

  async function submitTask() {
    const formState = store.getState().adminTaskForm;
    const {
      newTaskDescription, newTaskProjectId, newTaskLogDate,
      newTaskStatus, newTaskPriority, newTaskDeadline, newTaskRefDocId,
      newTaskCategory, newTaskEstimatedTime,
      editTaskId, newTaskAssignees
    } = formState;

    if (!newTaskDescription.trim() || !newTaskProjectId) return;
    const estimatedTimeValue = newTaskEstimatedTime ? parseFloat(newTaskEstimatedTime) : null;
    if (!editTaskId && (estimatedTimeValue === null || isNaN(estimatedTimeValue) || estimatedTimeValue <= 0)) {
      toast.error('Please enter an estimated time.');
      return;
    }
    if (!editTaskId && !newTaskCategory) {
      toast.error('Please select a category.');
      return;
    }
    dispatch(setCreatingTask(true));
    const logDateForTask = newTaskLogDate || todayIsoDate();
    const taskPayload = { project_id: newTaskProjectId, description: newTaskDescription.trim(), status: newTaskStatus, priority: newTaskPriority, deadline: newTaskDeadline || null, reference_doc_id: newTaskRefDocId || null, category: newTaskCategory || null, estimated_time: estimatedTimeValue !== null && !isNaN(estimatedTimeValue) ? estimatedTimeValue : null, log_date: logDateForTask };

    if (editTaskId) {
      try { await api.tasks.update(editTaskId, taskPayload); }
      catch (taskError: any) { dispatch(setCreatingTask(false)); toast.error(`Failed to update task: ${taskError.message}`); return; }
      await api.taskAssignments.replaceForTask(editTaskId, newTaskAssignees.map(memberId => ({ member_id: memberId })));
      toast.success('Task updated successfully!');
    } else {
      const anchorMemberId = newTaskAssignees[0] || currentUser?.id;
      try { await api.tasks.create({ task: taskPayload, assigneeIds: newTaskAssignees, anchor: anchorMemberId ? { member_id: anchorMemberId, log_date: logDateForTask } : null }); }
      catch (taskError: any) { dispatch(setCreatingTask(false)); toast.error(`Failed to create task: ${taskError?.message}`); return; }
      toast.success('Task created successfully!');
    }

    dispatch(resetForm());
    fetchData();
  }

  return {
    currentUser,
    teamMembers,
    projects,
    setProjects,
    tasks,
    setTasks,
    loading,
    setLoading,
    page,
    setPage,
    totalTasks,
    setTotalTasks,
    totalPages,
    showModal,
    setShowModal,
    editingProject,
    setEditingProject,
    editingWorkingHoursTaskId,
    setEditingWorkingHoursTaskId,
    editingWorkingHoursValue,
    setEditingWorkingHoursValue,
    editingBillingHoursTaskId,
    setEditingBillingHoursTaskId,
    editingBillingHoursValue,
    setEditingBillingHoursValue,
    editingHoursDate,
    setEditingHoursDate,
    taskHours,
    setTaskHours,
    taskWorkingHours,
    setTaskWorkingHours,
    taskBillingHours,
    setTaskBillingHours,
    canEditHours,
    insertHoursDelta,
    updateLatestLogDate,
    saveWorkingHours,
    saveBillingHours,
    fetchData,
    submitTask,
    PAGE_SIZE,
  };
}
