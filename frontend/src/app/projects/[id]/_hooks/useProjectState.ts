'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, subscribeToChanges } from '@/lib/api';
import { useUser } from '@/components/UserContext';
import { Project, Task, ProjectCredential, ProjectDocument, TaskStatus, TaskPriority, TeamMember, TaskCategory } from '@/lib/types';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity';
import { useProjectDocs } from './useProjectDocs';
import { useProjectCreds } from './useProjectCreds';

export function useProjectState() {
  const params = useParams();
  const router = useRouter();
  const { loading: userLoading, currentUser, teamMembers } = useUser();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [credentials, setCredentials] = useState<ProjectCredential[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const lastMonth = new Date(today);
  lastMonth.setDate(today.getDate() - 29);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(lastMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activities, setActivities] = useState<Array<{
    description: string;
    action_type: string;
    created_at: string;
    member: { name: string };
  }>>([]);
  const [loading, setLoading] = useState(true);

  const [rangeInitialized, setRangeInitialized] = useState(false);
  useEffect(() => {
    if (project && !rangeInitialized) {
      const created = (project as any).created_at || (project as any).start_date;
      if (created) setStartDate(new Date(created).toLocaleDateString('en-CA'));
      setRangeInitialized(true);
    }
  }, [project, rangeInitialized]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'credential' | 'document' | 'task' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assigningTask, setAssigningTask] = useState<string | null>(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Todo');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Low');
  const [taskDeadline, setTaskDeadline] = useState(new Date().toLocaleDateString('en-CA'));
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [taskRefDocId, setTaskRefDocId] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory | ''>('');
  const [taskEstimatedTime, setTaskEstimatedTime] = useState('');
  const [editingHoursTaskId, setEditingHoursTaskId] = useState<string | null>(null);
  const [editingWorkingHours, setEditingWorkingHours] = useState('');
  const [editingBillingHours, setEditingBillingHours] = useState('');
  const [editingHoursDate, setEditingHoursDate] = useState<string>(todayStr);
  const [taskLogDate, setTaskLogDate] = useState<string>(() => new Date().toLocaleDateString('en-CA'));
  const { showDocModal, setShowDocModal, editingDocId, setEditingDocId, docTitle, setDocTitle, docUrl, setDocUrl, docType, setDocType, isSubmitting: isDocSubmitting, isDeleting: isDocDeleting, handleDocSubmit, handleDeleteDocument, openNewDocModal, openEditDocModal } = useProjectDocs(projectId, false, currentUser, documents, setDocuments);

  const { showCredModal, setShowCredModal, editingCredId, setEditingCredId, credLabel, setCredLabel, credUrl, setCredUrl, credUser, setCredUser, credPass, setCredPass, credNotes, setCredNotes, isSubmitting: isCredSubmitting, isDeleting: isCredDeleting, handleCredSubmit, handleDeleteCredential, openNewCredModal, openEditCredModal } = useProjectCreds(projectId, false, currentUser, credentials, setCredentials);


  const assignTeamMember = async (taskId: string, memberId: string) => {
    try {
      await api.taskAssignments.assign(taskId, memberId);
      toast.success('Member assigned');
      fetchData();
    } catch {
      toast.error('Failed to assign member');
    }
    setAssigningTask(null);
  };

  const unassignTeamMember = async (taskId: string, memberId: string) => {
    try {
      await api.taskAssignments.unassign(taskId, memberId);
      toast.success('Member removed');
      fetchData();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleTaskSubmit = async () => {
    if (!taskDescription.trim()) return;
    const estimatedTimeValue = taskEstimatedTime ? parseFloat(taskEstimatedTime) : null;
    if (!editingTaskId && (estimatedTimeValue === null || isNaN(estimatedTimeValue) || estimatedTimeValue <= 0)) {
      toast.error('Please enter an estimated time.');
      return;
    }
    if (!editingTaskId && !taskCategory) {
      toast.error('Please select a category.');
      return;
    }
    setIsSubmitting(true);

    const todayLocal = new Date().toLocaleDateString('en-CA');
    const logDateForTask = taskLogDate || todayLocal;
    const taskData = {
      project_id: projectId,
      description: taskDescription.trim(),
      status: taskStatus,
      priority: taskPriority,
      deadline: taskDeadline || null,
      reference_doc_id: taskRefDocId || null,
      category: taskCategory || null,
      estimated_time: estimatedTimeValue !== null && !isNaN(estimatedTimeValue) ? estimatedTimeValue : null,
      log_date: logDateForTask,
    };

    try {
      if (editingTaskId) {
        await api.tasks.update(editingTaskId, taskData);

        const existingAssignments = await api.taskAssignments.list({ taskIds: [editingTaskId] });
        const existingStatusMap = new Map<string, string>(
          (existingAssignments || []).map((a: any) => [a.member_id, a.status])
        );
        await api.taskAssignments.replaceForTask(
          editingTaskId,
          taskAssignees.map(mId => ({
            member_id: mId,
            status: existingStatusMap.get(mId) || 'Todo',
          }))
        );
        toast.success('Task updated');
      } else {
        const anchorMemberId = taskAssignees[0] || currentUser?.id;
        await api.tasks.create({
          task: taskData,
          assigneeIds: taskAssignees,
          anchor: anchorMemberId ? { member_id: anchorMemberId, log_date: logDateForTask } : null,
        });
        toast.success('Task created');
      }

      fetchData();
      setTaskDescription(''); setTaskStatus('Todo'); setTaskPriority('Low'); setTaskDeadline(new Date().toLocaleDateString('en-CA')); setTaskAssignees([]);
      setTaskRefDocId('');
      setTaskCategory(''); setTaskEstimatedTime('');
      setTaskLogDate(new Date().toLocaleDateString('en-CA'));
      setEditingTaskId(null);
      setShowTaskModal(false);
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Operation failed'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setIsDeleting(true);
    try {
      await api.tasks.remove(id);
      toast.success('Task deleted');
      fetchData();
    } catch {
      toast.error('Delete failed');
    }
    setIsDeleting(false);
    setDeleteConfirm(null);
  };

  const handleSaveHours = async (taskId: string) => {
    const newWorking = parseFloat(editingWorkingHours) || 0;
    const newBilling = parseFloat(editingBillingHours) || 0;
    if (newBilling > newWorking) {
      toast.error('Logged time cannot be more than working hours.');
      return;
    }
    const task = tasks.find(t => t.id === taskId);
    const prevWorking = task?.total_logged_hours || 0;
    const prevBilling = task?.total_billing_hours || 0;
    const deltaWorking = newWorking - prevWorking;
    const deltaBilling = newBilling - prevBilling;
    const logDate = editingHoursDate || new Date().toLocaleDateString('en-CA');

    try {
      const asg = await api.taskAssignments.list({ taskIds: [taskId] });
      const assigneeIds = (asg || []).map((a: any) => a.member_id);
      const memberId = (currentUser && assigneeIds.includes(currentUser.id))
        ? currentUser.id
        : (assigneeIds[0] || currentUser?.id);
      if (deltaWorking !== 0 || deltaBilling !== 0) {
        if (!memberId) {
          toast.error('Cannot log hours: no assignee or current user.');
          return;
        }
        await api.timeLogs.create({
          task_id: taskId,
          member_id: memberId,
          hours_logged: deltaWorking,
          billing_hours: deltaBilling,
          log_date: logDate,
        });
        await api.tasks.update(taskId, { log_date: logDate });
        toast.success(`Hours updated for ${logDate}`);
      } else {
        const latest = await api.timeLogs.latest(taskId);
        if (latest?.id) {
          await api.timeLogs.update(latest.id, { log_date: logDate });
        } else {
          if (memberId) {
            await api.timeLogs.create({
              task_id: taskId,
              member_id: memberId,
              hours_logged: 0,
              billing_hours: 0,
              log_date: logDate,
            });
          }
        }
        await api.tasks.update(taskId, { log_date: logDate });
        toast.success(`Log date set to ${logDate}`);
      }

      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, total_logged_hours: newWorking, total_billing_hours: newBilling }
          : t
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      toast.error('Failed to update hours: ' + msg);
    }
    setEditingHoursTaskId(null);
    setEditingWorkingHours('');
    setEditingBillingHours('');
    setEditingHoursDate(new Date().toLocaleDateString('en-CA'));
  };

  const openEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskDescription(task.description);
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
    setTaskAssignees(task.assignees?.map(a => a.id) || []);
    setTaskRefDocId(task.reference_doc_id || '');
    setTaskCategory(task.category || '');
    setTaskEstimatedTime(task.estimated_time != null ? String(task.estimated_time) : '');
    setShowTaskModal(true);
  };

  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePassword = (credId: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(credId)) next.delete(credId);
      else {
        next.add(credId);
        const cred = credentials.find(c => c.id === credId);
        if (cred) {
          logActivity(projectId, currentUser?.id, 'View Credential', `Viewed password for "${cred.label}"`);
        }
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    const type = id.startsWith('user-') ? 'username' : 'password';
    const credId = id.split('-')[1];
    const cred = credentials.find(c => c.id === credId);
    if (cred) {
      logActivity(projectId, currentUser?.id, 'Copy Credential', `Copied ${type} for "${cred.label}"`);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [proj, tasksData, credsData, docsData, actData] = await Promise.all([
        api.projects.get(projectId),
        api.tasks.list({
          project_id: projectId,
          include: 'reference_doc',
          order_by: 'created_at',
          order: 'desc',
          created_from: startDate ? startDate + 'T00:00:00' : undefined,
          created_to: endDate ? endDate + 'T23:59:59' : undefined,
        }),
        api.credentials.listForProject(projectId),
        api.documents.listForProject(projectId),
        api.activity.list({ projectId, limit: 5 }),
      ]);

      if (proj) {
        let withLead = proj as any as Project;
        if ((proj as any).client) withLead = { ...withLead, client_name: (proj as any).client.name };
        if ((proj as any).project_lead) withLead = { ...withLead, project_lead: (proj as any).project_lead as TeamMember };
        setProject(withLead);
      }

      const taskIds = (tasksData || []).map((t: any) => t.id);

      const assignsByTask: Record<string, string[]> = {};
      const memberMap: Record<string, TeamMember> = {};
      const hoursMap: Record<string, { working: number; billing: number }> = {};

      if (taskIds.length > 0) {
        const [assigns, logs] = await Promise.all([
          api.taskAssignments.list({ taskIds }),
          api.timeLogs.list({
            logDateGte: startDate || undefined,
            logDateLte: endDate || undefined,
          }),
        ]);

        (assigns as { task_id: string; member_id: string }[]).forEach(a => {
          (assignsByTask[a.task_id] ||= []).push(a.member_id);
        });

        const memberIds = Array.from(new Set(assigns.map(a => a.member_id)));
        if (memberIds.length > 0) {
          const members = (await api.users.list()).filter((m: any) => memberIds.includes(m.id));
          (members || []).forEach((m: any) => { memberMap[m.id] = m as TeamMember; });
        }

        (logs as { task_id: string; hours_logged: number; billing_hours: number }[]).forEach(log => {
          if (!hoursMap[log.task_id]) hoursMap[log.task_id] = { working: 0, billing: 0 };
          hoursMap[log.task_id].working += log.hours_logged || 0;
          hoursMap[log.task_id].billing += log.billing_hours || 0;
        });
      }

      setTasks((tasksData || []).map((t: any) => {
        const ids = assignsByTask[t.id] || [];
        const h = hoursMap[t.id] || { working: 0, billing: 0 };
        return {
          ...t,
          assignees: ids.map(id => memberMap[id]).filter(Boolean) as TeamMember[],
          total_logged_hours: h.working,
          total_billing_hours: h.billing,
        } as Task;
      }));

      setCredentials(credsData || []);
      setDocuments(docsData || []);
      setActivities(((actData || []) as any[]).map(a => ({
        description: a.description,
        action_type: a.action_type,
        created_at: a.created_at,
        member: { name: a.member?.name || 'Unknown' },
      })));
    } catch {
      // Backend not reachable
    }
    setLoading(false);
  }, [projectId, startDate, endDate]);

  useEffect(() => {
    if (userLoading) return;
    fetchData();
  }, [userLoading, fetchData]);

  useEffect(() => {
    if (userLoading) return;

    const fetchLatestActivities = async () => {
      try {
        const actData = await api.activity.list({ projectId, limit: 5 });
        setActivities((actData || []).map((a: any) => ({
          description: a.description,
          action_type: a.action_type,
          created_at: a.created_at,
          member: { name: a.member?.name || 'Unknown' }
        })));
      } catch {
        /* ignore */
      }
    };
    const unsub = subscribeToChanges(fetchLatestActivities);

    return () => { unsub(); };
  }, [userLoading, projectId]);

  useEffect(() => {
    if (userLoading) return;
    const unsub = subscribeToChanges(() => { fetchData(); });
    return () => { unsub(); };
  }, [userLoading, projectId, fetchData]);

  const tasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const isAdmin = currentUser && ['super-admin', 'Admin'].includes(currentUser.role);
  const isProjectLead = project && currentUser && project.project_lead_id === currentUser.id;
  const isAssigned = tasks.some(t => t.assignees?.some(a => a.id === currentUser?.id));
  const hasProjectAccess = isAdmin || isProjectLead || isAssigned;

  const docTypeColor = (type: string) => {
    switch (type) {
      case 'Brief': return 'bg-violet-50 text-violet-600 border-violet-200';
      case 'Spec': return 'bg-cyan-50 text-cyan-600 border-cyan-200';
      case 'Design': return 'bg-pink-50 text-pink-600 border-pink-200';
      case 'Contract': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Paused': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Completed': return 'bg-sky-50 text-sky-600 border-sky-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return {
    router,
    projectId,
    handleDeleteTask,
    setProject,
    setTasks,
    setCredentials,
    setDocuments,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    activities,
    setActivities,
    setLoading,
    rangeInitialized,
    setRangeInitialized,
    showReportModal,
    setShowReportModal,
    isSubmitting,
    setIsSubmitting,
    deleteConfirm,
    setDeleteConfirm,
    isDeleting,
    setIsDeleting,
    assigningTask,
    setAssigningTask,
    showTaskModal,
    setShowTaskModal,
    showClaimModal,
    setShowClaimModal,
    claimingTaskId,
    setClaimingTaskId,
    setEditingTaskId,
    editingTaskId,
    taskDescription,
    setTaskDescription,
    taskStatus,
    setTaskStatus,
    taskPriority,
    setTaskPriority,
    taskDeadline,
    setTaskDeadline,
    taskAssignees,
    setTaskAssignees,
    taskRefDocId,
    setTaskRefDocId,
    taskCategory,
    setTaskCategory,
    taskEstimatedTime,
    setTaskEstimatedTime,
    editingHoursTaskId,
    setEditingHoursTaskId,
    editingWorkingHours,
    setEditingWorkingHours,
    editingBillingHours,
    setEditingBillingHours,
    editingHoursDate,
    setEditingHoursDate,
    taskLogDate,
    setTaskLogDate,
    visiblePasswords,
    setVisiblePasswords,
    copiedId,
    setCopiedId,
    currentUser,
    teamMembers,
    today,
    todayStr,
    lastMonth,
    lastMonthStr,
    assignTeamMember,
    unassignTeamMember,
    handleTaskSubmit,
    handleSaveHours,
    openEditTask,
    togglePassword,
    copyToClipboard,
    fetchData,
    project,
    tasks,
    credentials,
    documents,
    loading,
    userLoading,
    tasksByStatus,
    isAdmin,
    isProjectLead,
    isAssigned,
    hasProjectAccess,
    docTypeColor,
    statusColor
  };
}
