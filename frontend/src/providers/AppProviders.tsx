'use client';

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { makeStore } from '@/store';
import { makeQueryClient } from '@/lib/query/queryClient';

// Top-level client providers: Redux (global client state) + TanStack Query
// (server state). Instances are created once per browser session via refs so
// they stay stable across re-renders.
export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [store] = React.useState(() => makeStore());
  const [queryClient] = React.useState(() => makeQueryClient());

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
