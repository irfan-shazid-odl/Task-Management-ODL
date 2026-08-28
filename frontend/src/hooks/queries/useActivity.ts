import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';

interface ListParams {
  projectId?: string;
  limit?: number;
}

export function useActivity(params?: ListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activity.list(params),
    queryFn: () => api.activity.list(params),
    enabled,
  });
}

export function useLogActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.activity.create>[0]) => api.activity.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.activity.all }),
  });
}
