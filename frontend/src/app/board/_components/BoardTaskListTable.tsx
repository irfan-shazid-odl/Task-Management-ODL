'use client';

import React from 'react';
import { Task } from '@/lib/types';
import TaskTableRow from '@/components/TaskTableRow';
import { Skeleton } from '@/components/Skeleton';
import Image from 'next/image';
import { formatHours } from '@/lib/utils';

type ViewMode = 'mine' | 'all' | string;

interface BoardTaskListTableProps {
  loading: boolean;
  tableTasks: Task[];
  todaysActivity: Record<string, { working: number; billing: number }>;
  todaysTotalHours: number;
  todaysTotalBillingHours: number;
  todaysTotalProjects: number;
  showTasksTable: boolean;
  boardDate: string;
  viewMode: ViewMode;
  onToggleTable: () => void;
  onOpenReportModal: () => void;
  onUpdate: () => void;
}

export default function BoardTaskListTable({
  loading,
  tableTasks,
  todaysActivity,
  todaysTotalHours,
  todaysTotalBillingHours,
  todaysTotalProjects,
  showTasksTable,
  boardDate,
  viewMode,
  onToggleTable,
  onOpenReportModal,
  onUpdate,
}: BoardTaskListTableProps) {
  return (
    <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
          ALL TASKS {!loading && `(${tableTasks.length})`}
        </h3>
        <div className="flex items-center gap-2">
          <button
             onClick={onOpenReportModal}
             title="Daily Task Report"
             className="flex items-center justify-center p-1 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors active:scale-95"
          >
             <Image src="/icon11.jpeg" alt="Daily Task Report" width={24} height={24} className="rounded" />
          </button>
          <button
             onClick={onToggleTable}
             className="text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
          >
             {showTasksTable ? 'Hide Table' : 'Show Table'}
          </button>
        </div>
      </div>
      
      {showTasksTable && (
        <>
          {loading ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="divide-y divide-slate-100">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-wrap items-center p-4 gap-4">
                    <Skeleton className="h-4 w-32 rounded-lg flex-1" />
                    <Skeleton className="h-4 w-64 rounded-lg flex-[2]" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <div className="w-28 flex justify-end shrink-0">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tableTasks.length > 0 ? (
            <>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                 <div className="divide-y divide-slate-200 bg-white max-h-96 overflow-y-auto">
                    {tableTasks.map((task) => (
                      <TaskTableRow
                        key={task.id}
                        task={task}
                        todaysHours={todaysActivity[task.id]?.working || 0}
                        todaysBillingHours={todaysActivity[task.id]?.billing || 0}
                        onUpdate={onUpdate}
                        boardDate={boardDate}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
              </div>

              <div className="mt-4 flex flex-col gap-1.5 px-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">Working Period Hours:</span>
                  <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {formatHours(todaysTotalHours)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-violet-500">Logged Time Total:</span>
                  <span className="text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
                    {formatHours(todaysTotalBillingHours)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 italic">
                   Aggregated across {todaysTotalProjects} project{todaysTotalProjects !== 1 ? 's' : ''} for today.
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
              No tasks available in this view.
            </div>
          )}
        </>
      )}
    </div>
  );
}
