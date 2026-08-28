'use client';

import React, { useMemo, useState } from 'react';
import { KeyRound, Plus, Search, Inbox, Folder, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/components/UserContext';
import { useVaultItems, useDeleteVaultItem, useUpdateVaultItem } from '@/hooks/queries/useVault';
import { ALL_FOLDER, UNFILED_FOLDER, type VaultEntry } from '@/features/vault/constants';
import { useVaultFolders } from '@/features/vault/lib/useVaultFolders';
import VaultFolders from '@/features/vault/components/VaultFolders';
import VaultList from '@/features/vault/components/VaultList';
import VaultEntryModal from '@/features/vault/components/VaultEntryModal';

export default function PasswordVaultPage() {
  const { currentUser } = useUser();

  const { data, isLoading } = useVaultItems(!!currentUser);
  const deleteVaultItem = useDeleteVaultItem();
  const updateVaultItem = useUpdateVaultItem();

  // Backend scopes vault items to the authed member; sort newest-first.
  const entries = useMemo<VaultEntry[]>(
    () => [...(data ?? [])].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    [data],
  );

  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string>(ALL_FOLDER);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VaultEntry | null>(null);

  const { folders, createFolder, deleteFolder, renameFolder } = useVaultFolders(
    entries,
    activeFolder,
    setActiveFolder,
  );

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !search ||
          e.title.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q) ||
          e.url.toLowerCase().includes(q);
        if (!matchesSearch) return false;
        if (activeFolder === ALL_FOLDER) return true;
        if (activeFolder === UNFILED_FOLDER) return !e.folder;
        return e.folder === activeFolder;
      }),
    [entries, search, activeFolder],
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteVaultItem.mutateAsync(id);
      toast.success('Password deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const moveToFolder = async (id: string, folder: string) => {
    try {
      await updateVaultItem.mutateAsync({ id, data: { folder } });
      toast.success('Entry moved');
    } catch {
      toast.error('Failed to move entry');
    }
  };

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Password Vault</h1>
            <p className="text-sm text-slate-500">{entries.length} entries</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold hover:from-violet-700 hover:to-violet-600 transition-all shadow-md shadow-violet-200"
        >
          <Plus className="w-4 h-4" />
          Add Password
        </button>
      </div>

      <div className="flex gap-6">
        {/* Folder Sidebar */}
        <VaultFolders
          entries={entries}
          folders={folders}
          activeFolder={activeFolder}
          setActiveFolder={setActiveFolder}
          onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
          onRenameFolder={renameFolder}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search */}
          {entries.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-all"
              />
            </div>
          )}

          {/* Empty state */}
          {entries.length === 0 && (
            <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No passwords yet</h3>
              <p className="text-sm text-slate-500 mb-6">Your encrypted vault is empty. Add your first entry.</p>
              <button
                onClick={openNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold hover:from-violet-700 hover:to-violet-600 transition-all shadow-md shadow-violet-200"
              >
                <Plus className="w-4 h-4" />
                Add Password
              </button>
            </div>
          )}

          {/* Folder label */}
          {entries.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {activeFolder === ALL_FOLDER ? (
                <>
                  <Inbox className="w-4 h-4 text-violet-400" />
                  <span className="font-medium text-slate-700">All Entries</span>
                </>
              ) : activeFolder === UNFILED_FOLDER ? (
                <>
                  <Folder className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">Unfiled</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4 text-violet-400" />
                  <span className="font-medium text-slate-700">{activeFolder}</span>
                </>
              )}
              <span className="text-xs text-slate-400">({filtered.length})</span>
            </div>
          )}

          {/* Entry list */}
          <VaultList
            entries={filtered}
            hasEntries={entries.length > 0}
            folders={folders}
            userId={currentUser.id}
            onEdit={(entry) => {
              setEditing(entry);
              setModalOpen(true);
            }}
            onDelete={handleDelete}
            onMoveToFolder={moveToFolder}
            onSelectFolder={setActiveFolder}
          />
        </div>
      </div>

      <VaultEntryModal
        open={modalOpen}
        editing={editing}
        folders={folders}
        userId={currentUser.id}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
