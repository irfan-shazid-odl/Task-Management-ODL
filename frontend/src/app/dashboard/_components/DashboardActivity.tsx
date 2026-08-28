'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ListTodo, CheckCircle2, History, Clock, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskStatus } from '@/lib/types';

interface DashboardActivityProps {
  recentTasks: Array<{ description: string; status: TaskStatus; priority: string; project?: { id: string; name: string } }>;
  recentActivity: Array<{
    description: string;
    action_type: string;
    created_at: string;
    member: { name: string };
    project_name?: string;
  }>;
}

const DashboardActivity = memo(function DashboardActivity({ recentTasks, recentActivity }: DashboardActivityProps) {
  return (
    <>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-cyan-500" />
          Recent Tasks
        </h2>
        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No tasks yet. Create one from the Task Manager.</p>
          ) : (
            recentTasks.map((task, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${task.status === 'Complete' ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{task.description}</span>
                  <StatusBadge status={task.status} />
                </div>
                {task.project && (
                  <div className="flex items-center gap-1 pl-7">
                    <Link 
                      href={`/projects/${task.project.id}`}
                      className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-violet-600 font-medium uppercase tracking-wider transition-colors flex items-center gap-1"
                    >
                      {task.project.name}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-500" />
            Activity Log
          </h2>
        </div>
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {recentActivity.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No activity found in filter range.</p>
          ) : (
            recentActivity.map((activity, i) => (
              <div key={i} className="flex gap-3 relative pb-4 last:pb-0">
                {i !== recentActivity.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-100 dark:bg-slate-700" />
                )}
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100 dark:border-emerald-500/25 z-10">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0 pt-1.5">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {activity.member.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap font-medium uppercase min-w-fit">
                      {new Date(activity.created_at).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug break-words">
                    <span className="text-slate-900 dark:text-slate-100 font-medium">{activity.description}</span>
                  </p>
                  {activity.project_name && (
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
                      {activity.project_name}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {recentActivity.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Link 
              href="/admin/activity"
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 group"
            >
              View All Project Activity
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-violet-500 transition-colors" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
});

export default DashboardActivity;
