'use client';

import React from 'react';
import { TaskStatus, TaskPriority } from '@/lib/types';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

const statusColors: Record<TaskStatus, string> = {
  'Todo': 'bg-slate-50 text-slate-600 border-slate-200',
  'Working': 'bg-blue-50 text-blue-600 border-blue-200',
  'On Review': 'bg-amber-50 text-amber-600 border-amber-200',
  'Complete': 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

const priorityColors: Record<TaskPriority, string> = {
  'Low': 'bg-slate-50 text-slate-600 border-slate-200',
  'High': 'bg-orange-50 text-orange-600 border-orange-200',
  'Urgent': 'bg-red-50 text-red-600 border-red-200 animate-pulse',
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${statusColors[status]} ${sizeClass}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${priorityColors[priority]} ${sizeClass}`}>
      {priority}
    </span>
  );
}
