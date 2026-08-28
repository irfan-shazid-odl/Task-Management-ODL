'use client';

import React from 'react';
import { TaskStatus, TaskPriority, TaskCategory, TASK_CATEGORIES } from '@/lib/types';
import {
  ClipboardList, X, Loader2,
  Search, FolderOpen, ChevronDown, CheckCircle2,
  FileText, Link as LinkIcon, ExternalLink, Clock,
} from 'lucide-react';

const TASK_STATUS_LIST: TaskStatus[] = ['Todo', 'Working', 'On Review', 'Complete'];

interface TeamMember {
  id: string;
  name: string;
  role: string;
  is_paused?: boolean;
}

interface NewTaskModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isMember: boolean;

  // Task fields
  taskDescription: string;
  onDescriptionChange: (v: string) => void;
  taskStatus: TaskStatus;
  onStatusChange: (v: TaskStatus) => void;
  taskPriority: TaskPriority;
  onPriorityChange: (v: TaskPriority) => void;
  taskDeadline: string;
  onDeadlineChange: (v: string) => void;
  taskLogDate: string;
  onLogDateChange: (v: string) => void;
  taskEstimatedTime: string;
  onEstimatedTimeChange: (v: string) => void;
  taskCategory: TaskCategory | '';
  onCategoryChange: (v: TaskCategory | '') => void;

  // Project dropdown
  taskProjectId: string;
  taskProjectName: string;
  availableProjects: { id: string; name: string }[];
  projectSearch: string;
  onProjectSearchChange: (v: string) => void;
  projectDropdownOpen: boolean;
  projectDropdownRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  dropdownRect: { top: number; left: number; width: number } | null;
  onToggleProjectDropdown: () => void;
  onSelectProject: (id: string, name: string) => void;
  onClearProject: () => void;

  // Reference document
  projectDocs: { id: string; title: string; url: string; doc_type: string }[];
  loadingDocs: boolean;
  refDocId: string;
  onRefDocChange: (v: string) => void;

  // Assignees
  teamMembers: TeamMember[];
  taskAssignees: string[];
  onToggleAssignee: (id: string) => void;
}

export default function NewTaskModal({
  show,
  onClose,
  onSubmit,
  isSubmitting,
  isMember,
  taskDescription,
  onDescriptionChange,
  taskStatus,
  onStatusChange,
  taskPriority,
  onPriorityChange,
  taskDeadline,
  onDeadlineChange,
  taskLogDate,
  onLogDateChange,
  taskEstimatedTime,
  onEstimatedTimeChange,
  taskCategory,
  onCategoryChange,
  taskProjectId,
  taskProjectName,
  availableProjects,
  projectSearch,
  onProjectSearchChange,
  projectDropdownOpen,
  projectDropdownRef,
  triggerRef,
  dropdownRect,
  onToggleProjectDropdown,
  onSelectProject,
  onClearProject,
  projectDocs,
  loadingDocs,
  refDocId,
  onRefDocChange,
  teamMembers,
  taskAssignees,
  onToggleAssignee,
}: NewTaskModalProps) {
  if (!show) return null;

  const filteredProjects = availableProjects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">

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

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Task Description</label>
            <textarea
              rows={3}
              value={taskDescription}
              onChange={e => onDescriptionChange(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
              <select value={taskStatus} onChange={e => onStatusChange(e.target.value as TaskStatus)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all">
                {TASK_STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
              <select value={taskPriority} onChange={e => onPriorityChange(e.target.value as TaskPriority)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all">
                {['Low', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deadline (Optional)</label>
              <input type="date" value={taskDeadline} onChange={e => onDeadlineChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all dark:[color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Log Date</label>
              <input type="date" value={taskLogDate}
                max={new Date().toLocaleDateString('en-CA')}
                onChange={e => onLogDateChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all dark:[color-scheme:dark]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Estimated Time (hours) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number" step="0.25" min="0" placeholder="e.g. 2.5"
                value={taskEstimatedTime} onChange={e => onEstimatedTimeChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select value={taskCategory} onChange={e => onCategoryChange(e.target.value as TaskCategory)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all">
                <option value="" disabled>Select a category...</option>
                {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Searchable Project Dropdown */}
          {availableProjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Select Project <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="relative" ref={projectDropdownRef}>
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={onToggleProjectDropdown}
                  className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-700 border rounded-xl px-4 py-2.5 text-sm hover:border-slate-300 dark:hover:border-slate-500 focus:outline-none transition-all ${
                    !taskProjectId ? 'border-slate-200 dark:border-slate-600' : 'border-violet-400'
                  }`}
                >
                  {taskProjectId ? (
                    <span className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-medium">
                      <FolderOpen className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                      {taskProjectName}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">Search and select a project...</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {projectDropdownOpen && dropdownRect && (
                  <div
                    style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
                  >
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text" autoFocus placeholder="Search projects..."
                          value={projectSearch} onChange={e => onProjectSearchChange(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-violet-400 transition-all text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    {taskProjectId && (
                      <button type="button"
                        onClick={onClearProject}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Clear selection
                      </button>
                    )}
                    <div className="max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200">
                      {filteredProjects.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">No projects found</div>
                      ) : (
                        filteredProjects.map(p => (
                          <button key={p.id} type="button"
                            onClick={() => onSelectProject(p.id, p.name)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors ${
                              taskProjectId === p.id ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-semibold' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="flex-1">{p.name}</span>
                            {taskProjectId === p.id && <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reference Document Dropdown */}
          {taskProjectId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                Reference Document
                <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">(optional)</span>
              </label>
              {loadingDocs ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-400 dark:text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading documents...
                </div>
              ) : projectDocs.length === 0 ? (
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-400 dark:text-slate-500 text-center">
                  No documents found for this project
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={refDocId}
                    onChange={e => onRefDocChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-400 transition-all"
                  >
                    <option value="">— No reference document —</option>
                    {projectDocs.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        [{doc.doc_type}] {doc.title}
                      </option>
                    ))}
                  </select>
                  {refDocId && (() => {
                    const doc = projectDocs.find(d => d.id === refDocId);
                    return doc ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 font-medium px-3 py-1.5 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-100 dark:border-cyan-800 hover:border-cyan-200 transition-all"
                      >
                        <LinkIcon className="w-3 h-3" />
                        Open: {doc.title}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}

          {!isMember && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assign Team Members</label>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{taskAssignees.length} Selected</span>
              </div>
              <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                {(teamMembers || []).filter(m => !m.is_paused).map(m => (
                  <label key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                    <input type="checkbox" checked={taskAssignees.includes(m.id)} onChange={() => onToggleAssignee(m.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-500 accent-violet-600" />
                    <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{m.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{m.role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !taskDescription.trim() || !taskProjectId || !taskEstimatedTime || !taskCategory}
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
