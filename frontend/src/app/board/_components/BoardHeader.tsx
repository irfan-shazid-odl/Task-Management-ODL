'use client';

import React from 'react';
import {
  KanbanSquare, RefreshCw, Plus, Clock,
  ChevronDown, ChevronRight, Download, FileText,
} from 'lucide-react';
import BoardCalendarPicker from './BoardCalendarPicker';
import BoardProjectFilter from './BoardProjectFilter';
import BoardMemberSwitcher from './BoardMemberSwitcher';

type ViewMode = 'mine' | 'all' | string;

interface TeamMember {
  id: string;
  name: string;
  role: string;
  is_paused?: boolean;
}

interface BoardHeaderProps {
  viewLabel: string;
  viewMode: ViewMode;
  // Gates the "All Members" board switcher + PDF Summary export — super-admin
  // and Lead both get these; Admin/Member don't.
  canViewAllMembers: boolean;
  refreshing: boolean;

  // Filter mode
  boardFilterMode: 'day' | 'month';
  onSetFilterMode: (mode: 'day' | 'month') => void;

  // Day picker
  boardDate: string;
  boardCalendarOpen: boolean;
  boardCalendarViewDate: Date;
  boardCalendarRef: React.RefObject<HTMLDivElement | null>;
  onToggleCalendar: () => void;
  onSelectDay: (day: number) => void;
  onChangeMonth: (offset: number) => void;
  onGoToToday: () => void;

  // Month picker
  boardMonth: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToCurrentMonth: () => void;

  // Project filter
  boardProjectId: string;
  boardProjectDropdownOpen: boolean;
  boardProjectSearch: string;
  availableProjects: { id: string; name: string }[];
  boardProjectDropdownRef: React.RefObject<HTMLDivElement | null>;
  onToggleProjectDropdown: () => void;
  onSelectBoardProject: (id: string) => void;
  onBoardProjectSearchChange: (v: string) => void;

  // Member switcher
  memberDropdownOpen: boolean;
  memberDropdownRef: React.RefObject<HTMLDivElement | null>;
  teamMembers: TeamMember[];
  onToggleMemberDropdown: () => void;
  onSelectView: (mode: ViewMode) => void;

  // Actions
  onGeneratePDF: () => void;
  onShowActivityModal: () => void;
  onOpenNewTask: () => void;
  onRefresh: () => void;
}

export default function BoardHeader({
  viewLabel,
  viewMode,
  canViewAllMembers,
  refreshing,
  boardFilterMode,
  onSetFilterMode,
  boardDate,
  boardCalendarOpen,
  boardCalendarViewDate,
  boardCalendarRef,
  onToggleCalendar,
  onSelectDay,
  onChangeMonth,
  onGoToToday,
  boardMonth,
  onPrevMonth,
  onNextMonth,
  onGoToCurrentMonth,
  boardProjectId,
  boardProjectDropdownOpen,
  boardProjectSearch,
  availableProjects,
  boardProjectDropdownRef,
  onToggleProjectDropdown,
  onSelectBoardProject,
  onBoardProjectSearchChange,
  memberDropdownOpen,
  memberDropdownRef,
  teamMembers,
  onToggleMemberDropdown,
  onSelectView,
  onGeneratePDF,
  onShowActivityModal,
  onOpenNewTask,
  onRefresh,
}: BoardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <KanbanSquare className="w-7 h-7 text-violet-500" />
          {viewMode === 'all' ? 'Central' : 'My'} <span className="gradient-text">Board</span>
        </h1>
        <p className="text-slate-500 mt-1 text-sm">{viewLabel}</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Day / Month filter */}
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => onSetFilterMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${boardFilterMode === 'day' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Day
            </button>
            <button
              onClick={() => onSetFilterMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${boardFilterMode === 'month' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Month
            </button>
          </div>

          {/* Picker */}
          <div className="relative" ref={boardCalendarRef}>
            {boardFilterMode === 'month' ? (
              /* Month picker */
              <div className="flex items-center gap-1 bg-white border border-violet-300 rounded-xl px-3 py-2 shadow-sm">
                <button
                  onClick={onPrevMonth}
                  className="p-0.5 hover:bg-slate-50 rounded text-slate-400 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                </button>
                <span className="text-xs font-semibold text-violet-700 min-w-[90px] text-center">
                  {new Date(boardMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={onNextMonth}
                  className="p-0.5 hover:bg-slate-50 rounded text-slate-400 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onGoToCurrentMonth}
                  className="ml-1 text-[10px] font-bold text-violet-500 hover:text-violet-700 transition-colors"
                >
                  Today
                </button>
              </div>
            ) : (
              /* Day picker */
              <>
                <button
                  onClick={onToggleCalendar}
                  className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:shadow-sm transition-all"
                >
                  <Clock className="w-3.5 h-3.5 text-violet-500" />
                  {new Date(boardDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${boardCalendarOpen ? 'rotate-180' : ''}`} />
                </button>

                <BoardCalendarPicker
                  boardCalendarOpen={boardCalendarOpen}
                  boardCalendarViewDate={boardCalendarViewDate}
                  boardDate={boardDate}
                  onSelectDay={onSelectDay}
                  onChangeMonth={onChangeMonth}
                  onGoToToday={onGoToToday}
                />
              </>
            )}
          </div>
        </div>

        {/* Project Filter */}
        <BoardProjectFilter
          boardProjectId={boardProjectId}
          boardProjectDropdownOpen={boardProjectDropdownOpen}
          boardProjectSearch={boardProjectSearch}
          availableProjects={availableProjects}
          boardProjectDropdownRef={boardProjectDropdownRef}
          onToggleDropdown={onToggleProjectDropdown}
          onSelectProject={onSelectBoardProject}
          onSearchChange={onBoardProjectSearchChange}
        />
        
        {/* PDF Export Button (super-admin / Lead only) */}
        {canViewAllMembers && (
          <button
            onClick={onGeneratePDF}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 shadow-sm transition-all animate-in fade-in slide-in-from-right-4 duration-500"
            title="Generate Daily PDF Summary"
          >
            <FileText className="w-3.5 h-3.5 text-violet-500" />
            Summary
          </button>
        )}

        {/* Team Member Switcher Dropdown (super-admin / Lead only) */}
        {canViewAllMembers && (
          <BoardMemberSwitcher
            viewMode={viewMode}
            memberDropdownOpen={memberDropdownOpen}
            memberDropdownRef={memberDropdownRef}
            teamMembers={teamMembers}
            onToggleDropdown={onToggleMemberDropdown}
            onSelectView={onSelectView}
          />
        )}

        <div className="w-[1.5px] h-8 bg-slate-200/50 mx-1 rounded-full hidden sm:block" />

        <button
          onClick={onShowActivityModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-sm font-bold text-violet-600 hover:bg-violet-100 transition-all shadow-sm active:scale-[0.98]"
        >
          <Download className="w-4 h-4" /> Download Activity
        </button>
        <button
          onClick={onOpenNewTask}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
