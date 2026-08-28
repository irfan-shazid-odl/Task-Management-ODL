'use client';

import React, { useState } from 'react';
import { Trophy, ChevronDown, Filter, X } from 'lucide-react';
import { PERIOD_LABELS, type Period } from '../constants';

interface Props {
  period: Period;
  useCustomRange: boolean;
  selectedDate: string;
  today: string;
  onSelectPeriod: (p: Period) => void;
  onApplyDate: (date: string) => void;
  onRemoveFilter: () => void;
}

export default function AnalyticsFilterBar({
  period,
  useCustomRange,
  selectedDate,
  today,
  onSelectPeriod,
  onApplyDate,
  onRemoveFilter,
}: Props) {
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
          <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Team Performance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Auto-calculated rankings based on hours, tasks & projects</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Period Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 border border-slate-200 dark:border-slate-600">
          {(['day', 'month', 'year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => onSelectPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                period === p && !useCustomRange
                  ? 'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 shadow-sm border border-slate-200 dark:border-slate-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Custom Range Filter Button + Remove Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowCustomRange(!showCustomRange)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                useCustomRange
                  ? 'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Custom Range
            </button>

          {/* Custom Calendar Picker */}
          {showCustomRange && (
            <div className="absolute right-0 mt-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 w-80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Select Date Range</h3>
                <button
                  onClick={() => {
                    setShowCustomRange(false);
                    setTempSelectedDate(selectedDate);
                    setCalendarMonth(new Date(selectedDate));
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 rotate-90" />
                  </button>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h4>
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 -rotate-90" />
                  </button>
                </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {(() => {
                  const year = calendarMonth.getFullYear();
                  const month = calendarMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const days = [];

                  for (let i = 0; i < firstDay; i++) {
                    days.push(null);
                  }
                  for (let i = 1; i <= daysInMonth; i++) {
                    days.push(new Date(year, month, i));
                  }

                  return days.map((date, idx) => {
                    if (!date) {
                      return <div key={`empty-${idx}`} />;
                    }
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = dateStr === tempSelectedDate;
                    const isToday = dateStr === today;
                    const isFuture = dateStr > today;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => !isFuture && setTempSelectedDate(dateStr)}
                        disabled={isFuture}
                        className={`py-1.5 rounded text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-violet-600 text-white'
                            : isToday
                            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                            : isFuture
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Info and Apply Button */}
              <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Selected:</span> {new Date(tempSelectedDate).toLocaleDateString()} to {new Date(today).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => {
                  onApplyDate(tempSelectedDate);
                  setShowCustomRange(false);
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-500 text-white text-xs font-bold rounded-lg hover:from-violet-500 hover:to-violet-400 transition-all"
              >
                Apply Date
              </button>
            </div>
          )}
          </div>

          {/* Remove Filter Button */}
          {useCustomRange && (
            <button
              onClick={() => {
                onRemoveFilter();
                setShowCustomRange(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Remove Filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
