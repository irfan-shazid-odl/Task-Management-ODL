'use client';

import React from 'react';
import { Search, FolderOpen, CheckCircle2, ChevronDown } from 'lucide-react';

interface BoardProjectFilterProps {
  boardProjectId: string;
  boardProjectDropdownOpen: boolean;
  boardProjectSearch: string;
  availableProjects: { id: string; name: string }[];
  boardProjectDropdownRef: React.RefObject<HTMLDivElement | null>;
  onToggleDropdown: () => void;
  onSelectProject: (id: string) => void;
  onSearchChange: (value: string) => void;
}

export default function BoardProjectFilter({
  boardProjectId,
  boardProjectDropdownOpen,
  boardProjectSearch,
  availableProjects,
  boardProjectDropdownRef,
  onToggleDropdown,
  onSelectProject,
  onSearchChange,
}: BoardProjectFilterProps) {
  const boardFilteredProjects = [
    { id: 'all', name: 'All Projects' },
    ...availableProjects.filter(p => p.name.toLowerCase().includes(boardProjectSearch.toLowerCase()))
  ];

  return (
    <div className="relative" ref={boardProjectDropdownRef}>
      <button
        onClick={onToggleDropdown}
        className={`flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border transition-all text-xs font-semibold ${
          boardProjectId !== 'all' ? 'border-violet-400 shadow-sm text-violet-700' : 'border-slate-200 text-slate-700'
        } hover:border-violet-300 min-w-[200px]`}
      >
        <FolderOpen className={`w-3.5 h-3.5 ${boardProjectId !== 'all' ? 'text-violet-500' : 'text-slate-400'}`} />
        <span className="flex-1 text-left truncate">
          {boardProjectId === 'all' ? 'All Projects' : availableProjects.find(p => p.id === boardProjectId)?.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${boardProjectDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {boardProjectDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 z-[100] bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 min-w-[240px] max-w-[300px]">
          <div className="relative p-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search projects..."
              value={boardProjectSearch}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 transition-all font-medium"
            />
          </div>
          <div className="max-h-48 overflow-y-auto mt-1 custom-scrollbar">
            {boardFilteredProjects.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                  boardProjectId === p.id ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FolderOpen className={`w-3 h-3 ${boardProjectId === p.id ? 'text-violet-500' : 'text-slate-400'}`} />
                <span className="flex-1 truncate">{p.name}</span>
                {boardProjectId === p.id && <CheckCircle2 className="w-3 h-3 text-violet-500 shrink-0" />}
              </button>
            ))}
            {boardFilteredProjects.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-slate-400">No projects found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
