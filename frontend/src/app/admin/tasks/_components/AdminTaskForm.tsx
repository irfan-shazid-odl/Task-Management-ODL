'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TaskStatus, TaskPriority, TaskCategory, Project, ProjectDocument,
  TASK_STATUSES, TASK_PRIORITIES, TASK_CATEGORIES,
} from '@/lib/types';
import {
  Plus, Loader2, X, ChevronDown,
  Search, FolderOpen, CheckCircle2, FileText, Clock,
} from 'lucide-react';
import { RootState } from '@/store';
import {
  setShowTaskForm,
  setNewTaskProjectId,
  setProjectSearch,
  setProjectDropdownOpen,
  setNewTaskDescription,
  setNewTaskPriority,
  setNewTaskStatus,
  setNewTaskDeadline,
  setNewTaskLogDate,
  setNewTaskCategory,
  setNewTaskEstimatedTime,
  setNewTaskRefDocId,
  setDocDropdownOpen,
  setDocSearch,
  toggleAssignee,
} from '@/store/slices/adminTaskFormSlice';

import { api } from '@/lib/api';

const todayIsoDate = () => new Date().toLocaleDateString('en-CA');

interface TeamMember {
  id: string;
  name: string;
  role: string;
  is_paused?: boolean;
}

interface AdminTaskFormProps {
  onSubmit: () => void;
  projects: Project[];
  teamMembers: TeamMember[];
}

export default function AdminTaskForm({
  onSubmit,
  projects,
  teamMembers,
}: AdminTaskFormProps) {
  const dispatch = useDispatch();
  
  // Read state from Redux
  const formState = useSelector((state: RootState) => state.adminTaskForm);
  const {
    showTaskForm,
    creatingTask,
    editTaskId,
    newTaskProjectId,
    projectSearch,
    projectDropdownOpen,
    newTaskDescription,
    newTaskPriority,
    newTaskStatus,
    newTaskDeadline,
    newTaskLogDate,
    newTaskCategory,
    newTaskEstimatedTime,
    newTaskRefDocId,
    docDropdownOpen,
    docSearch,
    newTaskAssignees,
  } = formState;

  const [projectDocs, setProjectDocs] = useState<ProjectDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (!newTaskProjectId) { setProjectDocs([]); return; }
    let cancelled = false;
    setLoadingDocs(true);
    api.documents.listForProject(newTaskProjectId)
      .then((data) => { if (!cancelled) { setProjectDocs(data || []); setLoadingDocs(false); } })
      .catch(() => { if (!cancelled) { setProjectDocs([]); setLoadingDocs(false); } });
    return () => { cancelled = true; };
  }, [newTaskProjectId]);

  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const docDropdownRef = useRef<HTMLDivElement>(null);
  const docTriggerRef = useRef<HTMLButtonElement>(null);
  const [docRect, setDocRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        dispatch(setProjectDropdownOpen(false));
      }
      if (docDropdownRef.current && !docDropdownRef.current.contains(e.target as Node)) {
        dispatch(setDocDropdownOpen(false));
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dispatch]);

  const onToggleProjectDropdown = () => {
    if (!projectDropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropW = rect.width;
      const clampedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - dropW - 8));
      setDropdownRect({ top: rect.bottom + 4, left: clampedLeft, width: dropW });
    }
    dispatch(setProjectDropdownOpen(!projectDropdownOpen));
  };

  const onToggleDocDropdown = () => {
    if (!docDropdownOpen && docTriggerRef.current) {
      const rect = docTriggerRef.current.getBoundingClientRect();
      const dropW = rect.width;
      const clampedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - dropW - 8));
      setDocRect({ top: rect.bottom + 4, left: clampedLeft, width: dropW });
    }
    dispatch(setDocDropdownOpen(!docDropdownOpen));
  };

  if (!showTaskForm) return null;

  return (
    <div className="mb-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{editTaskId ? 'Edit Task' : 'Create New Task'}</h3>
        <button onClick={() => dispatch(setShowTaskForm(false))} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Searchable Project Dropdown */}
        <div className="relative" ref={projectDropdownRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={onToggleProjectDropdown}
            className={`w-full flex items-center justify-between appearance-none bg-white dark:bg-slate-700 border rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none transition-all shadow-sm ${
              !newTaskProjectId ? 'border-slate-200 dark:border-slate-600' : 'border-violet-500 ring-1 ring-violet-200'
            }`}
          >
            {newTaskProjectId ? (
              <span className="flex items-center gap-2 font-medium">
                <FolderOpen className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                {projects.find(p => p.id === newTaskProjectId)?.name || 'Project selected'}
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
                    value={projectSearch} onChange={e => dispatch(setProjectSearch(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-violet-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200">
                {projects
                  .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.category.toLowerCase().includes(projectSearch.toLowerCase()))
                  .length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">No projects found</div>
                ) : (
                  projects
                    .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.category.toLowerCase().includes(projectSearch.toLowerCase()))
                    .map(p => (
                    <button key={p.id} type="button"
                      onClick={() => { dispatch(setNewTaskProjectId(p.id)); dispatch(setProjectDropdownOpen(false)); dispatch(setProjectSearch('')); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors ${
                        newTaskProjectId === p.id ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-semibold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <div className="flex-1 truncate">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{p.category}</div>
                      </div>
                      {newTaskProjectId === p.id && <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Task Description */}
        <input
          type="text"
          placeholder="Task description..."
          value={newTaskDescription}
          onChange={(e) => dispatch(setNewTaskDescription(e.target.value))}
          className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200 shadow-sm"
        />

        {/* Reference Document Selector */}
        <div className="relative" ref={docDropdownRef}>
          <button
            ref={docTriggerRef}
            type="button"
            disabled={!newTaskProjectId || loadingDocs}
            onClick={onToggleDocDropdown}
            className={`w-full flex items-center justify-between appearance-none bg-white dark:bg-slate-700 border rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none transition-all shadow-sm ${
              !newTaskProjectId ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-600' : 
              newTaskRefDocId ? 'border-cyan-500 ring-1 ring-cyan-100' : 'border-slate-200 dark:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <FileText className={`w-3.5 h-3.5 ${newTaskRefDocId ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
              {loadingDocs ? (
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              ) : newTaskRefDocId ? (
                <span className="font-medium truncate text-slate-900 dark:text-slate-100">
                  {projectDocs.find(d => d.id === newTaskRefDocId)?.title || 'Doc Selected'}
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 truncate">
                  {!newTaskProjectId ? 'Select project first' : 'Select reference doc...'}
                </span>
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
                    value={docSearch} onChange={e => dispatch(setDocSearch(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200">
                <button type="button"
                  onClick={() => { dispatch(setNewTaskRefDocId('')); dispatch(setDocDropdownOpen(false)); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 border-b border-slate-50 dark:border-slate-700 italic"
                >
                  No Reference Document
                </button>
                {projectDocs
                  .filter(d => d.title.toLowerCase().includes(docSearch.toLowerCase()))
                  .length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">No documents found</div>
                ) : (
                  projectDocs
                    .filter(d => d.title.toLowerCase().includes(docSearch.toLowerCase()))
                    .map(d => (
                    <button key={d.id} type="button"
                      onClick={() => { dispatch(setNewTaskRefDocId(d.id)); dispatch(setDocDropdownOpen(false)); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors ${
                        newTaskRefDocId === d.id ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-semibold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <div className="flex-1 truncate">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{d.title}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{d.doc_type}</div>
                      </div>
                      {newTaskRefDocId === d.id && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="relative">
          <select
            value={newTaskPriority}
            onChange={(e) => dispatch(setNewTaskPriority(e.target.value as TaskPriority))}
            className="w-full appearance-none bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
              focus:outline-none focus:border-violet-500 cursor-pointer shadow-sm"
          >
            {TASK_PRIORITIES.map(p => (<option key={p} value={p}>{p}</option>))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={newTaskStatus}
            onChange={(e) => dispatch(setNewTaskStatus(e.target.value as TaskStatus))}
            className="w-full appearance-none bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
              focus:outline-none focus:border-violet-500 cursor-pointer shadow-sm"
          >
            {TASK_STATUSES.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Deadline</label>
          <input
            type="date"
            value={newTaskDeadline}
            onChange={(e) => dispatch(setNewTaskDeadline(e.target.value))}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
              focus:outline-none focus:border-violet-500 shadow-sm dark:[color-scheme:dark]"
          />
        </div>

        {/* Log Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Log Date</label>
          <input
            type="date"
            value={newTaskLogDate}
            max={todayIsoDate()}
            onChange={(e) => dispatch(setNewTaskLogDate(e.target.value))}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
              focus:outline-none focus:border-violet-500 shadow-sm dark:[color-scheme:dark]"
            title="Defaults to today; pick a past day to backdate"
          />
        </div>

        {/* Category */}
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Category {!editTaskId && <span className="text-red-500 dark:text-red-400">*</span>}
          </label>
          <select
            value={newTaskCategory}
            onChange={(e) => dispatch(setNewTaskCategory(e.target.value as TaskCategory))}
            className="w-full appearance-none bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
              focus:outline-none focus:border-violet-500 cursor-pointer shadow-sm"
          >
            <option value="" disabled>Select a category...</option>
            {TASK_CATEGORIES.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <ChevronDown className="absolute right-3 bottom-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        </div>

        {/* Estimated Time */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Estimated Time (hrs) {!editTaskId && <span className="text-red-500 dark:text-red-400">*</span>}
          </label>
          <input
            type="number" step="0.25" min="0" placeholder="e.g. 2.5"
            value={newTaskEstimatedTime}
            onChange={(e) => dispatch(setNewTaskEstimatedTime(e.target.value))}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
              focus:outline-none focus:border-violet-500 shadow-sm"
          />
        </div>
      </div>

      {/* Assignees */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wider">Assign Members</p>
        <div className="flex flex-wrap gap-2">
          {teamMembers.filter(m => !m.is_paused).map(m => (
            <button
              key={m.id}
              onClick={() => dispatch(toggleAssignee(m.id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                newTaskAssignees.includes(m.id)
                  ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={creatingTask || !newTaskDescription.trim() || !newTaskProjectId || (!editTaskId && (!newTaskEstimatedTime || !newTaskCategory))}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-sm text-white font-medium
          hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20 dark:shadow-violet-900/30"
      >
        {creatingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {editTaskId ? 'Update Task' : 'Create Task'}
      </button>
    </div>
  );
}
