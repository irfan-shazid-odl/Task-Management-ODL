'use client';

import React from 'react';

interface Props {
  totalTasks: number;
  totalProjects: number;
  totalMembers: number;
  totalLoggedTime: number;
}

export default function ReportsSummaryCards({ totalTasks, totalProjects, totalMembers, totalLoggedTime }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Tasks</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{totalTasks}</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Projects</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{totalProjects}</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Team Members</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{totalMembers}</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Logged Time</p>
        <p className="text-2xl font-bold text-emerald-600 mt-1">{totalLoggedTime.toFixed(1)}h</p>
      </div>
    </div>
  );
}
