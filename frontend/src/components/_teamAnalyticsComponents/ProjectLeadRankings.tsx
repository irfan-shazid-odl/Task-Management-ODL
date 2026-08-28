import React from 'react';
import { Star } from 'lucide-react';
import { getRoleDisplayName } from '@/lib/types';
import { LeadStats, Period, PERIOD_LABELS, RANK_STYLES } from './types';

interface ProjectLeadRankingsProps {
  leadStats: LeadStats[];
  period: Period;
}

export default function ProjectLeadRankings({ leadStats, period }: ProjectLeadRankingsProps) {
  if (leadStats.length === 0) return null;
  return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Project Lead Rankings • {PERIOD_LABELS[period]}</h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {leadStats.map((lead, idx) => {
              const rankStyle = idx < 3 ? RANK_STYLES[idx] : null;
              return (
                <div key={lead.id} className={`px-6 py-4 flex items-center gap-4 ${idx === 0 ? 'bg-violet-50/30 dark:bg-violet-900/20' : ''}`}>
                  {/* Rank */}
                  {rankStyle ? (
                    <div className={`w-8 h-8 rounded-lg ${rankStyle.bg} ${rankStyle.text} flex items-center justify-center shadow-sm shrink-0`}>
                      <rankStyle.icon className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{idx + 1}</span>
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{lead.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{getRoleDisplayName(lead.role)}</p>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{lead.projectsManaged}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Projects</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{lead.teamSize}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Members</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{lead.completedTasks}/{lead.totalTasks}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">{lead.completionRate.toFixed(0)}%</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Done</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-violet-600 dark:text-violet-300">{lead.totalProjectHours.toFixed(1)}h</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Hours</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
  );
}


