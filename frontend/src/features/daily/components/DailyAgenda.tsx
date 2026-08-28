'use client';

import React from 'react';
import { AlertCircle, Clock, CalendarDays, Calendar, Layers } from 'lucide-react';
import TaskSection from './TaskSection';
import { groupTasksByDeadline } from '../lib/groupTasks';
import type { TaskWithProject } from '../constants';

interface Props {
  tasks: TaskWithProject[];
  onRefresh: () => void;
}

// Renders the deadline-grouped agenda, or an "all caught up" empty state when there
// are no active (non-completed) tasks left.
export default function DailyAgenda({ tasks, onRefresh }: Props) {
  const hasActiveTasks = tasks.some((t) => t.status !== 'Complete');

  if (!hasActiveTasks) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
          <Calendar className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">All caught up!</h3>
        <p className="text-xs text-slate-500 mt-1">You have no active tasks left.</p>
      </div>
    );
  }

  const { overdue, today, tomorrow, upcoming, noDeadline } = groupTasksByDeadline(tasks);

  return (
    <>
      <TaskSection title="Overdue" icon={<AlertCircle className="w-4 h-4" />} iconColor="text-red-500" tasks={overdue} onRefresh={onRefresh} />
      <TaskSection title="Today" icon={<Clock className="w-4 h-4" />} iconColor="text-amber-500" tasks={today} onRefresh={onRefresh} />
      <TaskSection title="Tomorrow" icon={<CalendarDays className="w-4 h-4" />} iconColor="text-violet-500" tasks={tomorrow} onRefresh={onRefresh} />
      <TaskSection title="Upcoming" icon={<Calendar className="w-4 h-4" />} iconColor="text-cyan-500" tasks={upcoming} onRefresh={onRefresh} />
      <TaskSection title="No Deadline Given" icon={<Layers className="w-4 h-4" />} iconColor="text-slate-400" tasks={noDeadline} onRefresh={onRefresh} />
    </>
  );
}
