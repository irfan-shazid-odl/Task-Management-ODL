import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useProjectDocuments(projectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.documents.forProject(projectId),
    queryFn: () => api.documents.listForProject(projectId),
    enabled: enabled && !!projectId,
  });
}

export function useDocumentsByIds(ids: string[], enabled = true) {
  return useQuery({
    queryKey: queryKeys.documents.byIds(ids),
    queryFn: () => api.documents.listByIds(ids),
    enabled: enabled && ids.length > 0,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: queryKeys.documents.forProject(projectId) });
}

export function useCreateDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.documents.create>[0]) => api.documents.create(data),
    onSuccess: () => invalidate(qc, projectId),
  });
}

export function useUpdateDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.documents.update>[1] }) =>
      api.documents.update(id, data),
    onSuccess: () => invalidate(qc, projectId),
  });
}

export function useDeleteDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.documents.remove(id),
    onSuccess: () => invalidate(qc, projectId),
  });
}
