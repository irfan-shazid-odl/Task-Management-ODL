'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/components/UserContext';
import { Subscription } from '@/lib/types';
import { useSubscriptions, useDeleteSubscription } from '@/hooks/queries/useSubscriptions';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import SubscriptionsTable from '@/features/subscriptions/components/SubscriptionsTable';
import SubscriptionFormModal from '@/features/subscriptions/components/SubscriptionFormModal';
import { EMPTY_SUBSCRIPTION_FORM, type SubscriptionFormValues } from '@/features/subscriptions/constants';

export default function SubscriptionsPage() {
  const { currentUser, loading: userLoading } = useUser();
  const router = useRouter();

  const isMember = currentUser?.role === 'Member';

  // Role guard
  useEffect(() => {
    if (!userLoading && isMember) router.replace('/board');
  }, [isMember, userLoading, router]);

  const { data: subscriptions = [], isLoading } = useSubscriptions(!!currentUser && !isMember);
  const deleteSubscription = useDeleteSubscription();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [newSub, setNewSub] = useState<SubscriptionFormValues>(EMPTY_SUBSCRIPTION_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subToDelete, setSubToDelete] = useState<Subscription | null>(null);

  // Recover modal state from sessionStorage when returning from external links
  // eslint-disable react-hooks/set-state-in-effect -- restoring session state on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedModal = sessionStorage.getItem('sub_modal_open');
        if (savedModal === 'true') {
          setShowAddModal(true);
          const savedData = sessionStorage.getItem('sub_modal_data');
          if (savedData) setNewSub(JSON.parse(savedData));
          const savedEdit = sessionStorage.getItem('sub_modal_edit');
          if (savedEdit) setEditingSub(JSON.parse(savedEdit));
        }
      }
    } catch (e) { console.error('Failed to parse saved session', e); }
  }, []);
  // eslint-enable react-hooks/set-state-in-effect

  // Continuously save modal state as user types
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (showAddModal) {
          sessionStorage.setItem('sub_modal_open', 'true');
          sessionStorage.setItem('sub_modal_data', JSON.stringify(newSub));
          if (editingSub) {
            sessionStorage.setItem('sub_modal_edit', JSON.stringify(editingSub));
          } else {
            sessionStorage.removeItem('sub_modal_edit');
          }
        } else {
          sessionStorage.removeItem('sub_modal_open');
          sessionStorage.removeItem('sub_modal_data');
          sessionStorage.removeItem('sub_modal_edit');
        }
      }
    } catch (e) { console.error('Failed to save session', e); }
  }, [showAddModal, newSub, editingSub]);

  if (currentUser && currentUser.role === 'Member') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center animate-pulse">
          <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Redirecting...</h2>
          <p className="text-slate-500 text-sm">Subscriptions is restricted for Members.</p>
        </div>
      </div>
    );
  }

  const handleEditClick = (sub: Subscription) => {
    setEditingSub(sub);
    setNewSub({
      name: sub.name,
      email: sub.email,
      subscribedBy: sub.subscribed_by || '',
      startDate: sub.start_date,
      endDate: sub.end_date || '',
      amount: sub.amount,
      isFreeTrial: sub.is_free_trial || false,
      trialExpirationDate: sub.trial_expiration_date || '',
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingSub(null);
    setNewSub(EMPTY_SUBSCRIPTION_FORM);
    setFormErrors({});
  };

  const openDeleteModal = (sub: Subscription) => {
    setSubToDelete(sub);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!subToDelete) return;
    try {
      await deleteSubscription.mutateAsync(subToDelete.id);
      toast.success('Subscription deleted.');
      setDeleteModalOpen(false);
      setSubToDelete(null);
    } catch (err) {
      toast.error('Delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Subscriptions</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage recurring service payments and software licenses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-violet-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Subscription
        </button>
      </div>

      <SubscriptionsTable
        subscriptions={subscriptions}
        loading={isLoading}
        onEdit={handleEditClick}
        onDelete={openDeleteModal}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={deleteSubscription.isPending}
        title="Delete Subscription?"
        message={`Are you sure you want to delete the subscription for "${subToDelete?.name}"? This action cannot be undone.`}
        confirmText="Permanently Delete"
      />

      <SubscriptionFormModal
        open={showAddModal}
        editing={editingSub}
        form={newSub}
        setForm={setNewSub}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        onClose={handleCloseModal}
      />
    </div>
  );
}
