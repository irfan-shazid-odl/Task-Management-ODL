'use client';

import React, { useMemo, memo } from 'react';
import { TrendingUp } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskStatus } from '@/lib/types';
import type { StatusCount } from '../lib/aggregations';

interface Props {
  statusCounts: StatusCount[];
}

const TasksByStatus = memo(function TasksByStatus({ statusCounts }: Props) {
  const maxStatusCount = useMemo(() => Math.max(...statusCounts.map((s) => s.count), 1), [statusCounts]);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-violet-500" />
        Tasks by Status
      </h2>
      <div className="space-y-4">
        {statusCounts.map(({ status, count }) => (
          <div key={status} className="flex items-center gap-4">
            <StatusBadge status={status as TaskStatus} size="md" />
            <div className="flex-1">
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-700 ease-out"
                  style={{ width: `${(count / maxStatusCount) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-mono text-slate-500 dark:text-slate-400 w-8 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default TasksByStatus;
