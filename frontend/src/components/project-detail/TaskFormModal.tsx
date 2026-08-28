'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ClipboardList, Clock, FileText, Loader2, Search, X } from 'lucide-react';
import { ProjectDocument, TaskPriority, TaskStatus, TeamMember, TaskCategory, TASK_CATEGORIES } from '@/lib/types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  editingTaskId: string | null;
  description: string;
  setDescription: (v: string) => void;
  status: TaskStatus;
  setStatus: (v: TaskStatus) => void;
  priority: TaskPriority;
  setPriority: (v: TaskPriority) => void;
  deadline: string;
  setDeadline: (v: string) => void;
  logDate: string;
  setLogDate: (v: string) => void;
  refDocId: string;
  setRefDocId: (v: string) => void;
  category: TaskCategory | '';
  setCategory: (v: TaskCategory | '') => void;
  estimatedTime: string;
  setEstimatedTime: (v: string) => void;
  assignees: string[];
  setAssignees: (v: string[]) => void;
  documents: ProjectDocument[];
  teamMembers: TeamMember[];
  onSubmit: () => void;
};

export default function TaskFormModal({
  isOpen, onClose, isSubmitting, editingTaskId,
  description, setDescription, status, setStatus,
  priority, setPriority, deadline, setDeadline,
  logDate, setLogDate,
  refDocId, setRefDocId, assignees, setAssignees,
  category, setCategory, estimatedTime, setEstimatedTime,
  documents, teamMembers, onSubmit,
}: Props) {
  const todayIso = new Date().toLocaleDateString('en-CA');
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [docRect, setDocRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const docDropdownRef = useRef<HTMLDivElement>(null);
  const docTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (docDropdownRef.current && !docDropdownRef.current.contains(e.target as Node)) {
        setDocDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-violet-500 dark:text-violet-400" /> {editingTaskId ? 'Edit Task' : 'New Task'}
          </h3>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Task Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 min-h-[100px]"
              placeholder="What needs to be done?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="Todo">Todo</option>
                <option value="Working">Working</option>
                <option value="On Review">On Review</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="Low">Low</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deadline (Optional)</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Log Date</label>
              <input
                type="date"
                value={logDate}
                max={todayIso}
                onChange={e => setLogDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 dark:[color-scheme:dark]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category {!editingTaskId && <span className="text-red-500 dark:text-red-400">*</span>}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TaskCategory)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="" disabled>Select a category...</option>
                {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                Estimated Time (hrs) {!editingTaskId && <span className="text-red-500 dark:text-red-400">*</span>}
              </label>
              <input
                type="number" step="0.25" min="0" placeholder="e.g. 2.5"
                value={estimatedTime}
                onChange={e => setEstimatedTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Reference Document (Optional)</span>
              {refDocId && (
                <button
                  onClick={() => setRefDocId('')}
                  className="text-[10px] text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-bold uppercase tracking-wider"
                >
                  Clear
                </button>
              )}
            </label>
            <button
              type="button"
              ref={docTriggerRef}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const dropW = rect.width;
                const clampedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - dropW - 8));
                setDocRect({
                  top: rect.bottom + 4,
                  left: clampedLeft,
                  width: dropW
                });
                setDocDropdownOpen(!docDropdownOpen);
              }}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-600 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className={`w-3.5 h-3.5 ${refDocId ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className={refDocId ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
                  {refDocId
                    ? documents.find(d => d.id === refDocId)?.title || 'Select document...'
                    : 'Select document...'
                  }
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${docDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {docDropdownOpen && docRect && (
              <div
                ref={docDropdownRef}
                style={{
                  position: 'fixed',
                  top: docRect.top + 4,
                  left: docRect.left,
                  width: docRect.width,
                  zIndex: 9999
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
              >
                <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-violet-500 shadow-inner text-slate-900 dark:text-slate-100"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {documents.filter(d => d.title.toLowerCase().includes(docSearch.toLowerCase())).length === 0 ? (
                    <div className="py-8 text-center" key="no-docs">
                      <p className="text-xs text-slate-400 dark:text-slate-500">No documents found</p>
                    </div>
                  ) : (
                    documents
                      .filter(d => d.title.toLowerCase().includes(docSearch.toLowerCase()))
                      .map(doc => (
                        <button
                          key={`doc-select-${doc.id}`}
                          onClick={() => {
                            setRefDocId(doc.id);
                            setDocDropdownOpen(false);
                            setDocSearch('');
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between group ${
                            refDocId === doc.id ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className={`w-3.5 h-3.5 ${refDocId === doc.id ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className="truncate">{doc.title}</span>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity font-bold text-slate-400 dark:text-slate-500">Select</span>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Assign Team Members</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal uppercase">{assignees.length} Selected</span>
            </label>
            <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <div className="p-2 border-b border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto w-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {teamMembers
                    .filter(m => !m.is_paused)
                    .filter((member) =>
                      member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      member.role.toLowerCase().includes(memberSearch.toLowerCase())
                    )
                    .length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                      No members found
                    </div>
                  ) : (
                    teamMembers
                      .filter(m => !m.is_paused)
                      .filter((member) =>
                        member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                        member.role.toLowerCase().includes(memberSearch.toLowerCase())
                      )
                      .map((member) => (
                        <label
                          key={member.id}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors group"
                        >
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-500 text-violet-600 focus:ring-violet-500/20"
                            checked={assignees.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) setAssignees([...assignees, member.id]);
                              else setAssignees(assignees.filter(id => id !== member.id));
                            }}
                          />
                          <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 items-center justify-center text-[10px] font-bold flex shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-700 dark:group-hover:text-violet-400">{member.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">{member.role}</span>
                        </label>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={isSubmitting || !description.trim() || (!editingTaskId && (!estimatedTime || !category))}
            className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-violet-200 dark:shadow-violet-900/30"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingTaskId ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
