'use client';

import React from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { Layers, ExternalLink, GripVertical, ChevronDown, Check, Clock, Edit, X, Trash2 } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Paused: 'bg-amber-50 text-amber-700 border-amber-100',
  Completed: 'bg-blue-50 text-blue-700 border-blue-100',
};

const PROJECT_STATUSES: Array<'Active' | 'Paused' | 'Completed'> = ['Active', 'Paused', 'Completed'];

const STATUS_DOT: Record<string, string> = {
  Active: 'bg-emerald-500',
  Paused: 'bg-amber-500',
  Completed: 'bg-blue-500',
};

const CATEGORY_STYLES: Record<string, string> = {
  Marketplace: 'bg-violet-50 text-violet-700 border-violet-100',
  BDM: 'bg-blue-50 text-blue-700 border-blue-100',
  Servicing: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  Internal: 'bg-slate-100 text-slate-600 border-slate-200',
  Outside: 'bg-pink-50 text-pink-700 border-pink-100',
};

interface ProjectTableProps {
  projects: Project[];
  search: string;
  sortBy: 'custom' | 'name' | 'date';
  sortDir: 'asc' | 'desc';
  isSuperAdminOrLead: boolean;
  projectHours: Record<string, { working: number; billing: number }>;

  // Drag and Drop
  draggedId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;

  // Status editing
  canEditStatus: boolean;
  editingStatusId: string | null;
  setEditingStatusId: (id: string | null) => void;
  onSaveProjectStatus: (id: string, status: 'Active' | 'Paused' | 'Completed') => void;

  // Hours editing
  canEditHours: boolean;
  editingHoursId: string | null;
  editingMetric: 'working' | 'billing' | null;
  editingHoursValue: string;
  onEditHoursStart: (id: string, metric: 'working' | 'billing', val: string) => void;
  onEditHoursValueChange: (val: string) => void;
  onSaveHours: (id: string, val: number, metric: 'working' | 'billing') => void;
  onCancelEditHours: () => void;

  // Actions
  onOpenEdit: (p: Project) => void;
  onOpenDelete: (p: Project) => void;
}

export default function ProjectTable({
  projects, search, sortBy, sortDir, isSuperAdminOrLead,
  projectHours, draggedId, onDragStart, onDragOver, onDrop,
  canEditStatus, editingStatusId, setEditingStatusId, onSaveProjectStatus,
  canEditHours, editingHoursId, editingMetric, editingHoursValue,
  onEditHoursStart, onEditHoursValueChange, onSaveHours, onCancelEditHours,
  onOpenEdit, onOpenDelete,
}: ProjectTableProps) {
  const colSpan = isSuperAdminOrLead ? 10 : 8;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              {isSuperAdminOrLead && <th className="w-10 px-0"></th>}
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Name</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Client</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Category</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Lead</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Priority</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Type</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Working</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Logged Time</th>
              {isSuperAdminOrLead && <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px] text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-1 border border-slate-100">
                      <Layers className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-500">{search ? 'No matches found' : 'No projects tracked yet'}</p>
                    <p className="text-xs">Create your first project to start tracking tasks and progress</p>
                  </div>
                </td>
              </tr>
            ) : (
              projects.map(project => (
                <tr
                  key={project.id}
                  draggable={isSuperAdminOrLead && !search && sortBy === 'custom' && sortDir === 'asc'}
                  onDragStart={(e) => onDragStart(e, project.id)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, project.id)}
                  className={`hover:bg-slate-50 transition-colors group ${draggedId === project.id ? 'opacity-40 grayscale' : ''} ${!search && isSuperAdminOrLead && sortBy === 'custom' && sortDir === 'asc' ? 'cursor-move' : ''}`}
                >
                  {isSuperAdminOrLead && (
                    <td className={`px-3 py-4 text-slate-300 transition-opacity ${sortBy === 'custom' && sortDir === 'asc' ? 'opacity-100' : 'opacity-20 cursor-not-allowed'}`}
                        title={sortBy !== 'custom' || sortDir !== 'asc' ? 'Reordering only available in Manual Ascending sort' : ''}>
                      <GripVertical className="w-4 h-4" />
                    </td>
                  )}
                  {/* Name */}
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-1.5 hover:text-violet-600 transition-colors group/link">
                      {project.name}
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover/link:text-violet-500 transition-colors" />
                    </Link>
                  </td>
                  {/* Client */}
                  <td className="px-6 py-4">
                    {(project as any).client ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{(project as any).client.name.charAt(0)}</div>
                        <span className="font-medium">{(project as any).client.name}</span>
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  {/* Category */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${CATEGORY_STYLES[project.category] || CATEGORY_STYLES.Internal}`}>
                      {project.category}
                    </span>
                  </td>
                  {/* Lead */}
                  <td className="px-6 py-4">
                    {(project as any).project_lead ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-700">{(project as any).project_lead.name.charAt(0)}</div>
                        <span className="font-medium">{(project as any).project_lead.name}</span>
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  {/* Priority */}
                  <td className="px-6 py-4">
                    {project.priority ? (
                      <span className={`font-medium ${project.priority === 'Urgent' ? 'text-red-600' : project.priority === 'High' ? 'text-orange-600' : 'text-slate-500'}`}>{project.priority}</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  {/* Type */}
                  <td className="px-6 py-4 font-medium text-slate-500">
                    {project.project_type || <span className="text-slate-300">—</span>}
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4">
                    {canEditStatus ? (
                      <div className="relative">
                        <button
                          onClick={() => setEditingStatusId(editingStatusId === project.id ? null : project.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${STATUS_STYLES[project.status || 'Active'] || STATUS_STYLES.Active}`}
                          title="Click to change status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[project.status || 'Active']}`} />
                          {project.status || 'Active'}
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>
                        {editingStatusId === project.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setEditingStatusId(null)} />
                            <div className="absolute z-20 mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[150px]">
                              {PROJECT_STATUSES.map(s => (
                                <button
                                  key={s}
                                  onClick={() => onSaveProjectStatus(project.id, s)}
                                  className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors ${(project.status || 'Active') === s ? 'text-violet-700' : 'text-slate-600'}`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                                  {s}
                                  {(project.status || 'Active') === s && <Check className="w-3.5 h-3.5 ml-auto text-violet-600" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[project.status || 'Active'] || STATUS_STYLES.Active}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[project.status || 'Active']}`} />
                        {project.status || 'Active'}
                      </span>
                    )}
                  </td>
                  {/* Working Hours */}
                  <td className="px-6 py-4">
                    {editingHoursId === project.id && editingMetric === 'working' && canEditHours ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" step="0.25" min="0" value={editingHoursValue}
                          onChange={e => onEditHoursValueChange(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              const h = parseFloat(editingHoursValue);
                              if (!isNaN(h) && h >= 0) onSaveHours(project.id, h, 'working');
                            } else if (e.key === 'Escape') onCancelEditHours();
                          }}
                          autoFocus
                          className="w-20 bg-white border border-violet-400 rounded-md px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-300"
                        />
                        <button onClick={() => {
                          const h = parseFloat(editingHoursValue);
                          if (!isNaN(h) && h >= 0) onSaveHours(project.id, h, 'working');
                        }} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={onCancelEditHours} className="p-1 rounded text-slate-400 hover:bg-slate-100 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center gap-1.5 group/hours ${canEditHours ? 'cursor-pointer' : ''}`}
                        onClick={() => { if (canEditHours) onEditHoursStart(project.id, 'working', String(projectHours[project.id]?.working || 0)); }}
                        title={canEditHours ? 'Click to edit working hours' : undefined}
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className={`text-xs font-semibold ${(projectHours[project.id]?.working || 0) > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                          {(projectHours[project.id]?.working || 0).toFixed(1)}h
                        </span>
                        {canEditHours && <Edit className="w-2.5 h-2.5 text-slate-300 group-hover/hours:text-violet-400 transition-colors opacity-0 group-hover:opacity-100" />}
                      </div>
                    )}
                  </td>
                  {/* Billing Hours */}
                  <td className="px-6 py-4">
                    {editingHoursId === project.id && editingMetric === 'billing' && canEditHours ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" step="0.25" min="0" value={editingHoursValue}
                          onChange={e => onEditHoursValueChange(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              const h = parseFloat(editingHoursValue);
                              if (!isNaN(h) && h >= 0) onSaveHours(project.id, h, 'billing');
                            } else if (e.key === 'Escape') onCancelEditHours();
                          }}
                          autoFocus
                          className="w-20 bg-white border border-violet-400 rounded-md px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-300"
                        />
                        <button onClick={() => {
                          const h = parseFloat(editingHoursValue);
                          if (!isNaN(h) && h >= 0) onSaveHours(project.id, h, 'billing');
                        }} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={onCancelEditHours} className="p-1 rounded text-slate-400 hover:bg-slate-100 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center gap-2 group/billing ${canEditHours ? 'cursor-pointer' : ''}`}
                        onClick={() => { if (canEditHours) onEditHoursStart(project.id, 'billing', String(projectHours[project.id]?.billing || 0)); }}
                      >
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors ${
                          (projectHours[project.id]?.billing || 0) > 0 ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {(projectHours[project.id]?.billing || 0).toFixed(1)}h
                          {canEditHours && <Edit className="w-2.5 h-2.5 text-violet-400 group-hover/billing:text-violet-600 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </span>
                      </div>
                    )}
                  </td>
                  {/* Actions */}
                  {isSuperAdminOrLead && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onOpenEdit(project)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => onOpenDelete(project)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
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
}
