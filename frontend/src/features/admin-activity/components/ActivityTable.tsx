'use client';

import React from 'react';
import { Building2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { ActivityLogRow } from '@/lib/api/resources/activity';

interface Props {
  rows: ActivityLogRow[];
  loading: boolean;
  page: number;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function ActivityTable({ rows, loading, page, nextDisabled, onPrev, onNext }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Timestamp</th>
            <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Member</th>
            <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Action</th>
            <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Project</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading history...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                No activities match your filters.
              </td>
            </tr>
          ) : (
            rows.map((activity) => (
              <tr key={activity.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-[11px] text-slate-500 font-medium">
                  {new Date(activity.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                      {activity.member?.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-semibold text-slate-900">{activity.member?.name || 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-medium">{activity.description}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight mt-0.5">{activity.action_type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {activity.project && (
                    <Link href={`/projects/${activity.project.id}`} className="text-xs text-slate-500 hover:text-violet-600 font-medium flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {activity.project.name}
                    </Link>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {!loading && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {rows.length} entries</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={onPrev}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-400 disabled:opacity-30 hover:text-violet-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-400 disabled:opacity-30 hover:text-violet-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
