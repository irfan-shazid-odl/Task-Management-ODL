'use client';

import React, { memo } from 'react';
import { Task, TaskStatus } from '@/lib/types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onStatusChange?: () => void;
  onHoursLogged?: () => void;
  onDropTask?: (taskId: string, targetStatus: TaskStatus) => void;
  availableProjects?: { id: string; name: string }[];
  boardDate?: string;
}

const columnAccent: Record<TaskStatus, string> = {
  'Todo': 'from-gray-500 to-gray-600',
  'Working': 'from-blue-500 to-blue-600',
  'On Review': 'from-amber-500 to-amber-600',
  'Complete': 'from-emerald-500 to-emerald-600',
};

const columnBg: Record<TaskStatus, string> = {
  'Todo': 'border-slate-200 bg-slate-50/50',
  'Working': 'border-blue-100 bg-blue-50/30',
  'On Review': 'border-amber-100 bg-amber-50/30',
  'Complete': 'border-emerald-100 bg-emerald-50/30',
};

const KanbanColumnComponent = ({ status, tasks, onStatusChange, onHoursLogged, onDropTask, availableProjects, boardDate }: KanbanColumnProps) => {
  const [isOver, setIsOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onDropTask) {
      onDropTask(taskId, status);
    }
  };

  return (
    <div 
      className={`flex flex-col min-h-[400px] rounded-2xl border ${columnBg[status]} ${isOver ? 'ring-2 ring-violet-500/50 bg-white shadow-md' : 'shadow-sm'} transition-all duration-200 overflow-hidden`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${columnAccent[status]} shadow-sm`} />
            <h3 className="text-sm font-semibold text-slate-800">{status}</h3>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-xs">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onHoursLogged={onHoursLogged}
              onDropTask={onDropTask}
              availableProjects={availableProjects}
              boardDate={boardDate}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default memo(KanbanColumnComponent, (prevProps, nextProps) => {
  return (
    prevProps.status === nextProps.status &&
    prevProps.tasks === nextProps.tasks &&
    prevProps.availableProjects === nextProps.availableProjects &&
    prevProps.boardDate === nextProps.boardDate
  );
});
