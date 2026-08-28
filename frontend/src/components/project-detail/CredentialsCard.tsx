'use client';

import React, { memo } from 'react';
import { Check, Copy, Edit, ExternalLink, Eye, EyeOff, KeyRound, Plus, Shield, Trash2 } from 'lucide-react';
import { ProjectCredential } from '@/lib/types';

type Props = {
  credentials: ProjectCredential[];
  visiblePasswords: Set<string>;
  copiedId: string | null;
  onTogglePassword: (credId: string) => void;
  onCopy: (text: string, id: string) => void;
  onAdd: () => void;
  onEdit: (cred: ProjectCredential) => void;
  onRequestDelete: (credId: string) => void;
};

const CredentialsCard = memo(function CredentialsCard({
  credentials, visiblePasswords, copiedId,
  onTogglePassword, onCopy, onAdd, onEdit, onRequestDelete,
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-amber-500" />
        Credentials
        <span className="ml-auto text-[10px] text-slate-500 font-normal uppercase tracking-wider">
          {credentials.length} saved
        </span>
        <button onClick={onAdd} className="ml-2 p-1 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </h2>
      {credentials.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">No credentials stored</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {credentials.map(cred => (
            <div key={cred.id} className="relative p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-sm font-medium text-slate-900">{cred.label}</span>
                </div>
                <div className="flex items-center gap-1.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity absolute right-4">
                  {cred.url && (
                    <a
                      href={cred.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-colors"
                      title="Open Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => onEdit(cred)}
                    className="p-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                    title="Edit Credential"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRequestDelete(cred.id)}
                    className="p-1.5 bg-white border border-red-200 rounded text-red-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Delete Credential"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider w-16 flex-shrink-0">User</span>
                <code className="text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded flex-1 font-mono truncate">{cred.username}</code>
                <button
                  onClick={() => onCopy(cred.username || '', `user-${cred.id}`)}
                  className="p-1 rounded text-slate-400 hover:text-slate-900 transition-colors flex-shrink-0"
                >
                  {copiedId === `user-${cred.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider w-16 flex-shrink-0">Pass</span>
                <code className="text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded flex-1 font-mono truncate">
                  {visiblePasswords.has(cred.id) ? cred.password : '••••••••••'}
                </code>
                <button
                  onClick={() => onTogglePassword(cred.id)}
                  className="p-1 rounded text-slate-400 hover:text-slate-900 transition-colors flex-shrink-0"
                >
                  {visiblePasswords.has(cred.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => onCopy(cred.password || '', `pass-${cred.id}`)}
                  className="p-1 rounded text-slate-400 hover:text-slate-900 transition-colors flex-shrink-0"
                >
                  {copiedId === `pass-${cred.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {cred.notes && (
                <p className="text-[11px] text-slate-500 mt-1 italic">{cred.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default CredentialsCard;
