'use client';

import { Loader2, UserPlus, X } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Task } from '@/lib/types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  currentUserId: string;
  claimingTaskId: string | null;
  onClaim: (taskId: string) => void | Promise<void>;
};

export default function ClaimTaskModal({
  isOpen, onClose, tasks, currentUserId, claimingTaskId, onClaim,
}: Props) {
  if (!isOpen) return null;

  const claimable = tasks.filter(
    t => !t.assignees?.some(a => a.id === currentUserId) && t.status !== 'Complete'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-violet-500" />
            Claim a Task
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          <p className="text-xs text-slate-500 mb-4">Select a task below to assign yourself to it.</p>
          <div className="space-y-2">
            {claimable.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <UserPlus className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm font-medium">No available tasks to claim</p>
                <p className="text-xs mt-1">You&apos;re already assigned to all tasks, or all tasks are complete.</p>
              </div>
            ) : (
              claimable.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group ${
                    claimingTaskId === task.id
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-slate-200 hover:border-violet-200 hover:bg-violet-50/40'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{task.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.deadline && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Due {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {task.assignees.map(a => (
                          <span key={a.id} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{a.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    disabled={claimingTaskId === task.id}
                    onClick={() => onClaim(task.id)}
                    className="ml-4 shrink-0 flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {claimingTaskId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    Claim
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
