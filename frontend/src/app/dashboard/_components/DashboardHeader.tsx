'use client';

import React, { useRef, useEffect } from 'react';
import { Users, ChevronDown, X } from 'lucide-react';

interface DashboardHeaderProps {
  currentUser: any;
  teamMembers: any[];
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  showStartCalendar: boolean;
  setShowStartCalendar: (show: boolean) => void;
  showEndCalendar: boolean;
  setShowEndCalendar: (show: boolean) => void;
  startCalendarMonth: Date;
  setStartCalendarMonth: (date: Date) => void;
  endCalendarMonth: Date;
  setEndCalendarMonth: (date: Date) => void;
  tempStartDate: string;
  setTempStartDate: (date: string) => void;
  tempEndDate: string;
  setTempEndDate: (date: string) => void;
}

export default function DashboardHeader({
  currentUser, teamMembers,
  selectedMemberId, setSelectedMemberId,
  startDate, endDate, setStartDate, setEndDate,
  showStartCalendar, setShowStartCalendar,
  showEndCalendar, setShowEndCalendar,
  startCalendarMonth, setStartCalendarMonth,
  endCalendarMonth, setEndCalendarMonth,
  tempStartDate, setTempStartDate,
  tempEndDate, setTempEndDate,
}: DashboardHeaderProps) {
  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];

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
  }, [setShowStartCalendar, setShowEndCalendar]);

  return (
    <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Command <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">Real-time operations overview for Octopi Digital</p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-[1000] animate-in fade-in slide-in-from-right-4 duration-500">
        {currentUser && ['super-admin', 'Admin'].includes(currentUser.role) && teamMembers.length > 0 && (
          <div className="relative flex-1 sm:flex-initial">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl pl-9 pr-8 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <option value="all">All Members</option>
              {teamMembers.filter(m => !m.is_paused).map(m => (
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
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 text-left focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            {new Date(startDate).toLocaleDateString()}
          </button>
          {showStartCalendar && (
            <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl z-[9999] w-80 pointer-events-auto opacity-100">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setStartCalendarMonth(new Date(startCalendarMonth.getFullYear(), startCalendarMonth.getMonth() - 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                  <ChevronDown className="w-4 h-4 text-slate-400 rotate-90" />
                </button>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {startCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <button onClick={() => setStartCalendarMonth(new Date(startCalendarMonth.getFullYear(), startCalendarMonth.getMonth() + 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                  <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {(() => {
                  const year = startCalendarMonth.getFullYear();
                  const month = startCalendarMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const days = [];
                  for (let i = 0; i < firstDay; i++) days.push(null);
                  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
                  return days.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} />;
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = dateStr === tempStartDate;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setTempStartDate(dateStr)}
                        className={`py-1.5 rounded text-xs font-medium transition-all ${isSelected ? 'bg-violet-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  });
                })()}
              </div>
              <button
                onClick={() => { setStartDate(tempStartDate); setShowStartCalendar(false); }}
                className="w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-500 text-white text-xs font-bold rounded-lg hover:from-violet-500 hover:to-violet-400 transition-all"
              >
                Apply
              </button>
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
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 text-left focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            {new Date(endDate).toLocaleDateString()}
          </button>
          {showEndCalendar && (
            <div className="absolute top-full right-0 mt-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl z-[9999] w-80 pointer-events-auto opacity-100">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setEndCalendarMonth(new Date(endCalendarMonth.getFullYear(), endCalendarMonth.getMonth() - 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                  <ChevronDown className="w-4 h-4 text-slate-400 rotate-90" />
                </button>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {endCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <button onClick={() => setEndCalendarMonth(new Date(endCalendarMonth.getFullYear(), endCalendarMonth.getMonth() + 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                  <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {(() => {
                  const year = endCalendarMonth.getFullYear();
                  const month = endCalendarMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const days = [];
                  for (let i = 0; i < firstDay; i++) days.push(null);
                  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
                  return days.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} />;
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = dateStr === tempEndDate;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setTempEndDate(dateStr)}
                        className={`py-1.5 rounded text-xs font-medium transition-all ${isSelected ? 'bg-violet-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  });
                })()}
              </div>
              <button
                onClick={() => { setEndDate(tempEndDate); setShowEndCalendar(false); }}
                className="w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-500 text-white text-xs font-bold rounded-lg hover:from-violet-500 hover:to-violet-400 transition-all"
              >
                Apply
              </button>
            </div>
          )}
        </div>
        {(startDate !== todayStr || endDate !== todayStr) && (
          <button
            onClick={() => { setStartDate(todayStr); setEndDate(todayStr); }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shrink-0"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
