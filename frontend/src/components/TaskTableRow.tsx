'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus } from '@/lib/types';
import { api } from '@/lib/api';
import { useUser } from './UserContext';
import { toast } from 'sonner';

import TaskDescriptionCell from './_taskTableRowComponents/TaskDescriptionCell';
import TaskActionControls from './_taskTableRowComponents/TaskActionControls';

const todayIsoDate = () => new Date().toLocaleDateString('en-CA');

interface TaskTableRowProps {
  task: Task;
  todaysHours: number;
  todaysBillingHours: number;
  onUpdate?: () => void;
  boardDate?: string;
  viewMode?: string;
}

export default function TaskTableRow({ task, todaysHours, todaysBillingHours, onUpdate, boardDate, viewMode }: TaskTableRowProps) {
  const { currentUser } = useUser();

  const [hours, setHours] = useState('');
  const [billingHours, setBillingHours] = useState('');
  const taskStoredLogDate = task.log_date
    ? new Date(task.log_date).toLocaleDateString('en-CA')
    : todayIsoDate();
  const [logDate, setLogDate] = useState<string>(taskStoredLogDate);
  const [logDateEditable, setLogDateEditable] = useState(false);
  const logDateOnEditStartRef = useRef<string>(taskStoredLogDate);
  const [isLogging, setIsLogging] = useState(false);

  const displayedLogDate = logDateEditable ? logDate : taskStoredLogDate;

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus | null>(null);

  const displayStatus = optimisticStatus || (task as any).assignment_status || task.status;

  // eslint-disable react-hooks/set-state-in-effect -- clearing optimistic state when real state matches
  useEffect(() => {
    if (optimisticStatus) {
      const realStatus = (task as any).assignment_status || task.status;
      if (realStatus === optimisticStatus) setOptimisticStatus(null);
    }
  }, [task, optimisticStatus]);
  // eslint-enable react-hooks/set-state-in-effect

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === displayStatus) return;
    setOptimisticStatus(newStatus);
    setIsUpdatingStatus(true);

    const memberId = viewMode === 'mine' ? currentUser?.id : viewMode;
    const hasAssignmentStatus = (task as any).assignment_status != null;
    // `viewMode === 'all'` is not a real member id: per-assignment updates would
    // target a bogus assignee. Fall back to updating the task's global status in
    // that case.
    const isRealMemberId = !!memberId && memberId !== 'all';

    if (currentUser && hasAssignmentStatus && isRealMemberId) {
      try {
        await api.taskAssignments.updateStatus(task.id, memberId, newStatus);
        toast.success('Status updated'); onUpdate?.();
      } catch { toast.error('Failed to update status'); }
    } else {
      try {
        await api.tasks.update(task.id, { status: newStatus });
        toast.success('Status updated'); onUpdate?.();
      } catch { toast.error('Failed to update status'); }
    }
    setIsUpdatingStatus(false);
  };

  const commitLogDateOnly = async (newDate: string) => {
    if (!currentUser || !newDate) return;
    setIsLogging(true);
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
      onUpdate?.();
    } catch {
      toast.error('Failed to update log date');
    } finally {
      setIsLogging(false);
    }
  };

  const handleLogHours = async () => {
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
    const chosenDate = logDateEditable ? (logDate || defaultLogDate) : defaultLogDate;
    const dateOnlyChange = !hasHours && chosenDate !== defaultLogDate;
    if (!hasHours && !dateOnlyChange) return;

    setIsLogging(true);

    if (hasHours) {
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
        await api.tasks.update(task.id, { log_date: chosenDate });
        toast.success(`Logged ${h}h working / ${bh}h billing on ${chosenDate}`);
        setLogDate(today);
        setLogDateEditable(false);
        onUpdate?.();
      } catch {
        toast.error('Failed to log hours');
      }
    } else {
      try {
        const latest = await api.timeLogs.latest(task.id);
        if (latest?.id) {
          await api.timeLogs.update(latest.id, { log_date: chosenDate });
        } else {
          await api.timeLogs.create({
            task_id: task.id,
            member_id: currentUser.id,
            hours_logged: 0,
            billing_hours: 0,
            log_date: chosenDate,
          });
        }
        await api.tasks.update(task.id, { log_date: chosenDate });
        toast.success(`Log date set to ${chosenDate}`);
        setLogDate(today);
        setLogDateEditable(false);
        onUpdate?.();
      } catch {
        toast.error('Failed to save log date');
      }
    }

    setIsLogging(false);
  };

  return (
    <div className="flex flex-wrap lg:flex-nowrap items-center p-3 hover:bg-slate-50 transition-colors gap-4">
      {/* Project */}
      <div className="w-full lg:w-[120px] font-medium text-slate-900 text-sm truncate shrink-0">
        {task.project?.name || 'No Project'}
      </div>

      <TaskDescriptionCell task={task} onUpdate={onUpdate} />

      <TaskActionControls
        task={task}
        hours={hours}
        setHours={setHours}
        billingHours={billingHours}
        setBillingHours={setBillingHours}
        todaysHours={todaysHours}
        todaysBillingHours={todaysBillingHours}
        logDate={logDate}
        setLogDate={setLogDate}
        displayedLogDate={displayedLogDate}
        logDateEditable={logDateEditable}
        setLogDateEditable={setLogDateEditable}
        taskStoredLogDate={taskStoredLogDate}
        logDateOnEditStartRef={logDateOnEditStartRef}
        todayIsoDate={todayIsoDate}
        commitLogDateOnly={commitLogDateOnly}
        handleLogHours={handleLogHours}
        isLogging={isLogging}
        displayStatus={displayStatus}
        handleStatusChange={handleStatusChange}
        isUpdatingStatus={isUpdatingStatus}
      />
    </div>
  );
}
