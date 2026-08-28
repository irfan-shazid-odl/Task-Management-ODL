import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

export function useVaultItems(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vault.all,
    queryFn: () => api.vault.list(),
    enabled,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.vault.all });
}

export function useCreateVaultItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.vault.create>[0]) => api.vault.create(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateVaultItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.vault.update>[1] }) =>
      api.vault.update(id, data),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteVaultItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.vault.remove(id),
    onSuccess: () => invalidate(qc),
  });
}
