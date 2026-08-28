'use client';

import { useState, useMemo, memo } from 'react';
import { CalendarDays, Check, ChevronDown, ClipboardList, Edit, ExternalLink, FileText, Plus, Trash2, UserPlus, X } from 'lucide-react';

const todayIsoDate = () => new Date().toLocaleDateString('en-CA');
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Task, TaskStatus, TeamMember } from '@/lib/types';

const DESC_LIMIT = 160;

function TaskDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (text?.length || 0) > DESC_LIMIT;
  const display = isLong && !expanded ? text.slice(0, DESC_LIMIT).trimEnd() + '…' : text;
  return (
    <div className="wrap-anywhere whitespace-pre-wrap">
      <span>{display}</span>
      {isLong && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 hover:text-violet-700 transition-colors align-middle"
        >
          {expanded ? 'Less' : 'More'}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}

type CurrentUser = { id: string; role: string };

type Props = {
  tasks: Task[];
  currentUser: CurrentUser | null;
  teamMembers: TeamMember[];
  editingHoursTaskId: string | null;
  setEditingHoursTaskId: (v: string | null) => void;
  editingWorkingHours: string;
  setEditingWorkingHours: (v: string) => void;
  editingBillingHours: string;
  setEditingBillingHours: (v: string) => void;
  editingHoursDate: string;
  setEditingHoursDate: (v: string) => void;
  assigningTask: string | null;
  setAssigningTask: (v: string | null) => void;
  onSaveHours: (taskId: string) => void;
  onAssign: (taskId: string, memberId: string) => void;
  onUnassign: (taskId: string, memberId: string) => void;
  onEdit: (task: Task) => void;
  onRequestDelete: (taskId: string) => void;
  onCreate: () => void;
  onOpenClaim: () => void;
};

const TasksTable = memo(function TasksTable({
  tasks, currentUser, teamMembers,
  editingHoursTaskId, setEditingHoursTaskId,
  editingWorkingHours, setEditingWorkingHours,
  editingBillingHours, setEditingBillingHours,
  editingHoursDate, setEditingHoursDate,
  assigningTask, setAssigningTask,
  onSaveHours, onAssign, onUnassign, onEdit, onRequestDelete, onCreate, onOpenClaim,
}: Props) {
  const statusCounts = useMemo(() => {
    return {
      'Todo': tasks.filter(t => t.status === 'Todo').length,
      'Working': tasks.filter(t => t.status === 'Working').length,
      'On Review': tasks.filter(t => t.status === 'On Review').length,
      'Complete': tasks.filter(t => t.status === 'Complete').length,
    };
  }, [tasks]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-violet-500" />
          Tasks ({tasks.length})
        </h2>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-2">
            {(['Todo', 'Working', 'On Review', 'Complete'] as TaskStatus[]).map(status => (
              <div key={status} className="flex items-center gap-1.5">
                <StatusBadge status={status} />
                <span className="text-xs text-slate-500 font-mono">{statusCounts[status] || 0}</span>
              </div>
            ))}
          </div>
          {currentUser && currentUser.role !== 'Member' && (
            <button
              onClick={onCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Task
            </button>
          )}
          {currentUser && currentUser.role === 'Member' && (
            <button
              onClick={onOpenClaim}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 border border-violet-200 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Claim a Task
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Working Hours</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Logged Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned</th>
              {currentUser && currentUser.role !== 'Member' && (
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No tasks for this project</td>
              </tr>
            ) : (
              tasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-900 font-medium max-w-[300px]">
                    <div className="flex flex-col gap-1.5">
                      <TaskDescription text={task.description} />
                      {(task as any).reference_doc && (
                        <a
                          href={(task as any).reference_doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100 text-[10px] font-bold hover:bg-violet-100 transition-colors w-fit group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3 h-3 transition-transform group-hover:scale-110" />
                          <span className="truncate max-w-[120px]">{(task as any).reference_doc.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[0.5px]" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingHoursTaskId === task.id ? (
                      <input
                        type="number"
                        step="0.5"
                        value={editingWorkingHours}
                        onChange={e => setEditingWorkingHours(e.target.value)}
                        className="w-16 px-2 py-1 border border-violet-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="0"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingHoursTaskId(task.id);
                          setEditingWorkingHours((task.total_logged_hours || 0).toString());
                          setEditingBillingHours((task.total_billing_hours || 0).toString());
                          setEditingHoursDate(todayIsoDate());
                        }}
                        className="text-sm font-medium text-slate-900 hover:text-violet-600 hover:bg-violet-50 px-2 py-1 rounded transition-colors cursor-pointer inline-block min-w-[50px]"
                      >
                        {task.total_logged_hours ? task.total_logged_hours.toFixed(1) : '—'}h
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingHoursTaskId === task.id ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 justify-center">
                          <input
                            type="number"
                            step="0.5"
                            value={editingBillingHours}
                            onChange={e => setEditingBillingHours(e.target.value)}
                            className="w-16 px-2 py-1 border border-violet-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="0"
                          />
                          <button
                            onClick={() => onSaveHours(task.id)}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingHoursTaskId(null);
                              setEditingWorkingHours('');
                              setEditingBillingHours('');
                            }}
                            className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-slate-400" />
                          <input
                            type="date"
                            value={editingHoursDate}
                            max={todayIsoDate()}
                            onChange={e => setEditingHoursDate(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-700 focus:outline-none focus:border-violet-400"
                            title="Log date — change to backdate this update"
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingHoursTaskId(task.id);
                          setEditingWorkingHours((task.total_logged_hours || 0).toString());
                          setEditingBillingHours((task.total_billing_hours || 0).toString());
                          setEditingHoursDate(todayIsoDate());
                        }}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition-colors cursor-pointer inline-block min-w-[50px]"
                      >
                        {task.total_billing_hours ? task.total_billing_hours.toFixed(1) : '—'}h
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5 w-full relative">
                      {(!task.assignees || task.assignees.length === 0) ? (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      ) : (
                        task.assignees.map((a, i) => (
                          <span key={i} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200 text-[10px] font-medium group relative">
                            <div className="w-3.5 h-3.5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[8px] font-bold shrink-0">
                              {a.name.charAt(0)}
                            </div>
                            {a.name}
                            {currentUser && (currentUser.role !== 'Member' || a.id === currentUser.id) && (
                              <button onClick={() => onUnassign(task.id, a.id)} className="lg:opacity-0 lg:group-hover:opacity-100 absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full w-3.5 h-3.5 flex items-center justify-center transition-opacity hover:bg-red-200 shadow-sm border border-red-200">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </span>
                        ))
                      )}

                      {currentUser && (currentUser.role !== 'Member' || !task.assignees?.some(a => a.id === currentUser.id)) && (
                        <div className="relative">
                          <button onClick={() => setAssigningTask(assigningTask === task.id ? null : task.id)} className="flex items-center justify-center w-5 h-5 rounded hover:bg-slate-100 text-slate-400 hover:text-violet-600 transition-colors bg-white border border-slate-200 shadow-sm ml-1" title={currentUser.role === 'Member' ? 'Claim Task' : 'Assign Member'}>
                            <Plus className="w-3 h-3" />
                          </button>

                          {assigningTask === task.id && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1">
                              <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">{currentUser.role === 'Member' ? 'Claim Task' : 'Assign Member'}</div>
                              <div className="max-h-48 overflow-y-auto w-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                                {teamMembers
                                  .filter(m => !m.is_paused)
                                  .filter(m => currentUser.role !== 'Member' || m.id === currentUser.id)
                                  .filter(m => !(task.assignees || []).some(a => a.id === m.id)).map(m => (
                                  <button key={m.id} onClick={() => onAssign(task.id, m.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[8px] font-bold shrink-0">
                                      {m.name.charAt(0)}
                                    </div>
                                    {m.name}
                                  </button>
                                ))}
                                {teamMembers.filter(m => !m.is_paused).filter(m => !(task.assignees || []).some(a => a.id === m.id)).length === 0 && (
                                  <div className="px-3 py-2 text-xs text-slate-500 italic text-center">All members assigned</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  {currentUser && currentUser.role !== 'Member' && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 transition-opacity">
                        <button
                          onClick={() => onEdit(task)}
                          className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Task"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRequestDelete(task.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default TasksTable;
