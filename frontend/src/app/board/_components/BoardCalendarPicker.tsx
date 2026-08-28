'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BoardCalendarPickerProps {
  boardCalendarOpen: boolean;
  boardCalendarViewDate: Date;
  boardDate: string;
  onSelectDay: (day: number) => void;
  onChangeMonth: (offset: number) => void;
  onGoToToday: () => void;
}

export default function BoardCalendarPicker({
  boardCalendarOpen,
  boardCalendarViewDate,
  boardDate,
  onSelectDay,
  onChangeMonth,
  onGoToToday,
}: BoardCalendarPickerProps) {
  if (!boardCalendarOpen) return null;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  return (
    <div className="absolute top-full left-0 mt-2 z-[100] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <h4 className="text-sm font-bold text-slate-900">
          {boardCalendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h4>
        <div className="flex items-center gap-1">
          <button onClick={() => onChangeMonth(-1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <button onClick={() => onChangeMonth(1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={`weekday-${i}`} className="text-[10px] font-bold text-slate-400 text-center py-1 uppercase">{d}</div>
        ))}
        {(() => {
          const { firstDay, daysInMonth } = getDaysInMonth(boardCalendarViewDate);
          const days = [];
          for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);
          for (let d = 1; d <= daysInMonth; d++) {
            const isSelected = boardDate === new Date(boardCalendarViewDate.getFullYear(), boardCalendarViewDate.getMonth(), d).toLocaleDateString('en-CA');
            const isToday = new Date().toLocaleDateString('en-CA') === new Date(boardCalendarViewDate.getFullYear(), boardCalendarViewDate.getMonth(), d).toLocaleDateString('en-CA');
            days.push(
              <button
                key={d}
                onClick={() => onSelectDay(d)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                    : isToday
                    ? 'bg-violet-50 text-violet-600 border border-violet-100 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {d}
              </button>
            );
          }
          return days;
        })()}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={onGoToToday}
          className="text-[11px] font-bold text-violet-600 hover:text-violet-700"
        >
          Go to Today
        </button>
        <span className="text-[10px] text-slate-400 italic">Select a date</span>
      </div>
    </div>
  );
}
