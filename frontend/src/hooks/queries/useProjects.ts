import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

type ListOpts = Parameters<typeof api.projects.list>[0];

export function useProjects(opts?: ListOpts, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects.list(opts),
    queryFn: () => api.projects.list(opts),
    enabled,
  });
}

export function useProjectsCount() {
  return useQuery({
    queryKey: queryKeys.projects.count,
    queryFn: () => api.projects.count(),
  });
}

export function useProject(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => api.projects.get(id),
    enabled: enabled && !!id,
  });
}

function invalidateProjects(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.projects.all });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.projects.create>[0]) => api.projects.create(data),
    onSuccess: () => invalidateProjects(qc),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.projects.update>[1] }) =>
      api.projects.update(id, data),
    onSuccess: () => invalidateProjects(qc),
  });
}

export function useReorderProjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Array<{ id: string; sort_order: number }>) => api.projects.reorder(updates),
    onSuccess: () => invalidateProjects(qc),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.projects.remove(id),
    onSuccess: () => {
      invalidateProjects(qc);
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useOverrideProjectHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { hours_logged: number; billing_hours: number; log_date: string } }) =>
      api.projects.overrideHours(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.timeLogs.all });
    },
  });
}
