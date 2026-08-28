import { QueryClient } from '@tanstack/react-query';

// Single QueryClient factory. Sensible defaults for an authenticated dashboard:
// short stale time, background refetch on focus/reconnect, one retry.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
