'use client';

import React from 'react';
import { X, Copy } from 'lucide-react';
import Image from 'next/image';

interface DailyReportModalProps {
  show: boolean;
  onClose: () => void;
  onCopy: () => void;
  reportText: string;
  taskCount: number;
}

export default function DailyReportModal({
  show,
  onClose,
  onCopy,
  reportText,
  taskCount,
}: DailyReportModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <Image src="/icon11.jpeg" alt="" width={28} height={28} className="rounded" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Daily Task Report</h3>
              <p className="text-xs text-slate-500 font-medium">{taskCount} task{taskCount === 1 ? '' : 's'} · ready to share</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <pre className="whitespace-pre-wrap break-words font-sans text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 leading-relaxed">
{reportText}
          </pre>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onCopy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-md shadow-violet-200 active:scale-[0.98]"
          >
            <Copy className="w-4 h-4" /> Copy
          </button>
        </div>
      </div>
    </div>
  );
}
