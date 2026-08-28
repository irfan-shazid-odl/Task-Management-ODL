import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

interface ListParams {
  taskIds?: string[];
  memberId?: string;
}

export function useTaskAssignments(params?: ListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.taskAssignments.list(params),
    queryFn: () => api.taskAssignments.list(params),
    enabled,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.taskAssignments.all });
  qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
}

export function useAssignMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, memberId }: { taskId: string; memberId: string }) =>
      api.taskAssignments.assign(taskId, memberId),
    onSuccess: () => invalidate(qc),
  });
}

export function useUnassignMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, memberId }: { taskId: string; memberId: string }) =>
      api.taskAssignments.unassign(taskId, memberId),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateAssignmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, memberId, status }: { taskId: string; memberId: string; status: string }) =>
      api.taskAssignments.updateStatus(taskId, memberId, status),
    onSuccess: () => invalidate(qc),
  });
}

export function useReplaceAssignees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, assignees }: { taskId: string; assignees: Array<{ member_id: string; status?: string }> }) =>
      api.taskAssignments.replaceForTask(taskId, assignees),
    onSuccess: () => invalidate(qc),
  });
}
