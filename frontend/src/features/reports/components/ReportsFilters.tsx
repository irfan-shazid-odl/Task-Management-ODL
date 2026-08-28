'use client';

import React from 'react';
import { Search, CalendarDays, X } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  todayStr: string;
}

// Search + date range live here. Client/Project/Assigned/Category/Status are
// filtered directly from their own column header dropdowns in the table.
export default function ReportsFilters({
  search,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  todayStr,
}: Props) {
  const isTodayOnly = dateFrom === todayStr && dateTo === todayStr;

  // Keep the range valid — dragging one end past the other pulls it along.
  const handleFromChange = (value: string) => {
    const v = value || todayStr;
    onDateFromChange(v);
    if (v > dateTo) onDateToChange(v);
  };
  const handleToChange = (value: string) => {
    const v = value || todayStr;
    onDateToChange(v);
    if (v < dateFrom) onDateFromChange(v);
  };
  const resetToToday = () => {
    onDateFromChange(todayStr);
    onDateToChange(todayStr);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search client, project, task, member..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Date range — defaults to today; pick a wider range to review any period */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="date"
          value={dateFrom}
          max={todayStr}
          onChange={e => handleFromChange(e.target.value)}
          className="text-sm border-none outline-none bg-transparent w-32.5"
        />
        <span className="text-slate-300">-</span>
        <input
          type="date"
          value={dateTo}
          max={todayStr}
          onChange={e => handleToChange(e.target.value)}
          className="text-sm border-none outline-none bg-transparent w-32.5"
        />
        {!isTodayOnly && (
          <button
            onClick={resetToToday}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title="Reset to today"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
}
