'use client';

import React, { useEffect, useState } from 'react';
import { X, Lock, Eye, EyeOff, Folder } from 'lucide-react';
import { toast } from 'sonner';
import { encrypt } from '@/lib/vault';
import { useCreateVaultItem, useUpdateVaultItem } from '@/hooks/queries/useVault';
import { EMPTY_VAULT_FORM, type VaultEntry, type VaultFormValues } from '../constants';

interface Props {
  open: boolean;
  editing: VaultEntry | null;
  folders: string[];
  userId: string;
  onClose: () => void;
}

// Self-contained add/edit modal. Owns its form state, the password field
// visibility toggle, and its create/update mutations. Passwords are encrypted
// client-side via `@/lib/vault` before being sent.
export default function VaultEntryModal({ open, editing, folders, userId, onClose }: Props) {
  const [form, setForm] = useState<VaultFormValues>(EMPTY_VAULT_FORM);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const createVaultItem = useCreateVaultItem();
  const updateVaultItem = useUpdateVaultItem();
  const saving = createVaultItem.isPending || updateVaultItem.isPending;

  useEffect(() => {
    if (!open) return;
    setShowPasswordField(false);
    setForm(
      editing
        ? {
            title: editing.title,
            username: editing.username,
            password: '',
            url: editing.url,
            notes: editing.notes,
            folder: editing.folder,
          }
        : EMPTY_VAULT_FORM,
    );
  }, [open, editing]);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.title.trim() || !form.password.trim()) return;
    try {
      const encrypted = await encrypt(form.password, userId);
      const payload = {
        title: form.title.trim(),
        username: form.username.trim(),
        encrypted_password: encrypted,
        url: form.url.trim(),
        notes: form.notes.trim(),
        folder: form.folder,
      };
      if (editing) {
        await updateVaultItem.mutateAsync({ id: editing.id, data: payload });
        toast.success('Password updated');
      } else {
        // member_id is assigned server-side from the authed member.
        await createVaultItem.mutateAsync(payload);
        toast.success('Password saved');
      }
      onClose();
    } catch {
      toast.error('Failed to save password');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-violet-500" />
            {editing ? 'Edit Entry' : 'New Entry'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Gmail, AWS, GitHub"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Username / Email</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPasswordField ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordField(!showPasswordField)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswordField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">URL (Optional)</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Folder (Optional)</label>
            <div className="relative">
              <select
                value={form.folder}
                onChange={(e) => setForm({ ...form, folder: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
              >
                <option value="">— Unfiled —</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <Folder className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Notes (Optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim() || !form.password.trim()}
            className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {editing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
