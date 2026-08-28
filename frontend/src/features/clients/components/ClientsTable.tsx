'use client';

import React from 'react';
import { Building2, Mail, Phone, Edit, Trash2, Users } from 'lucide-react';
import type { Client } from '@/lib/types';
import { CLIENT_STATUS_STYLES } from '../constants';

interface Props {
  clients: Client[];
  canManage: boolean;
  isMember: boolean;
  hasSearch: boolean;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

const MASK = '••••••••••';

export default function ClientsTable({ clients, canManage, isMember, hasSearch, onEdit, onDelete }: Props) {
  const colSpan = canManage ? 5 : 4;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Client</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Contact</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Internal Reference</th>
              {canManage && (
                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[10px] text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                      <Building2 className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-500">
                      {hasSearch ? 'No clients match your search.' : 'No clients found.'}
                    </p>
                    {!hasSearch && <p className="text-xs">Click &quot;New Client&quot; to add your first client</p>}
                  </div>
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{client.name}</p>
                        {client.contact_name && <p className="text-xs text-slate-500">{client.contact_name}</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {client.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {isMember ? (
                            <span className="tracking-widest text-slate-400 select-none">{MASK}</span>
                          ) : (
                            <a href={`mailto:${client.email}`} className="hover:text-violet-600 transition-colors">{client.email}</a>
                          )}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {isMember ? (
                            <span className="tracking-widest text-slate-400 select-none">{MASK}</span>
                          ) : (
                            <span>{client.phone}</span>
                          )}
                        </div>
                      )}
                      {!client.email && !client.phone && <span className="text-slate-400 text-xs">—</span>}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${CLIENT_STATUS_STYLES[client.status] || CLIENT_STATUS_STYLES.Active}`}>
                      {client.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.contacted_by || '—'}</span>
                    </div>
                  </td>

                  {canManage && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(client)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(client)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
