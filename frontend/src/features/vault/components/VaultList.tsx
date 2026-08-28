'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  ExternalLink,
  FolderOpen,
  User,
  Lock,
  Eye,
  EyeOff,
  Copy,
  ClipboardList,
  Trash2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { decrypt } from '@/lib/vault';
import type { VaultEntry } from '../constants';

interface Props {
  entries: VaultEntry[]; // already filtered by search + active folder
  hasEntries: boolean; // whether any (unfiltered) entries exist
  folders: string[];
  userId: string;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (id: string) => void;
  onMoveToFolder: (id: string, folder: string) => void;
  onSelectFolder: (folder: string) => void;
}

// Presentational list of vault entries. Reveal/decrypt is purely view state and
// lives here — a map of entry id → decrypted plaintext for revealed rows.
export default function VaultList({
  entries,
  hasEntries,
  folders,
  userId,
  onEdit,
  onDelete,
  onMoveToFolder,
  onSelectFolder,
}: Props) {
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const toggleReveal = async (entry: VaultEntry) => {
    if (revealed[entry.id] !== undefined) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[entry.id];
        return next;
      });
      return;
    }
    try {
      const decrypted = await decrypt(entry.encrypted_password, userId);
      setRevealed((prev) => ({ ...prev, [entry.id]: decrypted }));
    } catch {
      toast.error('Failed to decrypt password');
    }
  };

  const copyPassword = async (entry: VaultEntry) => {
    const existing = revealed[entry.id];
    if (existing === undefined) {
      try {
        const decrypted = await decrypt(entry.encrypted_password, userId);
        await navigator.clipboard.writeText(decrypted);
        toast.success('Password copied');
      } catch {
        toast.error('Failed to decrypt');
      }
    } else {
      await navigator.clipboard.writeText(existing);
      toast.success('Password copied');
    }
  };

  if (entries.length === 0) {
    if (!hasEntries) return null;
    return (
      <div className="text-center py-12 text-slate-400">
        <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">No entries match your search</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isRevealed = revealed[entry.id] !== undefined;
        return (
          <div
            key={entry.id}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{entry.title}</h3>
                    {entry.url && (
                      <a
                        href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-violet-600 transition-colors"
                        title="Open URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {entry.folder && (
                      <button
                        onClick={() => onSelectFolder(entry.folder)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                      >
                        <FolderOpen className="w-2.5 h-2.5" />
                        {entry.folder}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {entry.username && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {entry.username}
                      </span>
                    )}
                    {/* Move to folder */}
                    {!entry.folder && folders.length > 0 && (
                      <span className="flex items-center gap-1">
                        {folders.map((f) => (
                          <button
                            key={f}
                            onClick={() => onMoveToFolder(entry.id, f)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                          >
                            +{f}
                          </button>
                        ))}
                      </span>
                    )}
                  </div>
                  {/* Password row */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 min-w-[120px]">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-mono text-slate-600">
                        {isRevealed ? revealed[entry.id] : '••••••••'}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleReveal(entry)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                      title={isRevealed ? 'Hide' : 'Reveal'}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => copyPassword(entry)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Copy password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {entry.notes && <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">{entry.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(entry)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Edit"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
