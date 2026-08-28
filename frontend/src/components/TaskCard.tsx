'use client';

import React, { useState, memo, useRef, useEffect } from 'react';
import TaskCardDetails from './_taskCardComponents/TaskCardDetails';
import TaskEditModal from './_taskCardComponents/TaskEditModal';
import { Task, TaskStatus, TaskPriority, TASK_STATUSES } from '@/lib/types';
import { api } from '@/lib/api';
import { useUser } from './UserContext';
import Avatar from './Avatar';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface TaskCardProps {
  task: Task;
  onStatusChange?: () => void;
  onHoursLogged?: () => void;
  onDropTask?: (taskId: string, targetStatus: TaskStatus) => void;
  showMoveButtons?: boolean;
  availableProjects?: { id: string; name: string }[];
  boardDate?: string;
}

const todayIsoDate = () => new Date().toLocaleDateString('en-CA');

const TaskCardComponent = ({ task, onStatusChange, onHoursLogged, onDropTask, showMoveButtons = true, availableProjects, boardDate }: TaskCardProps) => {
  const { currentUser, teamMembers } = useUser();
  const [hours, setHours] = useState('');
  const [billingHours, setBillingHours] = useState('');
  const taskStoredLogDate = task.log_date
    ? new Date(task.log_date).toLocaleDateString('en-CA')
    : todayIsoDate();
  const [logDate, setLogDate] = useState<string>(taskStoredLogDate);
  const [logDateEditable, setLogDateEditable] = useState(false);
  const logDateOnEditStartRef = useRef<string>(taskStoredLogDate);
  // When not editing, show the task's stored value directly so re-fetches reflect immediately.
  const displayedLogDate = logDateEditable ? logDate : taskStoredLogDate;
  const [logging, setLogging] = useState(false);
  const [moving, setMoving] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const DESC_LIMIT = 220;
  const isLongDesc = (task.description?.length || 0) > DESC_LIMIT;

  // Derived display status (per-assignment overrides global)
  const displayStatus = (task as any).assignment_status || task.status;

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editStatus, setEditStatus] = useState<TaskStatus>(displayStatus);
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);
  const [editDeadline, setEditDeadline] = useState(task.deadline ? task.deadline.slice(0, 10) : '');
  const [editHours, setEditHours] = useState<string>(String(task.total_logged_hours ?? 0));
  const [editBillingHours, setEditBillingHours] = useState<string>(String(task.total_billing_hours ?? 0));
  const [editLogDate, setEditLogDate] = useState<string>(todayIsoDate());
  const initialEditHoursRef = useRef<{ hours: string; billing: string }>({ hours: '0', billing: '0' });
  const initialEditLogDateRef = useRef<string>(todayIsoDate());
  const latestLogIdRef = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Project & Document Edit state
  const [editProjectId, setEditProjectId] = useState(task.project_id || '');
  const [editRefDocId, setEditRefDocId] = useState(task.reference_doc_id || '');
  const [editProjectDocs, setEditProjectDocs] = useState<{ id: string; title: string; url: string; doc_type: string }[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Assignee management state (Director & Team Lead only)
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const canManageAssignees = ['super-admin', 'Lead'].includes(currentUser?.role || '');

  // Avatar modal
  const [avatarModal, setAvatarModal] = useState<{
    name: string; role: string; avatar_url?: string; status?: string;
    email?: string; phone?: string; location?: string; bio?: string;
  } | null>(null);

  // Searchable dropdown states
  const [projDropdownOpen, setProjDropdownOpen] = useState(false);
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [projSearch, setProjSearch] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [projRect, setProjRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [docRect, setDocRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const projTriggerRef = useRef<HTMLButtonElement>(null);
  const docTriggerRef = useRef<HTMLButtonElement>(null);
  const projDropdownRef = useRef<HTMLDivElement>(null);
  const docDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch documents when project changes
  // eslint-disable react-hooks/set-state-in-effect -- resetting derived data on prop change
  useEffect(() => {
    if (!editProjectId) {
      setEditProjectDocs([]);
      return;
    }
    // Guard against a stale response: switching projects quickly must not let
    // an earlier (slower) request overwrite the docs of the current project,
    // and must not setState after unmount.
    let cancelled = false;
    setLoadingDocs(true);
    api.documents.listForProject(editProjectId)
      .then((data) => {
        if (cancelled) return;
        setEditProjectDocs(data || []);
        setLoadingDocs(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Original left data null on error ??? empty list; preserve that.
        setEditProjectDocs([]);
        setLoadingDocs(false);
      });
    return () => { cancelled = true; };
  }, [editProjectId]);
  // eslint-enable react-hooks/set-state-in-effect

  // Click outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (projDropdownRef.current && !projDropdownRef.current.contains(e.target as Node)) setProjDropdownOpen(false);
      if (docDropdownRef.current && !docDropdownRef.current.contains(e.target as Node)) setDocDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentIndex = TASK_STATUSES.indexOf(displayStatus);
  const canMoveForward = currentIndex < TASK_STATUSES.length - 1;
  const canMoveBackward = currentIndex > 0;

  async function moveTask(direction: 'forward' | 'backward') {
    if (isTaskLocked) {
      toast.error('Completed tasks are locked and cannot be moved by Leads or Members.');
      return;
    }
    const newIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= TASK_STATUSES.length) return;
    const newStatus: TaskStatus = TASK_STATUSES[newIndex];
    
    const shouldUpdateLogDate = newStatus === 'Complete';
    if (onDropTask) {
      onDropTask(task.id, newStatus);
    } else {
      setMoving(true);
      try {
        if (currentUser && (task as any).assignment_status != null) {
          if (shouldUpdateLogDate) await api.tasks.update(task.id, { log_date: boardDate || todayIsoDate() });
          await api.taskAssignments.updateStatus(task.id, currentUser.id, newStatus);
        } else {
          const patch: Record<string, unknown> = { status: newStatus };
          if (shouldUpdateLogDate) patch.log_date = boardDate || todayIsoDate();
        await api.tasks.update(task.id, patch);
      }
        onStatusChange?.();
      } catch {
        toast.error('Failed to update status');
      } finally {
        setMoving(false);
      }
    }
  }

  // Save a date-only correction (no hours involved). Used by onBlur auto-save.
  async function commitLogDateOnly(newDate: string) {
    if (!currentUser) return;
    if (!newDate) return;
    setLogging(true);
    try {
      const latest = await api.timeLogs.latest(task.id);
      if (latest?.id) {
        await api.timeLogs.update(latest.id, { log_date: newDate });
      } else {
        await api.timeLogs.create({
          task_id: task.id,
          member_id: currentUser.id,
          hours_logged: 0,
          billing_hours: 0,
          log_date: newDate,
        });
      }
      await api.tasks.update(task.id, { log_date: newDate });
      toast.success(`Log date set to ${newDate}`);
      onHoursLogged?.();
    } catch {
      toast.error('Failed to update log date');
    } finally {
      setLogging(false);
    }
  }

  async function logHours() {
    const h = parseFloat(hours) || 0;
    const bh = parseFloat(billingHours) || 0;
    if (!currentUser) return;

    const newTotalWorking = (task.total_logged_hours || 0) + h;
    const newTotalBilling = (task.total_billing_hours || 0) + bh;

    if (newTotalBilling > newTotalWorking) {
      toast.error('Total logged time cannot exceed total working hours.');
      return;
    }

    const today = todayIsoDate();
    const defaultLogDate = boardDate || today;
    const hasHours = hours !== '' || billingHours !== '';
    // Hours always log against the current board date unless the user explicitly opened the date
    // picker to backdate. Otherwise a carried-over task (whose stored log_date is
    // an earlier day) would file new hours under that old date, where today's/viewed
    // board can't see them ??? making it look like the time didn't save.
    const chosenDate = logDateEditable ? (logDate || defaultLogDate) : defaultLogDate;
    const dateOnlyChange = !hasHours && chosenDate !== defaultLogDate;

    if (!hasHours && !dateOnlyChange) return; // nothing to do

    setLogging(true);

    if (hasHours) {
      // Credit the task's assignee, not whoever is logging ??? an admin may be
      // logging on a teammate's board. Prefer the logger if they're an assignee
      // (normal self-logging, incl. multi-assignee tasks); else the first one.
      const asg = await api.taskAssignments.list({ taskIds: [task.id] });
      const assigneeIds = (asg || []).map((a: any) => a.member_id);
      const memberId = assigneeIds.includes(currentUser.id)
        ? currentUser.id
        : (assigneeIds[0] || currentUser.id);
      try {
        await api.timeLogs.create({
          task_id: task.id,
          member_id: memberId,
          hours_logged: h,
          billing_hours: bh,
          log_date: chosenDate,
        });
      } catch (error) { console.error('Failed to log hours:', error); setLogging(false); return; }
      await api.tasks.update(task.id, { log_date: chosenDate });
    } else {
      // Date-only change with zero hours ??? rebase latest log if it exists,
      // otherwise insert a zero-hours anchor row so the board places the task on `chosenDate`.
      const latest = await api.timeLogs.latest(task.id);
      if (latest?.id) {
        try {
          await api.timeLogs.update(latest.id, { log_date: chosenDate });
        } catch (error) { console.error('Failed to update log date:', error); setLogging(false); return; }
      } else {
        try {
          await api.timeLogs.create({
            task_id: task.id,
            member_id: currentUser.id,
            hours_logged: 0,
            billing_hours: 0,
            log_date: chosenDate,
          });
        } catch (error) { console.error('Failed to anchor log date:', error); setLogging(false); return; }
      }
      await api.tasks.update(task.id, { log_date: chosenDate });
    }

    setHours('');
    setBillingHours('');
    setLogDateEditable(false);
    setLogging(false);
    // Don't reset to today ??? let the useEffect sync the input to the task's
    // updated log_date once the parent refetches.
    onHoursLogged?.();
  }

  async function openEdit() {
    setEditDescription(task.description);
    setEditStatus(displayStatus);
    setEditPriority(task.priority);
    setEditDeadline(task.deadline ? task.deadline.slice(0, 10) : '');
    const initHours = String(task.total_logged_hours ?? 0);
    const initBilling = String(task.total_billing_hours ?? 0);
    setEditHours(initHours);
    setEditBillingHours(initBilling);
    initialEditHoursRef.current = { hours: initHours, billing: initBilling };

    // Prefer the task's own log_date (the source of truth); fall back to the latest time_log row.
    let latestLog: { id: string; log_date: string } | null = null;
    try {
      latestLog = await api.timeLogs.latest(task.id);
    } catch {
      latestLog = null;
    }
    const taskLogDate = (task as any).log_date as string | undefined;
    const startingDate = taskLogDate || (latestLog?.log_date as string) || todayIsoDate();
    setEditLogDate(startingDate);
    initialEditLogDateRef.current = startingDate;
    latestLogIdRef.current = (latestLog?.id as string) || null;

    setEditProjectId(task.project_id || '');
    setEditRefDocId(task.reference_doc_id || '');
    setAssigneeSearch('');
    setShowEditModal(true);

    // Fetch current assignees fresh from DB so pre-selection is always accurate
    if (canManageAssignees) {
      try {
        const data = await api.taskAssignments.list({ taskIds: [task.id] });
        setEditAssigneeIds((data || []).map((a: any) => a.member_id));
      } catch {
        setEditAssigneeIds([]);
      }
    }
  }

  async function saveEdit() {
    if (!editDescription.trim()) { toast.error('Description is required.'); return; }
    if (!editProjectId) { toast.error('Project is required.'); return; }
    setSaving(true);

    // Update task global fields (description, priority, etc.)
    // We update tasks.status as the global/overall status so the "All Members"
    // view reflects deliberate edits, while quick drag/move changes stay per-assignment.
    try {
      await api.tasks.update(task.id, {
        description: editDescription.trim(),
        status: editStatus,
        priority: editPriority,
        deadline: editDeadline || null,
        project_id: editProjectId,
        reference_doc_id: editRefDocId || null,
        log_date: editLogDate || todayIsoDate(),
      });
    } catch (error: any) { setSaving(false); toast.error('Failed to save: ' + (error?.message || 'error')); return; }

    // Also update the current user's per-assignment status so their board view
    // stays in sync immediately.
    if (currentUser) {
      await api.taskAssignments.updateStatus(task.id, currentUser.id, editStatus);
    }

    // Update assignees if the user has permission ??? preserve existing
    // per-assignment statuses for members that stay assigned.
    if (canManageAssignees) {
      const existingAssignments = await api.taskAssignments.list({ taskIds: [task.id] });
      const existingStatusMap = new Map((existingAssignments || []).map(a => [a.member_id, a.status]));
      await api.taskAssignments.replaceForTask(
        task.id,
        editAssigneeIds.map(memberId => ({
          member_id: memberId,
          status: existingStatusMap.get(memberId) || editStatus,
        }))
      );
    }

    // Working hours / log date: never wipe history. Three cases:
    //   1. Hours changed ??? insert a delta row dated `editLogDate`.
    //   2. Only log date changed ??? update the latest existing log row's date.
    //   3. Nothing changed ??? leave time_logs alone.
    const hoursChanged = editHours !== initialEditHoursRef.current.hours;
    const billingChanged = editBillingHours !== initialEditHoursRef.current.billing;
    const logDateChanged = editLogDate !== initialEditLogDateRef.current;

    if (hoursChanged || billingChanged) {
      const prevHours = parseFloat(initialEditHoursRef.current.hours) || 0;
      const prevBilling = parseFloat(initialEditHoursRef.current.billing) || 0;
      const newHours = parseFloat(editHours);
      const newBilling = parseFloat(editBillingHours);
      const wh = isNaN(newHours) ? prevHours : newHours;
      const bh = isNaN(newBilling) ? prevBilling : newBilling;

      if (bh > wh) {
        toast.error('Logged time cannot be more than working hours.');
        setSaving(false);
        return;
      }

      const deltaHours = wh - prevHours;
      const deltaBilling = bh - prevBilling;

      if ((deltaHours !== 0 || deltaBilling !== 0) && currentUser) {
        // File new hours under the current board date unless the user deliberately picked a date,
        // so the board (scoped to the selected day) surfaces them.
        const defaultLogDate = boardDate || todayIsoDate();
        const hoursDate = logDateChanged ? (editLogDate || defaultLogDate) : defaultLogDate;
        // Credit the hours to the task's assignee, not whoever is editing ??? fetch
        // fresh so an admin editing on someone's behalf lands on the member's
        // board. Prefer the editor if they're an assignee; else the first one.
        const asg = await api.taskAssignments.list({ taskIds: [task.id] });
        const assigneeIds = (asg || []).map((a: any) => a.member_id);
        const memberId = assigneeIds.includes(currentUser.id)
          ? currentUser.id
          : (assigneeIds[0] || currentUser.id);
        try {
          await api.timeLogs.create({
            task_id: task.id,
            member_id: memberId,
            hours_logged: deltaHours,
            billing_hours: deltaBilling,
            log_date: hoursDate,
          });
        } catch (logErr) {
          console.error('Failed to log hours:', logErr);
          toast.error('Failed to update hours');
          setSaving(false);
          return;
        }
        // Move the task onto that day so the board surfaces the new hours.
        await api.tasks.update(task.id, { log_date: hoursDate });
      }
    } else if (logDateChanged) {
      const newDate = editLogDate || todayIsoDate();
      if (latestLogIdRef.current) {
        await api.timeLogs.update(latestLogIdRef.current, { log_date: newDate });
      } else if (currentUser) {
        // No existing log row ??? insert a zero-hours anchor so the date persists.
        const assigns = await api.taskAssignments.list({ taskIds: [task.id] });
        const memberId = assigns?.[0]?.member_id || currentUser.id;
        await api.timeLogs.create({
          task_id: task.id,
          member_id: memberId,
          hours_logged: 0,
          billing_hours: 0,
          log_date: newDate,
        });
      }
    }

    setSaving(false);
    toast.success('Task updated!');
    setShowEditModal(false);
    onStatusChange?.();
    onHoursLogged?.();
  }

  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadlineDate && deadlineDate < new Date();
  function getTaskAge(createdAt: string) {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  }

  const isTaskLocked = displayStatus === 'Complete' && !['super-admin', 'Admin'].includes(currentUser?.role || '');

  return (
    <>
      <TaskCardDetails task={task} currentUser={currentUser} isTaskLocked={isTaskLocked} descExpanded={descExpanded} setDescExpanded={setDescExpanded} avatarModal={avatarModal} setAvatarModal={setAvatarModal} displayedLogDate={displayedLogDate} logDateEditable={logDateEditable} setLogDateEditable={setLogDateEditable} logDate={logDate} setLogDate={setLogDate} logging={logging} logHours={logHours} hours={hours} setHours={setHours} billingHours={billingHours} setBillingHours={setBillingHours} canMoveBackward={canMoveBackward} canMoveForward={canMoveForward} moving={moving} moveTask={moveTask} currentIndex={currentIndex} openEdit={openEdit} taskStoredLogDate={taskStoredLogDate} logDateOnEditStartRef={logDateOnEditStartRef} commitLogDateOnly={commitLogDateOnly} isLongDesc={isLongDesc} DESC_LIMIT={DESC_LIMIT} displayStatus={displayStatus} getTaskAge={getTaskAge} deadlineDate={deadlineDate} isOverdue={isOverdue} showMoveButtons={showMoveButtons} />
      <TaskEditModal showEditModal={showEditModal} setShowEditModal={setShowEditModal} editDescription={editDescription} setEditDescription={setEditDescription} editStatus={editStatus} setEditStatus={setEditStatus} editPriority={editPriority} setEditPriority={setEditPriority} editDeadline={editDeadline} setEditDeadline={setEditDeadline} editProjectId={editProjectId} setEditProjectId={setEditProjectId} editRefDocId={editRefDocId} setEditRefDocId={setEditRefDocId} editHours={editHours} setEditHours={setEditHours} editBillingHours={editBillingHours} setEditBillingHours={setEditBillingHours} editLogDate={editLogDate} setEditLogDate={setEditLogDate} editAssigneeIds={editAssigneeIds} setEditAssigneeIds={setEditAssigneeIds} assigneeSearch={assigneeSearch} setAssigneeSearch={setAssigneeSearch} projDropdownOpen={projDropdownOpen} setProjDropdownOpen={setProjDropdownOpen} docDropdownOpen={docDropdownOpen} setDocDropdownOpen={setDocDropdownOpen} projSearch={projSearch} setProjSearch={setProjSearch} docSearch={docSearch} setDocSearch={setDocSearch} projRect={projRect} setProjRect={setProjRect} docRect={docRect} setDocRect={setDocRect} projTriggerRef={projTriggerRef} docTriggerRef={docTriggerRef} projDropdownRef={projDropdownRef} docDropdownRef={docDropdownRef} availableProjects={availableProjects} editProjectDocs={editProjectDocs} loadingDocs={loadingDocs} teamMembers={teamMembers} isTaskLocked={isTaskLocked} canManageAssignees={canManageAssignees} saving={saving} saveEdit={saveEdit} />
      {/* ?????? Avatar Modal ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????? */}
      {avatarModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setAvatarModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xs border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              <div className="w-full aspect-square bg-slate-100 flex items-center justify-center">
                <Avatar
                  path={avatarModal.avatar_url}
                  name={avatarModal.name}
                  className="w-full h-full object-cover"
                  textClassName="text-4xl bg-slate-100 text-slate-400"
                />
              </div>
              <button
                onClick={() => setAvatarModal(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white hover:text-slate-900 transition-all shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-base font-bold text-slate-900">{avatarModal.name}</h3>
              <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">{avatarModal.role}</p>
              {avatarModal.status && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                  <span>Task: {avatarModal.status}</span>
                </div>
              )}
              <div className="pt-2 space-y-1.5 text-xs text-slate-600">
                {avatarModal.email && <p><span className="font-semibold text-slate-400">Email:</span> {avatarModal.email}</p>}
                {avatarModal.phone && <p><span className="font-semibold text-slate-400">Phone:</span> {avatarModal.phone}</p>}
                {avatarModal.location && <p><span className="font-semibold text-slate-400">Location:</span> {avatarModal.location}</p>}
                {avatarModal.bio && (
                  <div>
                    <p className="font-semibold text-slate-400 mb-0.5">Bio:</p>
                    <p className="text-slate-500 leading-relaxed">{avatarModal.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(TaskCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.task === nextProps.task &&
    prevProps.boardDate === nextProps.boardDate &&
    prevProps.showMoveButtons === nextProps.showMoveButtons &&
    prevProps.availableProjects === nextProps.availableProjects
  );
});
