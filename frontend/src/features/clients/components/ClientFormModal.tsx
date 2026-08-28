'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Client, ClientStatus } from '@/lib/types';
import { useCreateClient, useUpdateClient } from '@/hooks/queries/useClients';
import { EMPTY_CLIENT_FORM, type ClientFormValues } from '../constants';

interface Props {
  open: boolean;
  editing: Client | null;
  onClose: () => void;
}

// Self-contained add/edit modal. Owns its form state and mutations; the parent
// only decides when it's open and which client (if any) is being edited.
export default function ClientFormModal({ open, editing, onClose }: Props) {
  const [form, setForm] = useState<ClientFormValues>(EMPTY_CLIENT_FORM);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const saving = createClient.isPending || updateClient.isPending;

  // eslint-disable react-hooks/set-state-in-effect -- resetting form state when modal opens
  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            name: editing.name,
            contact_name: editing.contact_name || '',
            email: editing.email || '',
            phone: editing.phone || '',
            contacted_by: editing.contacted_by || '',
            status: editing.status,
          }
        : EMPTY_CLIENT_FORM,
    );
  }, [open, editing]);
  // eslint-enable react-hooks/set-state-in-effect

  if (!open) return null;

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Client name is required.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      contact_name: form.contact_name?.trim() || null,
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      contacted_by: form.contacted_by?.trim() || null,
      status: form.status,
    };
    try {
      if (editing) {
        await updateClient.mutateAsync({ id: editing.id, data: payload });
        toast.success('Client updated!');
      } else {
        await createClient.mutateAsync(payload);
        toast.success('Client added!');
      }
      onClose();
    } catch (err) {
      toast.error(
        `${editing ? 'Update' : 'Add'} failed: ` + (err instanceof Error ? err.message : 'Unknown error'),
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-xl font-bold text-slate-900">{editing ? 'Edit Client' : 'New Client'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Client / Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Acme Corporation"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">Contact Person</label>
            <input
              type="text"
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              placeholder="e.g. John Smith"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-400 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 000 0000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Internal Reference</label>
            <div className="relative">
              <input
                type="text"
                value={form.contacted_by}
                onChange={(e) => setForm({ ...form, contacted_by: e.target.value })}
                placeholder="Who contacted this client? (Optional)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-400 transition-all font-medium"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-400 font-bold uppercase">Optional</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">Status</label>
            <div className="flex gap-2">
              {(['Active', 'Lead', 'Inactive'] as ClientStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, status: s })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    form.status === s
                      ? s === 'Active'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : s === 'Lead'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-500 text-white border-slate-500 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-200 active:scale-[0.98] transition-all"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : editing ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
