'use client';

import React, { useEffect, useState } from 'react';
import { FileDown, X } from 'lucide-react';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (preparedBy: string) => void;
  defaultName?: string;
}

export default function GenerateReportModal({
  isOpen,
  onClose,
  onGenerate,
  defaultName = '',
}: GenerateReportModalProps) {
  const [name, setName] = useState(defaultName);

  // Reset the field to the default each time the modal opens.
  // eslint-disable react-hooks/set-state-in-effect -- resetting form state on prop change
  useEffect(() => {
    if (isOpen) setName(defaultName);
  }, [isOpen, defaultName]);
  // eslint-enable react-hooks/set-state-in-effect

  if (!isOpen) return null;

  const submit = () => {
    if (!name.trim()) return;
    onGenerate(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="h-2 bg-violet-500 w-full" />

        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-6 border border-violet-100 shadow-sm shadow-violet-100/50">
              <FileDown className="w-8 h-8 text-violet-500" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">Generate Report</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Enter your name. It will appear as <span className="font-semibold text-slate-700">Prepared by</span> on the report.
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Prepared by
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder="Your name"
              autoFocus
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-8">
            <button
              onClick={onClose}
              className="px-4 py-3 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!name.trim()}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all shadow-lg shadow-violet-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
