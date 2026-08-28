'use client';

import { useMemo } from 'react';
import { useUser } from '@/components/UserContext';
import { useTasks } from '@/hooks/queries/useTasks';
import { useTaskAssignments } from '@/hooks/queries/useTaskAssignments';
import { useTimeLogs } from '@/hooks/queries/useTimeLogs';
import { ROLES_WITH_FULL_DAILY_ACCESS, type TaskWithProject } from '../constants';

// Composes the three server queries behind the daily agenda (tasks + assignments +
// logs), stitches them into TaskWithProject rows, and applies the per-role visibility
// filter. Auto-refreshes every 8s so logged hours stay live everywhere.
export function useDailyTasks() {
  const { currentUser, loading: userLoading, teamMembers } = useUser();
  const enabled = !userLoading && !!currentUser;
  const canSeeAllTasks = !!currentUser && ROLES_WITH_FULL_DAILY_ACCESS.has(currentUser.role);

  const { data: tasksData = [], isLoading: tasksLoading } = useTasks(
    { include: 'project,reference_doc', order_by: 'deadline', order: 'asc' },
    { enabled, refetchInterval: 8000 },
  );

  const taskIds = useMemo(() => (tasksData || []).map((t) => t.id), [tasksData]);

  const { data: assignmentsData = [], isLoading: assignmentsLoading } = useTaskAssignments(undefined, enabled);
  const { data: logsData = [], isLoading: logsLoading } = useTimeLogs({ taskIds }, enabled);

  const tasks = useMemo<TaskWithProject[]>(() => {
    const assigneeIdsByTaskId = new Map<string, string[]>();
    const assignmentStatusMap = new Map<string, string>();
    (assignmentsData || []).forEach((a: any) => {
      const list = assigneeIdsByTaskId.get(a.task_id) || [];
      list.push(a.member_id);
      assigneeIdsByTaskId.set(a.task_id, list);
      // Store current user's per-assignment status
      if (a.member_id === currentUser?.id) {
        assignmentStatusMap.set(a.task_id, a.status);
      }
    });

    const memberById = new Map((teamMembers || []).map((m) => [m.id, m]));
    const hoursByTaskId = new Map<string, number>();
    (logsData || []).forEach((log: any) => {
      const prev = hoursByTaskId.get(log.task_id) || 0;
      hoursByTaskId.set(log.task_id, prev + Number(log.hours_logged || 0));
    });

    const mappedTasks: TaskWithProject[] = (tasksData || []).map((t: any) => {
      const assigneeIds = assigneeIdsByTaskId.get(t.id) || [];
      const assignees = assigneeIds.map((id: string) => memberById.get(id)).filter(Boolean);
      return {
        ...t,
        assignees,
        total_logged_hours: hoursByTaskId.get(t.id) || 0,
        // Only set per-assignment status for member-specific views
        assignment_status: canSeeAllTasks ? undefined : assignmentStatusMap.get(t.id) || null,
      };
    });

    if (!canSeeAllTasks) {
      return mappedTasks.filter(
        (t) =>
          (t.assignees || []).some((a: any) => a.id === currentUser?.id) ||
          (t.assignees || []).length === 0,
      );
    }
    return mappedTasks;
  }, [tasksData, assignmentsData, logsData, teamMembers, currentUser, canSeeAllTasks]);

  return {
    tasks,
    isLoading: userLoading || tasksLoading || assignmentsLoading || logsLoading,
  };
}
