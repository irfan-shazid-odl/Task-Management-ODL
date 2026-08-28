'use client';

import React from 'react';
import {
  TrendingUp, Clock, FolderOpen, CheckCircle2, Users, Zap, ChevronDown,
} from 'lucide-react';
import { getRoleDisplayName } from '@/lib/types';
import { RANK_STYLES, type MemberStats } from '../constants';

interface Props {
  member: MemberStats;
  idx: number;
  isExpanded: boolean;
  maxScore: number;
  onToggle: () => void;
}

export default function LeaderboardRow({ member: m, idx, isExpanded, maxScore, onToggle }: Props) {
  const rankStyle = idx < 3 ? RANK_STYLES[idx] : null;
  const barWidth = (m.score / maxScore) * 100;

  return (
    <React.Fragment>
      <tr
        className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
          idx === 0 ? 'bg-amber-50/30 dark:bg-amber-900/20' : idx === 1 ? 'bg-slate-50/30 dark:bg-slate-700/30' : idx === 2 ? 'bg-orange-50/20 dark:bg-orange-900/20' : ''
        }`}
        onClick={onToggle}
      >
        {/* Rank */}
        <td className="px-4 py-3">
          {rankStyle ? (
            <div className={`w-7 h-7 rounded-lg ${rankStyle.bg} ${rankStyle.text} flex items-center justify-center shadow-sm`}>
              <rankStyle.icon className="w-3.5 h-3.5" />
            </div>
          ) : (
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 pl-1.5">{idx + 1}</span>
          )}
        </td>
        {/* Member */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              idx === 0 ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {m.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{m.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{getRoleDisplayName(m.role)}</p>
            </div>
          </div>
        </td>
        {/* Hours */}
        <td className="px-3 py-3 text-center font-bold text-slate-900 dark:text-slate-100">{m.totalHours > 0 ? m.totalHours.toFixed(1) : '-'}</td>
        {/* Billable */}
        <td className="px-3 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{m.totalBillingHours > 0 ? m.totalBillingHours.toFixed(1) : '-'}</td>
        {/* Tasks Done */}
        <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">{m.tasksCompleted}</td>
        {/* Assigned */}
        <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">{m.tasksAssigned}</td>
        {/* Projects */}
        <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-300 font-semibold">{m.projectsInvolved}</td>
        {/* Completion Rate */}
        <td className="px-3 py-3 text-center">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
            m.completionRate >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
            m.completionRate >= 50 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
            'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}>
            {m.completionRate.toFixed(0)}%
          </span>
        </td>
        {/* Score Bar */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  idx === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                  idx === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                  idx === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                  'bg-gradient-to-r from-violet-400 to-violet-500'
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-8 text-right">{m.score.toFixed(0)}</span>
          </div>
        </td>
        {/* Expand */}
        <td className="px-2 py-3">
          <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </td>
      </tr>

      {/* Expanded Detail Row */}
      {isExpanded && (
        <tr className="bg-slate-50/50 dark:bg-slate-700/30">
          <td colSpan={10} className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-slate-700 rounded-xl p-3 border border-slate-200 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-violet-500 dark:text-violet-400" />
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Hours</p>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{m.totalHours.toFixed(1)}</p>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-xl p-3 border border-slate-200 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Logged Time</p>
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{m.totalBillingHours.toFixed(1)}</p>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-xl p-3 border border-slate-200 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tasks Done</p>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{m.tasksCompleted} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">/ {m.tasksAssigned}</span></p>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-xl p-3 border border-slate-200 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <FolderOpen className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Projects</p>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{m.projectsInvolved}</p>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-xl p-3 border border-slate-200 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Avg hrs/task</p>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{m.avgHoursPerTask.toFixed(1)}</p>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-xl p-3 border border-slate-200 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3 h-3 text-violet-500 dark:text-violet-400" />
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Completion</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{m.completionRate.toFixed(0)}%</p>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.completionRate >= 80 ? 'bg-emerald-500' : m.completionRate >= 50 ? 'bg-amber-500' : 'bg-red-400'
                      }`}
                      style={{ width: `${m.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
