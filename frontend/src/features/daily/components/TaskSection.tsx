'use client';

import React from 'react';
import TaskCard from '@/components/TaskCard';
import type { TaskWithProject } from '../constants';

interface Props {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  tasks: TaskWithProject[];
  onRefresh: () => void;
}

// A single deadline bucket: heading with count badge + responsive grid of TaskCards.
export default function TaskSection({ title, icon, iconColor, tasks, onRefresh }: Props) {
  if (tasks.length === 0) return null;
  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg ${iconColor} bg-white border border-slate-200 shadow-sm`}>
          {icon}
        </div>
        {title}
        <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-mono border border-slate-200">
          {tasks.length}
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onStatusChange={onRefresh} onHoursLogged={onRefresh} />
        ))}
      </div>
    </div>
  );
}
