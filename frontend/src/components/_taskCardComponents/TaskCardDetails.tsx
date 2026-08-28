import React from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Clock, CalendarDays, Loader2, Send, ExternalLink, Pencil, FileText, ChevronDown, Lock, Wallet } from 'lucide-react';
import { Task, TASK_STATUSES } from '@/lib/types';
import { PriorityBadge } from '../StatusBadge';
import Avatar from '../Avatar';

const todayIsoDate = () => new Date().toLocaleDateString('en-CA');

interface TaskCardDetailsProps {
  task: Task; currentUser: any; isTaskLocked: boolean; descExpanded: boolean; setDescExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  avatarModal: any; setAvatarModal: React.Dispatch<React.SetStateAction<any>>; displayedLogDate: string; logDateEditable: boolean;
  setLogDateEditable: React.Dispatch<React.SetStateAction<boolean>>; logDate: string; setLogDate: (date: string) => void;
  logging: boolean; logHours: () => void; hours: string; setHours: (hours: string) => void; billingHours: string;
  setBillingHours: (hours: string) => void; canMoveBackward: boolean; canMoveForward: boolean; moving: boolean;
  moveTask: (dir: 'forward'|'backward') => void; currentIndex: number; openEdit: () => void; taskStoredLogDate: string;
  logDateOnEditStartRef: React.MutableRefObject<string>; commitLogDateOnly: (date: string) => Promise<void>;
  isLongDesc: boolean; DESC_LIMIT: number; displayStatus: string; getTaskAge: (date: string) => string;
  deadlineDate: Date | null; isOverdue: boolean | null; showMoveButtons: boolean;
}

export default function TaskCardDetails({
  task, currentUser: _currentUser, isTaskLocked, descExpanded, setDescExpanded, avatarModal: _avatarModal, setAvatarModal, displayedLogDate,
  logDateEditable, setLogDateEditable, logDate, setLogDate, logging, logHours, hours, setHours, billingHours,
  setBillingHours, canMoveBackward, canMoveForward, moving, moveTask, currentIndex, openEdit, taskStoredLogDate,
  logDateOnEditStartRef, commitLogDateOnly, isLongDesc, DESC_LIMIT, displayStatus, getTaskAge, deadlineDate,
  isOverdue, showMoveButtons
}: TaskCardDetailsProps) {
  return (
    <>
      <div
          className={`group relative bg-white border border-slate-200 rounded-xl p-4
          hover:border-violet-200 hover:bg-slate-50/50 transition-all duration-300
          shadow-sm hover:shadow-md hover:shadow-violet-500/5 cursor-pointer
          ${isTaskLocked ? '' : 'active:cursor-grabbing'}`}
          draggable={!isTaskLocked}
          onDragStart={(e: any) => { e.dataTransfer.setData('taskId', task.id); }}
          onClick={() => openEdit()}
        >
          {/* Locked Indicator for Members & Leads */}
          {isTaskLocked && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 -mt-1 z-10">
              <span className="flex items-center gap-1 bg-slate-100 text-[8px] font-bold text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-300">
                <Lock className="w-2 h-2" /> LOCKED
              </span>
            </div>
          )}
        {/* Priority & Project + Edit button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            {task.created_at && (
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tight">
                {getTaskAge(task.created_at)} old
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.project && (
              <Link
                href={`/projects/${task.project.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-slate-500 hover:text-violet-600 font-medium uppercase tracking-wider truncate max-w-[100px] transition-colors flex items-center gap-1"
              >
                {task.project.name}
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
            {/* Edit button */}
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(); }}
              className="p-1 rounded-md text-slate-300 hover:text-violet-500 hover:bg-violet-50 transition-all opacity-0 group-hover:opacity-100"
              title="Edit task"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mb-2">
          <p className="text-xs text-slate-800 font-medium leading-relaxed wrap-anywhere whitespace-pre-wrap">
            {isLongDesc && !descExpanded
              ? task.description.slice(0, DESC_LIMIT).trimEnd() + '...'
              : task.description}
          </p>
          {isLongDesc && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDescExpanded(v => !v); }}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-violet-600 hover:text-violet-700 transition-colors"
            >
              {descExpanded ? (
                <>
                  Show less
                  <ChevronDown className="w-3 h-3 rotate-180 transition-transform" />
                </>
              ) : (
                <>
                  Show more
                  <ChevronDown className="w-3 h-3 transition-transform" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Reference Document badge */}
        {task.reference_doc && (
          <a
            href={task.reference_doc.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-1 rounded-lg hover:bg-cyan-100 hover:border-cyan-300 transition-all mb-2 max-w-full truncate"
            title={`Reference: ${task.reference_doc.title}`}
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate">{task.reference_doc.title}</span>
            <span className="shrink-0 text-cyan-400 font-normal">({task.reference_doc.doc_type})</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 text-cyan-400" />
          </a>
        )}

        {/* Meta Row */}
        <div className=" gap-3 text-[11px] text-slate-500 mb-3">
          {deadlineDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
              <CalendarDays className="w-3 h-3" />
              {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-1 w-full">
              {task.assignees.map(a => {
                const as = (a as any).assignment_status;
                const statusEmoji = as === 'Complete' ? '✅' : as === 'Working' ? '⏳' : as === 'On Review' ? '👀' : as === 'Todo' ? '📝' : '';
                return (
                  <div key={a.id} className="relative group/avatar">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAvatarModal({ name: a.name, role: a.role, avatar_url: a.avatar_url, status: as, email: a.email, phone: a.phone, location: a.location, bio: a.bio });
                      }}
                      className="relative focus:outline-none"
                    >
                      <Avatar
                        path={a.avatar_url}
                        name={a.name}
                        className="w-6 h-6 rounded-full border border-slate-200 shrink-0"
                        textClassName="text-[10px] bg-violet-100 text-violet-700 rounded-full"
                      />
                      {statusEmoji && (
                        <span className="absolute -top-1.5 -right-1.5 text-[10px] drop-shadow-lg">{statusEmoji}</span>
                      )}
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[10px] font-medium rounded shadow-lg whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-10">
                      {a.name} • {as || 'Todo'}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-col items-end gap-0.5 ml-auto text-[10px] font-semibold">
            <span className="text-slate-500">Work: {(task.total_logged_hours ?? 0).toFixed(2)}h</span>
            <span className="text-violet-500 font-bold">Bill: {(task.total_billing_hours ?? 0).toFixed(2)}h</span>
          </div>
        </div>

        {/* Hour Logging */}
        <div className="grid grid-cols-2 gap-4 mb-2" onClick={(e) => e.stopPropagation()}>
          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Working Hour</p>
            <div className="relative">
              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                type="number" step="0.25" placeholder="0.00"
                value={hours}
                onChange={(e) => {
                  const v = e.target.value;
                  const minWorkingDelta = -(task.total_logged_hours || 0);
                  if (parseFloat(v) < minWorkingDelta) setHours(minWorkingDelta.toString());
                  else setHours(v);
                }}
                onKeyDown={(e) => e.key === 'Enter' && logHours()}
                disabled={displayStatus !== 'Complete'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-violet-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-violet-400">Logged Time</p>
            <div className="relative">
              <Wallet className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-violet-400" />
              <input
                type="number" step="0.25" placeholder="0.00"
                value={billingHours}
                onChange={(e) => {
                  const v = e.target.value;
                  const newTotalWorking = (task.total_logged_hours || 0) + (parseFloat(hours) || 0);
                  const maxBillingDelta = newTotalWorking - (task.total_billing_hours || 0);
                  const minBillingDelta = -(task.total_billing_hours || 0);
                  if (parseFloat(v) > maxBillingDelta) setBillingHours(maxBillingDelta.toString());
                  else if (parseFloat(v) < minBillingDelta) setBillingHours(minBillingDelta.toString());
                  else setBillingHours(v);
                }}
                onKeyDown={(e) => e.key === 'Enter' && logHours()}
                disabled={displayStatus !== 'Complete'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-violet-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="mb-2" onClick={(e) => e.stopPropagation()}>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Log Date</p>
          <div className="relative">
            <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
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
              className={`w-full border rounded-lg pl-6 pr-8 py-1.5 text-xs text-slate-900 focus:outline-none transition-all ${
                logDateEditable
                  ? 'bg-white border-violet-400 ring-1 ring-violet-200'
                  : 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                if (!logDateEditable) {
                  setLogDate(taskStoredLogDate);
                  logDateOnEditStartRef.current = taskStoredLogDate;
                }
                setLogDateEditable(v => !v);
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
              title={logDateEditable ? 'Lock log date' : 'Edit log date'}
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); logHours(); }}
          disabled={logging || (!hours && !billingHours && (logDate === todayIsoDate() || !logDate)) || displayStatus !== 'Complete'}
          className="w-full py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-700 disabled:opacity-30 transition-all mb-3 shadow-sm shadow-violet-100 flex items-center justify-center gap-2"
        >
          {logging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Log Both Entries
        </button>

        {/* Move Buttons */}
        {showMoveButtons && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={(e) => { e.stopPropagation(); moveTask('backward'); }}
              disabled={!canMoveBackward || moving || isTaskLocked}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700
                disabled:opacity-20 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
            >
              <ChevronLeft className="w-3 h-3" />
              {canMoveBackward ? TASK_STATUSES[currentIndex - 1] : ''}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); moveTask('forward'); }}
              disabled={!canMoveForward || moving || isTaskLocked}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700
                disabled:opacity-20 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
            >
              {canMoveForward ? TASK_STATUSES[currentIndex + 1] : ''}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Creation Date at bottom */}
        {task.created_at && (
          <div className="mt-2 pt-1 border-t border-slate-50 flex justify-end">
            <span className="text-[9px] text-slate-400 font-medium tracking-tight">
              Created on {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

