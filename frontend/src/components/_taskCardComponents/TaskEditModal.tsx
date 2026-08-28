import React from 'react';
import { Pencil, X, FolderOpen, ChevronDown, Search, CheckCircle2, FileText, Lock, Clock, Wallet, CalendarDays, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskStatus, TaskPriority, TASK_STATUSES, getRoleDisplayName } from '@/lib/types';

const todayIsoDate = () => new Date().toLocaleDateString('en-CA');

interface TaskEditModalProps {
  showEditModal: boolean; setShowEditModal: (show: boolean) => void; editDescription: string; setEditDescription: (desc: string) => void;
  editStatus: TaskStatus; setEditStatus: (status: TaskStatus) => void; editPriority: TaskPriority; setEditPriority: (priority: TaskPriority) => void;
  editDeadline: string; setEditDeadline: (deadline: string) => void; editProjectId: string; setEditProjectId: (id: string) => void;
  editRefDocId: string; setEditRefDocId: (id: string) => void; editHours: string; setEditHours: (hours: string) => void;
  editBillingHours: string; setEditBillingHours: (hours: string) => void; editLogDate: string; setEditLogDate: (date: string) => void;
  editAssigneeIds: string[]; setEditAssigneeIds: React.Dispatch<React.SetStateAction<string[]>>; assigneeSearch: string;
  setAssigneeSearch: (search: string) => void; projDropdownOpen: boolean; setProjDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  docDropdownOpen: boolean; setDocDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; projSearch: string;
  setProjSearch: (search: string) => void; docSearch: string; setDocSearch: (search: string) => void;
  projRect: { top: number, left: number, width: number } | null; setProjRect: (rect: any) => void;
  docRect: { top: number, left: number, width: number } | null; setDocRect: (rect: any) => void;
  projTriggerRef: React.RefObject<HTMLButtonElement | null>; docTriggerRef: React.RefObject<HTMLButtonElement | null>;
  projDropdownRef: React.RefObject<HTMLDivElement | null>; docDropdownRef: React.RefObject<HTMLDivElement | null>;
  availableProjects?: { id: string; name: string }[]; editProjectDocs: { id: string; title: string; url: string; doc_type: string }[];
  loadingDocs: boolean; teamMembers: any[]; isTaskLocked: boolean; canManageAssignees: boolean; saving: boolean; saveEdit: () => void;
}

export default function TaskEditModal({
  showEditModal, setShowEditModal, editDescription, setEditDescription, editStatus, setEditStatus, editPriority, setEditPriority,
  editDeadline, setEditDeadline, editProjectId, setEditProjectId, editRefDocId, setEditRefDocId, editHours, setEditHours,
  editBillingHours, setEditBillingHours, editLogDate, setEditLogDate, editAssigneeIds, setEditAssigneeIds, assigneeSearch,
  setAssigneeSearch, projDropdownOpen, setProjDropdownOpen, docDropdownOpen, setDocDropdownOpen, projSearch, setProjSearch,
  docSearch, setDocSearch, projRect, setProjRect, docRect, setDocRect, projTriggerRef, docTriggerRef, projDropdownRef,
  docDropdownRef, availableProjects, editProjectDocs, loadingDocs, teamMembers, isTaskLocked, canManageAssignees, saving, saveEdit
}: TaskEditModalProps) {
  return (
    <AnimatePresence>
      {showEditModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setShowEditModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-slate-50 dark:from-violet-900/30 dark:to-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                Edit Task
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Project Selection */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <FolderOpen className="w-3 h-3 text-violet-500 dark:text-violet-400" /> Project
                </label>
                <button
                  type="button"
                  ref={projTriggerRef}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const dropW = rect.width;
                    const clampedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - dropW - 8));
                    setProjRect({ top: rect.bottom + 4, left: clampedLeft, width: dropW });
                    setProjDropdownOpen(!projDropdownOpen);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-600 transition-all shadow-sm"
                >
                  <span className={editProjectId ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                    {editProjectId 
                      ? availableProjects?.find(p => p.id === editProjectId)?.name || 'Project selected'
                      : 'Select a project...'
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${projDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {projDropdownOpen && projRect && (
                  <div 
                    ref={projDropdownRef}
                    style={{ position: 'fixed', top: projRect.top, left: projRect.left, width: projRect.width, zIndex: 9999 }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                  >
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search projects..."
                          value={projSearch}
                          onChange={(e) => setProjSearch(e.target.value)}
                          className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-violet-500 shadow-inner text-slate-900 dark:text-slate-100"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                      {availableProjects?.filter(p => p.name.toLowerCase().includes(projSearch.toLowerCase())).map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setEditProjectId(p.id);
                            setEditRefDocId('');
                            setProjDropdownOpen(false);
                            setProjSearch('');
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between group ${
                            editProjectId === p.id ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          {editProjectId === p.id && <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Document Selection */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-cyan-500 dark:text-cyan-400" /> Reference Document
                  </div>
                  {editRefDocId && (
                    <button onClick={() => setEditRefDocId('')} className="text-[9px] text-red-500 dark:text-red-400 font-bold uppercase tracking-wider hover:text-red-600 dark:hover:text-red-300">Clear</button>
                  )}
                </label>
                <button
                  type="button"
                  disabled={!editProjectId}
                  ref={docTriggerRef}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const dropW = rect.width;
                    const clampedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - dropW - 8));
                    setDocRect({ top: rect.bottom + 4, left: clampedLeft, width: dropW });
                    setDocDropdownOpen(!docDropdownOpen);
                  }}
                  className={`w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-400 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-600 transition-all shadow-sm ${!editProjectId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={editRefDocId ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                    {loadingDocs ? 'Loading documents...' : editRefDocId 
                      ? editProjectDocs.find(d => d.id === editRefDocId)?.title || 'Document selected'
                      : 'Select reference (optional)...'
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${docDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {docDropdownOpen && docRect && (
                  <div 
                    ref={docDropdownRef}
                    style={{ position: 'fixed', top: docRect.top, left: docRect.left, width: docRect.width, zIndex: 9999 }}
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
                          className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 shadow-inner text-slate-900 dark:text-slate-100"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                      {editProjectDocs.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic">No documents found for this project</div>
                      ) : (
                        editProjectDocs.filter(d => d.title.toLowerCase().includes(docSearch.toLowerCase())).map(doc => (
                          <button
                            key={doc.id}
                            onClick={() => {
                              setEditRefDocId(doc.id);
                              setDocDropdownOpen(false);
                              setDocSearch('');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between group ${
                              editRefDocId === doc.id ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span className="truncate">[{doc.doc_type}] {doc.title}</span>
                            {editRefDocId === doc.id && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100
                    focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 resize-none transition-all"
                />
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    Status {isTaskLocked && <Lock className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />}
                  </label>
                  <select
                    value={editStatus}
                    disabled={isTaskLocked}
                    onChange={e => setEditStatus(e.target.value as TaskStatus)}
                    className={`w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all ${
                      isTaskLocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Priority</label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all"
                  >
                    {['Low', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">Deadline</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={e => setEditDeadline(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-all dark:[color-scheme:dark]"
                />
              </div>

              {/* Hours Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Working Hour
                  </label>
                  <input
                    type="number" step="0.25" min="0" value={editHours}
                    onChange={e => setEditHours(e.target.value)}
                    disabled={editStatus !== 'Complete'}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-violet-400" /> Logged Time
                  </label>
                  <input
                    type="number" step="0.25" min="0" value={editBillingHours}
                    onChange={e => {
                      const v = e.target.value;
                      if (parseFloat(v) > (parseFloat(editHours) || 0)) setEditBillingHours(editHours || '0');
                      else setEditBillingHours(v);
                    }}
                    disabled={editStatus !== 'Complete'}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Log Date ??? only matters when hours changed; controls which day the correction is recorded against */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Log Date
                </label>
                <input
                  type="date"
                  value={editLogDate}
                  max={todayIsoDate()}
                  onChange={e => setEditLogDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 transition-all dark:[color-scheme:dark]"
                />
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Used only if you change Working/Billing hour above. Leave hours untouched to keep prior daily logs intact.</p>
              </div>

              {/* Assignee Management ??? Director & Team Lead only */}
              {canManageAssignees && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                      Assigned Members
                    </div>
                    <span className="text-[10px] font-bold text-violet-500 dark:text-violet-400 normal-case tracking-normal">
                      {editAssigneeIds.length} selected
                    </span>
                  </label>

                  {/* Search */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={assigneeSearch}
                      onChange={e => setAssigneeSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-violet-400 transition-all text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Member list */}
                  <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 max-h-44 overflow-y-auto custom-scrollbar">
                    {teamMembers
                      .filter(m => !m.is_paused)
                      .filter(m => m.name.toLowerCase().includes(assigneeSearch.toLowerCase()))
                      .map(m => {
                        const isSelected = editAssigneeIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() =>
                              setEditAssigneeIds(prev =>
                                isSelected ? prev.filter(id => id !== m.id) : [...prev, m.id]
                              )
                            }
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              isSelected ? 'bg-violet-50 dark:bg-violet-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected ? 'bg-violet-200 dark:bg-violet-900/50 text-violet-800 dark:text-violet-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                            }`}>
                              {m.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${isSelected ? 'text-violet-800 dark:text-violet-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                {m.name}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{getRoleDisplayName(m.role)}</p>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0" />}
                          </button>
                        );
                      })}
                    {teamMembers.filter(m => !m.is_paused).filter(m => m.name.toLowerCase().includes(assigneeSearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">No members found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editDescription.trim()}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-200 dark:shadow-violet-900/30"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


