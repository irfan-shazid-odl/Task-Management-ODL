'use client';

import React from 'react';
import { Search, Check, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ProjectCategory } from '@/lib/types';

const PROJECT_STATUSES: Array<'Active' | 'Paused' | 'Completed'> = ['Active', 'Paused', 'Completed'];
const PROJECT_CATEGORIES: ProjectCategory[] = ['Marketplace', 'BDM', 'Servicing', 'Internal', 'Outside'];

const STATUS_DOT: Record<string, string> = {
  Active: 'bg-emerald-500', Paused: 'bg-amber-500', Completed: 'bg-blue-500',
};
const CATEGORY_DOT: Record<string, string> = {
  Marketplace: 'bg-violet-500', BDM: 'bg-blue-500', Servicing: 'bg-cyan-500', Internal: 'bg-slate-500', Outside: 'bg-pink-500',
};

interface ProjectsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  statusFilterOpen: boolean;
  onStatusFilterToggle: () => void;
  onStatusFilterSelect: (v: string) => void;
  categoryFilter: string;
  categoryFilterOpen: boolean;
  onCategoryFilterToggle: () => void;
  onCategoryFilterSelect: (v: string) => void;
  sortBy: 'custom' | 'name' | 'date';
  onSortByChange: (v: 'custom' | 'name' | 'date') => void;
  sortDir: 'asc' | 'desc';
  onSortDirToggle: () => void;
}

export default function ProjectsToolbar({
  search, onSearchChange,
  statusFilter, statusFilterOpen, onStatusFilterToggle, onStatusFilterSelect,
  categoryFilter, categoryFilterOpen, onCategoryFilterToggle, onCategoryFilterSelect,
  sortBy, onSortByChange, sortDir, onSortDirToggle,
}: ProjectsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text" placeholder="Search projects or clients..."
          value={search} onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all font-medium"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Status Filter */}
        <div className="relative">
          <button onClick={onStatusFilterToggle}
            className={`flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all text-slate-700 hover:border-slate-300 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 ${statusFilterOpen ? 'border-violet-500 ring-2 ring-violet-500/10' : ''}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusFilter === 'All' ? 'bg-slate-400' : STATUS_DOT[statusFilter]}`} />
            <span>{statusFilter === 'All' ? 'All Statuses' : statusFilter}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${statusFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          {statusFilterOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => onStatusFilterSelect(statusFilter)} />
              <div className="absolute z-20 mt-1.5 left-0 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[180px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <button onClick={() => onStatusFilterSelect('All')}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors hover:bg-slate-50 ${statusFilter === 'All' ? 'text-violet-700' : 'text-slate-600'}`}>
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> All Statuses
                  {statusFilter === 'All' && <Check className="w-3.5 h-3.5 ml-auto text-violet-600" />}
                </button>
                <div className="mx-3 my-1 border-t border-slate-100" />
                {PROJECT_STATUSES.map(s => (
                  <button key={s} onClick={() => onStatusFilterSelect(s)}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors hover:bg-slate-50 ${statusFilter === s ? 'text-violet-700' : 'text-slate-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} /> {s}
                    {statusFilter === s && <Check className="w-3.5 h-3.5 ml-auto text-violet-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative">
          <button onClick={onCategoryFilterToggle}
            className={`flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all text-slate-700 hover:border-slate-300 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 ${categoryFilterOpen ? 'border-violet-500 ring-2 ring-violet-500/10' : ''}`}>
            <span className={`w-2 h-2 rounded-full ${categoryFilter === 'All' ? 'bg-slate-400' : CATEGORY_DOT[categoryFilter]}`} />
            <span>{categoryFilter === 'All' ? 'All Categories' : categoryFilter}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${categoryFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          {categoryFilterOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => onCategoryFilterSelect(categoryFilter)} />
              <div className="absolute z-20 mt-1.5 left-0 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[180px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <button onClick={() => onCategoryFilterSelect('All')}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors hover:bg-slate-50 ${categoryFilter === 'All' ? 'text-violet-700' : 'text-slate-600'}`}>
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> All Categories
                  {categoryFilter === 'All' && <Check className="w-3.5 h-3.5 ml-auto text-violet-600" />}
                </button>
                <div className="mx-3 my-1 border-t border-slate-100" />
                {PROJECT_CATEGORIES.map(c => (
                  <button key={c} onClick={() => onCategoryFilterSelect(c)}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors hover:bg-slate-50 ${categoryFilter === c ? 'text-violet-700' : 'text-slate-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT[c]}`} /> {c}
                    {categoryFilter === c && <Check className="w-3.5 h-3.5 ml-auto text-violet-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

        {/* Sort */}
        <select value={sortBy}
          onChange={e => onSortByChange(e.target.value as any)}
          className="bg-white border border-slate-200 rounded-xl pl-4 pr-8 py-2.5 text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all text-slate-700 appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat"
        >
          <option value="custom">Manual</option>
          <option value="name">Name</option>
          <option value="date">Date</option>
        </select>

        <button onClick={onSortDirToggle} disabled={sortBy === 'custom'}
          className={`p-2.5 bg-white border border-slate-200 rounded-xl transition-all ${
            sortBy === 'custom' ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'hover:border-violet-300 hover:bg-violet-50 text-slate-600 active:scale-95'
          }`}
          title={sortBy === 'custom' ? 'Manual sorting is fixed to Ascending' : `Current Order: ${sortDir.toUpperCase()}`}
        >
          {sortDir === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
