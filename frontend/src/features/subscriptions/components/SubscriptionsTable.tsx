'use client';

import React from 'react';
import { DollarSign, Loader2, Edit, Trash2 } from 'lucide-react';
import type { Subscription } from '@/lib/types';

interface Props {
  subscriptions: Subscription[];
  loading: boolean;
  onEdit: (sub: Subscription) => void;
  onDelete: (sub: Subscription) => void;
}

export default function SubscriptionsTable({ subscriptions, loading, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Name</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Amount</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Subscribed By</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Start Date</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">End Date</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                    <span className="text-sm font-medium text-slate-500">Loading subscriptions...</span>
                  </div>
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="font-medium text-slate-500">No subscriptions yet</p>
                    <p className="text-xs">Click &quot;Add Subscription&quot; to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => {
                const today = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(today.getDate() + 7);

                const end = sub.end_date ? new Date(sub.end_date) : null;
                const trialEnd = sub.trial_expiration_date ? new Date(sub.trial_expiration_date) : null;

                const isExpiring = (sub.status !== 'Active' && !sub.status?.includes('Trial'))
                  ? false
                  : (end && end <= nextWeek) || (trialEnd && trialEnd <= nextWeek);

                return (
                <tr key={sub.id} className={`transition-colors group ${isExpiring ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{sub.name}</span>
                        {isExpiring && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100/80 text-red-700 border border-red-200 text-[9px] font-bold uppercase tracking-wider">
                            Ending Soon
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 mt-0.5">{sub.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">${Number(sub.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">
                    {sub.subscribed_by || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      sub.status?.toLowerCase().includes('trial')
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {sub.start_date ? new Date(sub.start_date).toLocaleDateString('en-US') : '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {sub.end_date ? new Date(sub.end_date).toLocaleDateString('en-US') : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(sub)}
                        className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(sub)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
