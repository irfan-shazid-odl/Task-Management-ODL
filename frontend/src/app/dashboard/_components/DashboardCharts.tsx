'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { TrendingUp, FolderOpen, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskStatus } from '@/lib/types';

interface DashboardChartsProps {
  statusCounts: Array<{ status: TaskStatus; count: number }>;
  maxStatusCount: number;
  projectHours: Array<{ id: string; name: string; category: string; hours: number }>;
}

const DashboardCharts = memo(function DashboardCharts({
  statusCounts, maxStatusCount, projectHours
}: DashboardChartsProps) {
  return (
    <>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          Tasks by Status
        </h2>
        <div className="space-y-4">
          {statusCounts.map(({ status, count }) => (
            <div key={status} className="flex items-center gap-4">
              <StatusBadge status={status} size="md" />
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

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-sm flex flex-col">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-emerald-500" />
          Project Time Distribution
        </h2>
        <div className="space-y-4 flex-1 overflow-y-auto">
          {projectHours.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No time logged in filter range.</p>
          ) : (
            projectHours.map(ph => (
              <div key={ph.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link href={`/projects/${ph.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate hover:text-violet-600 flex items-center gap-1">
                      {ph.name}
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                      {ph.category}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{ph.hours.toFixed(1)}h</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
});

export default DashboardCharts;
