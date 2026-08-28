'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Clock, ExternalLink, History } from 'lucide-react';

type Activity = {
  description: string;
  action_type: string;
  created_at: string;
  member?: { name: string } | null;
};

type Props = {
  activities: Activity[];
  projectId: string;
};

const ActivityLog = memo(function ActivityLog({ activities, projectId }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-500" />
          Recent Project Activity
        </h2>
        {activities.length > 0 && (
          <span className="text-[10px] text-slate-500 font-normal uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            Audit Trail (Last 5)
          </span>
        )}
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <History className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-slate-400 text-sm font-medium">No activity recorded for this project yet.</p>
            <p className="text-[10px] text-slate-300 uppercase tracking-tighter mt-1">Audit logs will appear here</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100" />
            <div className="space-y-6">
              {activities.map((activity, i) => (
                <div key={i} className="flex gap-4 relative group">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-500 shrink-0 border border-slate-200 shadow-sm z-10 group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all duration-300">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-violet-600 transition-colors">
                        {activity.member?.name || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap font-semibold uppercase tracking-wider">
                        {new Date(activity.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-transparent group-hover:border-slate-100 group-hover:bg-white transition-all mt-1.5">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {activities.length >= 5 && (
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <Link
            href={`/admin/activity?project=${projectId}`}
            className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-all inline-flex items-center gap-1.5 px-4 py-2 bg-violet-50 rounded-full hover:bg-violet-100"
          >
            View Full History Page
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
});

export default ActivityLog;
