'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Loader2,
  ClipboardList,
  Search,
  FolderOpen,
  CheckCircle2,
  FileText,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TeamMember, TaskStatus, TaskPriority, TaskCategory } from '@/lib/types';
import { TASK_CATEGORIES } from '@/lib/types';
import { useProjects } from '@/hooks/queries/useProjects';
import { useProjectDocuments } from '@/hooks/queries/useDocuments';
import { useCreateTask } from '@/hooks/queries/useTasks';
import { TASK_STATUSES, TASK_PRIORITIES } from '../constants';

interface Props {
  open: boolean;
  onClose: () => void;
  currentUser: TeamMember | null;
  teamMembers: TeamMember[];
}

const todayIso = () => new Date().toLocaleDateString('en-CA');

// Self-contained "New Task" modal. Owns all form + dropdown state and the create
// mutation; the parent only decides when it's open. Uses the transactional
// api.tasks.create payload (task + assigneeIds + zero-hour anchor) via useCreateTask.
export default function NewTaskModal({ open, onClose, currentUser, teamMembers }: Props) {
  const createTask = useCreateTask();

  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Todo');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Low');
  const [taskDeadline, setTaskDeadline] = useState(todayIso());
  const [taskLogDate, setTaskLogDate] = useState<string>(todayIso());
  const [taskEstimatedTime, setTaskEstimatedTime] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory | ''>('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [taskRefDocId, setTaskRefDocId] = useState('');

  // Searchable project dropdown state
  const [projectSearch, setProjectSearch] = useState('');
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // Searchable reference-doc dropdown state
  const [docSearch, setDocSearch] = useState('');
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const docDropdownRef = useRef<HTMLDivElement>(null);
  const docTriggerRef = useRef<HTMLButtonElement>(null);
  const [docRect, setDocRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const { data: availableProjects = [] } = useProjects({ orderBy: 'name', order: 'asc' }, open);
  const { data: projectDocs = [], isLoading: docsLoading } = useProjectDocuments(taskProjectId);
  const loadingDocs = !!taskProjectId && docsLoading;

  // Reset the selected reference doc whenever the project changes.
  // eslint-disable react-hooks/set-state-in-effect -- resetting derived state on prop change
  useEffect(() => {
    setTaskRefDocId('');
    setDocSearch('');
  }, [taskProjectId]);
  // eslint-enable react-hooks/set-state-in-effect

  // Close dropdowns on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
      if (docDropdownRef.current && !docDropdownRef.current.contains(e.target as Node)) {
        setDocDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!open) return null;

  const toggleAssignee = (id: string) => {
    setTaskAssignees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const resetForm = () => {
    setTaskDescription('');
    setTaskStatus('Todo');
    setTaskPriority('Low');
    setTaskDeadline(todayIso());
    setTaskLogDate(todayIso());
    setTaskEstimatedTime('');
    setTaskCategory('');
    setTaskProjectId('');
    setTaskRefDocId('');
    setProjectSearch('');
    setProjectDropdownOpen(false);
    setTaskAssignees([]);
  };

  const handleCreateTask = async () => {
    if (!taskDescription.trim()) {
      toast.error('Task description is required.');
      return;
    }
    const estimatedTimeValue = parseFloat(taskEstimatedTime);
    if (!taskEstimatedTime || isNaN(estimatedTimeValue) || estimatedTimeValue <= 0) {
      toast.error('Estimated time is required.');
      return;
    }
    if (!taskCategory) {
      toast.error('Category is required.');
      return;
    }
    try {
      const today = todayIso();
      const logDate = taskLogDate || today;
      const taskData: any = {
        description: taskDescription.trim(),
        status: taskStatus,
        priority: taskPriority,
        deadline: taskDeadline || null,
        reference_doc_id: taskRefDocId || null,
        category: taskCategory || null,
        estimated_time: estimatedTimeValue,
        log_date: logDate,
      };
      if (taskProjectId) taskData.project_id = taskProjectId;

      // Members auto-assign themselves; others use selection
      const assigneeIds = currentUser?.role === 'Member'
        ? (currentUser?.id ? [currentUser.id] : [])
        : taskAssignees;

      // Auto-create a zero-hour time_logs row anchored to the chosen log_date
      // so every task has at least one log entry from day one.
      const anchorMemberId = assigneeIds[0] || currentUser?.id;

      // Single transactional create: task + assignments + optional zero-hour anchor.
      await createTask.mutateAsync({
        task: taskData,
        assigneeIds,
        anchor: anchorMemberId ? { member_id: anchorMemberId, log_date: logDate } : undefined,
      });
      toast.success('Task created successfully!');
      resetForm();
      onClose();
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Failed to create task'}`);
    }
  };

  const isSubmitting = createTask.isPending;
  const filteredProjects = availableProjects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()),
  );
  const filteredDocs = projectDocs.filter((d: any) =>
    d.title.toLowerCase().includes(docSearch.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            New Task
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Task Description</label>
            <textarea
              rows={3}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 resize-none transition-all"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all"
              >
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all"
              >
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Deadline + Log Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deadline (Optional)</label>
              <input
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Log Date</label>
              <input
                type="date"
                value={taskLogDate}
                max={todayIso()}
                onChange={(e) => setTaskLogDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Estimated Time + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Estimated Time (hours) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number" step="0.25" min="0" placeholder="e.g. 2.5"
                value={taskEstimatedTime}
                onChange={(e) => setTaskEstimatedTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all"
              >
                <option value="" disabled>Select a category...</option>
                {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Project & Reference Document */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                Project (Optional)
                {taskProjectId && (
                  <button
                    type="button"
                    onClick={() => { setTaskProjectId(''); setTaskRefDocId(''); }}
                    className="text-[10px] text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-bold uppercase tracking-wider"
                  >
                    Clear
                  </button>
                )}
              </label>
              <div className="relative" ref={projectDropdownRef}>
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => {
                    if (!projectDropdownOpen && triggerRef.current) {
                      const rect = triggerRef.current.getBoundingClientRect();
                      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                    }
                    setProjectDropdownOpen((o) => !o);
                  }}
                  className={`w-full flex items-center justify-between appearance-none bg-slate-50 dark:bg-slate-700 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none transition-all ${
                    taskProjectId ? 'border-violet-400 ring-2 ring-violet-400/10' : 'border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {taskProjectId ? (
                    <span className="flex items-center gap-2 font-medium">
                      <FolderOpen className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                      {availableProjects.find((p) => p.id === taskProjectId)?.name || 'Project selected'}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">Select Project...</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {projectDropdownOpen && dropdownRect && (
                  <div
                    style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
                  >
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text" autoFocus placeholder="Search projects..."
                          value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200">
                      {filteredProjects.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">No projects found</div>
                      ) : (
                        filteredProjects.map((p) => (
                          <button
                            key={p.id} type="button"
                            onClick={() => { setTaskProjectId(p.id); setProjectDropdownOpen(false); setProjectSearch(''); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors ${
                              taskProjectId === p.id ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-semibold' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="flex-1 truncate">{p.name}</span>
                            {taskProjectId === p.id && <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Document Selector */}
            {taskProjectId && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reference Document (Optional)</label>
                <div className="relative" ref={docDropdownRef}>
                  <button
                    ref={docTriggerRef}
                    type="button"
                    disabled={loadingDocs}
                    onClick={() => {
                      if (!docDropdownOpen && docTriggerRef.current) {
                        const rect = docTriggerRef.current.getBoundingClientRect();
                        setDocRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                      }
                      setDocDropdownOpen((o) => !o);
                    }}
                    className={`w-full flex items-center justify-between appearance-none bg-slate-50 dark:bg-slate-700 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none transition-all ${
                      taskRefDocId ? 'border-cyan-400 ring-2 ring-cyan-400/10' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className={`w-3.5 h-3.5 ${taskRefDocId ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      {loadingDocs ? (
                        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading docs...
                        </span>
                      ) : taskRefDocId ? (
                        <span className="font-medium truncate text-slate-900 dark:text-slate-100">
                          {projectDocs.find((d: any) => d.id === taskRefDocId)?.title || 'Doc Selected'}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 truncate">Select reference doc...</span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${docDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {docDropdownOpen && docRect && (
                    <div
                      style={{ position: 'fixed', top: docRect.top, left: docRect.left, width: docRect.width, zIndex: 9999 }}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
                    >
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <input
                            type="text" autoFocus placeholder="Search documents..."
                            value={docSearch} onChange={(e) => setDocSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200">
                        <button
                          type="button"
                          onClick={() => { setTaskRefDocId(''); setDocDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 border-b border-slate-50 dark:border-slate-700 italic"
                        >
                          No Reference Document
                        </button>
                        {filteredDocs.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">No documents found</div>
                        ) : (
                          filteredDocs.map((d: any) => (
                            <button
                              key={d.id} type="button"
                              onClick={() => { setTaskRefDocId(d.id); setDocDropdownOpen(false); setDocSearch(''); }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors ${
                                taskRefDocId === d.id ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-semibold' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <div className="flex-1 truncate">
                                <div className="font-medium text-slate-900 dark:text-slate-100">{d.title}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{d.doc_type}</div>
                              </div>
                              {taskRefDocId === d.id && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Assign Members */}
          {currentUser?.role !== 'Member' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assign Team Members</label>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{taskAssignees.length} Selected</span>
              </div>
              <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                {teamMembers.filter((m) => !m.is_paused).map((m) => (
                  <label key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={taskAssignees.includes(m.id)}
                      onChange={() => toggleAssignee(m.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-500 text-violet-600 accent-violet-600"
                    />
                    <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{m.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{m.role === 'super-admin' ? 'super-admin' : m.role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
          <button
            onClick={handleCreateTask}
            disabled={isSubmitting || !taskDescription.trim() || !taskEstimatedTime || !taskCategory}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold hover:from-violet-700 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200 dark:shadow-violet-900/30 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
