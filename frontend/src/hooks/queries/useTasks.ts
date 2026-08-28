import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';
import type { TaskListParams, TaskData } from '@/lib/api/resources/tasks';

interface UseTasksOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useTasks(params?: TaskListParams, options: UseTasksOptions = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: () => api.tasks.list(params),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval,
  });
}

export function useTasksWithCount(params?: TaskListParams, options: UseTasksOptions = {}) {
  return useQuery({
    queryKey: ['tasks', 'withCount', params ?? null],
    queryFn: () => api.tasks.listWithCount(params),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval,
  });
}

// Invalidate everything a task write can touch: tasks, their assignments, and logs.
export function invalidateTaskGraph(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
  qc.invalidateQueries({ queryKey: queryKeys.taskAssignments.all });
  qc.invalidateQueries({ queryKey: queryKeys.timeLogs.all });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.tasks.create>[0]) => api.tasks.create(input),
    onSuccess: () => invalidateTaskGraph(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TaskData> }) => api.tasks.update(id, patch),
    onSuccess: () => invalidateTaskGraph(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.tasks.remove(id),
    onSuccess: () => invalidateTaskGraph(qc),
  });
}
