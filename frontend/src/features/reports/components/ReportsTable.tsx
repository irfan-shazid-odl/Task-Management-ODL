'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, ChevronDown, ArrowUp, ArrowDown, Loader2, Search, Check } from 'lucide-react';
import { TASK_STATUSES, TASK_CATEGORIES } from '@/lib/types';
import type { TaskReportRow, ReportSortKey, SortDirection } from '../types';
import { TASK_CATEGORY_COLORS, STATUS_COLORS } from '../constants';

interface Props {
  rows: TaskReportRow[];
  totalLoggedTime: number;
  sortKey: ReportSortKey | null;
  sortDir: SortDirection;
  onSort: (key: ReportSortKey, dir: SortDirection) => void;
  clientOptions: string[];
  projectOptions: string[];
  assigneeOptions: string[];
  clientFilter: string;
  projectFilter: string;
  assigneeFilter: string;
  statusFilter: string;
  categoryFilter: string;
  onClientFilterChange: (v: string) => void;
  onProjectFilterChange: (v: string) => void;
  onAssigneeFilterChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onCategoryFilterChange: (v: string) => void;
  onCategoryChange: (taskId: string, category: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onDescriptionChange: (taskId: string, description: string) => void;
  onEstimatedTimeChange: (taskId: string, value: number) => void;
  onAssigneesChange: (row: TaskReportRow, memberIds: string[]) => void;
  onLoggedTimeChange: (row: TaskReportRow, value: number) => void;
  assignableMembers: { id: string; name: string }[];
  savingTaskId: string | null;
}

// Shared dropdown-panel positioning + outside-click handling for both header
// variants below (Google Sheets-style column menu: sort at the top, filter
// value list underneath).
function useHeaderDropdown() {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (minWidth = 200) => {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const width = Math.max(minWidth, r.width + 40);
      setRect({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - width - 8), width });
    }
    setOpen(o => !o);
  };

  return { open, setOpen, rect, triggerRef, panelRef, toggle };
}

function SortRow({ label, dir, active, onClick }: { label: string; dir: SortDirection; active: boolean; onClick: () => void }) {
  const Icon = dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-violet-50 transition-colors ${active ? 'text-violet-700 font-semibold bg-violet-50/60' : 'text-slate-700'}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
      {active && <Check className="w-3.5 h-3.5 text-violet-500 ml-auto" />}
    </button>
  );
}

// Click-to-edit text (Description). Reads as plain text until clicked, then
// becomes a textarea; Enter or blur saves, Escape reverts.
function EditableText({
  value, onSave, disabled, placeholder = 'Add a description...',
}: { value: string; onSave: (v: string) => void; disabled?: boolean; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  const startEditing = () => {
    if (disabled) return;
    setDraft(value);
    setEditing(true);
  };

  useEffect(() => {
    if (!editing) return;
    ref.current?.focus();
    ref.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
  };

  if (!editing) {
    return (
      <button
        onClick={startEditing}
        disabled={disabled}
        className="text-left hover:bg-violet-50 rounded px-1.5 -mx-1.5 py-0.5 w-full whitespace-pre-wrap wrap-break-word transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        {value || <span className="text-slate-400 italic">{placeholder}</span>}
      </button>
    );
  }
  return (
    <textarea
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { setEditing(false); }
      }}
      rows={3}
      className="w-full text-sm text-slate-900 border border-violet-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-y"
    />
  );
}

// Click-to-edit number (Estimated Time, Logged Time).
function EditableNumber({
  value, suffix = 'h', onSave, disabled, min = 0, colorClassName = 'text-slate-600',
}: { value: number | null; suffix?: string; onSave: (v: number) => void; disabled?: boolean; min?: number; colorClassName?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const ref = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    if (disabled) return;
    setDraft(String(value ?? ''));
    setEditing(true);
  };

  useEffect(() => {
    if (!editing) return;
    ref.current?.focus();
    ref.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const n = parseFloat(draft);
    if (!isNaN(n) && n >= min && n !== value) onSave(n);
  };

  if (!editing) {
    return (
      <button
        onClick={startEditing}
        disabled={disabled}
        className={`hover:bg-violet-50 rounded px-2 py-0.5 font-medium transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent ${colorClassName}`}
      >
        {value != null ? `${value}${suffix}` : '—'}
      </button>
    );
  }
  return (
    <input
      ref={ref}
      type="number"
      step="0.25"
      min={min}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
      className="w-20 text-center text-sm text-slate-900 border border-violet-300 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
    />
  );
}

// Click-to-edit assignee list — a checklist of the members a Lead is allowed
// to hand this task to, with an explicit Save so multiple toggles commit once.
function AssigneeCell({
  row, members, onSave, disabled,
}: { row: TaskReportRow; members: { id: string; name: string }[]; onSave: (ids: string[]) => void; disabled?: boolean }) {
  const { open, setOpen, rect, triggerRef, panelRef, toggle } = useHeaderDropdown();
  const [selected, setSelected] = useState<string[]>(row.assignees.map(a => a.id));

  const openPanel = () => {
    if (disabled) return;
    setSelected(row.assignees.map(a => a.id));
    toggle(200);
  };

  const toggleMember = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const save = () => {
    onSave(selected);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={openPanel}
        disabled={disabled}
        className="text-left hover:bg-violet-50 rounded px-1.5 -mx-1.5 py-0.5 w-full transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        {row.assignees.length > 0
          ? row.assignees.map(m => m.name).join(', ')
          : <span className="text-slate-400 text-xs">Unassigned</span>}
      </button>

      {open && rect && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden text-left"
        >
          <div className="max-h-56 overflow-y-auto p-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200">
            {members.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">No team members available</div>
            ) : (
              members.map(m => (
                <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:bg-violet-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={() => toggleMember(m.id)}
                    className="accent-violet-600"
                  />
                  {m.name}
                </label>
              ))
            )}
          </div>
          <div className="p-1.5 border-t border-slate-100">
            <button
              onClick={save}
              className="w-full py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Every filterable column doubles as a spreadsheet-style column menu: sort
// A→Z / Z→A at the top, then a searchable list of every distinct value
// present in the day's rows — pick one to narrow the table to just that
// value. The trigger always reads as a plain header label, same weight/color
// as the static columns — only the chevron hints it's interactive.
function FilterHeader({
  label, sortKey, value, options, sort, onChange, onSort, align = 'left',
}: {
  label: string; sortKey: ReportSortKey; value: string; options: string[];
  sort: { key: ReportSortKey | null; dir: SortDirection };
  onChange: (v: string) => void; onSort: (key: ReportSortKey, dir: SortDirection) => void;
  align?: 'left' | 'center';
}) {
  const { open, setOpen, rect, triggerRef, panelRef, toggle } = useHeaderDropdown();
  const [search, setSearch] = useState('');
  const isFiltered = value !== 'All';
  const isSorted = sort.key === sortKey;

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
  };
  const sortBy = (dir: SortDirection) => {
    onSort(sortKey, dir);
    setOpen(false);
  };

  const filteredOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider ${align === 'center' ? 'text-center' : 'text-left'}`}>
      <button
        ref={triggerRef}
        onClick={() => { toggle(); setSearch(''); }}
        className={`inline-flex items-center gap-1 text-white hover:text-slate-200 transition-colors ${align === 'center' ? 'justify-center' : ''}`}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
        {(isFiltered || isSorted) && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 ml-0.5" title={isFiltered ? `Filtered: ${value}` : 'Sorted'} />}
      </button>

      {open && rect && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden text-left normal-case font-normal tracking-normal"
        >
          <div className="py-1 border-b border-slate-100">
            <SortRow label="Sort A to Z" dir="asc" active={isSorted && sort.dir === 'asc'} onClick={() => sortBy('asc')} />
            <SortRow label="Sort Z to A" dir="desc" active={isSorted && sort.dir === 'desc'} onClick={() => sortBy('desc')} />
          </div>
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 text-slate-900"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200">
            <button
              onClick={() => select('All')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-violet-50 transition-colors ${value === 'All' ? 'text-violet-700 font-semibold bg-violet-50/60' : 'text-slate-600'}`}
            >
              All {label}
              {value === 'All' && <Check className="w-3.5 h-3.5 text-violet-500" />}
            </button>
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-slate-400">No matches</div>
            ) : (
              filteredOptions.map(o => (
                <button
                  key={o}
                  onClick={() => select(o)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left hover:bg-violet-50 transition-colors ${value === o ? 'text-violet-700 font-semibold bg-violet-50/60' : 'text-slate-700'}`}
                >
                  <span className="truncate">{o}</span>
                  {value === o && <Check className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </th>
  );
}

export default function ReportsTable({
  rows, totalLoggedTime, sortKey, sortDir, onSort,
  clientOptions, projectOptions, assigneeOptions,
  clientFilter, projectFilter, assigneeFilter, statusFilter, categoryFilter,
  onClientFilterChange, onProjectFilterChange, onAssigneeFilterChange, onStatusFilterChange, onCategoryFilterChange,
  onCategoryChange, onStatusChange, onDescriptionChange, onEstimatedTimeChange, onAssigneesChange, onLoggedTimeChange,
  assignableMembers, savingTaskId,
}: Props) {
  const router = useRouter();
  const sort = { key: sortKey, dir: sortDir };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <FilterHeader label="Client Name" sortKey="client" value={clientFilter} options={clientOptions} sort={sort} onChange={onClientFilterChange} onSort={onSort} />
              <FilterHeader label="Project Name" sortKey="project" value={projectFilter} options={projectOptions} sort={sort} onChange={onProjectFilterChange} onSort={onSort} />
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Description</th>
              <FilterHeader label="Assigned" sortKey="assignee" value={assigneeFilter} options={assigneeOptions} sort={sort} onChange={onAssigneeFilterChange} onSort={onSort} />
              <FilterHeader label="Category" sortKey="category" value={categoryFilter} options={[...TASK_CATEGORIES, 'Uncategorized']} sort={sort} onChange={onCategoryFilterChange} onSort={onSort} align="center" />
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider">Estimated Time</th>
              <FilterHeader label="Status" sortKey="status" value={statusFilter} options={['Active', ...TASK_STATUSES]} sort={sort} onChange={onStatusFilterChange} onSort={onSort} align="center" />
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider">Logged Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  No tasks found for this day / filter combination.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.taskId} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors align-top">
                  {/* Client */}
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{row.clientName}</td>

                  {/* Project */}
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">
                    {row.projectId ? (
                      <button
                        onClick={() => router.push(`/projects/${row.projectId}`)}
                        className="inline-flex items-center gap-1.5 text-slate-900 hover:text-violet-600 hover:underline transition-colors cursor-pointer"
                      >
                        {row.projectName}
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    ) : (
                      <span className="text-slate-400">{row.projectName}</span>
                    )}
                  </td>

                  {/* Description — inline editable, full text always shown */}
                  <td className="px-4 py-3 text-slate-700 max-w-sm">
                    <EditableText
                      value={row.description}
                      onSave={(v) => onDescriptionChange(row.taskId, v)}
                      disabled={savingTaskId === row.taskId}
                    />
                  </td>

                  {/* Assignee(s) — inline editable */}
                  <td className="px-4 py-3 text-slate-700">
                    <AssigneeCell
                      row={row}
                      members={assignableMembers}
                      onSave={(ids) => onAssigneesChange(row, ids)}
                      disabled={savingTaskId === row.taskId}
                    />
                  </td>

                  {/* Category — inline editable */}
                  <td className="px-4 py-3 text-center">
                    <div className="relative inline-block">
                      <select
                        value={row.category || ''}
                        onChange={(e) => onCategoryChange(row.taskId, e.target.value)}
                        disabled={savingTaskId === row.taskId}
                        className={`appearance-none cursor-pointer rounded-full text-[11px] font-semibold pl-2.5 pr-6 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 ${row.category ? TASK_CATEGORY_COLORS[row.category] : 'bg-slate-100 text-slate-500'}`}
                      >
                        <option value="">Uncategorized</option>
                        {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </td>

                  {/* Estimated Time — inline editable */}
                  <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
                    <EditableNumber
                      value={row.estimatedTime}
                      onSave={(v) => onEstimatedTimeChange(row.taskId, v)}
                      disabled={savingTaskId === row.taskId}
                    />
                  </td>

                  {/* Status — inline editable */}
                  <td className="px-4 py-3 text-center">
                    <div className="relative inline-flex items-center gap-1.5">
                      <select
                        value={row.status}
                        onChange={(e) => onStatusChange(row.taskId, e.target.value)}
                        disabled={savingTaskId === row.taskId}
                        className={`appearance-none cursor-pointer rounded-full text-[11px] font-semibold border pl-2.5 pr-6 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 ${STATUS_COLORS[row.status] || STATUS_COLORS['Todo']}`}
                      >
                        {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {savingTaskId === row.taskId && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                    </div>
                  </td>

                  {/* Logged Time — inline editable (edits insert the delta as a time log) */}
                  <td className="px-4 py-3 text-center font-bold">
                    <EditableNumber
                      value={row.loggedTime}
                      onSave={(v) => onLoggedTimeChange(row, v)}
                      disabled={savingTaskId === row.taskId}
                      colorClassName="text-emerald-600 font-bold"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                <td colSpan={7} className="px-4 py-3 text-right text-slate-700 uppercase text-xs tracking-wider">
                  Total Logged Time
                </td>
                <td className="px-4 py-3 text-center text-emerald-600 text-base">{totalLoggedTime.toFixed(1)}h</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
