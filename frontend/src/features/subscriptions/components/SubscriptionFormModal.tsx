'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Subscription } from '@/lib/types';
import { useCreateSubscription, useUpdateSubscription } from '@/hooks/queries/useSubscriptions';
import { buildSubscriptionStatus, type SubscriptionFormValues } from '../constants';

interface Props {
  open: boolean;
  editing: Subscription | null;
  form: SubscriptionFormValues;
  setForm: React.Dispatch<React.SetStateAction<SubscriptionFormValues>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onClose: () => void;
}

// Add/edit modal. Owns validation + the create/update mutations. Form state and
// its sessionStorage persistence stay in the parent so the modal can be
// recovered after navigating away, so the values are passed in as props.
export default function SubscriptionFormModal({
  open,
  editing,
  form,
  setForm,
  formErrors,
  setFormErrors,
  onClose,
}: Props) {
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const saving = createSubscription.isPending || updateSubscription.isPending;

  if (!open) return null;

  const handleSave = async () => {
    setFormErrors({});
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = 'Subscription name is required.';
    if (!form.email.trim()) errors.email = 'Account email is required.';
    if (!form.startDate) errors.startDate = 'Start date is required.';

    if (form.endDate && form.endDate < form.startDate) {
      errors.endDate = 'End date cannot be earlier than the start date.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const status = buildSubscriptionStatus(form.isFreeTrial, form.trialExpirationDate);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      subscribed_by: form.subscribedBy.trim() || null,
      start_date: form.startDate,
      end_date: form.endDate || null,
      amount: form.amount,
      is_free_trial: form.isFreeTrial,
      trial_expiration_date: form.trialExpirationDate || null,
      status,
    };

    try {
      if (editing) {
        await updateSubscription.mutateAsync({ id: editing.id, data: payload });
        toast.success('Subscription updated!');
      } else {
        await createSubscription.mutateAsync(payload);
        toast.success('Subscription added!');
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
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[500px] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-xl font-bold text-slate-900">{editing ? 'Edit Subscription' : 'Add New Subscription'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Subscription Name</label>
            <input type="text" value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
              }}
              placeholder="e.g. Adobe Creative Cloud"
              className={`w-full border rounded-xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 placeholder:text-slate-400 transition-all ${
                formErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30' : 'bg-slate-50/50 border-slate-200 focus:ring-violet-500/10 focus:border-violet-500'
              }`}
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Account / Email</label>
            <input type="email" value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
              }}
              placeholder="e.g. user@example.com"
              className={`w-full border rounded-xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 placeholder:text-slate-400 transition-all ${
                formErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30' : 'bg-slate-50/50 border-slate-200 focus:ring-violet-500/10 focus:border-violet-500'
              }`}
            />
            {formErrors.email && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Subscribed By (Optional)</label>
            <input type="text" value={form.subscribedBy} onChange={(e) => setForm({ ...form, subscribedBy: e.target.value })}
              placeholder="e.g. Niyamul Islam"
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 placeholder:text-slate-400 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Start Date</label>
              <input type="date" value={form.startDate}
                onChange={(e) => {
                  setForm({ ...form, startDate: e.target.value });
                  if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: '' });
                }}
                className={`w-full border rounded-xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                  formErrors.startDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30' : 'bg-slate-50/50 border-slate-200 focus:ring-violet-500/10 focus:border-violet-500'
                }`}
              />
              {formErrors.startDate && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{formErrors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">End Date (Optional)</label>
              <input type="date" value={form.endDate}
                onChange={(e) => {
                  setForm({ ...form, endDate: e.target.value });
                  if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: '' });
                }}
                className={`w-full border rounded-xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                  formErrors.endDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30' : 'bg-slate-50/50 border-slate-200 focus:ring-violet-500/10 focus:border-violet-500'
                }`}
              />
              {formErrors.endDate && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{formErrors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Charging Amount ($)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              placeholder="0"
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 placeholder:text-slate-400 transition-all"
            />
          </div>

          <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">Free Trial</h4>
                <p className="text-sm text-slate-500">Is this subscription currently on a free trial?</p>
              </div>
              <button
                onClick={() => setForm({ ...form, isFreeTrial: !form.isFreeTrial })}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${form.isFreeTrial ? 'bg-violet-600' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all absolute ${form.isFreeTrial ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {form.isFreeTrial && (
              <div className="mt-5 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Trial Expiration Date</label>
                <input type="date" value={form.trialExpirationDate} onChange={(e) => setForm({ ...form, trialExpirationDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
                />
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-200 active:scale-[0.98] transition-all"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : editing ? 'Update Subscription' : 'Add Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
