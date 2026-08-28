'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Check, ExternalLink, FileText } from 'lucide-react';

const todayIsoDate = () => new Date().toLocaleDateString('en-CA');

interface TeamMember {
  id: string;
  name: string;
  role: string;
  is_paused?: boolean;
}

interface AdminTaskTableProps {
  tasks: (Task & { assignee_ids?: string[] })[];
  teamMembers: TeamMember[];
  canEditHours: boolean;
  totalTasks: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;

  // Working hours editing
  editingWorkingHoursTaskId: string | null;
  editingWorkingHoursValue: string;
  onEditWorkingHoursStart: (taskId: string, currentValue: number) => void;
  onEditWorkingHoursValueChange: (v: string) => void;
  onSaveWorkingHours: (taskId: string) => void;
  onCancelEditWorkingHours: () => void;

  // Billing hours editing
  editingBillingHoursTaskId: string | null;
  editingBillingHoursValue: string;
  onEditBillingHoursStart: (taskId: string, currentValue: number) => void;
  onEditBillingHoursValueChange: (v: string) => void;
  onSaveBillingHours: (taskId: string) => void;
  onCancelEditBillingHours: () => void;

  // Hours date
  editingHoursDate: string;
  onEditingHoursDateChange: (v: string) => void;

  // Hours data
  taskWorkingHours: Record<string, number>;
  taskBillingHours: Record<string, number>;
}

export default function AdminTaskTable({
  tasks,
  teamMembers,
  canEditHours,
  totalTasks,
  page,
  pageSize,
  totalPages,
  onPageChange,
  loading,
  editingWorkingHoursTaskId,
  editingWorkingHoursValue,
  onEditWorkingHoursStart,
  onEditWorkingHoursValueChange,
  onSaveWorkingHours,
  onCancelEditWorkingHours,
  editingBillingHoursTaskId,
  editingBillingHoursValue,
  onEditBillingHoursStart,
  onEditBillingHoursValueChange,
  onSaveBillingHours,
  onCancelEditBillingHours,
  editingHoursDate,
  onEditingHoursDateChange,
  taskWorkingHours,
  taskBillingHours,
}: AdminTaskTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
          All Tasks ({tasks.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Working Hours</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Logged Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference Doc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No tasks yet. Create a project first, then add tasks.</td>
              </tr>
            ) : (
              tasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-900 font-medium max-w-[250px] truncate">{task.description}</td>
                  <td className="px-4 py-3 text-xs text-left">
                    <button
                      onClick={() => router.push(`/projects/${task.project_id}`)}
                      className="text-slate-600 hover:text-violet-600 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      {task.project?.name || '—'}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </td>

                  {/* Working Hours */}
                  <td className="px-4 py-3 text-center">
                    {editingWorkingHoursTaskId === task.id && canEditHours ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 justify-center">
                          <input
                            type="number" step="0.5"
                            value={editingWorkingHoursValue}
                            onChange={e => onEditWorkingHoursValueChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') onSaveWorkingHours(task.id);
                              else if (e.key === 'Escape') onCancelEditWorkingHours();
                            }}
                            autoFocus
                            className="w-16 bg-white border border-violet-400 rounded-md px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-300"
                          />
                          <button
                            onClick={() => onSaveWorkingHours(task.id)}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="date"
                          value={editingHoursDate}
                          max={todayIsoDate()}
                          onChange={e => onEditingHoursDateChange(e.target.value)}
                          className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-400 dark:[color-scheme:dark]"
                          title="Log date for this change"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => { if (canEditHours) onEditWorkingHoursStart(task.id, taskWorkingHours[task.id] || 0); }}
                        className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                          canEditHours ? 'text-violet-600 hover:text-violet-700 hover:bg-violet-50 cursor-pointer' : 'text-slate-600'
                        }`}
                        title={canEditHours ? 'Click to edit' : undefined}
                      >
                        {(taskWorkingHours[task.id] || 0).toFixed(1)}h
                      </button>
                    )}
                  </td>

                  {/* Billing Hours */}
                  <td className="px-4 py-3 text-center">
                    {editingBillingHoursTaskId === task.id && canEditHours ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 justify-center">
                          <input
                            type="number" step="0.5"
                            value={editingBillingHoursValue}
                            onChange={e => onEditBillingHoursValueChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') onSaveBillingHours(task.id);
                              else if (e.key === 'Escape') onCancelEditBillingHours();
                            }}
                            autoFocus
                            className="w-16 bg-white border border-violet-400 rounded-md px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-300"
                          />
                          <button
                            onClick={() => onSaveBillingHours(task.id)}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="date"
                          value={editingHoursDate}
                          max={todayIsoDate()}
                          onChange={e => onEditingHoursDateChange(e.target.value)}
                          className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-400 dark:[color-scheme:dark]"
                          title="Log date for this change"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => { if (canEditHours) onEditBillingHoursStart(task.id, taskBillingHours[task.id] || 0); }}
                        className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                          canEditHours ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer' : 'text-slate-600'
                        }`}
                        title={canEditHours ? 'Click to edit' : undefined}
                      >
                        {(taskBillingHours[task.id] || 0).toFixed(1)}h
                      </button>
                    )}
                  </td>

                  {/* Assigned */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(task.assignee_ids || []).length > 0 ? (
                        (task.assignee_ids || []).map(id => {
                          const m = teamMembers.find(member => member.id === id);
                          return m ? (
                            <span key={id} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium border border-slate-200">
                              {m.name}
                            </span>
                          ) : null;
                        })
                      ) : (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      )}
                    </div>
                  </td>

                  {/* Reference Doc */}
                  <td className="px-4 py-3">
                    {(task as any).reference_doc ? (
                      <a
                        href={(task as any).reference_doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-1 rounded-lg hover:bg-cyan-100 hover:border-cyan-300 transition-all max-w-[160px] truncate"
                        title={(task as any).reference_doc.title}
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate">{(task as any).reference_doc.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-cyan-400" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
        <p className="text-xs text-slate-500">
          {totalTasks === 0 ? (
            <>No tasks</>
          ) : (
            <>
              Showing <span className="font-semibold text-slate-700">{(page - 1) * pageSize + 1}</span>
              &ndash;<span className="font-semibold text-slate-700">{Math.min(page * pageSize, totalTasks)}</span>
              {' '}of <span className="font-semibold text-slate-700">{totalTasks}</span> tasks
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <span className="text-xs text-slate-500 px-2">
            Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span>
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
