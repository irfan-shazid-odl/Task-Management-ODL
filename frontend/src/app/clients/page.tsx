'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Client } from '@/lib/types';
import { useUser } from '@/components/UserContext';
import { useClients, useDeleteClient } from '@/hooks/queries/useClients';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import ClientFormModal from '@/features/clients/components/ClientFormModal';
import ClientsTable from '@/features/clients/components/ClientsTable';

export default function ClientsPage() {
  const { loading: userLoading, currentUser } = useUser();
  const router = useRouter();

  const isMember = currentUser?.role === 'Member';
  const canManage = !!currentUser && !isMember;

  // Role guard — Members can't access Clients.
  useEffect(() => {
    if (!userLoading && isMember) router.replace('/board');
  }, [isMember, userLoading, router]);

  const { data: clients = [], isLoading } = useClients(!!currentUser && !isMember);
  const deleteClient = useDeleteClient();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [toDelete, setToDelete] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.contact_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteClient.mutateAsync(toDelete.id);
      toast.success('Client deleted successfully.');
      setToDelete(null);
    } catch (err) {
      toast.error('Delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (isMember) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center animate-pulse">
          <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Redirecting...</h2>
          <p className="text-slate-500 text-sm">Clients is restricted for Members.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen text-slate-500">
        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mr-3" />
        Loading clients...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your clients and leads</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-violet-200 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Client
          </button>
        )}
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all"
        />
      </div>

      <ClientsTable
        clients={filtered}
        canManage={canManage}
        isMember={isMember}
        hasSearch={!!search}
        onEdit={(c) => {
          setEditing(c);
          setModalOpen(true);
        }}
        onDelete={setToDelete}
      />

      <DeleteConfirmModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={deleteClient.isPending}
        title="Delete Client?"
        message={`Are you sure you want to delete "${toDelete?.name}"? All associated data will be permanently removed. This action cannot be undone.`}
        confirmText="Permanently Delete"
      />

      <ClientFormModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
    </div>
  );
}
