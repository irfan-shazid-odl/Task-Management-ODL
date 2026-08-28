'use client';

import { KeyRound, Loader2, X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  editingCredId: string | null;
  label: string;
  setLabel: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onSubmit: () => void;
};

export default function CredentialModal({
  isOpen, onClose, isSubmitting, editingCredId,
  label, setLabel, url, setUrl, username, setUsername,
  password, setPassword, notes, setNotes, onSubmit,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" /> {editingCredId ? 'Edit Credential' : 'Add Credential'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto w-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Label (e.g. WordPress Admin)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500" placeholder="System Name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Login URL (Optional)</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500" placeholder="username" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500" placeholder="••••••••" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Notes (Optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500" placeholder="Requires VPN..." />
          </div>
          <button onClick={onSubmit} disabled={isSubmitting || !label} className="w-full py-2.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCredId ? 'Update Credential' : 'Save Credential'}
          </button>
        </div>
      </div>
    </div>
  );
}
