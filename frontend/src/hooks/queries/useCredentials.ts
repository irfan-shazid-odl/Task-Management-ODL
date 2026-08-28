import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useProjectCredentials(projectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.credentials.forProject(projectId),
    queryFn: () => api.credentials.listForProject(projectId),
    enabled: enabled && !!projectId,
  });
}

export function useCreateCredential(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.credentials.create>[0]) => api.credentials.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.credentials.forProject(projectId) }),
  });
}

export function useUpdateCredential(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.credentials.update>[1] }) =>
      api.credentials.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.credentials.forProject(projectId) }),
  });
}

export function useDeleteCredential(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.credentials.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.credentials.forProject(projectId) }),
  });
}
