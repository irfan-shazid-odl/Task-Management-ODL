import React from 'react';
import { Task, TaskStatus, TASK_STATUSES } from '@/lib/types';
import HourInput from '../HourInput';
import { StatusBadge } from '../StatusBadge';
import { CalendarDays, Send, Loader2, Pencil } from 'lucide-react';

interface TaskActionControlsProps {
  task: Task;
  hours: string;
  setHours: (val: string) => void;
  billingHours: string;
  setBillingHours: (val: string) => void;
  todaysHours: number;
  todaysBillingHours: number;
  logDate: string;
  setLogDate: (val: string) => void;
  displayedLogDate: string;
  logDateEditable: boolean;
  setLogDateEditable: React.Dispatch<React.SetStateAction<boolean>>;
  taskStoredLogDate: string;
  logDateOnEditStartRef: React.MutableRefObject<string>;
  todayIsoDate: () => string;
  commitLogDateOnly: (newDate: string) => Promise<void>;
  handleLogHours: () => Promise<void>;
  isLogging: boolean;
  displayStatus: TaskStatus;
  handleStatusChange: (s: TaskStatus) => Promise<void>;
  isUpdatingStatus: boolean;
}

export default function TaskActionControls({
  task,
  hours,
  setHours,
  billingHours,
  setBillingHours,
  todaysHours,
  todaysBillingHours,
  logDate,
  setLogDate,
  displayedLogDate,
  logDateEditable,
  setLogDateEditable,
  taskStoredLogDate,
  logDateOnEditStartRef,
  todayIsoDate,
  commitLogDateOnly,
  handleLogHours,
  isLogging,
  displayStatus,
  handleStatusChange,
  isUpdatingStatus,
}: TaskActionControlsProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 lg:gap-4 w-full lg:w-auto shrink-0 mt-2 lg:mt-0 justify-between lg:justify-end">
      {/* Working Hours */}
      <div className="flex flex-col gap-1">
         <span className="text-[10px] font-semibold text-slate-500 uppercase px-1">Working Hours</span>
         <div className="flex items-center gap-1">
           <HourInput
             value={hours}
             onChange={setHours}
             placeholder="Work"
             onEnter={handleLogHours}
             total={todaysHours}
             disabled={displayStatus !== 'Complete'}
             min={-(task.total_logged_hours || 0)}
           />
         </div>
      </div>

      {/* Log Date */}
      <div className="flex items-center gap-2 border-l border-slate-200 pl-3 pb-0.5">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-semibold text-slate-500" title="Date these hours apply to">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          Date
        </div>
        <input
          type="date"
          value={displayedLogDate}
          max={todayIsoDate()}
          readOnly={!logDateEditable}
          disabled={!logDateEditable}
          onChange={(e) => setLogDate(e.target.value)}
          onBlur={async () => {
            if (!logDateEditable) return;
            const newDate = logDate || todayIsoDate();
            if (newDate !== logDateOnEditStartRef.current) {
              await commitLogDateOnly(newDate);
            }
            setLogDateEditable(false);
          }}
          className={`border rounded-lg px-2 py-1 text-[10px] focus:outline-none transition-all shadow-sm ${
            logDateEditable
              ? 'bg-white border-violet-400 focus:ring-1 focus:ring-violet-400'
              : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
          }`}
          title={logDateEditable ? 'Pick a date — saves when you click away' : 'Click the pencil to edit'}
        />
        <button
          type="button"
          onClick={() => {
            if (!logDateEditable) {
              const current = taskStoredLogDate;
              setLogDate(current);
              logDateOnEditStartRef.current = current;
            }
            setLogDateEditable(v => !v);
          }}
          className="p-1 rounded text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
          title={logDateEditable ? 'Lock log date' : 'Edit log date'}
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>

      {/* Billing Hours */}
      <div className="flex flex-col gap-1 border-l border-slate-200 pl-3">
         <span className="text-[10px] font-semibold text-slate-500 uppercase px-1">Logged Time</span>
         <div className="flex items-center gap-1">
           <HourInput
             value={billingHours}
             onChange={setBillingHours}
             placeholder="Bill"
             onEnter={handleLogHours}
             total={todaysBillingHours}
             disabled={displayStatus !== 'Complete'}
             max={(task.total_logged_hours || 0) + (parseFloat(hours) || 0) - (task.total_billing_hours || 0)}
             min={-(task.total_billing_hours || 0)}
           />
         <button
           onClick={handleLogHours}
           disabled={isLogging || (!hours && !billingHours && (!logDate || logDate === todayIsoDate())) || displayStatus !== 'Complete'}
           className="p-1 text-violet-600 hover:bg-violet-50 rounded disabled:opacity-30 transition-colors shrink-0"
           title="Log entries"
         >
             {isLogging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
           </button>
         </div>
      </div>

      {/* Status Selection */}
      <div className="w-40 relative group/status pb-0.5">
        <select
          value={displayStatus}
          onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
          disabled={isUpdatingStatus}
          className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-violet-300 rounded-lg pl-3 pr-10 py-2 text-xs font-bold text-slate-700
            focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer shadow-sm disabled:opacity-50 transition-all"
        >
          {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          {isUpdatingStatus ? (
             <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
          ) : (
             <div className="scale-90 origin-right">
                <StatusBadge status={displayStatus} size="sm" />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
