import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/queryKeys';
import type { TimeLogListParams } from '@/lib/api/resources/timeLogs';

export function useTimeLogs(params?: TimeLogListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.timeLogs.list(params),
    queryFn: () => api.timeLogs.list(params),
    enabled,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.timeLogs.all });
  qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
}

export function useCreateTimeLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.timeLogs.create>[0]) => api.timeLogs.create(input),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateTimeLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.timeLogs.update>[1] }) =>
      api.timeLogs.update(id, input),
    onSuccess: () => invalidate(qc),
  });
}
