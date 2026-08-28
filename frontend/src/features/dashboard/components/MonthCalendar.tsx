'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  month: Date;
  onMonthChange: (month: Date) => void;
  selectedDate: string;
  onSelectDay: (dateStr: string) => void;
  onApply: () => void;
}

// The inner calendar grid + month nav + Apply button, shared by the start and
// end date pickers. The surrounding popover (position/visibility) is owned by
// DashboardFilters so the two pickers stay mutually exclusive.
export default function MonthCalendar({ month, onMonthChange, selectedDate, onSelectDay, onApply }: Props) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1))}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-slate-400 rotate-90" />
        </button>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h4>
        <button
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1))}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {(() => {
          const year = month.getFullYear();
          const monthIdx = month.getMonth();
          const firstDay = new Date(year, monthIdx, 1).getDay();
          const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
          const days = [];

          for (let i = 0; i < firstDay; i++) {
            days.push(null);
          }
          for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, monthIdx, i));
          }

          return days.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} />;
            }
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dateStr}
                onClick={() => onSelectDay(dateStr)}
                className={`py-1.5 rounded text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {date.getDate()}
              </button>
            );
          });
        })()}
      </div>

      <button
        onClick={onApply}
        className="w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-500 text-white text-xs font-bold rounded-lg hover:from-violet-500 hover:to-violet-400 transition-all"
      >
        Apply
      </button>
    </>
  );
}
