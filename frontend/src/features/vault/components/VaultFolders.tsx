'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Inbox, Folder, FolderOpen, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { ALL_FOLDER, UNFILED_FOLDER, type VaultEntry } from '../constants';

interface Props {
  entries: VaultEntry[];
  folders: string[];
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (folder: string) => void;
  onRenameFolder: (oldName: string, newName: string) => Promise<'close' | 'keep'>;
}

// Folder sidebar. Owns only the inline-rename UI state; all folder persistence
// and bulk-move logic lives in the useVaultFolders hook via the callbacks.
export default function VaultFolders({
  entries,
  folders,
  activeFolder,
  setActiveFolder,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}: Props) {
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingFolder && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingFolder]);

  const startRename = (folder: string) => {
    setRenamingFolder(folder);
    setRenameValue(folder);
  };

  const commitRename = async () => {
    if (!renamingFolder || !renameValue.trim()) {
      setRenamingFolder(null);
      return;
    }
    const result = await onRenameFolder(renamingFolder, renameValue);
    if (result === 'close') setRenamingFolder(null);
  };

  return (
    <div className="w-56 shrink-0">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Folders</span>
        </div>
        <div className="py-1">
          <button
            onClick={() => setActiveFolder(ALL_FOLDER)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
              activeFolder === ALL_FOLDER ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Inbox className="w-4 h-4 shrink-0" />
            <span className="truncate">All Entries</span>
            <span className="ml-auto text-xs text-slate-400">{entries.length}</span>
          </button>
          <button
            onClick={() => setActiveFolder(UNFILED_FOLDER)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
              activeFolder === UNFILED_FOLDER ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Folder className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="truncate">Unfiled</span>
            <span className="ml-auto text-xs text-slate-400">{entries.filter((e) => !e.folder).length}</span>
          </button>

          {folders.map((folder) => (
            <div key={folder} className="group relative">
              {renamingFolder === folder ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenamingFolder(null);
                    }}
                    onBlur={commitRename}
                    className="w-full bg-white border border-violet-400 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-300"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setActiveFolder(folder)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                    activeFolder === folder ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 shrink-0 text-violet-400" />
                  <span className="truncate">{folder}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {entries.filter((e) => e.folder === folder).length}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(folder);
                      }}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <Pencil className="w-3 h-3" />
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder);
                      }}
                      className="p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 px-2 py-2">
          <button
            onClick={onCreateFolder}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Folder
          </button>
        </div>
      </div>
    </div>
  );
}
