import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUpdateVaultItem } from '@/hooks/queries/useVault';
import { ALL_FOLDER, type VaultEntry } from '../constants';

const STORAGE_KEY = 'vault_folders';

// Folders derived from the entries themselves (any folder currently in use).
export function foldersFromEntries(entries: VaultEntry[]): string[] {
  const set = new Set<string>();
  entries.forEach((e) => {
    if (e.folder) set.add(e.folder);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// Owns folder state + bulk folder operations. Folders live in localStorage and
// are merged with folders in-use on entries. Bulk moves patch each affected
// entry via updateVaultItem; the mutation invalidates the vault query so the
// list refetches.
export function useVaultFolders(
  entries: VaultEntry[],
  activeFolder: string,
  setActiveFolder: (folder: string) => void,
) {
  const [storedFolders, setStoredFolders] = useState<string[]>([]);
  const updateVaultItem = useUpdateVaultItem();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setStoredFolders(raw ? JSON.parse(raw) : []);
    } catch {
      setStoredFolders([]);
    }
  }, []);

  const saveStoredFolders = (updated: string[]) => {
    setStoredFolders(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const folders = Array.from(new Set([...storedFolders, ...foldersFromEntries(entries)])).sort((a, b) =>
    a.localeCompare(b),
  );

  const createFolder = () => {
    const name = prompt('Folder name:');
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (folders.includes(trimmed)) {
        toast.error('Folder already exists');
        return;
      }
      saveStoredFolders([...storedFolders, trimmed]);
      setActiveFolder(trimmed);
    }
  };

  const deleteFolder = async (folder: string) => {
    if (!confirm(`Delete folder "${folder}"? Entries will be moved to Unfiled.`)) return;
    const ids = entries.filter((e) => e.folder === folder).map((e) => e.id);
    if (ids.length > 0) {
      try {
        await Promise.all(ids.map((id) => updateVaultItem.mutateAsync({ id, data: { folder: '' } })));
      } catch {
        toast.error('Failed to move entries');
        return;
      }
    }
    saveStoredFolders(storedFolders.filter((f) => f !== folder));
    if (activeFolder === folder) setActiveFolder(ALL_FOLDER);
    toast.success(`Folder "${folder}" deleted`);
  };

  // Returns whether the rename UI should close. Duplicate names keep the inline
  // editor open (matching the original behaviour); everything else closes it.
  const renameFolder = async (oldName: string, rawNewName: string): Promise<'close' | 'keep'> => {
    const newName = rawNewName.trim();
    if (!newName || newName === oldName) return 'close';
    if (folders.includes(newName)) {
      toast.error('A folder with that name already exists');
      return 'keep';
    }
    const ids = entries.filter((e) => e.folder === oldName).map((e) => e.id);
    if (ids.length > 0) {
      try {
        await Promise.all(ids.map((id) => updateVaultItem.mutateAsync({ id, data: { folder: newName } })));
      } catch {
        toast.error('Failed to rename folder');
        return 'close';
      }
    }
    saveStoredFolders(storedFolders.map((f) => (f === oldName ? newName : f)));
    if (activeFolder === oldName) setActiveFolder(newName);
    toast.success('Folder renamed');
    return 'close';
  };

  return { folders, createFolder, deleteFolder, renameFolder };
}
