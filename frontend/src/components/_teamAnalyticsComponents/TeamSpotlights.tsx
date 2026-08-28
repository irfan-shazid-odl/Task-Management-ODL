import React from 'react';
import { Crown, Star } from 'lucide-react';
import { MemberStats, LeadStats, Period, PERIOD_LABELS } from './types';
import { getRoleDisplayName } from '@/lib/types';

interface TeamSpotlightsProps {
  topEmployee: MemberStats | undefined;
  topLead: LeadStats | undefined;
  period: Period;
}

export default function TeamSpotlights({ topEmployee, topLead, period }: TeamSpotlightsProps) {
  return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Best Employee */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-amber-900/30 dark:via-slate-800 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 to-transparent dark:from-amber-900/30 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Best Employee • {PERIOD_LABELS[period]}
              </h3>
            </div>
            {topEmployee && topEmployee.score > 0 ? (
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-amber-200/50 shrink-0">
                  {topEmployee.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{topEmployee.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{getRoleDisplayName(topEmployee.role)}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-white/70 dark:bg-slate-700/70 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-800">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Hours</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{topEmployee.totalHours.toFixed(1)}</p>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-700/70 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-800">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Tasks Done</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{topEmployee.tasksCompleted}</p>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-700/70 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-800">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Projects</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{topEmployee.projectsInvolved}</p>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-700/70 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-800">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Logged Time</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{topEmployee.totalBillingHours.toFixed(1)}h</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4">No activity recorded for {PERIOD_LABELS[period].toLowerCase()}.</p>
            )}
          </div>
        </div>

        {/* Best Project Lead */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-900/30 dark:via-slate-800 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-100/50 to-transparent dark:from-violet-900/30 rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              <h3 className="text-sm font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wider">
                Best Project Lead • {PERIOD_LABELS[period]}
              </h3>
            </div>
            {topLead && topLead.score > 0 ? (
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-violet-200/50 shrink-0">
                  {topLead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{topLead.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{getRoleDisplayName(topLead.role)}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-white/70 dark:bg-slate-700/70 rounded-lg px-3 py-2 border border-violet-100 dark:border-violet-800">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Projects Led</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{topLead.projectsManaged}</p>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-700/70 rounded-lg px-3 py-2 border border-violet-100 dark:border-violet-800">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Team Size</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{topLead.teamSize}</p>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-700/70 rounded-lg px-3 py-2 border border-violet-100 dark:border-violet-800">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Completion</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{topLead.completionRate.toFixed(0)}%</p>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-700/70 rounded-lg px-3 py-2 border border-violet-100 dark:border-violet-800">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Delivered</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{topLead.totalProjectHours.toFixed(1)}h</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4">No project leads with activity for {PERIOD_LABELS[period].toLowerCase()}.</p>
            )}
          </div>
        </div>
      </div>
  );
}

