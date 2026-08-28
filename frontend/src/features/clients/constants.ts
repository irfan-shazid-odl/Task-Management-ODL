import type { ClientStatus } from '@/lib/types';

export const CLIENT_STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  Lead: 'bg-amber-50 text-amber-700 border-amber-100',
};

export const EMPTY_CLIENT_FORM = {
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  contacted_by: '',
  status: 'Active' as ClientStatus,
};

export type ClientFormValues = typeof EMPTY_CLIENT_FORM;
