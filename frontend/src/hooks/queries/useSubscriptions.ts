import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useSubscriptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.subscriptions.all,
    queryFn: () => api.subscriptions.list(),
    enabled,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.subscriptions.create>[0]) => api.subscriptions.create(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.subscriptions.update>[1] }) =>
      api.subscriptions.update(id, data),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.subscriptions.remove(id),
    onSuccess: () => invalidate(qc),
  });
}
