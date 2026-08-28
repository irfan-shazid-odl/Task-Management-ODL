import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useClients(enabled = true) {
  return useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => api.clients.list(),
    enabled,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.clients.all });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.clients.create>[0]) => api.clients.create(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.clients.update>[1] }) =>
      api.clients.update(id, data),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.clients.remove(id),
    onSuccess: () => invalidate(qc),
  });
}
