'use client';

import { FileText, Loader2, X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  editingDocId: string | null;
  title: string;
  setTitle: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  docType: string;
  setDocType: (v: string) => void;
  onSubmit: () => void;
};

export default function DocumentModal({
  isOpen, onClose, isSubmitting, editingDocId,
  title, setTitle, url, setUrl, docType, setDocType, onSubmit,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-500" /> {editingDocId ? 'Edit Document' : 'Add Document'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Document Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-cyan-500" placeholder="e.g. Figma Design" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">URL / Link</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-cyan-500" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-cyan-500">
              <option value="Brief">Brief</option>
              <option value="Spec">Spec</option>
              <option value="Design">Design</option>
              <option value="Contract">Contract</option>
              <option value="Link">Link</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button onClick={onSubmit} disabled={isSubmitting || !title || !url} className="w-full py-2.5 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingDocId ? 'Update Document' : 'Save Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
