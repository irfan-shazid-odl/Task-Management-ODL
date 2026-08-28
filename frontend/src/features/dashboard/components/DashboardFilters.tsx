'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Users, ChevronDown, X } from 'lucide-react';
import type { TeamMember } from '@/lib/types';
import MonthCalendar from './MonthCalendar';

interface Props {
  currentUser: TeamMember | null;
  teamMembers: TeamMember[];
  selectedMemberId: string;
  onSelectMember: (id: string) => void;
  startDate: string;
  endDate: string;
  onChangeStart: (date: string) => void;
  onChangeEnd: (date: string) => void;
  todayStr: string;
}

// Header control cluster: optional team-member filter + start/end date pickers +
// clear button. Owns all calendar popover state; the page just holds the
// committed startDate/endDate/selectedMemberId values.
export default function DashboardFilters({
  currentUser,
  teamMembers,
  selectedMemberId,
  onSelectMember,
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
  todayStr,
}: Props) {
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startCalendarMonth, setStartCalendarMonth] = useState(new Date());
  const [endCalendarMonth, setEndCalendarMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);

  // Close calendars on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (startCalendarRef.current && !startCalendarRef.current.contains(e.target as Node)) {
        setShowStartCalendar(false);
      }
      if (endCalendarRef.current && !endCalendarRef.current.contains(e.target as Node)) {
        setShowEndCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-[1000] animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Team Member Filter — Admin/Super Admin only */}
      {currentUser && ['super-admin', 'Admin'].includes(currentUser.role) && teamMembers.length > 0 && (
        <div className="relative flex-1 sm:flex-initial">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={selectedMemberId}
            onChange={(e) => onSelectMember(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl pl-9 pr-8 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300
              focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <option value="all">All Members</option>
            {teamMembers.filter((m) => !m.is_paused).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      )}
      {/* Start Date Calendar */}
      <div className="relative flex-1 sm:flex-initial" ref={startCalendarRef}>
        <button
          onClick={() => {
            setShowStartCalendar(!showStartCalendar);
            setShowEndCalendar(false);
            setTempStartDate(startDate);
            setStartCalendarMonth(new Date(startDate));
          }}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 text-left
            focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          {new Date(startDate).toLocaleDateString()}
        </button>

        {/* Start Date Calendar Picker */}
        {showStartCalendar && (
          <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl z-[9999] w-80 pointer-events-auto opacity-100">
            <MonthCalendar
              month={startCalendarMonth}
              onMonthChange={setStartCalendarMonth}
              selectedDate={tempStartDate}
              onSelectDay={setTempStartDate}
              onApply={() => {
                onChangeStart(tempStartDate);
                setShowStartCalendar(false);
              }}
            />
          </div>
        )}
      </div>

      <span className="hidden sm:block text-slate-400 dark:text-slate-500 font-medium text-center">to</span>

      {/* End Date Calendar */}
      <div className="relative flex-1 sm:flex-initial" ref={endCalendarRef}>
        <button
          onClick={() => {
            setShowEndCalendar(!showEndCalendar);
            setShowStartCalendar(false);
            setTempEndDate(endDate);
            setEndCalendarMonth(new Date(endDate));
          }}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 text-left
            focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          {new Date(endDate).toLocaleDateString()}
        </button>

        {/* End Date Calendar Picker */}
        {showEndCalendar && (
          <div className="absolute top-full right-0 mt-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl z-[9999] w-80 pointer-events-auto opacity-100">
            <MonthCalendar
              month={endCalendarMonth}
              onMonthChange={setEndCalendarMonth}
              selectedDate={tempEndDate}
              onSelectDay={setTempEndDate}
              onApply={() => {
                onChangeEnd(tempEndDate);
                setShowEndCalendar(false);
              }}
            />
          </div>
        )}
      </div>
      {(startDate !== todayStr || endDate !== todayStr) && (
        <button
          onClick={() => {
            onChangeStart(todayStr);
            onChangeEnd(todayStr);
          }}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shrink-0"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  );
}
