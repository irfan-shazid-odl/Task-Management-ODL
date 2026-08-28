'use client';

import React from 'react';
import Link from 'next/link';
import { FolderOpen, ExternalLink } from 'lucide-react';
import type { ProjectHours } from '../lib/aggregations';

interface Props {
  projectHours: ProjectHours[];
}

export default function ProjectTimeDistribution({ projectHours }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-sm flex flex-col">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-emerald-500" />
        Project Time Distribution
      </h2>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {projectHours.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No time logged in filter range.</p>
        ) : (
          projectHours.map((ph) => (
            <div key={ph.id} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <Link href={`/projects/${ph.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate hover:text-violet-600 flex items-center gap-1">
                  {ph.name}
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                  {ph.category}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{ph.hours.toFixed(1)}h</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
