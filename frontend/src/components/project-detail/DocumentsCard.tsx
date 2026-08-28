'use client';

import React, { memo } from 'react';
import { Edit, ExternalLink, FileText, Plus, Trash2 } from 'lucide-react';
import { ProjectDocument } from '@/lib/types';

type Props = {
  documents: ProjectDocument[];
  canEdit: boolean;
  docTypeColor: (type: string) => string;
  onAdd: () => void;
  onEdit: (doc: ProjectDocument) => void;
  onRequestDelete: (docId: string) => void;
};

const DocumentsCard = memo(function DocumentsCard({
  documents, canEdit, docTypeColor, onAdd, onEdit, onRequestDelete,
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-cyan-500" />
        Documents & Links
        <span className="ml-auto text-[10px] text-slate-500 font-normal uppercase tracking-wider">
          {documents.length} files
        </span>
        {canEdit && (
          <button onClick={onAdd} className="ml-2 p-1 bg-cyan-50 text-cyan-600 rounded-md hover:bg-cyan-100 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </h2>
      {documents.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">No documents linked</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-violet-300 transition-all group"
            >
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 font-medium truncate">{doc.title}</p>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-500 truncate hover:text-violet-600 hover:underline inline-block w-full">{doc.url}</a>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${docTypeColor(doc.doc_type)}`}>
                {doc.doc_type}
              </span>

              <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                {canEdit && (
                  <>
                    <button
                      onClick={() => onEdit(doc)}
                      className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit Document"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRequestDelete(doc.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                  title="Open Link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default DocumentsCard;
